-- =====================================================
-- Add Admin Invites Table and User Roles
-- =====================================================

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'content_editor';

-- Update existing admins to full_admin
UPDATE users SET role = 'full_admin' WHERE is_admin = true;

-- Create admin_invites table
CREATE TABLE IF NOT EXISTS admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('full_admin', 'content_editor')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view invites" ON admin_invites;
DROP POLICY IF EXISTS "Admins can create invites" ON admin_invites;

-- Create policies
CREATE POLICY "Admins can view invites" ON admin_invites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can create invites" ON admin_invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true AND role = 'full_admin')
  );

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON admin_invites(token);
CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON admin_invites(email);
