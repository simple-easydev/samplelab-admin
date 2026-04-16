-- Allow admin uploads to the public preview-audios bucket.
-- Pack cover images now live under:
--   preview-audios/<pack-slug>/cover/<file-name>

INSERT INTO storage.buckets (id, name, public)
VALUES ('preview-audios', 'preview-audios', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view preview audios" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload preview audios" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update preview audios" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete preview audios" ON storage.objects;

CREATE POLICY "Anyone can view preview audios" ON storage.objects
  FOR SELECT USING (bucket_id = 'preview-audios');

CREATE POLICY "Admins can upload preview audios" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'preview-audios' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update preview audios" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'preview-audios' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete preview audios" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'preview-audios' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
