-- Normalize sample type labels (Loop / Loops / One-shot / One-shots / etc.)
-- for credit rules and get_all_samples p_type filtering.

CREATE OR REPLACE FUNCTION public.is_one_shot_sample_type(p_sample_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(lower(trim(COALESCE(p_sample_type, ''))), '[^a-z0-9]', '', 'g') IN ('oneshot', 'oneshots');
$$;

CREATE OR REPLACE FUNCTION public.is_loop_sample_type(p_sample_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(lower(trim(COALESCE(p_sample_type, ''))), '[^a-z0-9]', '', 'g') IN ('loop', 'loops');
$$;

CREATE OR REPLACE FUNCTION public.credit_cost_from_sample_type(p_type text)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE
      WHEN public.is_one_shot_sample_type(p_type) THEN (
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
      WHEN public.is_one_shot_sample_type(p_type) THEN 1
      ELSE 2
    END
  )::integer;
$$;

COMMENT ON FUNCTION public.credit_cost_from_sample_type(text) IS
  'Credit cost from app_settings credit_rules; one-shot family vs loop family (Loop, Loops, One-shot, One-shots, etc.).';

GRANT EXECUTE ON FUNCTION public.is_one_shot_sample_type(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_loop_sample_type(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.credit_cost_from_sample_type(text) TO authenticated, service_role;


-- get_all_samples: use helpers for credit_cost and p_type filter
CREATE OR REPLACE FUNCTION public.get_all_samples(
  p_search      text DEFAULT NULL,
  p_sort        text DEFAULT 'newest',
  p_genres      text[] DEFAULT NULL,
  p_keywords    text[] DEFAULT NULL,
  p_instrument  text DEFAULT 'all',
  p_type        text DEFAULT 'all',
  p_stems       text DEFAULT 'all',
  p_keys        text[] DEFAULT NULL,
  p_key_quality text DEFAULT 'all',
  p_bpm_min     int DEFAULT NULL,
  p_bpm_max     int DEFAULT NULL,
  p_bpm_exact   int DEFAULT NULL,
  p_limit       int DEFAULT NULL,
  p_offset      int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  preview_audio_url text,
  pack_id uuid,
  pack_name text,
  creator_id uuid,
  creator_name text,
  genre text,
  bpm integer,
  key text,
  instrument text,
  type text,
  download_count integer,
  credit_cost integer,
  status text,
  has_stems boolean,
  stems_count bigint,
  created_at timestamptz,
  metadata jsonb,
  thumbnail_url text,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      s.id,
      s.name,
      COALESCE(s.preview_audio_url, s.audio_url) AS preview_audio_url,
      p.id AS pack_id,
      p.name AS pack_name,
      p.creator_id AS creator_id,
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
      s.instrument,
      s.type,
      COALESCE(s.download_count, 0)::integer AS download_count,
      public.credit_cost_from_sample_type(s.type) AS credit_cost,
      s.status,
      COALESCE(s.has_stems, false) AS has_stems,
      COALESCE(st.stem_count, 0)::bigint AS stems_count,
      s.created_at,
      s.metadata,
      s.thumbnail_url
    FROM samples s
    JOIN packs p ON p.id = s.pack_id
    LEFT JOIN creators cr ON cr.id = p.creator_id
    LEFT JOIN (
      SELECT sample_id, COUNT(*) AS stem_count
      FROM stems
      GROUP BY sample_id
    ) st ON st.sample_id = s.id
    WHERE
      (p_search IS NULL OR trim(p_search) = ''
       OR s.name ILIKE '%' || trim(p_search) || '%'
       OR p.name ILIKE '%' || trim(p_search) || '%'
       OR cr.name ILIKE '%' || trim(p_search) || '%')
      AND (p_genres IS NULL OR cardinality(p_genres) = 0 OR EXISTS (
        SELECT 1 FROM pack_genres pg
        JOIN genres g ON g.id = pg.genre_id
        WHERE pg.pack_id = s.pack_id AND COALESCE(g.is_active, true) = true AND g.name = ANY(p_genres)
      ))
      AND (p_keywords IS NULL OR cardinality(p_keywords) = 0 OR p.tags && p_keywords)
      AND (
        p_instrument IS NULL
        OR trim(lower(p_instrument)) = 'all'
        OR (
          trim(p_instrument) <> ''
          AND EXISTS (
            SELECT 1
            FROM (
              SELECT COALESCE(
                NULLIF(trim(s.instrument), ''),
                NULLIF(trim(s.metadata->>'instrument'), ''),
                NULLIF(trim(s.metadata->>'Instrument'), ''),
                (
                  SELECT NULLIF(trim(v), '')
                  FROM jsonb_each_text(
                    CASE
                      WHEN s.metadata IS NULL THEN '{}'::jsonb
                      WHEN jsonb_typeof(s.metadata) <> 'object' THEN '{}'::jsonb
                      ELSE s.metadata
                    END
                  ) t(k, v)
                  WHERE lower(k) = 'instrument'
                  LIMIT 1
                )
              ) AS eff
            ) x
            WHERE x.eff IS NOT NULL
              AND (
                trim(x.eff) ILIKE '%' || trim(p_instrument) || '%'
                OR trim(p_instrument) ILIKE '%' || trim(x.eff) || '%'
              )
          )
        )
      )
      AND (p_type = 'all' OR p_type IS NULL
           OR (public.is_loop_sample_type(p_type) AND public.is_loop_sample_type(s.type))
           OR (public.is_one_shot_sample_type(p_type) AND public.is_one_shot_sample_type(s.type)))
      AND (p_stems = 'all' OR p_stems IS NULL
           OR (p_stems = 'yes' AND COALESCE(s.has_stems, false) = true)
           OR (p_stems = 'no' AND COALESCE(s.has_stems, false) = false))
      AND (
        p_keys IS NULL OR cardinality(p_keys) = 0
        OR (
          s.key IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM (SELECT unnest(p_keys) AS kt) q
            WHERE trim(q.kt) <> ''
              AND (
                lower(trim(s.key)) = lower(trim(q.kt))
                OR lower(trim(s.key)) LIKE lower(trim(q.kt)) || ' %'
              )
          )
        )
      )
      AND (
        p_key_quality IS NULL
        OR trim(lower(p_key_quality)) = 'all'
        OR trim(lower(p_key_quality)) NOT IN ('major', 'minor')
        OR (
          s.key IS NOT NULL
          AND (
            (trim(lower(p_key_quality)) = 'major' AND right(lower(trim(s.key)), 6) = ' major')
            OR (trim(lower(p_key_quality)) = 'minor' AND right(lower(trim(s.key)), 6) = ' minor')
          )
        )
      )
      AND (
        (p_bpm_exact IS NOT NULL AND s.bpm = p_bpm_exact)
        OR (p_bpm_exact IS NULL AND
            (p_bpm_min IS NULL OR p_bpm_min <= 0 OR (s.bpm IS NOT NULL AND s.bpm >= p_bpm_min))
            AND (
              p_bpm_max IS NULL
              OR (s.bpm IS NOT NULL AND s.bpm <= p_bpm_max)
              OR (s.bpm IS NULL AND (p_bpm_min IS NULL OR p_bpm_min <= 0))
            ))
      )
  ),
  counted AS (
    SELECT *, (SELECT COUNT(*)::bigint FROM base) AS total_count
    FROM base
  )
  SELECT
    c.id,
    c.name,
    c.preview_audio_url,
    c.pack_id,
    c.pack_name,
    c.creator_id,
    c.creator_name,
    c.genre,
    c.bpm,
    c.key,
    c.instrument,
    c.type,
    c.download_count,
    c.credit_cost,
    c.status,
    c.has_stems,
    c.stems_count,
    c.created_at,
    c.metadata,
    c.thumbnail_url,
    c.total_count
  FROM counted c
  ORDER BY
    CASE WHEN p_sort = 'newest' THEN c.created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'oldest' THEN c.created_at END ASC NULLS LAST,
    CASE WHEN p_sort = 'popular' THEN c.download_count END DESC NULLS LAST,
    CASE WHEN p_sort = 'name-az' THEN c.name END ASC NULLS LAST,
    CASE WHEN p_sort = 'name-za' THEN c.name END DESC NULLS LAST,
    c.created_at DESC NULLS LAST,
    c.name ASC
  LIMIT p_limit
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

COMMENT ON FUNCTION public.get_all_samples(
  text, text, text[], text[], text, text, text, text[], text,
  integer, integer, integer, integer, integer
) IS
  'Samples list; credit_cost from credit_cost_from_sample_type(s.type).';


-- get_similar_samples_by_downloaded_sample: use helper for credit_cost in JSON payload
CREATE OR REPLACE FUNCTION public.get_similar_samples_by_downloaded_sample(
  p_limit integer DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_seed_sample_id uuid;
  v_seed_sample_name text;
  v_pack_id uuid;
  v_limit integer;
  v_similar jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_limit := GREATEST(1, LEAST(COALESCE(p_limit, 24), 100));

  SELECT ca.sample_id
  INTO v_seed_sample_id
  FROM public.credit_activity ca
  JOIN public.customers c ON c.id = ca.customer_id
  WHERE c.user_id = v_user_id
    AND ca.activity_type = 'download_charge'
    AND ca.sample_id IS NOT NULL
  ORDER BY ca.created_at DESC
  LIMIT 1;

  IF v_seed_sample_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT s.pack_id, s.name
  INTO v_pack_id, v_seed_sample_name
  FROM public.samples s
  WHERE s.id = v_seed_sample_id;

  IF v_pack_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC NULLS LAST),
    '[]'::jsonb
  )
  INTO v_similar
  FROM (
    SELECT
      s2.id,
      s2.name,
      COALESCE(s2.preview_audio_url, s2.audio_url)::text AS preview_audio_url,
      p.id AS pack_id,
      p.name AS pack_name,
      p.creator_id,
      COALESCE(cr.name, '')::text AS creator_name,
      COALESCE(
        (SELECT g.name
         FROM public.pack_genres pg
         JOIN public.genres g ON g.id = pg.genre_id
         WHERE pg.pack_id = p.id AND COALESCE(g.is_active, true) = true
         LIMIT 1),
        ''
      )::text AS genre,
      s2.bpm,
      s2.key,
      s2.type,
      COALESCE(s2.download_count, 0)::integer AS download_count,
      s2.status,
      COALESCE(s2.has_stems, false) AS has_stems,
      COALESCE(st.stem_count, 0)::bigint AS stems_count,
      s2.created_at,
      s2.metadata,
      s2.thumbnail_url,
      public.credit_cost_from_sample_type(s2.type) AS credit_cost
    FROM public.samples s2
    JOIN public.packs p ON p.id = s2.pack_id
    LEFT JOIN public.creators cr ON cr.id = p.creator_id
    LEFT JOIN (
      SELECT sample_id, COUNT(*) AS stem_count
      FROM public.stems
      GROUP BY sample_id
    ) st ON st.sample_id = s2.id
    WHERE s2.pack_id = v_pack_id
      AND s2.id <> v_seed_sample_id
      AND s2.status = 'Active'
      AND p.status = 'Published'
    ORDER BY s2.created_at DESC NULLS LAST
    LIMIT v_limit
  ) t;

  RETURN jsonb_build_object(
    'seed_sample',
    jsonb_build_object(
      'id', v_seed_sample_id,
      'name', v_seed_sample_name
    ),
    'similarities',
    COALESCE(v_similar, '[]'::jsonb)
  );
END;
$$;

COMMENT ON FUNCTION public.get_similar_samples_by_downloaded_sample(integer) IS
  'Similar samples JSON; credit_cost from credit_cost_from_sample_type.';


-- request_sample_download_prepare: debit uses credit_cost_from_sample_type
CREATE OR REPLACE FUNCTION public.request_sample_download_prepare(
  p_sample_id uuid,
  p_user_id uuid,
  p_idempotency_key uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_existing public.sample_credit_downloads%ROWTYPE;
  v_replay_name text;
  v_replay_url text;
  v_name text;
  v_audio_url text;
  v_cost integer;
  v_sample_type text;
  v_sample_status text;
  v_pack_status text;
  v_is_premium boolean;
  v_has_sub boolean;
  v_charged integer;
  v_balance_before integer;
  v_balance_after integer;
BEGIN
  SELECT * INTO v_customer
  FROM public.customers
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'customer_not_found');
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text || ':' || p_idempotency_key::text));

    SELECT * INTO v_existing
    FROM public.sample_credit_downloads
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;

    IF FOUND THEN
      IF v_existing.sample_id IS DISTINCT FROM p_sample_id THEN
        RETURN jsonb_build_object('ok', false, 'code', 'idempotency_conflict');
      END IF;

      SELECT s.name, s.audio_url
      INTO v_replay_name, v_replay_url
      FROM public.samples s
      WHERE s.id = p_sample_id;

      IF NOT FOUND OR v_replay_url IS NULL OR trim(v_replay_url) = '' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'asset_unavailable');
      END IF;

      RETURN jsonb_build_object(
        'ok', true,
        'replay', true,
        'bucket', 'private-audios',
        'audio_url', v_replay_url,
        'sample_name', v_replay_name,
        'credits_charged', 0
      );
    END IF;
  END IF;

  SELECT
    s.name,
    s.audio_url,
    s.type,
    public.credit_cost_from_sample_type(s.type),
    s.status,
    p.status,
    COALESCE(p.is_premium, false)
  INTO v_name, v_audio_url, v_sample_type, v_cost, v_sample_status, v_pack_status, v_is_premium
  FROM public.samples s
  JOIN public.packs p ON p.id = s.pack_id
  WHERE s.id = p_sample_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'sample_not_found');
  END IF;

  IF v_sample_status IS DISTINCT FROM 'Active' OR v_pack_status IS DISTINCT FROM 'Published' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'sample_not_found');
  END IF;

  IF v_is_premium THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.subscriptions sub
      WHERE sub.customer_id = v_customer.id
        AND (
          COALESCE(sub.status, '') IN ('active', 'trialing')
          OR COALESCE(sub.stripe_status, '') IN ('active', 'trialing')
        )
    ) INTO v_has_sub;

    IF NOT v_has_sub THEN
      RETURN jsonb_build_object('ok', false, 'code', 'forbidden');
    END IF;
  END IF;

  IF v_audio_url IS NULL OR trim(v_audio_url) = '' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'asset_unavailable');
  END IF;

  v_charged := v_cost;
  v_balance_before := COALESCE(v_customer.credit_balance, 0);

  IF v_charged > v_balance_before THEN
    RETURN jsonb_build_object('ok', false, 'code', 'insufficient_credits');
  END IF;

  v_balance_after := v_balance_before - v_charged;

  IF v_charged > 0 THEN
    UPDATE public.customers
    SET
      credit_balance = v_balance_after,
      updated_at = now()
    WHERE id = v_customer.id;

    INSERT INTO public.credit_activity (
      customer_id,
      user_id,
      delta,
      balance_before,
      balance_after,
      activity_type,
      source_type,
      source_ref,
      note,
      metadata,
      sample_id,
      idempotency_key
    )
    VALUES (
      v_customer.id,
      p_user_id,
      -v_charged,
      v_balance_before,
      v_balance_after,
      'download_charge',
      'system',
      p_sample_id::text,
      'Credits deducted for sample download',
      jsonb_build_object(
        'sample_id', p_sample_id,
        'sample_type', v_sample_type,
        'idempotency_key', p_idempotency_key
      ),
      p_sample_id,
      p_idempotency_key
    );
  END IF;

  INSERT INTO public.sample_credit_downloads (user_id, sample_id, idempotency_key, credits_charged)
  VALUES (p_user_id, p_sample_id, p_idempotency_key, v_charged);

  PERFORM public.increment_sample_downloads(p_sample_id);

  RETURN jsonb_build_object(
    'ok', true,
    'replay', false,
    'bucket', 'private-audios',
    'audio_url', v_audio_url,
    'sample_name', v_name,
    'credits_charged', v_charged
  );
END;
$$;

COMMENT ON FUNCTION public.request_sample_download_prepare(uuid, uuid, uuid) IS
  'Debit credits using credit_cost_from_sample_type(s.type); write credit_activity.';


-- get_pack_by_id / get_creator_by_id: sample JSON credit_cost uses helper
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
      'credit_cost', public.credit_cost_from_sample_type(s.type),
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
  'Pack detail JSON; sample credit_cost from credit_cost_from_sample_type(s.type).';


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
           public.credit_cost_from_sample_type(s.type) AS credit_cost,
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
  'Creator detail JSON; sample credit_cost from credit_cost_from_sample_type(s.type).';
