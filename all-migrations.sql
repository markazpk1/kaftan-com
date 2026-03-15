-- =====================================================
-- FASHION SPECTRUM LUXE - DATABASE MIGRATIONS
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  category TEXT,
  collection TEXT,
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 0,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Australia',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can insert own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;

CREATE POLICY "Customers can view own profile" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Customers can insert own profile" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers can update own profile" ON public.customers FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create orders tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT,
  shipping_country TEXT DEFAULT 'Australia',
  status order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  color TEXT,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'FS-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- 5. Create user_roles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Setup storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public', 'public', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies before creating new ones
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'public');
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON storage.objects FOR UPDATE USING (bucket_id = 'public' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete" ON storage.objects FOR DELETE USING (bucket_id = 'public' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view" ON storage.objects FOR SELECT USING (bucket_id = 'public');

-- 7. Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('visa', 'mastercard', 'amex', 'other')),
  last4 TEXT NOT NULL CHECK (last4 ~ '^\d{4}$'),
  expiry TEXT NOT NULL CHECK (expiry ~ '^\d{2}/\d{2}$'),
  cardholder TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON public.payment_methods(user_id, is_default);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with DROP statements
DROP POLICY IF EXISTS "Users can view own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment methods" ON public.payment_methods;
CREATE POLICY "Users can insert own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment methods" ON public.payment_methods;
CREATE POLICY "Users can update own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a new payment method as default, unset all other defaults for this user
  IF NEW.is_default = true THEN
    UPDATE public.payment_methods 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for ensuring single default
DROP TRIGGER IF EXISTS ensure_single_default_payment_method_trigger ON public.payment_methods;
CREATE TRIGGER ensure_single_default_payment_method_trigger
BEFORE INSERT OR UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_payment_method();

-- =====================================================
-- MIGRATIONS COMPLETE
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin users to update orders" ON orders;
DROP POLICY IF EXISTS "Allow admin users to update order items" ON order_items;

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'user_metadata')::json ->> 'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow admin users to update orders (for status changes)
CREATE POLICY "Allow admin users to update orders"
ON orders
FOR UPDATE
TO public
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow admin users to update order items (if needed)
CREATE POLICY "Allow admin users to update order items"
ON order_items
FOR UPDATE
TO public
USING (public.is_admin())
WITH CHECK (public.is_admin());
