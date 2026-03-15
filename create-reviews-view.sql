-- Create reviews_with_customers view
-- Run this in Supabase SQL Editor

-- Drop the view if it exists
DROP VIEW IF EXISTS public.reviews_with_customers;

-- Create the view
CREATE VIEW public.reviews_with_customers AS
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

-- Test the view
SELECT * FROM public.reviews_with_customers LIMIT 5;
