-- RPC: Return all moods for admin library (Moods tab).
-- Frontend: supabase.rpc('get_all_moods')
-- RLS: runs as invoker; admins see all moods.

CREATE OR REPLACE FUNCTION public.get_all_moods()
RETURNS TABLE (
  id uuid,
  name text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.name,
    COALESCE(m.is_active, true) AS is_active,
    m.created_at
  FROM moods m
  ORDER BY m.name ASC;
$$;

COMMENT ON FUNCTION public.get_all_moods() IS
  'Returns all moods. For admin library Moods tab.';

GRANT EXECUTE ON FUNCTION public.get_all_moods() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_moods() TO service_role;
