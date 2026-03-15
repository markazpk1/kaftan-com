-- Migration to populate customers table from existing auth users and orders
-- This will create customer profiles for users who have registered or placed orders

-- First, insert customers from auth users who don't have customer profiles
INSERT INTO public.customers (user_id, full_name, email, phone, city, created_at, updated_at)
SELECT 
    au.id as user_id,
    COALESCE(au.raw_user_meta_data->>'full_name', 
              split_part(au.email, '@', 1), 
              'Unknown User') as full_name,
    au.email,
    NULL as phone,
    NULL as city,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.customers c ON au.id = c.user_id
WHERE c.user_id IS NULL
AND au.email NOT LIKE '%@example.com'; -- Exclude test users

-- Update customer profiles with order information
UPDATE public.customers c
SET 
    full_name = COALESCE(c.full_name, o.customer_name),
    phone = COALESCE(c.phone, o.customer_phone),
    city = COALESCE(c.city, o.shipping_city),
    updated_at = NOW()
FROM (
    SELECT 
        user_id,
        customer_name,
        customer_phone,
        shipping_city,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.orders
    WHERE user_id IS NOT NULL
) o
WHERE o.user_id = c.user_id 
AND o.rn = 1;

-- Show results
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_customers
FROM public.customers;
