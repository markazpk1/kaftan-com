-- Run this SQL script in your Supabase SQL Editor to fix admin orders access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow anyone to view orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Allow anonymous order creation" ON orders;
DROP POLICY IF EXISTS "Allow anyone to view order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Allow anonymous order items creation" ON order_items;

-- Create admin policies for orders
CREATE POLICY "Allow admin users to view all orders" 
ON orders 
FOR SELECT 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Allow users to view own orders" 
ON orders 
FOR SELECT 
TO public 
USING (auth.uid() = user_id);

-- Create admin policies for order items
CREATE POLICY "Allow admin users to view all order items" 
ON order_items 
FOR SELECT 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Allow users to view own order items" 
ON order_items 
FOR SELECT 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Keep insertion policies for checkout
CREATE POLICY "Allow anonymous order creation" 
ON orders 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Allow anonymous order items creation" 
ON order_items 
FOR INSERT 
TO public 
WITH CHECK (true);
