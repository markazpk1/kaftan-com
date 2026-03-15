-- Test SMTP Settings Table
-- Run this to verify the table exists and is accessible

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'smtp_settings'
);

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'smtp_settings' 
ORDER BY ordinal_position;

-- Check RLS status (using a simpler approach)
-- SELECT 'RLS enabled' as status 
-- FROM pg_class 
-- WHERE relname = 'smtp_settings' AND relrowsecurity = true;

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'smtp_settings';

-- Try to select from table (to test permissions)
SELECT COUNT(*) FROM smtp_settings;
