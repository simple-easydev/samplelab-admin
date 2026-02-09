-- =====================================================
-- Create popups table for popup announcement management
-- =====================================================

-- Create popups table
CREATE TABLE IF NOT EXISTS popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_label TEXT,
  cta_url TEXT,
  audience TEXT NOT NULL DEFAULT 'all',
  frequency TEXT NOT NULL DEFAULT 'once',
  active BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add check constraints
ALTER TABLE popups 
  ADD CONSTRAINT popups_audience_check 
  CHECK (audience IN ('all', 'subscribers', 'trial'));

ALTER TABLE popups 
  ADD CONSTRAINT popups_frequency_check 
  CHECK (frequency IN ('once', 'until-dismissed'));

-- Enable Row Level Security
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all popups" ON popups;
DROP POLICY IF EXISTS "Admins can insert popups" ON popups;
DROP POLICY IF EXISTS "Admins can update popups" ON popups;
DROP POLICY IF EXISTS "Admins can delete popups" ON popups;

-- Admins can view all popups
CREATE POLICY "Admins can view all popups" ON popups
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Admins can insert popups
CREATE POLICY "Admins can insert popups" ON popups
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Admins can update popups
CREATE POLICY "Admins can update popups" ON popups
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Admins can delete popups
CREATE POLICY "Admins can delete popups" ON popups
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_popups_updated_at ON popups;

CREATE TRIGGER update_popups_updated_at
  BEFORE UPDATE ON popups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_popups_active ON popups(active);
CREATE INDEX IF NOT EXISTS idx_popups_created_at ON popups(created_at DESC);

-- Add comments
COMMENT ON TABLE popups IS 'Stores popup announcements that appear as modals to users';
COMMENT ON COLUMN popups.audience IS 'Target audience: all, subscribers, or trial users';
COMMENT ON COLUMN popups.frequency IS 'Display frequency: once per user or until dismissed';
COMMENT ON COLUMN popups.active IS 'Only one popup can be active at a time';
