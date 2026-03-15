-- Create Email Templates Table (Ultra Minimal Version)
-- Run this in your Supabase SQL Editor

-- Create table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('transactional', 'marketing', 'system')),
  body TEXT NOT NULL,
  last_edited TEXT DEFAULT 'Just now',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (only if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_templates' AND schemaname = 'public' AND rowsecurity = true) THEN
    ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON email_templates;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON email_templates
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON email_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON email_templates
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_templates_category') THEN
    CREATE INDEX idx_email_templates_category ON email_templates(category);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_templates_active') THEN
    CREATE INDEX idx_email_templates_active ON email_templates(active);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_templates_created_at') THEN
    CREATE INDEX idx_email_templates_created_at ON email_templates(created_at DESC);
  END IF;
END $$;

-- Grant permissions (only if not already granted)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges WHERE table_name = 'email_templates' AND grantee = 'authenticated' AND privilege_type = 'SELECT') THEN
    GRANT ALL ON email_templates TO authenticated;
  END IF;
END $$;

-- Insert one test template (only if table is empty)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM email_templates) = 0 THEN
    INSERT INTO email_templates (name, subject, description, category, body) VALUES 
    (
      'Test Template',
      'Test Subject',
      'A test template to verify the system works',
      'transactional',
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a; font-size: 24px;">Test Template</h1>
  <p style="color: #555;">This is a test template to verify the system works.</p>
  <p>Hi {{customer_name}}, this is a test email.</p>
</div>'
    );
  END IF;
END $$;
