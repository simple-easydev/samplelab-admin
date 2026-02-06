-- =====================================================
-- CREATE AVATARS STORAGE BUCKET
-- =====================================================

-- Create storage bucket for creator avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES FOR AVATARS BUCKET
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete avatars" ON storage.objects;

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow admins to upload avatars
CREATE POLICY "Admins can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Allow admins to update avatars
CREATE POLICY "Admins can update avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Allow admins to delete avatars
CREATE POLICY "Admins can delete avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
