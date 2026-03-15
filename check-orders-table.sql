-- Check orders table structure and data
-- Run this in Supabase SQL Editor

-- Check if orders table exists and has data
SELECT COUNT(*) as total_orders FROM public.orders;

-- Check if orders have customer_id populated
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as orders_with_customer_id,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as orders_with_user_id
FROM public.orders;

-- Check recent orders (last 10)
SELECT 
    order_number,
    created_at,
    status,
    total,
    customer_email,
    customer_id,
    user_id
FROM public.orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if RLS is enabled on orders
SELECT 
    rlsenabled,
    forcerlspolicy
FROM pg_tables 
WHERE tablename = 'orders' 
AND schemaname = 'public';
