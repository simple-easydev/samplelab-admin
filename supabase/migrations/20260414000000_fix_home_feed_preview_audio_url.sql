-- Fix: home feed/new releases/trending should return preview audio for playback.
-- We keep the frontend field name `audio_url`, but source it from `samples.preview_audio_url`
-- (falling back to `samples.audio_url` when preview is missing).

CREATE OR REPLACE FUNCTION public.get_trending_samples()
RETURNS TABLE (
  id uuid,
  name text,
  audio_url text,
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
  created_at timestamptz,
  metadata jsonb,
  thumbnail_url text,
  trending_score numeric,
  release_date timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    COALESCE(s.preview_audio_url, s.audio_url)::text AS audio_url,
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
    s.created_at,
    s.metadata,
    s.thumbnail_url,
    s.trending_score,
    s.release_date
  FROM samples s
  JOIN packs p ON p.id = s.pack_id
  LEFT JOIN creators cr ON cr.id = p.creator_id
  LEFT JOIN (
    SELECT sample_id, COUNT(*) AS stem_count
    FROM stems
    GROUP BY sample_id
  ) st ON st.sample_id = s.id
  WHERE s.status = 'Active'
  ORDER BY s.trending_score DESC NULLS LAST, s.created_at DESC NULLS LAST
  LIMIT 5;
$$;

COMMENT ON FUNCTION public.get_trending_samples() IS
  'Returns top 5 active samples ordered by trending_score (for home/explore).';

GRANT EXECUTE ON FUNCTION public.get_trending_samples() TO anon;
GRANT EXECUTE ON FUNCTION public.get_trending_samples() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_samples() TO service_role;


CREATE OR REPLACE FUNCTION public.get_new_releases()
RETURNS TABLE (
  id uuid,
  name text,
  audio_url text,
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
  created_at timestamptz,
  metadata jsonb,
  thumbnail_url text,
  trending_score numeric,
  release_date timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    COALESCE(s.preview_audio_url, s.audio_url)::text AS audio_url,
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
    s.created_at,
    s.metadata,
    s.thumbnail_url,
    s.trending_score,
    s.release_date
  FROM samples s
  JOIN packs p ON p.id = s.pack_id
  LEFT JOIN creators cr ON cr.id = p.creator_id
  LEFT JOIN (
    SELECT sample_id, COUNT(*) AS stem_count
    FROM stems
    GROUP BY sample_id
  ) st ON st.sample_id = s.id
  WHERE s.status = 'Active' AND s.release_date IS NOT NULL
  ORDER BY s.release_date DESC, s.created_at DESC NULLS LAST
  LIMIT 5;
$$;

COMMENT ON FUNCTION public.get_new_releases() IS
  'Returns latest 5 released (Active) samples by release_date (for home/explore).';

GRANT EXECUTE ON FUNCTION public.get_new_releases() TO anon;
GRANT EXECUTE ON FUNCTION public.get_new_releases() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_new_releases() TO service_role;


CREATE OR REPLACE FUNCTION public.get_home_feed()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'trending_samples', COALESCE(
      (SELECT jsonb_agg(to_jsonb(t)) FROM (
        SELECT
          s.id,
          s.name,
          COALESCE(s.preview_audio_url, s.audio_url)::text AS audio_url,
          p.id AS pack_id,
          p.name AS pack_name,
          COALESCE(cr.name, '')::text AS creator_name,
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
          s.metadata,
          s.thumbnail_url,
          s.trending_score,
          s.release_date
        FROM samples s
        JOIN packs p ON p.id = s.pack_id
        LEFT JOIN creators cr ON cr.id = p.creator_id
        LEFT JOIN (SELECT sample_id, COUNT(*) AS stem_count FROM stems GROUP BY sample_id) st ON st.sample_id = s.id
        WHERE s.status = 'Active'
        ORDER BY s.trending_score DESC NULLS LAST, s.created_at DESC NULLS LAST
        LIMIT 5
      ) t),
      '[]'::jsonb
    ),
    'new_releases', COALESCE(
      (SELECT jsonb_agg(to_jsonb(n)) FROM (
        SELECT
          s.id,
          s.name,
          COALESCE(s.preview_audio_url, s.audio_url)::text AS audio_url,
          p.id AS pack_id,
          p.name AS pack_name,
          COALESCE(cr.name, '')::text AS creator_name,
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
          s.metadata,
          s.thumbnail_url,
          s.trending_score,
          s.release_date
        FROM samples s
        JOIN packs p ON p.id = s.pack_id
        LEFT JOIN creators cr ON cr.id = p.creator_id
        LEFT JOIN (SELECT sample_id, COUNT(*) AS stem_count FROM stems GROUP BY sample_id) st ON st.sample_id = s.id
        WHERE s.status = 'Active' AND s.release_date IS NOT NULL
        ORDER BY s.release_date DESC, s.created_at DESC NULLS LAST
        LIMIT 5
      ) n),
      '[]'::jsonb
    ),
    'top_creators', COALESCE(
      (SELECT jsonb_agg(to_jsonb(cr)) FROM (
        SELECT
          c.id,
          c.name,
          c.avatar_url,
          COALESCE(c.rank, 0)::integer AS rank,
          COALESCE(p.packs_count, 0)::bigint AS packs_count,
          COALESCE(s.samples_count, 0)::bigint AS samples_count
        FROM creators c
        LEFT JOIN (SELECT creator_id, COUNT(*) AS packs_count FROM packs GROUP BY creator_id) p ON p.creator_id = c.id
        LEFT JOIN (
          SELECT p2.creator_id, COUNT(sa.id) AS samples_count
          FROM samples sa JOIN packs p2 ON p2.id = sa.pack_id GROUP BY p2.creator_id
        ) s ON s.creator_id = c.id
        WHERE COALESCE(c.is_active, true) = true
        ORDER BY COALESCE(c.rank, 0) DESC NULLS LAST, c.name ASC
        LIMIT 5
      ) cr),
      '[]'::jsonb
    )
  );
$$;

COMMENT ON FUNCTION public.get_home_feed() IS
  'Returns one object: { trending_samples, new_releases, top_creators } for home/explore in a single call.';

GRANT EXECUTE ON FUNCTION public.get_home_feed() TO anon;
GRANT EXECUTE ON FUNCTION public.get_home_feed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_home_feed() TO service_role;

