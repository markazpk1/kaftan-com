-- Fix SMTP Settings RLS Policies
-- Run this in your Supabase SQL Editor

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON smtp_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON smtp_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON smtp_settings;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON smtp_settings;

-- Create new policies that work correctly
CREATE POLICY "Enable read access for authenticated users" ON smtp_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON smtp_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON smtp_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON smtp_settings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Verify RLS is enabled
ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON smtp_settings TO authenticated;

-- Check if table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'smtp_settings' 
ORDER BY ordinal_position;
