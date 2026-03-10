-- RPC: Return one active creator by id with full detail (description, tags, genres, packs, samples, similar creators).
-- Returns single JSONB: null if creator not found or inactive; otherwise one object with nested arrays.
-- Frontend: supabase.rpc('get_creator_by_id', { p_creator_id: '<uuid>' })
-- Drop existing function first (return type changed from TABLE to jsonb).
DROP FUNCTION IF EXISTS public.get_creator_by_id(uuid);

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
  v_moods jsonb;
  v_packs jsonb;
  v_samples jsonb;
  v_similar_creators jsonb;
  v_result jsonb;
BEGIN
  -- Load creator; exit with null if missing or inactive
  SELECT * INTO v_creator
  FROM creators c
  WHERE c.id = p_creator_id AND COALESCE(c.is_active, true) = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Counts (same rules as get_creators_with_counts: all packs, all samples)
  SELECT COUNT(*) INTO v_packs_count FROM packs WHERE creator_id = p_creator_id;
  SELECT COUNT(*) INTO v_samples_count
    FROM samples s
    JOIN packs p ON p.id = s.pack_id
    WHERE p.creator_id = p_creator_id;

  -- Distinct tags from all packs of this creator
  SELECT COALESCE(array_agg(x.t ORDER BY x.t), ARRAY[]::text[])
  INTO v_tags
  FROM (
    SELECT DISTINCT unnest(COALESCE(packs.tags, ARRAY[]::text[])) AS t
    FROM packs
    WHERE packs.creator_id = p_creator_id
  ) x;

  -- Distinct genres (id, name) from pack_genres for this creator's packs
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name)) FILTER (WHERE g.id IS NOT NULL), '[]'::jsonb)
  INTO v_genres
  FROM (SELECT DISTINCT g2.id, g2.name
        FROM pack_genres pg
        JOIN genres g2 ON g2.id = pg.genre_id
        JOIN packs p ON p.id = pg.pack_id
        WHERE p.creator_id = p_creator_id AND COALESCE(g2.is_active, true) = true) g;

  -- Distinct categories (id, name) from packs of this creator
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', cat.id, 'name', cat.name)) FILTER (WHERE cat.id IS NOT NULL), '[]'::jsonb)
  INTO v_categories
  FROM (SELECT DISTINCT c2.id, c2.name
        FROM packs p
        JOIN categories c2 ON c2.id = p.category_id
        WHERE p.creator_id = p_creator_id AND COALESCE(c2.is_active, true) = true) cat;

  -- All active moods (id, name) - reference list (no pack_moods link in schema)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name) ORDER BY m.name), '[]'::jsonb)
  INTO v_moods
  FROM (SELECT id, name FROM moods WHERE COALESCE(is_active, true) = true ORDER BY name) m;

  -- All packs for this creator (same fields as table)
  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.updated_at DESC NULLS LAST, p.id), '[]'::jsonb)
  INTO v_packs
  FROM (
    SELECT id, name, description, cover_url, category_id, tags, is_premium, status,
           download_count, created_at, updated_at
    FROM packs
    WHERE creator_id = p_creator_id
  ) p;

  -- All samples for this creator's packs
  SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.pack_id, s.name, s.id), '[]'::jsonb)
  INTO v_samples
  FROM (
    SELECT s.id, s.pack_id, s.name, s.audio_url, s.bpm, s.key, s.type, s.length,
           s.file_size_bytes, s.credit_cost, s.status, s.has_stems, s.download_count,
           s.created_at, s.updated_at
    FROM samples s
    JOIN packs p ON p.id = s.pack_id
    WHERE p.creator_id = p_creator_id
  ) s;

  -- Similar creators: share at least one genre with this creator's packs, exclude self, limit 6
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
    'moods', COALESCE(v_moods, '[]'::jsonb),
    'packs', COALESCE(v_packs, '[]'::jsonb),
    'samples', COALESCE(v_samples, '[]'::jsonb),
    'similar_creators', COALESCE(v_similar_creators, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_creator_by_id(uuid) IS
  'Returns one JSONB object for the active creator: id, name, description (bio), avatar_url, packs_count, samples_count, tags[], genres[], categories[], moods[], packs[], samples[], similar_creators[]. Returns null if not found or inactive.';

GRANT EXECUTE ON FUNCTION public.get_creator_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_creator_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_by_id(uuid) TO service_role;
