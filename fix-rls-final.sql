-- Final RLS fix for admin orders access
-- Run this in Supabase SQL Editor

-- First, ensure RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow admin users to view all orders" ON orders;
DROP POLICY IF EXISTS "Allow users to view own orders" ON orders;
DROP POLICY IF EXISTS "Allow anonymous order creation" ON orders;
DROP POLICY IF EXISTS "Allow admin users to view all order items" ON order_items;
DROP POLICY IF EXISTS "Allow users to view own order items" ON order_items;
DROP POLICY IF EXISTS "Allow anonymous order items creation" ON order_items;

-- Create comprehensive admin policies for orders
CREATE POLICY "Allow admin users to view all orders" 
ON orders 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  auth.jwt() ->> 'role' = '"admin"'
);

CREATE POLICY "Allow users to view own orders" 
ON orders 
FOR SELECT 
USING (
  auth.uid() = user_id
);

CREATE POLICY "Allow order creation" 
ON orders 
FOR INSERT 
WITH CHECK (true);

-- Create comprehensive admin policies for order_items
CREATE POLICY "Allow admin users to view all order items" 
ON order_items 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  auth.jwt() ->> 'role' = '"admin"'
);

CREATE POLICY "Allow users to view own order items" 
ON order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Allow order items creation" 
ON order_items 
FOR INSERT 
WITH CHECK (true);

-- Verify policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
