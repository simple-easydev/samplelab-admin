-- Require active subscription for full-sample downloads on all packs (not only is_premium).
-- Credit balance is still checked for every download (credit_cost debited when > 0).

CREATE OR REPLACE FUNCTION public.request_sample_download_prepare(
  p_sample_id uuid,
  p_user_id uuid,
  p_idempotency_key uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_existing public.sample_credit_downloads%ROWTYPE;
  v_replay_name text;
  v_replay_url text;
  v_name text;
  v_audio_url text;
  v_cost integer;
  v_sample_status text;
  v_pack_status text;
  v_has_sub boolean;
  v_charged integer;
BEGIN
  SELECT * INTO v_customer
  FROM public.customers
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'customer_not_found');
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text || ':' || p_idempotency_key::text));

    SELECT * INTO v_existing
    FROM public.sample_credit_downloads
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;

    IF FOUND THEN
      IF v_existing.sample_id IS DISTINCT FROM p_sample_id THEN
        RETURN jsonb_build_object('ok', false, 'code', 'idempotency_conflict');
      END IF;

      SELECT s.name, s.audio_url
      INTO v_replay_name, v_replay_url
      FROM public.samples s
      WHERE s.id = p_sample_id;

      IF NOT FOUND OR v_replay_url IS NULL OR trim(v_replay_url) = '' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'asset_unavailable');
      END IF;

      RETURN jsonb_build_object(
        'ok', true,
        'replay', true,
        'bucket', 'private-audios',
        'audio_url', v_replay_url,
        'sample_name', v_replay_name,
        'credits_charged', 0
      );
    END IF;
  END IF;

  SELECT
    s.name,
    s.audio_url,
    COALESCE(s.credit_cost, 0)::integer,
    s.status,
    p.status
  INTO v_name, v_audio_url, v_cost, v_sample_status, v_pack_status
  FROM public.samples s
  JOIN public.packs p ON p.id = s.pack_id
  WHERE s.id = p_sample_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'sample_not_found');
  END IF;

  IF v_sample_status IS DISTINCT FROM 'Active' OR v_pack_status IS DISTINCT FROM 'Published' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'sample_not_found');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions sub
    WHERE sub.customer_id = v_customer.id
      AND (
        COALESCE(sub.status, '') IN ('active', 'trialing')
        OR COALESCE(sub.stripe_status, '') IN ('active', 'trialing')
      )
  ) INTO v_has_sub;

  IF NOT v_has_sub THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden');
  END IF;

  IF v_audio_url IS NULL OR trim(v_audio_url) = '' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'asset_unavailable');
  END IF;

  v_charged := v_cost;

  IF v_charged > COALESCE(v_customer.credit_balance, 0) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'insufficient_credits');
  END IF;

  IF v_charged > 0 THEN
    UPDATE public.customers
    SET
      credit_balance = COALESCE(credit_balance, 0) - v_charged,
      updated_at = now()
    WHERE id = v_customer.id;
  END IF;

  INSERT INTO public.sample_credit_downloads (user_id, sample_id, idempotency_key, credits_charged)
  VALUES (p_user_id, p_sample_id, p_idempotency_key, v_charged);

  PERFORM public.increment_sample_downloads(p_sample_id);

  RETURN jsonb_build_object(
    'ok', true,
    'replay', false,
    'bucket', 'private-audios',
    'audio_url', v_audio_url,
    'sample_name', v_name,
    'credits_charged', v_charged
  );
END;
$$;

COMMENT ON FUNCTION public.request_sample_download_prepare(uuid, uuid, uuid) IS
  'Debit credits and record download; requires active subscription for all packs + sufficient credit_balance. Service role only.';

REVOKE ALL ON FUNCTION public.request_sample_download_prepare(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_sample_download_prepare(uuid, uuid, uuid) TO service_role;
