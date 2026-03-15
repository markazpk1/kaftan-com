-- Add SKU column to products table
ALTER TABLE products ADD COLUMN sku TEXT;

-- Create unique index for SKU
CREATE UNIQUE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
