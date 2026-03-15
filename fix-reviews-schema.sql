-- Fix reviews schema issues
-- This script fixes the foreign key relationship and query issues

-- First, let's update the reviews table to properly reference customers table
-- We need to add a proper foreign key relationship between reviews and customers

-- Step 1: Update the reviews table to reference customers.user_id instead of auth.users directly
-- This will require recreating the foreign key constraint

-- Drop existing foreign key constraint if it exists
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

-- Add proper foreign key constraint to customers.user_id
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(user_id) ON DELETE CASCADE;

-- Step 2: Update the customers table to ensure it has first_name and last_name columns
-- The customers table might have full_name instead, so let's add first_name and last_name if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'first_name'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN first_name TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'last_name'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN last_name TEXT;
    END IF;
END $$;

-- Step 3: Create a function to populate first_name and last_name from full_name
-- This is a one-time operation to migrate existing data
CREATE OR REPLACE FUNCTION migrate_customer_names()
RETURNS VOID AS $$
BEGIN
    -- Update customers with split names from full_name where first_name/last_name are null
    UPDATE public.customers 
    SET 
        first_name = SPLIT_PART(full_name, ' ', 1),
        last_name = CASE 
            WHEN POSITION(' ' IN full_name) > 0 
            THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
            ELSE ''
        END
    WHERE first_name IS NULL OR last_name IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_customer_names();

-- Step 4: Update the orders table to use customer_id instead of user_id for consistency
-- The stored procedures are looking for customer_id in orders table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN customer_id UUID REFERENCES public.customers(user_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing orders to set customer_id from user_id
UPDATE public.orders 
SET customer_id = user_id 
WHERE customer_id IS NULL AND user_id IS NOT NULL;

-- Step 5: Create or replace the stored procedures with correct column references
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
        WHERE o.customer_id = p_customer_id
        AND oi.product_id = p_product_id
        AND o.status = 'delivered'
    ) INTO has_order;
    
    RETURN has_order;
END;
$$ LANGUAGE plpgsql;

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
    WHERE o.customer_id = p_customer_id
    AND oi.product_id = p_product_id
    AND o.status = 'delivered'
    ORDER BY o.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION has_delivered_order_for_product(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_delivered_order_for_product(UUID, UUID) TO authenticated, anon;

-- Step 7: Update RLS policies for reviews to work with the new relationship
DROP POLICY IF EXISTS "Allow public to view approved reviews" ON public.reviews;
CREATE POLICY "Allow public to view approved reviews" ON public.reviews
    FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Allow customers to view their own reviews" ON public.reviews;
CREATE POLICY "Allow customers to view their own reviews" ON public.reviews
    FOR SELECT USING (customer_id IN (SELECT user_id FROM customers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Allow customers to create reviews" ON public.reviews;
CREATE POLICY "Allow customers to create reviews" ON public.reviews
    FOR INSERT WITH CHECK (customer_id IN (SELECT user_id FROM customers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Allow customers to update their own reviews" ON public.reviews;
CREATE POLICY "Allow customers to update their own reviews" ON public.reviews
    FOR UPDATE USING (customer_id IN (SELECT user_id FROM customers WHERE user_id = auth.uid())) 
    WITH CHECK (customer_id IN (SELECT user_id FROM customers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Allow customers to delete their own reviews" ON public.reviews;
CREATE POLICY "Allow customers to delete their own reviews" ON public.reviews
    FOR DELETE USING (customer_id IN (SELECT user_id FROM customers WHERE user_id = auth.uid()));

-- Clean up the migration function
DROP FUNCTION IF EXISTS migrate_customer_names();

-- Verify the setup
SELECT 
    'reviews table' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'customers table' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;
