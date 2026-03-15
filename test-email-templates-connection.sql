-- Test Email Templates Database Connection
-- Run this in your Supabase SQL Editor

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'email_templates'
) AS table_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_templates' 
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT tablename, rowlevelsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'email_templates';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'email_templates';

-- Test basic select
SELECT COUNT(*) as total_templates FROM email_templates;

-- Test basic insert (should work if permissions are correct)
INSERT INTO email_templates (name, subject, description, category, body) VALUES 
(
  'Connection Test',
  'Testing Database Connection',
  'This template tests if the database connection works',
  'system',
  '<div>Test email content</div>'
) ON CONFLICT (id) DO NOTHING;

-- Test basic select after insert
SELECT COUNT(*) as total_templates FROM email_templates;

-- Test select with auth role check
SELECT COUNT(*) as total_templates 
FROM email_templates 
WHERE auth.role() = 'authenticated';
