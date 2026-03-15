-- FINAL FIX for reviews 406 error
-- Run this in Supabase SQL Editor

-- Step 1: Check and fix the reviews table structure
-- First, let's see what we're working with
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public' 
ORDER BY ordinal_position;

-- Step 2: Fix the foreign key relationship properly
-- Drop existing foreign key if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reviews_customer_id_fkey' 
        AND table_name = 'reviews'
    ) THEN
        ALTER TABLE public.reviews DROP CONSTRAINT reviews_customer_id_fkey;
    END IF;
END $$;

-- Add the correct foreign key constraint
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(user_id) ON DELETE CASCADE;

-- Step 3: Fix RLS policies for reviews table
-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public to view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow customers to view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow customers to create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow customers to update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow customers to delete their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow admin full access" ON public.reviews;

-- Create proper RLS policies
CREATE POLICY "Enable read access for all users" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on customer_id" ON public.reviews
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for users based on customer_id" ON public.reviews
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 4: Ensure customers table has proper RLS policies
DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can insert own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;

CREATE POLICY "Enable read access for all users" ON public.customers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON public.customers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Step 5: Create a simple view to test the relationship
CREATE OR REPLACE VIEW public.reviews_with_customers AS
SELECT 
    r.id,
    r.product_id,
    r.customer_id,
    r.rating,
    r.comment,
    r.status,
    r.helpful_count,
    r.created_at,
    r.updated_at,
    c.first_name,
    c.last_name,
    COALESCE(c.first_name || ' ' || c.last_name, 'Anonymous Customer') as customer_name
FROM public.reviews r
LEFT JOIN public.customers c ON r.customer_id = c.user_id;

-- Grant access to the view
GRANT SELECT ON public.reviews_with_customers TO anon;
GRANT SELECT ON public.reviews_with_customers TO authenticated;

-- Step 6: Test the relationship with a simple query
-- This should work without errors
SELECT COUNT(*) as review_count 
FROM public.reviews_with_customers 
WHERE status = 'approved';

-- Step 7: Update the stored procedures one more time
DROP FUNCTION IF EXISTS has_delivered_order_for_product(UUID, UUID);
CREATE OR REPLACE FUNCTION has_delivered_order_for_product(
    p_customer_id UUID,
    p_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    has_order BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE COALESCE(o.customer_id, o.user_id) = p_customer_id
        AND oi.product_id = p_product_id
        AND o.status = 'delivered'
    ) INTO has_order;
    
    RETURN has_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_delivered_order_for_product(UUID, UUID);
CREATE OR REPLACE FUNCTION get_delivered_order_for_product(
    p_customer_id UUID,
    p_product_id UUID
)
RETURNS TABLE (
    order_id UUID,
    order_date TIMESTAMP WITH TIME ZONE,
    quantity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as order_id,
        o.created_at as order_date,
        oi.quantity::INTEGER
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE COALESCE(o.customer_id, o.user_id) = p_customer_id
    AND oi.product_id = p_product_id
    AND o.status = 'delivered'
    ORDER BY o.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION has_delivered_order_for_product(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_delivered_order_for_product(UUID, UUID) TO authenticated, anon;

-- Step 8: Verify everything is working
SELECT 'reviews table' as info, COUNT(*) as count FROM public.reviews;
SELECT 'customers table' as info, COUNT(*) as count FROM public.customers;
SELECT 'reviews_with_customers view' as info, COUNT(*) as count FROM public.reviews_with_customers;
