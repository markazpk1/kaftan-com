-- QUICK INVENTORY FIX - Run this in your Supabase SQL Editor

-- 1. Add inventory columns to products table (if they don't exist)
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 5;

-- 2. Insert sample inventory data
INSERT INTO products (name, slug, description, price, original_price, category, collection, images, sizes, colors, in_stock, featured, stock, sku, reorder_level, min_stock_level) VALUES
('Classic White Shirt', 'classic-white-shirt', 'Premium cotton white shirt perfect for formal occasions', 49.99, 69.99, 'shirts', 'formal', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['white'], true, true, 75, 'CWS-001', 20, 10),
('Slim Fit Jeans', 'slim-fit-jeans', 'Modern slim fit jeans in classic blue', 79.99, 99.99, 'pants', 'casual', ARRAY['/placeholder.svg'], ARRAY['28', '30', '32', '34'], ARRAY['blue', 'black'], true, true, 120, 'SFJ-002', 30, 15),
('Leather Handbag', 'leather-handbag', 'Genuine leather handbag with multiple compartments', 199.99, 249.99, 'accessories', 'luxury', ARRAY['/placeholder.svg'], ARRAY['OS'], ARRAY['brown', 'black'], true, false, 8, 'LHB-003', 15, 5),
('Silk Evening Dress', 'silk-evening-dress', 'Elegant silk dress for special occasions', 299.99, 399.99, 'dresses', 'formal', ARRAY['/placeholder.svg'], ARRAY['XS', 'S', 'M', 'L'], ARRAY['red', 'black', 'navy'], false, true, 3, 'SED-004', 10, 3),
('Cotton T-Shirt Pack', 'cotton-tshirt-pack', 'Pack of 3 premium cotton t-shirts', 39.99, 49.99, 'shirts', 'casual', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['white', 'gray', 'navy'], true, true, 0, 'CTP-005', 25, 10),
('Wool Blazer', 'wool-blazer', 'Professional wool blazer for business attire', 149.99, 199.99, 'jackets', 'formal', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['navy', 'charcoal', 'black'], true, false, 25, 'WOB-006', 20, 8),
('Sports Shoes', 'sports-shoes', 'Comfortable running shoes with advanced cushioning', 89.99, 119.99, 'shoes', 'sports', ARRAY['/placeholder.svg'], ARRAY['7', '8', '9', '10', '11'], ARRAY['white', 'black', 'blue'], true, true, 45, 'SSH-007', 30, 12),
('Denim Jacket', 'denim-jacket', 'Classic denim jacket with modern fit', 99.99, 139.99, 'jackets', 'casual', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL'], ARRAY['blue', 'black'], true, true, 15, 'DNJ-008', 25, 10),
('Summer Dress', 'summer-dress', 'Light and breezy dress perfect for summer', 59.99, 79.99, 'dresses', 'casual', ARRAY['/placeholder.svg'], ARRAY['XS', 'S', 'M', 'L'], ARRAY['floral', 'solid'], true, true, 60, 'SUD-009', 40, 15),
('Business Suit', 'business-suit', 'Professional business suit with modern cut', 399.99, 549.99, 'suits', 'formal', ARRAY['/placeholder.svg'], ARRAY['38R', '40R', '42R', '44R'], ARRAY['navy', 'charcoal', 'black'], false, true, 12, 'BSU-010', 15, 5)
ON CONFLICT (slug) DO NOTHING;

-- 3. Generate SKUs for products that don't have them
UPDATE products 
SET sku = 'PRD-' || UPPER(SUBSTRING(REPLACE(name, ' ', ''), 1, 3)) || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 3, '0')
WHERE sku IS NULL OR sku = '';

-- 4. Set default reorder levels for products that don't have them
UPDATE products 
SET reorder_level = 10, min_stock_level = 5
WHERE reorder_level IS NULL OR min_stock_level IS NULL;

-- 5. Update in_stock based on stock levels
UPDATE products 
SET in_stock = CASE 
  WHEN stock > 0 THEN true 
  ELSE false 
END;
