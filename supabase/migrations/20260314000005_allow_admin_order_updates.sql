-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admin users to update orders" ON orders;
DROP POLICY IF EXISTS "Allow admin users to update order items" ON order_items;
DROP POLICY IF EXISTS "Allow admin users to delete orders" ON orders;
DROP POLICY IF EXISTS "Allow admin users to delete order items" ON order_items;

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

-- Allow admin users to delete orders
CREATE POLICY "Allow admin users to delete orders"
ON orders
FOR DELETE
TO public
USING (public.is_admin());

-- Allow admin users to delete order items (cascade delete)
CREATE POLICY "Allow admin users to delete order items"
ON order_items
FOR DELETE
TO public
USING (public.is_admin());
