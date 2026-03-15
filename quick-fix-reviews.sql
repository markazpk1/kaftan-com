-- Quick fix for reviews table - add missing columns and fix relationships
-- Run this in Supabase SQL Editor

-- Step 1: Add customer_id column to orders table if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(user_id) ON DELETE SET NULL;

-- Step 2: Update existing orders to set customer_id from user_id
UPDATE public.orders 
SET customer_id = user_id 
WHERE customer_id IS NULL AND user_id IS NOT NULL;

-- Step 3: Add first_name and last_name to customers table if they don't exist
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Step 4: Populate first_name and last_name from full_name for existing records
UPDATE public.customers 
SET 
    first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = CASE 
        WHEN POSITION(' ' IN full_name) > 0 
        THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
        ELSE ''
    END
WHERE (first_name IS NULL OR last_name IS NULL) AND full_name IS NOT NULL;

-- Step 5: Fix the stored procedures to use customer_id instead of user_id
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

-- Step 6: Grant permissions for the functions
GRANT EXECUTE ON FUNCTION has_delivered_order_for_product(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_delivered_order_for_product(UUID, UUID) TO authenticated, anon;

-- Step 7: Verify the tables have the correct structure
SELECT 'reviews' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public' 
ORDER BY ordinal_position;

SELECT 'customers' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public' 
ORDER BY ordinal_position;
