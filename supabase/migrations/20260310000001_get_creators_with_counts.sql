-- RPC: Return active creators with pack and sample counts.
-- Optional search by name, pagination via p_limit / p_offset.
-- Frontend: supabase.rpc('get_creators_with_counts', { p_search, p_limit, p_offset })

CREATE OR REPLACE FUNCTION public.get_creators_with_counts(
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  packs_count bigint,
  samples_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.avatar_url,
    COALESCE(p.packs_count, 0)::bigint AS packs_count,
    COALESCE(s.samples_count, 0)::bigint AS samples_count
  FROM creators c
  LEFT JOIN (
    SELECT creator_id, COUNT(*) AS packs_count
    FROM packs
    GROUP BY creator_id
  ) p ON p.creator_id = c.id
  LEFT JOIN (
    SELECT p2.creator_id, COUNT(s.id) AS samples_count
    FROM samples s
    JOIN packs p2 ON p2.id = s.pack_id
    GROUP BY p2.creator_id
  ) s ON s.creator_id = c.id
  WHERE COALESCE(c.is_active, true) = true
    AND (p_search IS NULL OR TRIM(p_search) = '' OR c.name ILIKE '%' || TRIM(p_search) || '%')
  ORDER BY c.name ASC
  LIMIT GREATEST(0, LEAST(COALESCE(p_limit, 100), 1000))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

COMMENT ON FUNCTION public.get_creators_with_counts(text, int, int) IS
  'Returns one row per active creator with packs_count and samples_count. Args: p_search (filter name ILIKE), p_limit (default 100), p_offset (default 0).';

GRANT EXECUTE ON FUNCTION public.get_creators_with_counts(text, int, int) TO anon;
GRANT EXECUTE ON FUNCTION public.get_creators_with_counts(text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_creators_with_counts(text, int, int) TO service_role;
