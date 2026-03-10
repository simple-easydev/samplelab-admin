-- RPC: Return a single active creator by id with pack and sample counts.
-- Same counting rules as get_creators_with_counts (all packs, all samples).
-- Returns no row if creator does not exist or is_active is false.
-- Frontend: supabase.rpc('get_creator_by_id', { p_creator_id: '<uuid>' })

CREATE OR REPLACE FUNCTION public.get_creator_by_id(p_creator_id uuid)
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
  WHERE c.id = p_creator_id
    AND COALESCE(c.is_active, true) = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_creator_by_id(uuid) IS
  'Returns one row for the active creator with the given id (packs_count, samples_count). Returns no row if not found or inactive.';

GRANT EXECUTE ON FUNCTION public.get_creator_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_creator_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_by_id(uuid) TO service_role;
