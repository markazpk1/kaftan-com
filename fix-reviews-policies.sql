-- Fix: Drop existing policies before recreating them
DROP POLICY IF EXISTS "Allow public to view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow customers to view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow customers to create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow customers to update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow customers to delete their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow admin full access" ON public.reviews;

-- Recreate policies
-- Allow anyone to view approved reviews
CREATE POLICY "Allow public to view approved reviews" ON public.reviews
    FOR SELECT USING (status = 'approved');

-- Allow customers to view their own reviews
CREATE POLICY "Allow customers to view their own reviews" ON public.reviews
    FOR SELECT USING (customer_id = auth.uid());

-- Allow customers to create reviews
CREATE POLICY "Allow customers to create reviews" ON public.reviews
    FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Allow customers to update their own pending reviews
CREATE POLICY "Allow customers to update their own reviews" ON public.reviews
    FOR UPDATE USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

-- Allow customers to delete their own reviews
CREATE POLICY "Allow customers to delete their own reviews" ON public.reviews
    FOR DELETE USING (customer_id = auth.uid());

-- Allow admin to manage all reviews using JWT claim (fixed version)
CREATE POLICY "Allow admin full access" ON public.reviews
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'tcv00898@gmail.com'
    );

-- Grant execute permissions on functions (if not already granted)
GRANT EXECUTE ON FUNCTION has_delivered_order_for_product(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_delivered_order_for_product(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_stats() TO authenticated;
