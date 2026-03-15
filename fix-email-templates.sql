-- Fix Email Templates - Complete Reset
-- Run this in your Supabase SQL Editor

-- Drop everything related to email_templates
DROP TABLE IF EXISTS email_templates CASCADE;

-- Drop any existing policies (just in case)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON email_templates;

-- Create fresh table
CREATE TABLE email_templates (
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

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON email_templates
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON email_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON email_templates
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(active);
CREATE INDEX idx_email_templates_created_at ON email_templates(created_at DESC);

-- Grant permissions
GRANT ALL ON email_templates TO authenticated;

-- Insert one working template
INSERT INTO email_templates (name, subject, description, category, body) VALUES 
(
  'Welcome Email',
  'Welcome to Fashion Spectrum, {{customer_name}}!',
  'Sent when a new customer registers',
  'transactional',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a; font-size: 24px;">Welcome to Fashion Spectrum! ✨</h1>
  <p style="color: #555;">Hi {{customer_name}},</p>
  <p style="color: #555;">We''re thrilled to have you join our community of fashion enthusiasts. Explore our curated collection of premium African fashion.</p>
  <a href="{{shop_url}}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Start Shopping</a>
  <p style="color: #555; margin-top: 20px;">Use code <strong>WELCOME10</strong> for 10% off your first order!</p>
</div>'
);
