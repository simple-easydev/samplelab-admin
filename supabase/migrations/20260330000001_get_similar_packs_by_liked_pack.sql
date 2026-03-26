-- RPC: Similar packs for a pack the user liked.
-- Response: { "liked_pack": { "id", "name" }, "similarities": [ ... ] }
-- Similarity (same as get_pack_by_id similar_packs): same creator, same category, or overlapping genres.
-- Optional p_pack_id: must be in user_pack_likes for the caller; if null, uses most recent liked pack.

CREATE OR REPLACE FUNCTION public.get_similar_packs_by_liked_pack(
  p_pack_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 6
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_seed uuid;
  v_limit integer;
  v_liked jsonb;
  v_creator_id uuid;
  v_category_id uuid;
  v_similar jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_limit := GREATEST(1, LEAST(COALESCE(p_limit, 6), 100));

  IF p_pack_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.user_pack_likes u
      WHERE u.user_id = v_user_id
        AND u.pack_id = p_pack_id
    ) THEN
      RETURN NULL;
    END IF;
    v_seed := p_pack_id;
  ELSE
    SELECT u.pack_id
    INTO v_seed
    FROM public.user_pack_likes u
    WHERE u.user_id = v_user_id
    ORDER BY u.created_at DESC NULLS LAST
    LIMIT 1;

    IF v_seed IS NULL THEN
      RETURN NULL;
    END IF;
  END IF;

  SELECT
    jsonb_build_object('id', p.id, 'name', p.name),
    p.creator_id,
    p.category_id
  INTO v_liked, v_creator_id, v_category_id
  FROM public.packs p
  WHERE p.id = v_seed;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    (
      SELECT jsonb_agg(
        x.elem
        ORDER BY
          x.sort_creator DESC,
          x.sort_category DESC,
          x.created_at DESC NULLS LAST
      )
      FROM (
        SELECT
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'creator_id', p.creator_id,
            'category_id', p.category_id,
            'creator_name', COALESCE(cr.name, '')::text,
            'category_name', COALESCE(cat.name, 'Uncategorized')::text,
            'genres', COALESCE(
              (
                SELECT array_agg(g.name ORDER BY g.name)
                FROM public.pack_genres pg
                JOIN public.genres g ON g.id = pg.genre_id
                WHERE pg.pack_id = p.id
                  AND COALESCE(g.is_active, true) = true
              ),
              ARRAY[]::text[]
            ),
            'tags', COALESCE(p.tags, ARRAY[]::text[]),
            'samples_count', COALESCE(s_cnt.cnt, 0)::bigint,
            'download_count', COALESCE(p.download_count, 0)::integer,
            'status', p.status,
            'cover_url', p.cover_url,
            'created_at', p.created_at,
            'is_premium', COALESCE(p.is_premium, false)
          ) AS elem,
          (p.creator_id IS NOT DISTINCT FROM v_creator_id) AS sort_creator,
          (p.category_id IS NOT DISTINCT FROM v_category_id) AS sort_category,
          p.created_at
        FROM public.packs p
        LEFT JOIN public.creators cr ON cr.id = p.creator_id
        LEFT JOIN public.categories cat ON cat.id = p.category_id
        LEFT JOIN (
          SELECT pack_id, COUNT(*) AS cnt
          FROM public.samples
          WHERE status IN ('Active', 'Disabled')
          GROUP BY pack_id
        ) s_cnt ON s_cnt.pack_id = p.id
        WHERE p.id <> v_seed
          AND p.status = 'Published'
          AND (
            p.creator_id IS NOT DISTINCT FROM v_creator_id
            OR p.category_id IS NOT DISTINCT FROM v_category_id
            OR EXISTS (
              SELECT 1
              FROM public.pack_genres pg_other
              WHERE pg_other.pack_id = p.id
                AND pg_other.genre_id IN (
                  SELECT pg_cur.genre_id
                  FROM public.pack_genres pg_cur
                  WHERE pg_cur.pack_id = v_seed
                )
            )
          )
        ORDER BY
          (p.creator_id IS NOT DISTINCT FROM v_creator_id) DESC,
          (p.category_id IS NOT DISTINCT FROM v_category_id) DESC,
          p.created_at DESC NULLS LAST
        LIMIT v_limit
      ) x
    ),
    '[]'::jsonb
  )
  INTO v_similar;

  RETURN jsonb_build_object(
    'liked_pack', v_liked,
    'similarities', COALESCE(v_similar, '[]'::jsonb)
  );
END;
$$;

COMMENT ON FUNCTION public.get_similar_packs_by_liked_pack(uuid, integer) IS
  'Returns { liked_pack: { id, name }, similarities: [...] } for a pack the user liked. Same similarity rules as get_pack_by_id similar_packs; only Published recommendations.';

REVOKE ALL ON FUNCTION public.get_similar_packs_by_liked_pack(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_similar_packs_by_liked_pack(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_similar_packs_by_liked_pack(uuid, integer) TO service_role;
