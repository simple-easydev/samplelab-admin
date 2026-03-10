-- RPC: Return all samples for admin library (Samples tab).
-- Each row includes pack name, creator name, first pack genre, and stem count.
-- Frontend: supabase.rpc('get_all_samples_for_admin')
-- RLS: runs as invoker; admins see all samples, others see nothing (no public policy on this RPC).

CREATE OR REPLACE FUNCTION public.get_all_samples_for_admin()
RETURNS TABLE (
  id uuid,
  name text,
  pack_id uuid,
  pack_name text,
  creator_name text,
  genre text,
  bpm integer,
  key text,
  type text,
  download_count integer,
  status text,
  has_stems boolean,
  stems_count bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    p.id AS pack_id,
    p.name AS pack_name,
    COALESCE(cr.name, '')::text AS creator_name,
    COALESCE(
      (SELECT g.name
       FROM pack_genres pg
       JOIN genres g ON g.id = pg.genre_id
       WHERE pg.pack_id = s.pack_id AND COALESCE(g.is_active, true) = true
       LIMIT 1),
      ''
    )::text AS genre,
    s.bpm,
    s.key,
    s.type,
    COALESCE(s.download_count, 0)::integer AS download_count,
    s.status,
    COALESCE(s.has_stems, false) AS has_stems,
    COALESCE(st.stem_count, 0)::bigint AS stems_count,
    s.created_at
  FROM samples s
  JOIN packs p ON p.id = s.pack_id
  LEFT JOIN creators cr ON cr.id = p.creator_id
  LEFT JOIN (
    SELECT sample_id, COUNT(*) AS stem_count
    FROM stems
    GROUP BY sample_id
  ) st ON st.sample_id = s.id
  ORDER BY s.created_at DESC NULLS LAST, s.name ASC;
$$;

COMMENT ON FUNCTION public.get_all_samples_for_admin() IS
  'Returns one row per sample with pack, creator, genre, and stem count. For admin library Samples tab.';

GRANT EXECUTE ON FUNCTION public.get_all_samples_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_samples_for_admin() TO service_role;
