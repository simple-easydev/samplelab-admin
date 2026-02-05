-- =====================================================
-- SampleLab - Packs & Samples System Migration
-- =====================================================
-- Creates the pack-first architecture for audio sample management
-- Includes storage buckets, tables, and upload functions
-- =====================================================

-- =====================================================
-- 1. STORAGE BUCKETS
-- =====================================================

-- Create storage bucket for audio files (samples and stems)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-samples', 'audio-samples', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for pack cover images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pack-covers', 'pack-covers', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CREATORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view creators" ON creators;
DROP POLICY IF EXISTS "Admins can manage creators" ON creators;

CREATE POLICY "Anyone can view creators" ON creators
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage creators" ON creators
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. GENRES, CATEGORIES, MOODS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- Policies for genres, categories, moods
CREATE POLICY "Anyone can view genres" ON genres FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view moods" ON moods FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage genres" ON genres FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can manage moods" ON moods FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- =====================================================
-- 4. PACKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  cover_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[], -- Array of tags
  is_premium BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Disabled')),
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published packs" ON packs;
DROP POLICY IF EXISTS "Admins can view all packs" ON packs;
DROP POLICY IF EXISTS "Admins can manage packs" ON packs;

-- Users can only see Published packs
CREATE POLICY "Anyone can view published packs" ON packs
  FOR SELECT USING (status = 'Published');

-- Admins can see all packs
CREATE POLICY "Admins can view all packs" ON packs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can manage packs
CREATE POLICY "Admins can manage packs" ON packs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

DROP TRIGGER IF EXISTS update_packs_updated_at ON packs;
CREATE TRIGGER update_packs_updated_at
  BEFORE UPDATE ON packs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. PACK_GENRES (Many-to-Many Relationship)
-- =====================================================

CREATE TABLE IF NOT EXISTS pack_genres (
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (pack_id, genre_id)
);

ALTER TABLE pack_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pack genres" ON pack_genres
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage pack genres" ON pack_genres
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- =====================================================
-- 6. SAMPLES TABLE (Refactored for Pack-First Architecture)
-- =====================================================

-- Drop old samples table if it doesn't have pack_id
DROP TABLE IF EXISTS samples CASCADE;

CREATE TABLE samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL, -- URL to the main audio file in storage
  bpm INTEGER,
  key TEXT, -- Musical key (e.g., "Am", "C#")
  type TEXT NOT NULL CHECK (type IN ('Loop', 'One-shot')), -- NOTE: 'Stem' is NOT a sample type - stems are bundles attached to samples
  length TEXT, -- Duration (e.g., "2:30")
  file_size_bytes BIGINT,
  credit_cost INTEGER, -- Optional override for credit cost of the PARENT sample (excludes stems bundle cost)
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
  has_stems BOOLEAN DEFAULT FALSE, -- If true, this sample has a stems bundle (in stems table)
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active samples in published packs" ON samples;
DROP POLICY IF EXISTS "Admins can view all samples" ON samples;
DROP POLICY IF EXISTS "Admins can manage samples" ON samples;

-- Users can only see Active samples that belong to Published packs
CREATE POLICY "Anyone can view active samples in published packs" ON samples
  FOR SELECT USING (
    status = 'Active' AND 
    EXISTS (SELECT 1 FROM packs WHERE id = pack_id AND status = 'Published')
  );

-- Admins can see all samples
CREATE POLICY "Admins can view all samples" ON samples
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can manage samples
CREATE POLICY "Admins can manage samples" ON samples
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

DROP TRIGGER IF EXISTS update_samples_updated_at ON samples;
CREATE TRIGGER update_samples_updated_at
  BEFORE UPDATE ON samples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. STEMS TABLE (for samples with multiple stem files)
-- =====================================================

CREATE TABLE IF NOT EXISTS stems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL, -- URL to the stem file in storage
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE stems ENABLE ROW LEVEL SECURITY;

-- Users can view stems for active samples in published packs
CREATE POLICY "Anyone can view stems for published samples" ON stems
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM samples s 
      JOIN packs p ON s.pack_id = p.id 
      WHERE s.id = sample_id 
        AND s.status = 'Active' 
        AND p.status = 'Published'
    )
  );

-- Admins can manage stems
CREATE POLICY "Admins can manage stems" ON stems
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- =====================================================
-- 8. STORAGE POLICIES
-- =====================================================

-- Audio samples bucket policies
DROP POLICY IF EXISTS "Anyone can view audio samples" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload audio samples" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete audio samples" ON storage.objects;

CREATE POLICY "Anyone can view audio samples" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-samples');

CREATE POLICY "Admins can upload audio samples" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio-samples' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete audio samples" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audio-samples' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Pack covers bucket policies
CREATE POLICY "Anyone can view pack covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'pack-covers');

CREATE POLICY "Admins can upload pack covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pack-covers' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete pack covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pack-covers' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to get sample count for a pack
CREATE OR REPLACE FUNCTION get_pack_sample_count(pack_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM samples WHERE pack_id = pack_uuid);
END;
$$ LANGUAGE plpgsql;

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_pack_downloads(pack_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE packs SET download_count = download_count + 1 WHERE id = pack_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_sample_downloads(sample_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE samples SET download_count = download_count + 1 WHERE id = sample_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. SEED DATA (Initial Genres, Categories, Moods)
-- =====================================================

INSERT INTO genres (name, description) VALUES
  ('Trap', 'Modern hip-hop style with heavy 808s'),
  ('Lo-Fi', 'Chill, relaxed beats with vintage vibes'),
  ('EDM', 'Electronic dance music'),
  ('House', 'Four-on-the-floor dance music'),
  ('Hip Hop', 'Classic hip-hop beats and samples'),
  ('Synthwave', 'Retro 80s inspired electronic music'),
  ('Ambient', 'Atmospheric and textural soundscapes'),
  ('Rock', 'Guitar-driven music'),
  ('Jazz', 'Swing, bebop, and smooth jazz'),
  ('Classical', 'Orchestral and classical instruments')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description) VALUES
  ('One-shot', 'Single hit samples'),
  ('Loops', 'Repeating musical phrases'),
  ('Drums', 'Drum hits and percussion'),
  ('Vocals', 'Vocal samples and phrases')
ON CONFLICT (name) DO NOTHING;

INSERT INTO moods (name, description) VALUES
  ('Energetic', 'High energy and upbeat'),
  ('Dark', 'Mysterious and moody'),
  ('Chill', 'Relaxed and laid-back'),
  ('Uplifting', 'Positive and inspiring'),
  ('Aggressive', 'Hard hitting and intense')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Migration Complete
-- =====================================================
