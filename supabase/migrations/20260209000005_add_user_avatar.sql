-- =====================================================
-- Add avatar_url to users table
-- =====================================================

-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comment on column
COMMENT ON COLUMN users.avatar_url IS 'URL path to user avatar in storage bucket (e.g., avatars/user-id/filename.jpg)';
