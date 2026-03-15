-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  featured BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_collections_status ON collections(status);
CREATE INDEX idx_collections_featured ON collections(featured);
CREATE INDEX idx_collections_slug ON collections(slug);

-- Enable RLS (Row Level Security)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage collections
CREATE POLICY "Admins can manage collections" ON collections
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
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
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_collections_timestamp
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();
