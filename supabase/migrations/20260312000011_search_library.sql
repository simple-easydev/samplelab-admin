-- RPC: Search samples, packs, creators, genres with relationship cascades.
-- Frontend: supabase.rpc('search_library', { p_query: 'term', p_context: 'samples, packs, creators' })
--
-- Cascades:
-- - context "packs, samples, creators": matched creators → their packs; matched packs → their samples + genres.
-- - context "genres": matched genres → their packs → samples in those packs + creators of those packs.
-- Returns: { samples, packs, creators, genres } — only active/published entities.

CREATE OR REPLACE FUNCTION public.search_library(
  p_query   text,
  p_context text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
WITH params AS (
  SELECT
    NULLIF(trim(p_query), '')                           AS q,
    lower(coalesce(p_context, ''))                      AS ctx,
    position('samples'  in lower(coalesce(p_context, ''))) > 0 AS want_samples,
    position('packs'    in lower(coalesce(p_context, ''))) > 0 AS want_packs,
    position('creators' in lower(coalesce(p_context, ''))) > 0 AS want_creators,
    (position('genres'  in lower(coalesce(p_context, ''))) > 0
     OR position('generes' in lower(coalesce(p_context, ''))) > 0) AS want_genres
),
normalized AS (
  SELECT
    q,
    ctx,
    (ctx = '' OR want_samples)  AS eff_samples,
    (ctx = '' OR want_packs)    AS eff_packs,
    (ctx = '' OR want_creators) AS eff_creators,
    (ctx = '' OR want_genres)   AS eff_genres
  FROM params
),

matched_creators AS (
  SELECT c.id, c.name, c.avatar_url
  FROM normalized n
  JOIN creators c ON n.q IS NOT NULL
  WHERE n.eff_creators
    AND COALESCE(c.is_active, true) = true
    AND c.name ILIKE '%' || n.q || '%'
  ORDER BY c.name ASC
  LIMIT 50
),

matched_packs AS (
  SELECT p.id, p.name, p.creator_id, p.category_id
  FROM normalized n
  JOIN packs p ON n.q IS NOT NULL
  LEFT JOIN creators cr ON cr.id = p.creator_id
  LEFT JOIN categories cat ON cat.id = p.category_id
  WHERE n.eff_packs
    AND p.status = 'Published'
    AND (
      p.name ILIKE '%' || n.q || '%'
      OR cr.name ILIKE '%' || n.q || '%'
      OR cat.name ILIKE '%' || n.q || '%'
    )
  ORDER BY p.created_at DESC NULLS LAST, p.name ASC
  LIMIT 50
),

matched_samples AS (
  SELECT s.id, s.pack_id
  FROM normalized n
  JOIN samples s ON n.q IS NOT NULL
  JOIN packs p   ON p.id = s.pack_id
  LEFT JOIN creators cr ON cr.id = p.creator_id
  WHERE n.eff_samples
    AND s.status = 'Active'
    AND p.status = 'Published'
    AND (
      s.name ILIKE '%' || n.q || '%'
      OR p.name ILIKE '%' || n.q || '%'
      OR cr.name ILIKE '%' || n.q || '%'
    )
  ORDER BY s.created_at DESC NULLS LAST, s.name ASC
  LIMIT 50
),

matched_genres AS (
  SELECT g.id, g.name, g.description, g.thumbnail_url, COALESCE(g.is_active, true) AS is_active
  FROM normalized n
  JOIN genres g ON n.q IS NOT NULL
  WHERE n.eff_genres
    AND COALESCE(g.is_active, true) = true
    AND (g.name ILIKE '%' || n.q || '%' OR g.description ILIKE '%' || n.q || '%')
  ORDER BY g.name ASC
  LIMIT 50
),

packs_from_creators AS (
  SELECT DISTINCT p.id
  FROM matched_creators mc
  JOIN packs p ON p.creator_id = mc.id
  WHERE p.status = 'Published'
),

packs_from_genres AS (
  SELECT DISTINCT p.id
  FROM matched_genres mg
  JOIN pack_genres pg ON pg.genre_id = mg.id
  JOIN packs p ON p.id = pg.pack_id
  WHERE p.status = 'Published'
),

all_packs AS (
  SELECT DISTINCT id FROM matched_packs
  UNION
  SELECT id FROM packs_from_creators
  UNION
  SELECT id FROM packs_from_genres
),

samples_from_packs AS (
  SELECT DISTINCT s.id
  FROM all_packs ap
  JOIN samples s ON s.pack_id = ap.id
  JOIN packs p   ON p.id = s.pack_id
  WHERE s.status = 'Active' AND p.status = 'Published'
),

all_samples AS (
  SELECT DISTINCT id FROM matched_samples
  UNION
  SELECT id FROM samples_from_packs
),

genres_from_packs AS (
  SELECT DISTINCT g.id
  FROM all_packs ap
  JOIN pack_genres pg ON pg.pack_id = ap.id
  JOIN genres g ON g.id = pg.genre_id
  WHERE COALESCE(g.is_active, true) = true
),

creators_from_packs AS (
  SELECT DISTINCT c.id
  FROM all_packs ap
  JOIN packs p ON p.id = ap.id
  JOIN creators c ON c.id = p.creator_id
  WHERE COALESCE(c.is_active, true) = true
),

samples_result AS (
  SELECT
    s.id,
    s.name,
    p.id AS pack_id,
    p.name AS pack_name,
    COALESCE(cr.name, '')::text AS creator_name,
    s.audio_url,
    s.thumbnail_url,
    COALESCE(
      (SELECT g.name FROM pack_genres pg JOIN genres g ON g.id = pg.genre_id
       WHERE pg.pack_id = s.pack_id AND COALESCE(g.is_active, true) = true LIMIT 1), ''
    )::text AS genre,
    s.bpm,
    s.key,
    s.type,
    COALESCE(s.download_count, 0)::integer AS download_count,
    s.status,
    COALESCE(s.has_stems, false) AS has_stems,
    COALESCE(st.stem_count, 0)::bigint AS stems_count,
    s.created_at,
    s.metadata
  FROM all_samples a
  JOIN samples s ON s.id = a.id
  JOIN packs p   ON p.id = s.pack_id
  LEFT JOIN creators cr ON cr.id = p.creator_id
  LEFT JOIN (SELECT sample_id, COUNT(*) AS stem_count FROM stems GROUP BY sample_id) st ON st.sample_id = s.id
  ORDER BY s.created_at DESC NULLS LAST, s.name ASC
  LIMIT 50
),

packs_result AS (
  SELECT
    p.id,
    p.name,
    p.creator_id,
    p.category_id,
    COALESCE(cr.name, '')::text AS creator_name,
    COALESCE(cat.name, 'Uncategorized')::text AS category_name,
    COALESCE(
      (SELECT array_agg(g.name ORDER BY g.name)
       FROM pack_genres pg JOIN genres g ON g.id = pg.genre_id
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
  FROM all_packs ap
  JOIN packs p ON p.id = ap.id
  LEFT JOIN creators cr ON cr.id = p.creator_id
  LEFT JOIN categories cat ON cat.id = p.category_id
  LEFT JOIN (
    SELECT pack_id, COUNT(*) AS cnt FROM samples WHERE status IN ('Active', 'Disabled') GROUP BY pack_id
  ) s_cnt ON s_cnt.pack_id = p.id
  WHERE p.status = 'Published'
  ORDER BY COALESCE(p.download_count, 0) DESC, p.created_at DESC NULLS LAST
  LIMIT 50
),

creator_counts AS (
  SELECT c.id,
    COALESCE(p.packs_count, 0)::bigint AS packs_count,
    COALESCE(s.samples_count, 0)::bigint AS samples_count
  FROM creators c
  LEFT JOIN (SELECT creator_id, COUNT(*) AS packs_count FROM packs GROUP BY creator_id) p ON p.creator_id = c.id
  LEFT JOIN (
    SELECT p2.creator_id, COUNT(sa.id) AS samples_count
    FROM samples sa JOIN packs p2 ON p2.id = sa.pack_id GROUP BY p2.creator_id
  ) s ON s.creator_id = c.id
),

all_creator_ids AS (
  SELECT DISTINCT id FROM matched_creators
  UNION
  SELECT DISTINCT id FROM creators_from_packs
),
creators_result AS (
  SELECT c.id, c.name, c.avatar_url, cc.packs_count, cc.samples_count
  FROM all_creator_ids a
  JOIN creators c ON c.id = a.id
  JOIN creator_counts cc ON cc.id = c.id
  WHERE COALESCE(c.is_active, true) = true
  ORDER BY cc.packs_count DESC, c.name ASC
  LIMIT 50
),

all_genre_ids AS (
  SELECT DISTINCT id FROM matched_genres
  UNION
  SELECT DISTINCT id FROM genres_from_packs
),
genres_result AS (
  SELECT
    g.id,
    g.name,
    g.description,
    g.thumbnail_url,
    COALESCE(g.is_active, true) AS is_active,
    (SELECT COUNT(*)::bigint FROM samples s JOIN packs p ON p.id = s.pack_id
     JOIN pack_genres pg ON pg.pack_id = p.id
     WHERE pg.genre_id = g.id AND p.status = 'Published' AND s.status = 'Active') AS samples_count,
    (SELECT COUNT(DISTINCT p.id)::bigint FROM packs p JOIN pack_genres pg ON pg.pack_id = p.id
     WHERE pg.genre_id = g.id AND p.status = 'Published') AS packs_count
  FROM all_genre_ids a
  JOIN genres g ON g.id = a.id
  WHERE COALESCE(g.is_active, true) = true
  ORDER BY g.name ASC
  LIMIT 50
)

SELECT jsonb_build_object(
  'samples', CASE
    WHEN (SELECT q FROM normalized) IS NULL OR NOT (SELECT eff_samples FROM normalized) THEN '[]'::jsonb
    ELSE COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM samples_result s), '[]'::jsonb)
  END,
  'packs', CASE
    WHEN (SELECT q FROM normalized) IS NULL OR NOT (SELECT eff_packs FROM normalized) THEN '[]'::jsonb
    ELSE COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM packs_result p), '[]'::jsonb)
  END,
  'creators', CASE
    WHEN (SELECT q FROM normalized) IS NULL OR NOT (SELECT eff_creators FROM normalized) THEN '[]'::jsonb
    ELSE COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM creators_result c), '[]'::jsonb)
  END,
  'genres', CASE
    WHEN (SELECT q FROM normalized) IS NULL OR NOT (SELECT eff_genres FROM normalized) THEN '[]'::jsonb
    ELSE COALESCE((SELECT jsonb_agg(to_jsonb(g)) FROM genres_result g), '[]'::jsonb)
  END
);
$$;

COMMENT ON FUNCTION public.search_library(text, text) IS
  'Search samples, packs, creators, genres. Cascades: matched creators→packs; matched packs→samples+genres; matched genres→packs→samples+creators. Only published/active.';

GRANT EXECUTE ON FUNCTION public.search_library(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_library(text, text) TO service_role;
