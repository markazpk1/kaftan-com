-- Add RLS policies for admin users to view all orders

-- Drop existing policies that restrict order access
DROP POLICY IF EXISTS "Allow anyone to view orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- Create policy to allow admin users to view all orders
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

-- Create policy to allow regular users to view their own orders
CREATE POLICY "Allow users to view own orders" 
ON orders 
FOR SELECT 
TO public 
USING (auth.uid() = user_id);

-- Allow order creation (for checkout)
CREATE POLICY "Allow anonymous order creation" 
ON orders 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Also update order_items policies
DROP POLICY IF EXISTS "Allow anyone to view order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

-- Create policy to allow admin users to view all order items
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

-- Create policy to allow regular users to view their own order items
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

-- Allow order items creation (for checkout)
CREATE POLICY "Allow anonymous order items creation" 
ON order_items 
FOR INSERT 
TO public 
WITH CHECK (true);
