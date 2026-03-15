-- Drop overly permissive guest policies
DROP POLICY "Guests can insert order items" ON public.order_items;
DROP POLICY "Guests can view own order items" ON public.order_items;

-- Tighter: guests can only insert items for orders with null user_id
CREATE POLICY "Guests can insert order items"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id IS NULL
  )
);

-- Allow anon to read back order items for guest orders (needed for insert..select)  
CREATE POLICY "Guests can view guest order items"
ON public.order_items
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id IS NULL
  )
);

-- Allow anon to read back the order they just created
CREATE POLICY "Guests can view own orders"
ON public.orders
FOR SELECT
TO anon
USING (user_id IS NULL);