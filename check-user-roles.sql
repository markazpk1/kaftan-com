-- Query to check user roles and see if customers have admin roles
SELECT 
    u.id,
    u.email,
    u.created_at,
    ur.role,
    c.full_name,
    c.created_at as customer_created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.customers c ON u.id = c.user_id
WHERE u.email LIKE '%@gmail.com' OR u.email LIKE '%markaz%'
ORDER BY u.created_at DESC;

-- Check if there are any non-admin customers
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN ur.role IS NULL THEN 1 END) as non_admin_customers,
    COUNT(CASE WHEN ur.role = 'admin' THEN 1 END) as admin_customers
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.customers c ON u.id = c.user_id
WHERE c.user_id IS NOT NULL;
