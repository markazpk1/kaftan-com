-- Create Email Templates Table (Safe Version)
-- Run this in your Supabase SQL Editor
-- This version handles existing tables and indexes gracefully

-- Create email_templates table (IF NOT EXISTS)
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

-- Enable RLS (IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_templates' AND schemaname = 'public' AND rowsecurity = true) THEN
    ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop and recreate policies for email templates
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON email_templates;

-- Create policies for email templates
CREATE POLICY "Enable read access for authenticated users" ON email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON email_templates
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON email_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON email_templates
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(active);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_at ON email_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_templates_updated_at ON email_templates(updated_at DESC);

-- Function to auto-update updated_at (IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_email_templates_updated_at') THEN
    CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  END IF;
END $$;

-- Trigger to auto-update updated_at (IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_templates_updated_at') THEN
    CREATE TRIGGER update_email_templates_updated_at
      BEFORE UPDATE ON email_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_email_templates_updated_at();
  END IF;
END $$;

-- Insert default templates (only if table is empty)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM email_templates) = 0 THEN
    INSERT INTO email_templates (name, subject, description, category, body) VALUES 
    (
      'Order Confirmation',
      'Your order #{{order_id}} has been confirmed!',
      'Sent when a customer places a new order',
      'transactional',
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a; font-size: 24px;">Order Confirmed! 🎉</h1>
  <p style="color: #555;">Hi {{customer_name}},</p>
  <p style="color: #555;">Thank you for your order! We''re preparing your items with care.</p>
  <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold;">Order #{{order_id}}</p>
    <p style="margin: 4px 0; color: #555;">Total: {{order_total}}</p>
    <p style="margin: 4px 0; color: #555;">Date: {{order_date}}</p>
  </div>
  <a href="{{tracking_url}}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Track Your Order</a>
  <p style="color: #999; font-size: 12px; margin-top: 30px;">Fashion Spectrum — Redefining African Fashion</p>
</div>'
    ),
    (
      'Shipping Notification',
      'Your order #{{order_id}} has been shipped!',
      'Sent when an order is shipped',
      'transactional',
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a; font-size: 24px;">Your Order is On Its Way! 📦</h1>
  <p style="color: #555;">Hi {{customer_name}},</p>
  <p style="color: #555;">Great news! Your order has been shipped and is on its way to you.</p>
  <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; font-weight: bold;">Tracking: {{tracking_number}}</p>
    <p style="margin: 4px 0; color: #555;">Carrier: {{carrier}}</p>
    <p style="margin: 4px 0; color: #555;">Estimated delivery: {{delivery_date}}</p>
  </div>
  <a href="{{tracking_url}}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Track Package</a>
</div>'
    ),
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
    ),
    (
      'Password Reset',
      'Reset your Fashion Spectrum password',
      'Sent when a customer requests a password reset',
      'system',
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a; font-size: 24px;">Password Reset Request</h1>
  <p style="color: #555;">Hi {{customer_name}},</p>
  <p style="color: #555;">We received a request to reset your password. Click the button below to create a new password.</p>
  <a href="{{reset_url}}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Reset Password</a>
  <p style="color: #999; font-size: 12px; margin-top: 20px;">This link expires in 1 hour. If you didn''t request this, please ignore this email.</p>
</div>'
    ),
    (
      'Abandoned Cart',
      'You left something behind, {{customer_name}}!',
      'Sent when a customer abandons their cart',
      'marketing',
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a; font-size: 24px;">Forgot Something? 🛒</h1>
  <p style="color: #555;">Hi {{customer_name}},</p>
  <p style="color: #555;">You left some amazing items in your cart. Don''t let them get away!</p>
  <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; color: #555;">{{cart_items}}</p>
    <p style="margin: 8px 0 0; font-weight: bold;">Total: {{cart_total}}</p>
  </div>
  <a href="{{cart_url}}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Complete Your Order</a>
  <p style="color: #555; margin-top: 20px;">Use code <strong>COMEBACK5</strong> for 5% off!</p>
</div>'
    ),
    (
      'Review Request',
      'How was your order, {{customer_name}}?',
      'Sent after order delivery to request a review',
      'marketing',
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a; font-size: 24px;">We''d Love Your Feedback! ⭐</h1>
  <p style="color: #555;">Hi {{customer_name}},</p>
  <p style="color: #555;">We hope you''re enjoying your recent purchase! Your feedback helps us serve you better.</p>
  <a href="{{review_url}}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Leave a Review</a>
</div>'
    );
  END IF;
END $$;

-- Grant necessary permissions (IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_privileges WHERE table_name = 'email_templates' AND grantee = 'authenticated' AND privilege_type = 'SELECT') THEN
    GRANT ALL ON email_templates TO authenticated;
  END IF;
END $$;
