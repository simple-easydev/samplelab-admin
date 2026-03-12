-- RPC: Genre detail by ID — genre, samples, packs, creators in one call.
-- Frontend: supabase.rpc('get_genre_detail_by_id', { p_genre_id: '<uuid>' })
--
-- Returns: { genre, samples, packs, creators }
-- - genre: object (id, name, description, thumbnail_url, is_active, samples_count, packs_count) or null if not found/inactive
-- - samples: array of SampleItem shape (get_all_samples), filtered to packs in this genre; published packs, active samples; order: created_at DESC
-- - packs: array of PackRow shape (get_all_packs), filtered to packs in this genre; published only; order: download_count DESC, created_at DESC
-- - creators: array of { id, name, avatar_url, packs_count, samples_count } (counts scoped to this genre); order: packs_count DESC, name ASC

CREATE OR REPLACE FUNCTION public.get_genre_detail_by_id(p_genre_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT json_build_object(
    'genre', (
      SELECT json_build_object(
        'id', g.id,
        'name', g.name,
        'description', g.description,
        'thumbnail_url', g.thumbnail_url,
        'is_active', COALESCE(g.is_active, true),
        'samples_count', (SELECT COUNT(*)::bigint FROM samples s
          JOIN pack_genres pg ON pg.pack_id = s.pack_id
          WHERE pg.genre_id = g.id AND s.status = 'Active'
          AND EXISTS (SELECT 1 FROM packs p WHERE p.id = s.pack_id AND p.status = 'Published')),
        'packs_count', (SELECT COUNT(DISTINCT pg.pack_id)::bigint FROM pack_genres pg
          JOIN packs p ON p.id = pg.pack_id
          WHERE pg.genre_id = g.id AND p.status = 'Published')
      )
      FROM genres g
      WHERE g.id = p_genre_id AND COALESCE(g.is_active, true) = true
    ),
    'samples', COALESCE(
      (SELECT jsonb_agg(to_jsonb(ss) ORDER BY ss.created_at DESC NULLS LAST, ss.name)
       FROM (
         SELECT
           s.id,
           s.name,
           s.audio_url,
           p.id AS pack_id,
           p.name AS pack_name,
           COALESCE(cr.name, '')::text AS creator_name,
           COALESCE(
             (SELECT g2.name FROM pack_genres pg2
              JOIN genres g2 ON g2.id = pg2.genre_id
              WHERE pg2.pack_id = s.pack_id AND COALESCE(g2.is_active, true) = true
              LIMIT 1), ''
           )::text AS genre,
           s.bpm,
           s.key,
           s.type,
           COALESCE(s.download_count, 0)::integer AS download_count,
           s.status,
           COALESCE(s.has_stems, false) AS has_stems,
           COALESCE(st.stem_count, 0)::bigint AS stems_count,
           s.created_at,
           s.metadata,
           s.thumbnail_url
         FROM samples s
         JOIN packs p ON p.id = s.pack_id
         JOIN pack_genres pg ON pg.pack_id = p.id AND pg.genre_id = p_genre_id
         LEFT JOIN creators cr ON cr.id = p.creator_id
         LEFT JOIN (
           SELECT sample_id, COUNT(*) AS stem_count
           FROM stems
           GROUP BY sample_id
         ) st ON st.sample_id = s.id
         WHERE p.status = 'Published' AND s.status = 'Active'
       ) ss),
      '[]'::jsonb
    ),
    'packs', COALESCE(
      (SELECT jsonb_agg(to_jsonb(pp) ORDER BY COALESCE(pp.download_count, 0) DESC, pp.created_at DESC NULLS LAST)
       FROM (
         SELECT
           p.id,
           p.name,
           p.creator_id,
           p.category_id,
           COALESCE(cr.name, '')::text AS creator_name,
           COALESCE(cat.name, 'Uncategorized')::text AS category_name,
           COALESCE(
             (SELECT array_agg(g.name ORDER BY g.name)
              FROM pack_genres pg2
              JOIN genres g ON g.id = pg2.genre_id
              WHERE pg2.pack_id = p.id AND COALESCE(g.is_active, true) = true),
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
         JOIN pack_genres pg ON pg.pack_id = p.id AND pg.genre_id = p_genre_id
         LEFT JOIN creators cr ON cr.id = p.creator_id
         LEFT JOIN categories cat ON cat.id = p.category_id
         LEFT JOIN (
           SELECT pack_id, COUNT(*) AS cnt
           FROM samples
           WHERE status IN ('Active', 'Disabled')
           GROUP BY pack_id
         ) s_cnt ON s_cnt.pack_id = p.id
         WHERE p.status = 'Published'
       ) pp),
      '[]'::jsonb
    ),
    'creators', COALESCE(
      (SELECT jsonb_agg(to_jsonb(cc) ORDER BY cc.packs_count DESC, cc.name ASC)
       FROM (
         SELECT
           c.id,
           c.name,
           c.avatar_url,
           COALESCE(genre_packs.cnt, 0)::bigint AS packs_count,
           COALESCE(genre_samples.cnt, 0)::bigint AS samples_count
         FROM creators c
         INNER JOIN (
           SELECT p.creator_id, COUNT(DISTINCT p.id) AS cnt
           FROM packs p
           JOIN pack_genres pg ON pg.pack_id = p.id AND pg.genre_id = p_genre_id
           WHERE p.status = 'Published'
           GROUP BY p.creator_id
         ) genre_packs ON genre_packs.creator_id = c.id
         LEFT JOIN (
           SELECT p2.creator_id, COUNT(s.id) AS cnt
           FROM samples s
           JOIN packs p2 ON p2.id = s.pack_id
           JOIN pack_genres pg ON pg.pack_id = p2.id AND pg.genre_id = p_genre_id
           WHERE p2.status = 'Published' AND s.status = 'Active'
           GROUP BY p2.creator_id
         ) genre_samples ON genre_samples.creator_id = c.id
         WHERE COALESCE(c.is_active, true) = true
       ) cc),
      '[]'::jsonb
    )
  )::jsonb;
$$;

COMMENT ON FUNCTION public.get_genre_detail_by_id(uuid) IS
  'Returns genre detail: genre object (or null), samples[], packs[], creators[] for Genre Detail Page. Only published packs and active samples. Creators have genre-scoped packs_count and samples_count.';

GRANT EXECUTE ON FUNCTION public.get_genre_detail_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_genre_detail_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_genre_detail_by_id(uuid) TO service_role;
