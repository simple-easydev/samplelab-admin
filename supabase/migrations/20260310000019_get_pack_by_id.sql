-- RPC: get_pack_by_id
-- Returns one JSONB object with pack fields, samples array, and similar_packs array
-- for the pack detail page. Returns null if pack not found.
-- Frontend: supabase.rpc('get_pack_by_id', { p_pack_id: '<uuid>' })

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
  -- Load pack and related scalar data (creator name, category name, genres)
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

  -- Sample count for this pack
  SELECT COUNT(*) INTO v_samples_count
  FROM samples
  WHERE pack_id = p_pack_id AND status IN ('Active', 'Disabled');

  -- Samples in this pack (with optional creator_name from pack's creator)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'pack_id', s.pack_id,
      'name', s.name,
      'audio_url', s.audio_url,
      'bpm', s.bpm,
      'key', s.key,
      'type', s.type,
      'length', s.length,
      'file_size_bytes', s.file_size_bytes,
      'credit_cost', s.credit_cost,
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

  -- Similar packs: same creator, then same category, then overlapping genres; exclude current pack; limit 6
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
  'Returns one JSONB object for a pack: id, name, description, cover_url, creator_id, creator_name, category_id, category_name, genres[], tags[], is_premium, samples_count, download_count, status, created_at, samples[], similar_packs[]. Returns null if pack not found. For pack detail page.';

GRANT EXECUTE ON FUNCTION public.get_pack_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_pack_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pack_by_id(uuid) TO service_role;
