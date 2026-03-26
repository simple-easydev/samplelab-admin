-- User likes for samples and published packs; adjusts trending_score on samples and packs.

-- ---------------------------------------------------------------------------
-- 1. Pack trending (mirrors samples.trending_score for pack-level sorting)
-- ---------------------------------------------------------------------------
ALTER TABLE public.packs
  ADD COLUMN IF NOT EXISTS trending_score NUMERIC(12, 4) DEFAULT 0;

COMMENT ON COLUMN public.packs.trending_score IS
  'Popularity/trending score; incremented when a user likes this pack.';

-- ---------------------------------------------------------------------------
-- 2. Like tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_sample_likes (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  sample_id uuid NOT NULL REFERENCES public.samples (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, sample_id)
);

CREATE TABLE IF NOT EXISTS public.user_pack_likes (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES public.packs (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pack_id)
);

CREATE INDEX IF NOT EXISTS user_sample_likes_sample_id_idx
  ON public.user_sample_likes (sample_id);

CREATE INDEX IF NOT EXISTS user_pack_likes_pack_id_idx
  ON public.user_pack_likes (pack_id);

COMMENT ON TABLE public.user_sample_likes IS
  'One row per user/sample like; sample trending_score +1 on insert, -1 on delete.';
COMMENT ON TABLE public.user_pack_likes IS
  'One row per user/pack like; pack trending_score +1 on insert, -1 on delete.';

-- ---------------------------------------------------------------------------
-- 3. Triggers: update trending_score (SECURITY DEFINER so RLS on samples/packs does not block)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_user_sample_like_trending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.samples
    SET trending_score = COALESCE(trending_score, 0) + 1
    WHERE id = NEW.sample_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.samples
    SET trending_score = GREATEST(COALESCE(trending_score, 0) - 1, 0)
    WHERE id = OLD.sample_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_user_pack_like_trending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.packs
    SET trending_score = COALESCE(trending_score, 0) + 1
    WHERE id = NEW.pack_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.packs
    SET trending_score = GREATEST(COALESCE(trending_score, 0) - 1, 0)
    WHERE id = OLD.pack_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_sample_likes_trending ON public.user_sample_likes;
CREATE TRIGGER trg_user_sample_likes_trending
  AFTER INSERT OR DELETE ON public.user_sample_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_user_sample_like_trending();

DROP TRIGGER IF EXISTS trg_user_pack_likes_trending ON public.user_pack_likes;
CREATE TRIGGER trg_user_pack_likes_trending
  AFTER INSERT OR DELETE ON public.user_pack_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_user_pack_like_trending();

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_sample_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pack_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sample likes" ON public.user_sample_likes;
CREATE POLICY "Users can view sample likes" ON public.user_sample_likes
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Users can insert sample likes" ON public.user_sample_likes;
CREATE POLICY "Users can insert sample likes" ON public.user_sample_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.samples s
      JOIN public.packs p ON s.pack_id = p.id
      WHERE s.id = sample_id
        AND s.status = 'Active'
        AND p.status = 'Published'
    )
  );

DROP POLICY IF EXISTS "Users can delete own sample likes" ON public.user_sample_likes;
CREATE POLICY "Users can delete own sample likes" ON public.user_sample_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view pack likes" ON public.user_pack_likes;
CREATE POLICY "Users can view pack likes" ON public.user_pack_likes
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Users can insert pack likes" ON public.user_pack_likes;
CREATE POLICY "Users can insert pack likes" ON public.user_pack_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.packs p
      WHERE p.id = pack_id
        AND p.status = 'Published'
    )
  );

DROP POLICY IF EXISTS "Users can delete own pack likes" ON public.user_pack_likes;
CREATE POLICY "Users can delete own pack likes" ON public.user_pack_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Grants (client API)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, DELETE ON public.user_sample_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_pack_likes TO authenticated;
