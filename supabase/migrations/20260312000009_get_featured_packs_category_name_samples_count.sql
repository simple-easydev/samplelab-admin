-- Update get_featured_packs: return category_name (not category_id) and samples_count.
-- Must DROP first because PostgreSQL does not allow changing return type with CREATE OR REPLACE.

DROP FUNCTION IF EXISTS public.get_featured_packs();

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
  'Returns published packs where is_featured = true, with category_name and samples_count.';

GRANT EXECUTE ON FUNCTION public.get_featured_packs() TO anon;
GRANT EXECUTE ON FUNCTION public.get_featured_packs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_featured_packs() TO service_role;
