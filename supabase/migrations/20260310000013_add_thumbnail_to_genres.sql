-- Add thumbnail URL to genres and expose it via get_all_genres RPC.

ALTER TABLE genres
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Drop existing function so we can safely change its return type
DROP FUNCTION IF EXISTS public.get_all_genres();

CREATE OR REPLACE FUNCTION public.get_all_genres()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  is_active boolean,
  created_at timestamptz,
  packs_count bigint,
  samples_count bigint,
  thumbnail_url text
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
    COALESCE(s_cnt.cnt, 0)::bigint AS samples_count,
    g.thumbnail_url
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
  'Returns all genres with packs_count, samples_count, and thumbnail_url. For admin library Genres tab.';

