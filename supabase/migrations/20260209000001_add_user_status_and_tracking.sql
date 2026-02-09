-- =====================================================
-- Add Status and Tracking Columns to Users Table
-- =====================================================
-- This migration adds:
-- - status: Track admin user status (active/pending/disabled)
-- - last_login: Track when admin last logged in
-- - invited_by: Track who invited this admin
-- - role: Already exists but ensure it has correct values
-- =====================================================

-- Add status column with enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('active', 'pending', 'disabled');
  END IF;
END $$;

-- Add new columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add role column if it doesn't exist (it should exist from earlier migrations)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('full_admin', 'content_editor');
  END IF;
END $$;

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'content_editor';

-- Backfill existing admin users with 'active' status
UPDATE users 
SET status = 'active' 
WHERE is_admin = true AND status IS NULL;

-- Create index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);

-- Create a function to update last_login timestamp
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  -- This can be called manually when user logs in
  -- For now, it's a placeholder for future implementation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN users.status IS 'Current status of the admin user: active (can access), pending (invite sent but not accepted), disabled (access revoked)';
COMMENT ON COLUMN users.last_login IS 'Timestamp of when the admin user last logged in';
COMMENT ON COLUMN users.invited_by IS 'Reference to the admin user who invited this user';
