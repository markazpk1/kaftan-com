-- Check the admin user's specific data
-- This will help us see why admin customer details aren't showing correctly

SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at,
    c.full_name,
    c.email as customer_email,
    c.phone,
    c.city,
    c.created_at as customer_created_at,
    ur.role
FROM auth.users u
LEFT JOIN public.customers c ON u.id = c.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@example.com' OR u.email LIKE '%admin%';

-- Check orders for the admin user
SELECT 
    o.id,
    o.order_number,
    o.user_id,
    o.customer_name,
    o.customer_email,
    o.total,
    o.status,
    o.created_at
FROM public.orders o
WHERE o.customer_email LIKE '%admin%' OR o.user_id IN (
    SELECT u.id 
    FROM auth.users u 
    WHERE u.email LIKE '%admin%'
)
ORDER BY o.created_at DESC;

-- Check if there's a mismatch between user_id in orders vs customers
SELECT 
    'Order-Customer Mismatch' as analysis,
    COUNT(*) as mismatched_orders
FROM public.orders o
LEFT JOIN public.customers c ON o.user_id = c.user_id
WHERE o.user_id IS NOT NULL 
AND c.user_id IS NULL;
