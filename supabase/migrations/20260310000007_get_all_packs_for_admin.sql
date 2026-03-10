-- RPC: Return all packs for admin library (Packs tab) with creator, category, genres, and sample count.
-- Frontend: supabase.rpc('get_all_packs_for_admin')
-- RLS: runs as invoker; admins see all packs.

CREATE OR REPLACE FUNCTION public.get_all_packs_for_admin()
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
  is_premium boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
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
  ORDER BY p.created_at DESC NULLS LAST, p.name ASC;
$$;

COMMENT ON FUNCTION public.get_all_packs_for_admin() IS
  'Returns all packs with creator_name, category_name, genres array, and samples_count. For admin library Packs tab.';

GRANT EXECUTE ON FUNCTION public.get_all_packs_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_packs_for_admin() TO service_role;
