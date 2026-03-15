-- Query 1: Check if there are any customers in the database
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_customers
FROM public.customers;

-- Query 2: Show all customers with their details
SELECT 
    id,
    user_id,
    full_name,
    email,
    phone,
    city,
    created_at,
    updated_at
FROM public.customers 
ORDER BY created_at DESC;

-- Query 3: Check customers with their orders count
SELECT 
    c.id,
    c.full_name,
    c.email,
    c.city,
    COUNT(o.id) as order_count,
    COALESCE(SUM(o.total), 0) as total_spent,
    c.created_at
FROM public.customers c
LEFT JOIN public.orders o ON c.user_id = o.user_id
GROUP BY c.id, c.full_name, c.email, c.city, c.created_at
ORDER BY c.created_at DESC;

-- Query 4: Check if there are any auth users (registered users)
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- Query 5: Check admin roles
SELECT 
    ur.user_id,
    u.email,
    ur.role,
    ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin';

-- Query 6: Test RLS policies - try to select customers as admin
-- This simulates what the admin panel does
SELECT * FROM public.customers LIMIT 5;
