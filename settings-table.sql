-- Create settings table
CREATE TABLE IF NOT EXISTS store_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text NOT NULL DEFAULT 'Fashion Spectrum',
  store_email text NOT NULL DEFAULT 'contact@fashionspectrum.com',
  store_phone text NOT NULL DEFAULT '+61 2 9876 5432',
  currency text NOT NULL DEFAULT 'AUD',
  tax_rate decimal(5,2) NOT NULL DEFAULT 10.00,
  free_shipping_min decimal(10,2) NOT NULL DEFAULT 100.00,
  shipping_fee decimal(10,2) NOT NULL DEFAULT 15.00,
  enable_reviews boolean NOT NULL DEFAULT true,
  enable_wishlist boolean NOT NULL DEFAULT true,
  enable_cod boolean NOT NULL DEFAULT true,
  maintenance_mode boolean NOT NULL DEFAULT false,
  email_notifications boolean NOT NULL DEFAULT true,
  order_notifications boolean NOT NULL DEFAULT true,
  low_stock_alerts boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON auth.users TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can manage store settings" ON store_settings;

-- Create policy for admin access
CREATE POLICY "Admins can manage store settings" ON store_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insert default settings if table is empty
INSERT INTO store_settings (
  store_name, store_email, store_phone, currency, tax_rate, 
  free_shipping_min, shipping_fee, enable_reviews, enable_wishlist,
  enable_cod, maintenance_mode, email_notifications, order_notifications,
  low_stock_alerts
) VALUES (
  'Fashion Spectrum', 'contact@fashionspectrum.com', '+61 2 9876 5432', 
  'AUD', 10.00, 100.00, 15.00, true, true, true, false, true, true, true
) ON CONFLICT DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
