-- Simple SQL to create storage bucket using Supabase storage extension
-- Run this in your Supabase SQL Editor

-- Check if storage extension is available
DO $$
BEGIN
    -- Try to create the bucket using the storage extension
    PERFORM storage.create_bucket(
        'media',           -- bucket id
        'media',           -- bucket name  
        true,              -- public bucket
        10485760,          -- 10MB file size limit
        ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'] -- allowed mime types
    );
    
    RAISE NOTICE 'Media bucket created successfully';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating bucket: %', SQLERRM;
        -- If bucket already exists, that's fine
        IF SQLERRM LIKE '%already exists%' THEN
            RAISE NOTICE 'Bucket already exists, skipping creation';
        END IF;
END $$;

-- Alternative: Try inserting directly if the above doesn't work
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media', 
    true,
    10485760,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Enable RLS on storage objects (this usually works without superuser)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create basic policies (these might fail without proper permissions, but we can try)
DO $$
BEGIN
    -- Policy for public read access
    CREATE POLICY "Public Access" ON storage.objects
        FOR SELECT
        USING (bucket_id = 'media');
EXCEPTION 
    WHEN duplicate_object THEN
        RAISE NOTICE 'Public Access policy already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create Public Access policy: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Policy for admin uploads
    CREATE POLICY "Admin Uploads" ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'media' AND
            EXISTS (
                SELECT 1 FROM auth.users 
                WHERE auth.users.id = auth.uid() 
                AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
        );
EXCEPTION 
    WHEN duplicate_object THEN
        RAISE NOTICE 'Admin Uploads policy already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create Admin Uploads policy: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Policy for admin deletes
    CREATE POLICY "Admin Deletes" ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'media' AND
            EXISTS (
                SELECT 1 FROM auth.users 
                WHERE auth.users.id = auth.uid() 
                AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
        );
EXCEPTION 
    WHEN duplicate_object THEN
        RAISE NOTICE 'Admin Deletes policy already exists';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create Admin Deletes policy: %', SQLERRM;
END $$;

-- Verify bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'media';
