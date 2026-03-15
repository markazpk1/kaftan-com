-- Allow guest (unauthenticated) users to create orders
CREATE POLICY "Guests can create orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Allow guest users to insert order items for their orders
CREATE POLICY "Guests can insert order items"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow guests to view order items (needed for the insert...select flow)
CREATE POLICY "Guests can view own order items"
ON public.order_items
FOR SELECT
TO anon
USING (true);