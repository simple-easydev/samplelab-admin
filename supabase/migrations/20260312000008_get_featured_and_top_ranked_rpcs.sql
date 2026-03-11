-- RPC: Return featured packs (is_featured = true, published only for public).
-- Frontend: supabase.rpc('get_featured_packs')

CREATE OR REPLACE FUNCTION public.get_featured_packs()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  creator_id uuid,
  creator_name text,
  cover_url text,
  category_name text,
  tags text[],
  is_premium boolean,
  status text,
  download_count integer,
  is_featured boolean,
  created_at timestamptz,
  updated_at timestamptz,
  samples_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.description,
    p.creator_id,
    COALESCE(c.name, '')::text AS creator_name,
    p.cover_url,
    COALESCE(cat.name, '')::text AS category_name,
    COALESCE(p.tags, ARRAY[]::text[]) AS tags,
    COALESCE(p.is_premium, false) AS is_premium,
    p.status,
    COALESCE(p.download_count, 0)::integer AS download_count,
    COALESCE(p.is_featured, false) AS is_featured,
    p.created_at,
    p.updated_at,
    COALESCE(s.samples_count, 0)::bigint AS samples_count
  FROM packs p
  LEFT JOIN creators c ON c.id = p.creator_id
  LEFT JOIN categories cat ON cat.id = p.category_id
  LEFT JOIN (
    SELECT pack_id, COUNT(*) AS samples_count
    FROM samples
    GROUP BY pack_id
  ) s ON s.pack_id = p.id
  WHERE COALESCE(p.is_featured, false) = true
    AND p.status = 'Published'
  ORDER BY p.created_at DESC NULLS LAST;
$$;

COMMENT ON FUNCTION public.get_featured_packs() IS
  'Returns published packs where is_featured = true (for home/explore).';

GRANT EXECUTE ON FUNCTION public.get_featured_packs() TO anon;
GRANT EXECUTE ON FUNCTION public.get_featured_packs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_featured_packs() TO service_role;


-- RPC: Return featured creators (is_featured = true).
-- Frontend: supabase.rpc('get_featured_creators')

CREATE OR REPLACE FUNCTION public.get_featured_creators()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  bio text,
  avatar_url text,
  is_active boolean,
  rank integer,
  is_featured boolean,
  created_at timestamptz,
  updated_at timestamptz,
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
    c.email,
    c.bio,
    c.avatar_url,
    COALESCE(c.is_active, true) AS is_active,
    COALESCE(c.rank, 0)::integer AS rank,
    COALESCE(c.is_featured, false) AS is_featured,
    c.created_at,
    c.updated_at,
    COALESCE(p.packs_count, 0)::bigint AS packs_count,
    COALESCE(s.samples_count, 0)::bigint AS samples_count
  FROM creators c
  LEFT JOIN (
    SELECT creator_id, COUNT(*) AS packs_count
    FROM packs
    GROUP BY creator_id
  ) p ON p.creator_id = c.id
  LEFT JOIN (
    SELECT p2.creator_id, COUNT(sa.id) AS samples_count
    FROM samples sa
    JOIN packs p2 ON p2.id = sa.pack_id
    GROUP BY p2.creator_id
  ) s ON s.creator_id = c.id
  WHERE COALESCE(c.is_active, true) = true
    AND COALESCE(c.is_featured, false) = true
  ORDER BY COALESCE(c.rank, 0) DESC NULLS LAST, c.name ASC;
$$;

COMMENT ON FUNCTION public.get_featured_creators() IS
  'Returns active creators where is_featured = true (for home/explore).';

GRANT EXECUTE ON FUNCTION public.get_featured_creators() TO anon;
GRANT EXECUTE ON FUNCTION public.get_featured_creators() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_featured_creators() TO service_role;


-- RPC: Return top ranked genres (ordered by rank desc).
-- Frontend: supabase.rpc('get_top_ranked_genres', { p_limit: 20 })

CREATE OR REPLACE FUNCTION public.get_top_ranked_genres(p_limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  is_active boolean,
  rank integer,
  thumbnail_url text,
  created_at timestamptz,
  packs_count bigint
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
    COALESCE(g.rank, 0)::integer AS rank,
    g.thumbnail_url,
    g.created_at,
    COALESCE(pg.packs_count, 0)::bigint AS packs_count
  FROM genres g
  LEFT JOIN (
    SELECT genre_id, COUNT(*) AS packs_count
    FROM pack_genres
    GROUP BY genre_id
  ) pg ON pg.genre_id = g.id
  WHERE COALESCE(g.is_active, true) = true
  ORDER BY COALESCE(g.rank, 0) DESC NULLS LAST, g.name ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 100));
$$;

COMMENT ON FUNCTION public.get_top_ranked_genres(integer) IS
  'Returns active genres ordered by rank (top N, default 20, max 100).';

GRANT EXECUTE ON FUNCTION public.get_top_ranked_genres(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_top_ranked_genres(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_ranked_genres(integer) TO service_role;
