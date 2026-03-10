-- RPC: Return all categories for admin library (Categories tab) with pack count.
-- Frontend: supabase.rpc('get_all_categories')
-- RLS: runs as invoker; admins see all categories.

CREATE OR REPLACE FUNCTION public.get_all_categories()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  is_active boolean,
  created_at timestamptz,
  packs_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.description,
    COALESCE(c.is_active, true) AS is_active,
    c.created_at,
    COALESCE(p_cnt.cnt, 0)::bigint AS packs_count
  FROM categories c
  LEFT JOIN (
    SELECT category_id, COUNT(*) AS cnt
    FROM packs
    GROUP BY category_id
  ) p_cnt ON p_cnt.category_id = c.id
  ORDER BY c.name ASC;
$$;

COMMENT ON FUNCTION public.get_all_categories() IS
  'Returns all categories with packs_count. For admin library Categories tab.';

GRANT EXECUTE ON FUNCTION public.get_all_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_categories() TO service_role;
