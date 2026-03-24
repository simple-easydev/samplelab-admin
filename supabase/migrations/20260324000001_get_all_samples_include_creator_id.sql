-- Include creator_id in get_all_samples response payload.
-- Keeps existing filters/sort behavior and current parameter signature.

DROP FUNCTION IF EXISTS public.get_all_samples(
  text,
  text,
  text[],
  text[],
  text,
  text,
  text,
  text[],
  text,
  integer,
  integer,
  integer,
  integer,
  integer
);

CREATE FUNCTION public.get_all_samples(
  p_search      text DEFAULT NULL,
  p_sort        text DEFAULT 'newest',
  p_genres      text[] DEFAULT NULL,
  p_keywords    text[] DEFAULT NULL,
  p_instrument  text DEFAULT 'all',
  p_type        text DEFAULT 'all',
  p_stems       text DEFAULT 'all',
  p_keys        text[] DEFAULT NULL,
  p_key_quality text DEFAULT 'all',
  p_bpm_min     int DEFAULT NULL,
  p_bpm_max     int DEFAULT NULL,
  p_bpm_exact   int DEFAULT NULL,
  p_limit       int DEFAULT NULL,
  p_offset      int DEFAULT 0
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
  credit_cost integer,
  status text,
  has_stems boolean,
  stems_count bigint,
  created_at timestamptz,
  metadata jsonb,
  thumbnail_url text,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
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
      s.type,
      COALESCE(s.download_count, 0)::integer AS download_count,
      s.credit_cost,
      s.status,
      COALESCE(s.has_stems, false) AS has_stems,
      COALESCE(st.stem_count, 0)::bigint AS stems_count,
      s.created_at,
      s.metadata,
      s.thumbnail_url
    FROM samples s
    JOIN packs p ON p.id = s.pack_id
    LEFT JOIN creators cr ON cr.id = p.creator_id
    LEFT JOIN (
      SELECT sample_id, COUNT(*) AS stem_count
      FROM stems
      GROUP BY sample_id
    ) st ON st.sample_id = s.id
    WHERE
      (p_search IS NULL OR trim(p_search) = ''
       OR s.name ILIKE '%' || trim(p_search) || '%'
       OR p.name ILIKE '%' || trim(p_search) || '%'
       OR cr.name ILIKE '%' || trim(p_search) || '%')
      AND (p_genres IS NULL OR cardinality(p_genres) = 0 OR EXISTS (
        SELECT 1 FROM pack_genres pg
        JOIN genres g ON g.id = pg.genre_id
        WHERE pg.pack_id = s.pack_id AND COALESCE(g.is_active, true) = true AND g.name = ANY(p_genres)
      ))
      AND (p_keywords IS NULL OR cardinality(p_keywords) = 0 OR p.tags && p_keywords)
      AND (p_instrument = 'all' OR p_instrument IS NULL)
      AND (p_type = 'all' OR p_type IS NULL
           OR (lower(p_type) = 'loop' AND s.type = 'Loop')
           OR (lower(p_type) = 'one-shot' AND s.type = 'One-shot'))
      AND (p_stems = 'all' OR p_stems IS NULL
           OR (p_stems = 'yes' AND COALESCE(s.has_stems, false) = true)
           OR (p_stems = 'no' AND COALESCE(s.has_stems, false) = false))
      AND (p_keys IS NULL OR cardinality(p_keys) = 0 OR s.key = ANY(p_keys))
      AND (p_key_quality = 'all' OR p_key_quality IS NULL)
      AND (
        (p_bpm_exact IS NOT NULL AND s.bpm = p_bpm_exact)
        OR (p_bpm_exact IS NULL AND
            (p_bpm_min IS NULL OR (s.bpm IS NOT NULL AND s.bpm >= p_bpm_min))
            AND (p_bpm_max IS NULL OR (s.bpm IS NOT NULL AND s.bpm <= p_bpm_max)))
      )
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
    c.type,
    c.download_count,
    c.credit_cost,
    c.status,
    c.has_stems,
    c.stems_count,
    c.created_at,
    c.metadata,
    c.thumbnail_url,
    c.total_count
  FROM counted c
  ORDER BY
    CASE WHEN p_sort = 'newest' THEN c.created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'oldest' THEN c.created_at END ASC NULLS LAST,
    CASE WHEN p_sort = 'popular' THEN c.download_count END DESC NULLS LAST,
    CASE WHEN p_sort = 'name-az' THEN c.name END ASC NULLS LAST,
    CASE WHEN p_sort = 'name-za' THEN c.name END DESC NULLS LAST,
    c.created_at DESC NULLS LAST,
    c.name ASC
  LIMIT p_limit
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

COMMENT ON FUNCTION public.get_all_samples(
  text, text, text[], text[], text, text, text, text[], text,
  integer, integer, integer, integer, integer
) IS
  'Returns samples with optional filters and sort. Includes creator_id and credit_cost for the admin library Samples tab.';

GRANT EXECUTE ON FUNCTION public.get_all_samples(
  text, text, text[], text[], text, text, text, text[], text,
  integer, integer, integer, integer, integer
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_samples(
  text, text, text[], text[], text, text, text, text[], text,
  integer, integer, integer, integer, integer
) TO service_role;

