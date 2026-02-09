-- =====================================================
-- Create banners table for announcement management
-- =====================================================

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_label TEXT,
  cta_url TEXT,
  audience TEXT NOT NULL DEFAULT 'all',
  active BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add check constraint for audience
ALTER TABLE banners 
  ADD CONSTRAINT banners_audience_check 
  CHECK (audience IN ('all', 'logged-in'));

-- Enable Row Level Security
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all banners" ON banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON banners;
DROP POLICY IF EXISTS "Admins can update banners" ON banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON banners;

-- Admins can view all banners
CREATE POLICY "Admins can view all banners" ON banners
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Admins can insert banners
CREATE POLICY "Admins can insert banners" ON banners
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Admins can update banners
CREATE POLICY "Admins can update banners" ON banners
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Admins can delete banners
CREATE POLICY "Admins can delete banners" ON banners
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for active banners
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(active);

-- Create index for created_at for sorting
CREATE INDEX IF NOT EXISTS idx_banners_created_at ON banners(created_at DESC);

-- Add comment
COMMENT ON TABLE banners IS 'Stores banner announcements that appear at the top of pages';
COMMENT ON COLUMN banners.audience IS 'Target audience: all (everyone) or logged-in (authenticated users only)';
COMMENT ON COLUMN banners.active IS 'Only one banner can be active at a time';
