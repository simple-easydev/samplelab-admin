-- When a sample has stems, downloads should include additional credit cost from app_settings:
--   credit_rules.stems (e.g. 4).
-- Total charged = base sample cost (by type) + stems add-on (when has_stems=true).
--
-- Note: This migration is kept to match remote migration history.
-- A later migration (20260408000002) further updates this RPC to also write `credit_activity`.

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
  v_replay_has_stems boolean;
  v_name text;
  v_audio_url text;
  v_has_stems boolean;
  v_sample_type text;
  v_base_cost integer;
  v_stems_addon_cost integer;
  v_cost integer;
  v_sample_status text;
  v_pack_status text;
  v_is_premium boolean;
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

      SELECT s.name, s.audio_url, COALESCE(s.has_stems, false)
      INTO v_replay_name, v_replay_url, v_replay_has_stems
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
        'has_stems', v_replay_has_stems,
        'credits_charged', 0
      );
    END IF;
  END IF;

  SELECT
    s.name,
    s.audio_url,
    COALESCE(s.has_stems, false),
    s.type,
    s.status,
    p.status,
    COALESCE(p.is_premium, false)
  INTO v_name, v_audio_url, v_has_stems, v_sample_type, v_sample_status, v_pack_status, v_is_premium
  FROM public.samples s
  JOIN public.packs p ON p.id = s.pack_id
  WHERE s.id = p_sample_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'sample_not_found');
  END IF;

  IF v_sample_status IS DISTINCT FROM 'Active' OR v_pack_status IS DISTINCT FROM 'Published' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'sample_not_found');
  END IF;

  IF v_is_premium THEN
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
  END IF;

  IF v_audio_url IS NULL OR trim(v_audio_url) = '' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'asset_unavailable');
  END IF;

  v_base_cost := public.credit_cost_from_sample_type(v_sample_type);

  SELECT COALESCE(
    (
      SELECT CASE
        WHEN trim(a.value) ~ '^-?[0-9]+$' THEN trim(a.value)::integer
        ELSE NULL
      END
      FROM public.app_settings a
      WHERE a.key = 'credit_rules.stems'
      LIMIT 1
    ),
    0
  )::integer
  INTO v_stems_addon_cost;

  v_cost := v_base_cost + (CASE WHEN v_has_stems THEN v_stems_addon_cost ELSE 0 END);
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
    'has_stems', v_has_stems,
    'credits_charged', v_charged
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_sample_download_prepare(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_sample_download_prepare(uuid, uuid, uuid) TO service_role;

