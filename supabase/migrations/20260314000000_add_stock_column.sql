-- Add stock quantity column to products table
ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;

-- Update existing products to have stock based on in_stock
UPDATE products SET stock = CASE WHEN in_stock THEN 100 ELSE 0 END;
