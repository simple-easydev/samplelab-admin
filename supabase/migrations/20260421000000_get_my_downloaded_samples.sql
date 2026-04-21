-- RPC: Fetch current user's downloaded samples (paged, newest download first).
-- Source of truth: sample_credit_downloads (inserted on successful download debit).
-- Frontend: supabase.rpc('get_my_downloaded_samples', { p_limit: 50, p_offset: 0 })

CREATE OR REPLACE FUNCTION public.get_my_downloaded_samples(
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
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
  instrument text,
  type text,
  download_count integer,
  credit_cost integer,
  status text,
  has_stems boolean,
  stems_count bigint,
  created_at timestamptz,
  metadata jsonb,
  thumbnail_url text,
  downloaded_at timestamptz,
  credits_charged integer,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      s.id,
      s.name,
      COALESCE(s.preview_audio_url, s.audio_url) AS preview_audio_url,
      p.id AS pack_id,
      p.name AS pack_name,
      p.creator_id AS creator_id,
      COALESCE(cr.name, '')::text AS creator_name,
      COALESCE(
        (SELECT g.name
         FROM pack_genres pg
         JOIN genres g ON g.id = pg.genre_id
         WHERE pg.pack_id = s.pack_id AND COALESCE(g.is_active, true) = true
         LIMIT 1),
        ''
      )::text AS genre,
      s.bpm,
      s.key,
      s.instrument,
      s.type,
      COALESCE(s.download_count, 0)::integer AS download_count,
      s.credit_cost,
      s.status,
      COALESCE(s.has_stems, false) AS has_stems,
      COALESCE(st.stem_count, 0)::bigint AS stems_count,
      s.created_at,
      s.metadata,
      s.thumbnail_url,
      scd.created_at AS downloaded_at,
      scd.credits_charged
    FROM public.sample_credit_downloads scd
    JOIN public.samples s ON s.id = scd.sample_id
    JOIN public.packs p ON p.id = s.pack_id
    LEFT JOIN public.creators cr ON cr.id = p.creator_id
    LEFT JOIN (
      SELECT sample_id, COUNT(*) AS stem_count
      FROM public.stems
      GROUP BY sample_id
    ) st ON st.sample_id = s.id
    WHERE auth.uid() IS NOT NULL
      AND scd.user_id = auth.uid()
  ),
  counted AS (
    SELECT *, (SELECT COUNT(*)::bigint FROM base) AS total_count
    FROM base
  )
  SELECT
    c.id,
    c.name,
    c.preview_audio_url,
    c.pack_id,
    c.pack_name,
    c.creator_id,
    c.creator_name,
    c.genre,
    c.bpm,
    c.key,
    c.instrument,
    c.type,
    c.download_count,
    c.credit_cost,
    c.status,
    c.has_stems,
    c.stems_count,
    c.created_at,
    c.metadata,
    c.thumbnail_url,
    c.downloaded_at,
    c.credits_charged,
    c.total_count
  FROM counted c
  ORDER BY c.downloaded_at DESC NULLS LAST
  LIMIT GREATEST(0, LEAST(COALESCE(p_limit, 50), 200))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

COMMENT ON FUNCTION public.get_my_downloaded_samples(integer, integer) IS
  'Returns current user downloaded samples (paged) from sample_credit_downloads, newest first. total_count = total matching rows before limit/offset.';

REVOKE ALL ON FUNCTION public.get_my_downloaded_samples(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_downloaded_samples(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_downloaded_samples(integer, integer) TO service_role;

