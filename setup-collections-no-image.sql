-- Create collections table (without image column)
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  featured BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON collections(featured);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);

-- Enable RLS (Row Level Security)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage collections" ON collections;
DROP POLICY IF EXISTS "Everyone can view published collections" ON collections;
DROP POLICY IF EXISTS "Admins can view all collections" ON collections;

-- Create policy for admins to manage collections
CREATE POLICY "Admins can manage collections" ON collections
  USING (
    auth.uid() in (
      SELECT user_id FROM user_roles 
      WHERE role = 'admin'
    )
  );

-- Create policy for everyone to view published collections
CREATE POLICY "Everyone can view published collections" ON collections
  FOR SELECT
  USING (
    status = 'published'
  );

-- Create policy for admins to view all collections
CREATE POLICY "Admins can view all collections" ON collections
  FOR SELECT
  USING (
    auth.uid() in (
      SELECT user_id FROM user_roles 
      WHERE role = 'admin'
    )
  );

-- Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_collections_timestamp ON collections;
CREATE TRIGGER set_collections_timestamp
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage collection products" ON collection_products;
DROP POLICY IF EXISTS "Everyone can view collection products for published collections" ON collection_products;
DROP POLICY IF EXISTS "Admins can view all collection products" ON collection_products;

-- Create policy for admins to manage collection products
CREATE POLICY "Admins can manage collection products" ON collection_products
  USING (
    auth.uid() in (
      SELECT user_id FROM user_roles 
      WHERE role = 'admin'
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
    auth.uid() in (
      SELECT user_id FROM user_roles 
      WHERE role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id ON collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON collection_products(product_id);
