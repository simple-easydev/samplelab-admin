-- Rename get_all_genres_for_admin to get_all_genres (for DBs that already ran the previous migration).
DROP FUNCTION IF EXISTS public.get_all_genres_for_admin();

CREATE OR REPLACE FUNCTION public.get_all_genres()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  is_active boolean,
  created_at timestamptz,
  packs_count bigint,
  samples_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    g.id,
    g.name,
    g.description,
    COALESCE(g.is_active, true) AS is_active,
    g.created_at,
    COALESCE(pg_cnt.cnt, 0)::bigint AS packs_count,
    COALESCE(s_cnt.cnt, 0)::bigint AS samples_count
  FROM genres g
  LEFT JOIN (
    SELECT genre_id, COUNT(*) AS cnt
    FROM pack_genres
    GROUP BY genre_id
  ) pg_cnt ON pg_cnt.genre_id = g.id
  LEFT JOIN (
    SELECT pg.genre_id, COUNT(s.id) AS cnt
    FROM pack_genres pg
    JOIN samples s ON s.pack_id = pg.pack_id
    WHERE s.status IN ('Active', 'Disabled')
    GROUP BY pg.genre_id
  ) s_cnt ON s_cnt.genre_id = g.id
  ORDER BY g.name ASC;
$$;

COMMENT ON FUNCTION public.get_all_genres() IS
  'Returns all genres with packs_count and samples_count. For admin library Genres tab.';

GRANT EXECUTE ON FUNCTION public.get_all_genres() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_genres() TO service_role;
