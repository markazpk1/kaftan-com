-- ========================================
-- INVENTORY MANAGEMENT DATABASE SETUP
-- ========================================

-- 1. Add inventory-specific columns to products table (if not already added)
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 5;

-- Create unique index for SKU (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;

-- 2. Create inventory tracking table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'restock', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  reference_id UUID, -- Can reference order_id or other transaction
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- 3. Create inventory alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock')),
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- 4. Insert sample inventory data
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

-- 5. Create inventory summary view (optional - for reporting)
-- Note: This is a view, not a table. The main data will come from the products table
CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.stock,
  10 as reorder_level,
  5 as min_stock_level,
  p.price,
  p.category,
  CASE 
    WHEN p.images IS NULL OR array_length(p.images, 1) = 0 THEN '/placeholder.svg'
    ELSE p.images[1]
  END as image,
  CASE 
    WHEN p.stock = 0 THEN 'Out of Stock'
    WHEN p.stock <= 5 THEN 'Critical'
    WHEN p.stock <= 10 THEN 'Low Stock'
    ELSE 'In Stock'
  END as stock_status,
  p.updated_at
FROM products p
ORDER BY 
  CASE 
    WHEN p.stock = 0 THEN 1
    WHEN p.stock <= 5 THEN 2
    WHEN p.stock <= 10 THEN 3
    ELSE 4
  END,
  p.name;

-- 6. Create functions for inventory management

-- Function to update stock
CREATE OR REPLACE FUNCTION update_product_stock(
  product_uuid UUID,
  quantity_change INTEGER,
  movement_type TEXT DEFAULT 'adjustment',
  reference_uuid UUID DEFAULT NULL,
  notes_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Get current stock
  SELECT stock INTO current_stock FROM products WHERE id = product_uuid;
  
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  -- Calculate new stock
  IF current_stock + quantity_change < 0 THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;
  
  -- Update product stock
  UPDATE products 
  SET stock = stock + quantity_change,
      updated_at = now()
  WHERE id = product_uuid;
  
  -- Record movement
  INSERT INTO inventory_movements (product_id, movement_type, quantity, reference_id, notes)
  VALUES (product_uuid, movement_type, quantity_change, reference_uuid, notes_text);
  
  -- Create alerts if needed
  IF current_stock + quantity_change = 0 THEN
    INSERT INTO inventory_alerts (product_id, alert_type, message)
    VALUES (product_uuid, 'out_of_stock', 'Product is now out of stock');
  ELSIF current_stock + quantity_change <= (SELECT min_stock_level FROM products WHERE id = product_uuid) THEN
    INSERT INTO inventory_alerts (product_id, alert_type, message)
    VALUES (product_uuid, 'low_stock', 'Product stock is critically low');
  ELSIF current_stock > (SELECT min_stock_level FROM products WHERE id = product_uuid) 
    AND current_stock + quantity_change <= (SELECT min_stock_level FROM products WHERE id = product_uuid) THEN
    INSERT INTO inventory_alerts (product_id, alert_type, message)
    VALUES (product_uuid, 'low_stock', 'Product stock is low');
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions to authenticated users
GRANT SELECT ON inventory_summary TO authenticated;
GRANT SELECT ON inventory_movements TO authenticated;
GRANT SELECT ON inventory_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_stock TO authenticated;

-- 8. Create RLS policies for inventory tables
CREATE POLICY "Authenticated users can view inventory summary" ON inventory_summary FOR SELECT USING (true);
CREATE POLICY "Authenticated users can view inventory movements" ON inventory_movements FOR SELECT USING (true);
CREATE POLICY "Admins can insert inventory movements" ON inventory_movements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);
CREATE POLICY "Authenticated users can view inventory alerts" ON inventory_alerts FOR SELECT USING (true);
CREATE POLICY "Admins can manage inventory alerts" ON inventory_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- 9. Generate SKUs for products that don't have them
UPDATE products 
SET sku = 'PRD-' || UPPER(SUBSTRING(REPLACE(name, ' ', ''), 1, 3)) || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 3, '0')
WHERE sku IS NULL OR sku = '';

-- 10. Set default reorder levels for products that don't have them
UPDATE products 
SET reorder_level = 10, min_stock_level = 5
WHERE reorder_level IS NULL OR min_stock_level IS NULL;

COMMIT;
