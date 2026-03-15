-- ========================================
-- SUPABASE STORAGE BUCKET SETUP FOR MEDIA
-- ========================================

-- 1. Create the media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for public read access
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

-- 4. Create policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media' AND
    (
      SELECT raw_user_meta_data->>'role' 
      FROM auth.users 
      WHERE auth.users.id = auth.uid()
    ) = 'admin'
  );

-- 5. Create policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media' AND
    (
      SELECT raw_user_meta_data->>'role' 
      FROM auth.users 
      WHERE auth.users.id = auth.uid()
    ) = 'admin'
  );

-- 6. Create folder structure
-- Note: Supabase storage doesn't have explicit folders, but we can create a placeholder
-- The folders will be created automatically when files are uploaded with paths like 'products/123/image.jpg'

-- 7. Add helpful comment
COMMENT ON TABLE storage.buckets IS 'Storage buckets for Fashion Spectrum Luxe';

COMMIT;
