-- Check products table structure and sample data
-- Run this in Supabase SQL Editor

-- Check if products table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any products with images
SELECT COUNT(*) as products_with_images,
    COUNT(*) as total_products,
    COUNT(CASE WHEN images IS NOT NULL AND images != '{}' THEN 1 END) as products_with_non_empty_images
FROM public.products;

-- Sample product data to check images structure
SELECT 
    id,
    name,
    images,
    CASE 
        WHEN jsonb_typeof(images) = 'array' THEN 'jsonb array'
        WHEN jsonb_typeof(images) = 'object' THEN 'jsonb object'
        ELSE 'text/other'
    END as images_type
FROM public.products 
LIMIT 5;

-- Check order_items to see if product_id exists
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
AND column_name LIKE '%product%';
