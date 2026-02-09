-- =====================================================
-- Create Settings Table for Application Configuration
-- =====================================================
-- Stores global application settings
-- =====================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  category TEXT NOT NULL, -- 'general', 'legal', 'social', 'integrations'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view settings
CREATE POLICY "Admins can view settings" ON app_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Full admins can update settings
CREATE POLICY "Full admins can update settings" ON app_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true AND role = 'full_admin')
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);

-- Insert default settings
INSERT INTO app_settings (key, value, category) VALUES
  -- General
  ('product_name', 'The Sample Lab', 'general'),
  ('public_url', 'https://lab.yoursite.com', 'general'),
  ('support_email', 'support@yourdomain.com', 'general'),
  ('default_timezone', 'UTC', 'general'),
  
  -- Legal & Policies
  ('terms_of_service_url', '', 'legal'),
  ('privacy_policy_url', '', 'legal'),
  ('cookie_policy_url', '', 'legal'),
  
  -- Social Links
  ('instagram_url', '', 'social'),
  ('soundcloud_url', '', 'social'),
  
  -- Integrations
  ('stripe_status', 'Not Connected', 'integrations')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE app_settings IS 'Global application settings and configuration';
COMMENT ON COLUMN app_settings.key IS 'Unique setting key identifier';
COMMENT ON COLUMN app_settings.value IS 'Setting value stored as text';
COMMENT ON COLUMN app_settings.category IS 'Setting category: general, legal, social, integrations';
