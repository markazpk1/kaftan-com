-- MINIMAL SQL - Only creates bucket, no policies
-- If this fails, you MUST use the Supabase Dashboard UI

INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Check if it worked
SELECT id, name, public FROM storage.buckets WHERE id = 'media';
