-- RPC: Similar samples for a downloaded sample.
-- Similarity v1: other samples in the same pack (excluding the seed sample).
-- Security: Users must have previously downloaded the seed sample.

CREATE OR REPLACE FUNCTION public.get_similar_samples_by_downloaded_sample(
  p_sample_id uuid,
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
  credit_cost integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_pack_id uuid;
  v_limit integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Clamp limit to a safe range.
  v_limit := GREATEST(1, LEAST(COALESCE(p_limit, 24), 100));

  -- Only allow similarity lookup for samples the caller actually downloaded.
  IF NOT EXISTS (
    SELECT 1
    FROM public.sample_credit_downloads d
    WHERE d.user_id = v_user_id
      AND d.sample_id = p_sample_id
  ) THEN
    RETURN;
  END IF;

  SELECT s.pack_id
  INTO v_pack_id
  FROM public.samples s
  WHERE s.id = p_sample_id;

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
    COALESCE(s2.credit_cost, 0)::integer AS credit_cost
  FROM public.samples s2
  JOIN public.packs p ON p.id = s2.pack_id
  LEFT JOIN public.creators cr ON cr.id = p.creator_id
  LEFT JOIN (
    SELECT sample_id, COUNT(*) AS stem_count
    FROM public.stems
    GROUP BY sample_id
  ) st ON st.sample_id = s2.id
  WHERE s2.pack_id = v_pack_id
    AND s2.id <> p_sample_id
    AND s2.status = 'Active'
    AND p.status = 'Published'
  ORDER BY s2.created_at DESC NULLS LAST
  LIMIT v_limit;
END;
$$;

COMMENT ON FUNCTION public.get_similar_samples_by_downloaded_sample(uuid, integer) IS
  'Given a sample the user downloaded, returns similar samples. v1: same pack, excluding seed. Requires prior download.';

REVOKE ALL ON FUNCTION public.get_similar_samples_by_downloaded_sample(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_similar_samples_by_downloaded_sample(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_similar_samples_by_downloaded_sample(uuid, integer) TO service_role;

