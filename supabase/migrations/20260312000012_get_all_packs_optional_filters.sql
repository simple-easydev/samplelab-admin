-- Extend get_all_packs with optional filters and sort. Backward compatible: no args = same as before.
-- New params (all optional with defaults): p_search, p_sort, p_genres, p_keywords, p_access, p_license,
--   p_creators, p_released, p_limit, p_offset. Returns same row shape + total_count (total matching rows).

DROP FUNCTION IF EXISTS public.get_all_packs();

CREATE OR REPLACE FUNCTION public.get_all_packs(
  p_search   text DEFAULT NULL,
  p_sort    text DEFAULT 'newest',
  p_genres  text[] DEFAULT NULL,
  p_keywords text[] DEFAULT NULL,
  p_access  text DEFAULT 'all',
  p_license text DEFAULT 'all',
  p_creators text[] DEFAULT NULL,
  p_released text DEFAULT 'all',
  p_limit   int DEFAULT NULL,
  p_offset  int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  creator_id uuid,
  category_id uuid,
  creator_name text,
  category_name text,
  genres text[],
  tags text[],
  samples_count bigint,
  download_count integer,
  status text,
  cover_url text,
  created_at timestamptz,
  is_premium boolean,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id,
      p.name,
      p.creator_id,
      p.category_id,
      COALESCE(cr.name, '')::text AS creator_name,
      COALESCE(cat.name, 'Uncategorized')::text AS category_name,
      COALESCE(
        (SELECT array_agg(g.name ORDER BY g.name)
         FROM pack_genres pg
         JOIN genres g ON g.id = pg.genre_id
         WHERE pg.pack_id = p.id AND COALESCE(g.is_active, true) = true),
        ARRAY[]::text[]
      ) AS genres,
      COALESCE(p.tags, ARRAY[]::text[]) AS tags,
      COALESCE(s_cnt.cnt, 0)::bigint AS samples_count,
      COALESCE(p.download_count, 0)::integer AS download_count,
      p.status,
      p.cover_url,
      p.created_at,
      COALESCE(p.is_premium, false) AS is_premium
    FROM packs p
    LEFT JOIN creators cr ON cr.id = p.creator_id
    LEFT JOIN categories cat ON cat.id = p.category_id
    LEFT JOIN (
      SELECT pack_id, COUNT(*) AS cnt
      FROM samples
      WHERE status IN ('Active', 'Disabled')
      GROUP BY pack_id
    ) s_cnt ON s_cnt.pack_id = p.id
    WHERE
      (p_search IS NULL OR trim(p_search) = '' OR p.name ILIKE '%' || trim(p_search) || '%' OR cr.name ILIKE '%' || trim(p_search) || '%')
      AND (p_genres IS NULL OR cardinality(p_genres) = 0 OR EXISTS (
        SELECT 1 FROM pack_genres pg
        JOIN genres g ON g.id = pg.genre_id
        WHERE pg.pack_id = p.id AND COALESCE(g.is_active, true) = true AND g.name = ANY(p_genres)
      ))
      AND (p_keywords IS NULL OR cardinality(p_keywords) = 0 OR p.tags && p_keywords)
      AND (p_access = 'all' OR p_access IS NULL OR (p_access = 'premium' AND COALESCE(p.is_premium, false) = true) OR (p_access = 'free' AND COALESCE(p.is_premium, false) = false))
      AND (p_license = 'all' OR p_license IS NULL)
      AND (p_creators IS NULL OR cardinality(p_creators) = 0 OR cr.name = ANY(p_creators))
      AND (
        p_released = 'all' OR p_released IS NULL
        OR (p_released = '24h' AND p.created_at >= (now() - interval '24 hours'))
        OR (p_released = '7d' AND p.created_at >= (now() - interval '7 days'))
        OR (p_released = '30d' AND p.created_at >= (now() - interval '30 days'))
      )
  ),
  counted AS (
    SELECT *, (SELECT COUNT(*)::bigint FROM base) AS total_count
    FROM base
  )
  SELECT
    c.id,
    c.name,
    c.creator_id,
    c.category_id,
    c.creator_name,
    c.category_name,
    c.genres,
    c.tags,
    c.samples_count,
    c.download_count,
    c.status,
    c.cover_url,
    c.created_at,
    c.is_premium,
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

COMMENT ON FUNCTION public.get_all_packs(text, text, text[], text[], text, text, text[], text, int, int) IS
  'Returns packs with optional filters and sort. Params: p_search (name/creator ILIKE), p_sort (newest|oldest|popular|name-az|name-za), p_genres (genre names), p_keywords (tags overlap), p_access (all|premium|free), p_license (all; reserved), p_creators (creator names), p_released (all|24h|7d|30d), p_limit, p_offset. Last column total_count = total matching rows before limit/offset.';

GRANT EXECUTE ON FUNCTION public.get_all_packs(text, text, text[], text[], text, text, text[], text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_packs(text, text, text[], text[], text, text, text[], text, int, int) TO service_role;
