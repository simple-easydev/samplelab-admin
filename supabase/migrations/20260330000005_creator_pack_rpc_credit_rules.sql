-- Align get_pack_by_id and get_creator_by_id sample credit_cost payloads
-- with app_settings credit rules by sample type.

CREATE OR REPLACE FUNCTION public.get_pack_by_id(p_pack_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_pack_id uuid;
  v_name text;
  v_description text;
  v_cover_url text;
  v_creator_id uuid;
  v_creator_name text;
  v_category_id uuid;
  v_category_name text;
  v_genres text[];
  v_tags text[];
  v_is_premium boolean;
  v_samples_count bigint;
  v_download_count integer;
  v_status text;
  v_created_at timestamptz;
  v_samples jsonb;
  v_similar_packs jsonb;
  v_result jsonb;
BEGIN
  SELECT
    p.id,
    p.name,
    p.description,
    p.cover_url,
    p.creator_id,
    COALESCE(cr.name, '')::text,
    p.category_id,
    COALESCE(cat.name, 'Uncategorized')::text,
    COALESCE(
      (SELECT array_agg(g.name ORDER BY g.name)
       FROM pack_genres pg
       JOIN genres g ON g.id = pg.genre_id
       WHERE pg.pack_id = p.id AND COALESCE(g.is_active, true) = true),
      ARRAY[]::text[]
    ),
    COALESCE(p.tags, ARRAY[]::text[]),
    COALESCE(p.is_premium, false),
    p.status,
    COALESCE(p.download_count, 0),
    p.created_at
  INTO
    v_pack_id,
    v_name,
    v_description,
    v_cover_url,
    v_creator_id,
    v_creator_name,
    v_category_id,
    v_category_name,
    v_genres,
    v_tags,
    v_is_premium,
    v_status,
    v_download_count,
    v_created_at
  FROM packs p
  LEFT JOIN creators cr ON cr.id = p.creator_id
  LEFT JOIN categories cat ON cat.id = p.category_id
  WHERE p.id = p_pack_id;

  IF v_pack_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*) INTO v_samples_count
  FROM samples
  WHERE pack_id = p_pack_id AND status IN ('Active', 'Disabled');

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'pack_id', s.pack_id,
      'name', s.name,
      'audio_url', s.audio_url,
      'preview_audio_url', COALESCE(s.preview_audio_url, s.audio_url),
      'bpm', s.bpm,
      'key', s.key,
      'type', s.type,
      'length', s.length,
      'file_size_bytes', s.file_size_bytes,
      'credit_cost', COALESCE(
        CASE
          WHEN lower(COALESCE(s.type, '')) IN ('one-shot', 'one_shot', 'oneshot') THEN (
            SELECT CASE
              WHEN trim(a.value) ~ '^-?[0-9]+$' THEN trim(a.value)::integer
              ELSE NULL
            END
            FROM public.app_settings a
            WHERE a.key = 'credit_rules.one_shots'
            LIMIT 1
          )
          ELSE (
            SELECT CASE
              WHEN trim(a.value) ~ '^-?[0-9]+$' THEN trim(a.value)::integer
              ELSE NULL
            END
            FROM public.app_settings a
            WHERE a.key = 'credit_rules.loops_compositions'
            LIMIT 1
          )
        END,
        CASE
          WHEN lower(COALESCE(s.type, '')) IN ('one-shot', 'one_shot', 'oneshot') THEN 1
          ELSE 2
        END
      )::integer,
      'status', s.status,
      'has_stems', COALESCE(s.has_stems, false),
      'download_count', COALESCE(s.download_count, 0),
      'created_at', s.created_at,
      'creator_name', v_creator_name,
      'thumbnail_url', s.thumbnail_url,
      'metadata', s.metadata
    )
    ORDER BY s.name, s.id
  ), '[]'::jsonb)
  INTO v_samples
  FROM samples s
  WHERE s.pack_id = p_pack_id AND s.status IN ('Active', 'Disabled');

  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
  INTO v_similar_packs
  FROM (
    SELECT jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'creator_id', p.creator_id,
      'category_id', p.category_id,
      'creator_name', COALESCE(cr.name, '')::text,
      'category_name', COALESCE(cat.name, 'Uncategorized')::text,
      'genres', COALESCE(
        (SELECT array_agg(g.name ORDER BY g.name)
         FROM pack_genres pg
         JOIN genres g ON g.id = pg.genre_id
         WHERE pg.pack_id = p.id AND COALESCE(g.is_active, true) = true),
        ARRAY[]::text[]
      ),
      'tags', COALESCE(p.tags, ARRAY[]::text[]),
      'samples_count', COALESCE(s_cnt.cnt, 0)::bigint,
      'download_count', COALESCE(p.download_count, 0)::integer,
      'status', p.status,
      'cover_url', p.cover_url,
      'created_at', p.created_at,
      'is_premium', COALESCE(p.is_premium, false)
    ) AS sub
    FROM packs p
    LEFT JOIN creators cr ON cr.id = p.creator_id
    LEFT JOIN categories cat ON cat.id = p.category_id
    LEFT JOIN (
      SELECT pack_id, COUNT(*) AS cnt
      FROM samples
      WHERE status IN ('Active', 'Disabled')
      GROUP BY pack_id
    ) s_cnt ON s_cnt.pack_id = p.id
    WHERE p.id != p_pack_id
      AND (
        p.creator_id = v_creator_id
        OR p.category_id = v_category_id
        OR EXISTS (
          SELECT 1 FROM pack_genres pg_other
          WHERE pg_other.pack_id = p.id
            AND pg_other.genre_id IN (
              SELECT pg_cur.genre_id
              FROM pack_genres pg_cur
              WHERE pg_cur.pack_id = p_pack_id
            )
        )
      )
    ORDER BY
      (p.creator_id = v_creator_id) DESC,
      (p.category_id = v_category_id) DESC,
      p.created_at DESC NULLS LAST
    LIMIT 6
  ) x;

  v_result := jsonb_build_object(
    'id', v_pack_id,
    'name', v_name,
    'description', v_description,
    'cover_url', v_cover_url,
    'creator_id', v_creator_id,
    'creator_name', v_creator_name,
    'category_id', v_category_id,
    'category_name', v_category_name,
    'genres', COALESCE(v_genres, ARRAY[]::text[]),
    'tags', COALESCE(v_tags, ARRAY[]::text[]),
    'is_premium', v_is_premium,
    'samples_count', COALESCE(v_samples_count, 0),
    'download_count', COALESCE(v_download_count, 0),
    'status', v_status,
    'created_at', v_created_at,
    'samples', COALESCE(v_samples, '[]'::jsonb),
    'similar_packs', COALESCE(v_similar_packs, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_pack_by_id(uuid) IS
  'Returns pack detail JSON; sample credit_cost is derived from app_settings credit_rules by sample type.';


CREATE OR REPLACE FUNCTION public.get_creator_by_id(p_creator_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_creator creators%ROWTYPE;
  v_packs_count bigint;
  v_samples_count bigint;
  v_tags text[];
  v_genres jsonb;
  v_categories jsonb;
  v_packs jsonb;
  v_samples jsonb;
  v_similar_creators jsonb;
  v_result jsonb;
BEGIN
  SELECT * INTO v_creator
  FROM creators c
  WHERE c.id = p_creator_id AND COALESCE(c.is_active, true) = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*) INTO v_packs_count FROM packs WHERE creator_id = p_creator_id;
  SELECT COUNT(*) INTO v_samples_count
    FROM samples s
    JOIN packs p ON p.id = s.pack_id
    WHERE p.creator_id = p_creator_id;

  SELECT COALESCE(array_agg(x.t ORDER BY x.t), ARRAY[]::text[])
  INTO v_tags
  FROM (
    SELECT DISTINCT unnest(COALESCE(packs.tags, ARRAY[]::text[])) AS t
    FROM packs
    WHERE packs.creator_id = p_creator_id
  ) x;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name)) FILTER (WHERE g.id IS NOT NULL), '[]'::jsonb)
  INTO v_genres
  FROM (SELECT DISTINCT g2.id, g2.name
        FROM pack_genres pg
        JOIN genres g2 ON g2.id = pg.genre_id
        JOIN packs p ON p.id = pg.pack_id
        WHERE p.creator_id = p_creator_id AND COALESCE(g2.is_active, true) = true) g;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', cat.id, 'name', cat.name)) FILTER (WHERE cat.id IS NOT NULL), '[]'::jsonb)
  INTO v_categories
  FROM (SELECT DISTINCT c2.id, c2.name
        FROM packs p
        JOIN categories c2 ON c2.id = p.category_id
        WHERE p.creator_id = p_creator_id AND COALESCE(c2.is_active, true) = true) cat;

  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.updated_at DESC NULLS LAST, p.id), '[]'::jsonb)
  INTO v_packs
  FROM (
    SELECT id, name, description, cover_url, category_id, tags, is_premium, status,
           download_count, created_at, updated_at
    FROM packs
    WHERE creator_id = p_creator_id
  ) p;

  SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.pack_id, s.name, s.id), '[]'::jsonb)
  INTO v_samples
  FROM (
    SELECT s.id, s.pack_id, s.name, s.audio_url, s.bpm, s.key, s.type, s.length,
           s.file_size_bytes,
           COALESCE(
             CASE
               WHEN lower(COALESCE(s.type, '')) IN ('one-shot', 'one_shot', 'oneshot') THEN (
                 SELECT CASE
                   WHEN trim(a.value) ~ '^-?[0-9]+$' THEN trim(a.value)::integer
                   ELSE NULL
                 END
                 FROM public.app_settings a
                 WHERE a.key = 'credit_rules.one_shots'
                 LIMIT 1
               )
               ELSE (
                 SELECT CASE
                   WHEN trim(a.value) ~ '^-?[0-9]+$' THEN trim(a.value)::integer
                   ELSE NULL
                 END
                 FROM public.app_settings a
                 WHERE a.key = 'credit_rules.loops_compositions'
                 LIMIT 1
               )
             END,
             CASE
               WHEN lower(COALESCE(s.type, '')) IN ('one-shot', 'one_shot', 'oneshot') THEN 1
               ELSE 2
             END
           )::integer AS credit_cost,
           s.status, s.has_stems, s.download_count,
           s.created_at, s.updated_at
    FROM samples s
    JOIN packs p ON p.id = s.pack_id
    WHERE p.creator_id = p_creator_id
  ) s;

  SELECT COALESCE(jsonb_agg(sc), '[]'::jsonb)
  INTO v_similar_creators
  FROM (
    SELECT jsonb_build_object('id', c.id, 'name', c.name, 'avatar_url', c.avatar_url) AS sc
    FROM creators c
    WHERE c.id != p_creator_id
      AND COALESCE(c.is_active, true) = true
      AND EXISTS (
        SELECT 1 FROM pack_genres pg
        JOIN packs p ON p.id = pg.pack_id
        WHERE p.creator_id = c.id
          AND pg.genre_id IN (
            SELECT pg2.genre_id
            FROM pack_genres pg2
            JOIN packs p2 ON p2.id = pg2.pack_id
            WHERE p2.creator_id = p_creator_id
          )
      )
    ORDER BY c.name
    LIMIT 6
  ) x;

  v_result := jsonb_build_object(
    'id', v_creator.id,
    'name', v_creator.name,
    'description', v_creator.bio,
    'avatar_url', v_creator.avatar_url,
    'packs_count', v_packs_count,
    'samples_count', v_samples_count,
    'tags', COALESCE(v_tags, ARRAY[]::text[]),
    'genres', COALESCE(v_genres, '[]'::jsonb),
    'categories', COALESCE(v_categories, '[]'::jsonb),
    'packs', COALESCE(v_packs, '[]'::jsonb),
    'samples', COALESCE(v_samples, '[]'::jsonb),
    'similar_creators', COALESCE(v_similar_creators, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_creator_by_id(uuid) IS
  'Returns creator detail JSON; sample credit_cost is derived from app_settings credit_rules by sample type.';
