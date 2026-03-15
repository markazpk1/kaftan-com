-- Fix COD display issue
-- Run this in Supabase SQL Editor

-- Step 1: Check if store_settings table has data
SELECT COUNT(*) as settings_count FROM store_settings;

-- Step 2: Insert default settings if table is empty
INSERT INTO store_settings (
  store_name, store_email, store_phone, currency, tax_rate, 
  free_shipping_min, shipping_fee, enable_reviews, enable_wishlist,
  enable_cod, maintenance_mode, email_notifications, order_notifications,
  low_stock_alerts
) VALUES (
  'Fashion Spectrum', 'contact@fashionspectrum.com', '+61 2 9876 5432', 
  'AUD', 10.00, 100.00, 15.00, true, true, true, false, true, true, true
) ON CONFLICT DO NOTHING;

-- Step 3: Update existing settings to ensure COD is enabled
UPDATE store_settings 
SET enable_cod = true 
WHERE enable_cod = false;

-- Step 4: Fix RLS policies to allow public read access
DROP POLICY IF EXISTS "Admins can manage store settings" ON store_settings;

CREATE POLICY "Enable read access for all users" ON store_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage store settings" ON store_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Step 5: Verify the settings
SELECT * FROM store_settings ORDER BY created_at DESC LIMIT 1;

-- Step 6: Test the settings access
SELECT enable_cod FROM store_settings LIMIT 1;
