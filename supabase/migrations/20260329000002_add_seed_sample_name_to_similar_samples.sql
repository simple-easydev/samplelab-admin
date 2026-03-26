-- Add seed_sample_name to get_similar_samples_by_downloaded_sample response.
-- PostgreSQL cannot change a function's return type with CREATE OR REPLACE; drop first.

DROP FUNCTION IF EXISTS public.get_similar_samples_by_downloaded_sample(integer);
DROP FUNCTION IF EXISTS public.get_similar_samples_by_downloaded_sample(uuid, integer);

CREATE FUNCTION public.get_similar_samples_by_downloaded_sample(
  p_limit integer DEFAULT 24
)
RETURNS TABLE (
  id uuid,
  name text,
  preview_audio_url text,
  pack_id uuid,
  pack_name text,
  creator_id uuid,
  creator_name text,
  genre text,
  bpm integer,
  key text,
  type text,
  download_count integer,
  status text,
  has_stems boolean,
  stems_count bigint,
  created_at timestamptz,
  metadata jsonb,
  thumbnail_url text,
  credit_cost integer,
  seed_sample_id uuid,
  seed_sample_name text
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_seed_sample_id uuid;
  v_seed_sample_name text;
  v_pack_id uuid;
  v_limit integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  v_limit := GREATEST(1, LEAST(COALESCE(p_limit, 24), 100));

  SELECT ca.sample_id
  INTO v_seed_sample_id
  FROM public.credit_activity ca
  JOIN public.customers c ON c.id = ca.customer_id
  WHERE c.user_id = v_user_id
    AND ca.activity_type = 'download_charge'
    AND ca.sample_id IS NOT NULL
  ORDER BY ca.created_at DESC
  LIMIT 1;

  IF v_seed_sample_id IS NULL THEN
    RETURN;
  END IF;

  SELECT s.pack_id, s.name
  INTO v_pack_id, v_seed_sample_name
  FROM public.samples s
  WHERE s.id = v_seed_sample_id;

  IF v_pack_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s2.id,
    s2.name,
    COALESCE(s2.preview_audio_url, s2.audio_url)::text AS preview_audio_url,
    p.id AS pack_id,
    p.name AS pack_name,
    p.creator_id,
    COALESCE(cr.name, '')::text AS creator_name,
    COALESCE(
      (SELECT g.name
       FROM public.pack_genres pg
       JOIN public.genres g ON g.id = pg.genre_id
       WHERE pg.pack_id = p.id AND COALESCE(g.is_active, true) = true
       LIMIT 1),
      ''
    )::text AS genre,
    s2.bpm,
    s2.key,
    s2.type,
    COALESCE(s2.download_count, 0)::integer AS download_count,
    s2.status,
    COALESCE(s2.has_stems, false) AS has_stems,
    COALESCE(st.stem_count, 0)::bigint AS stems_count,
    s2.created_at,
    s2.metadata,
    s2.thumbnail_url,
    COALESCE(s2.credit_cost, 0)::integer AS credit_cost,
    v_seed_sample_id AS seed_sample_id,
    v_seed_sample_name AS seed_sample_name
  FROM public.samples s2
  JOIN public.packs p ON p.id = s2.pack_id
  LEFT JOIN public.creators cr ON cr.id = p.creator_id
  LEFT JOIN (
    SELECT sample_id, COUNT(*) AS stem_count
    FROM public.stems
    GROUP BY sample_id
  ) st ON st.sample_id = s2.id
  WHERE s2.pack_id = v_pack_id
    AND s2.id <> v_seed_sample_id
    AND s2.status = 'Active'
    AND p.status = 'Published'
  ORDER BY s2.created_at DESC NULLS LAST
  LIMIT v_limit;
END;
$$;

COMMENT ON FUNCTION public.get_similar_samples_by_downloaded_sample(integer) IS
  'Returns similar samples for the caller’s last downloaded seed sample. v1: same pack; seed from credit_activity(download_charge). Includes seed id and name.';

REVOKE ALL ON FUNCTION public.get_similar_samples_by_downloaded_sample(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_similar_samples_by_downloaded_sample(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_similar_samples_by_downloaded_sample(integer) TO service_role;
