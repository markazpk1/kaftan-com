-- Simple diagnostic check for products table
-- Run this in Supabase SQL Editor

-- Check if products table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'products' 
    AND table_schema = 'public'
) as products_table_exists;

-- Check products table structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Count products with images
SELECT COUNT(*) as products_with_images
FROM public.products 
WHERE images IS NOT NULL 
AND images != '{}';

-- Sample products to see image data
SELECT 
    id,
    name,
    images,
    CASE 
        WHEN images IS NULL THEN 'NULL'
        WHEN images = '{}' THEN 'EMPTY'
        ELSE 'HAS_DATA'
    END as image_status
FROM public.products 
LIMIT 10;
