-- Create collection_products junction table
CREATE TABLE IF NOT EXISTS collection_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, product_id)
);

-- Enable RLS
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage collection products
CREATE POLICY "Admins can manage collection products" ON collection_products
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create policy for everyone to view collection products for published collections
CREATE POLICY "Everyone can view collection products for published collections" ON collection_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_products.collection_id
      AND collections.status = 'published'
    )
  );

-- Create policy for admins to view all collection products
CREATE POLICY "Admins can view all collection products" ON collection_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes
CREATE INDEX idx_collection_products_collection_id ON collection_products(collection_id);
CREATE INDEX idx_collection_products_product_id ON collection_products(product_id);
