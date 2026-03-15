-- ========================================
-- PAGES MANAGEMENT DATABASE SETUP
-- ========================================

-- 1. Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  meta_title TEXT,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_system BOOLEAN DEFAULT FALSE, -- For system pages like Home, Shop that can't be deleted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add updated_at trigger
CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON pages 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Anyone can view published pages" ON pages FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage all pages" ON pages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- 5. Insert default system pages
INSERT INTO pages (name, slug, path, content, meta_title, meta_description, status, is_system) VALUES
('Home', 'home', '/', 
'<div class="hero-section">
  <h1>Welcome to Fashion Spectrum Luxe</h1>
  <p>Discover premium fashion collections</p>
</div>', 
'Fashion Spectrum Luxe - Premium Fashion Store', 
'Shop the latest fashion trends at Fashion Spectrum Luxe. Premium clothing, accessories, and more.', 
'published', true),

('Shop', 'shop', '/shop',
'<div class="shop-section">
  <h2>Shop Our Collections</h2>
  <div class="products-grid">
    <!-- Products will be dynamically loaded here -->
  </div>
</div>',
'Shop - Fashion Spectrum Luxe',
'Browse our complete collection of premium fashion items.',
'published', true),

('Collections', 'collections', '/collections',
'<div class="collections-section">
  <h2>Our Collections</h2>
  <div class="collections-grid">
    <!-- Collections will be dynamically loaded here -->
  </div>
</div>',
'Collections - Fashion Spectrum Luxe',
'Explore our curated fashion collections.',
'published', true),

('New Arrivals', 'new-arrivals', '/new-arrivals',
'<div class="new-arrivals-section">
  <h2>New Arrivals</h2>
  <div class="products-grid">
    <!-- New products will be dynamically loaded here -->
  </div>
</div>',
'New Arrivals - Fashion Spectrum Luxe',
'Check out the latest additions to our collection.',
'published', true),

('Sale', 'sale', '/sale',
'<div class="sale-section">
  <h2>Sale Items</h2>
  <div class="products-grid">
    <!-- Sale items will be dynamically loaded here -->
  </div>
</div>',
'Sale - Fashion Spectrum Luxe',
'Find amazing deals on premium fashion items.',
'published', true),

('Best Sellers', 'best-sellers', '/best-sellers',
'<div class="best-sellers-section">
  <h2>Best Sellers</h2>
  <div class="products-grid">
    <!-- Best selling products will be dynamically loaded here -->
  </div>
</div>',
'Best Sellers - Fashion Spectrum Luxe',
'Shop our most popular and trending fashion items.',
'published', true),

('About', 'about', '/about',
'<div class="about-section">
  <h2>About Fashion Spectrum Luxe</h2>
  <p>Learn more about our story and commitment to quality fashion.</p>
</div>',
'About Us - Fashion Spectrum Luxe',
'Learn about Fashion Spectrum Luxe and our premium fashion collections.',
'draft', false),

('Contact', 'contact', '/contact',
'<div class="contact-section">
  <h2>Contact Us</h2>
  <p>Get in touch with our team for any questions or support.</p>
</div>',
'Contact - Fashion Spectrum Luxe',
'Contact Fashion Spectrum Luxe for customer support and inquiries.',
'draft', false)

ON CONFLICT (slug) DO NOTHING;

-- 6. Create function to get page by path
CREATE OR REPLACE FUNCTION get_page_by_path(page_path TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  path TEXT,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT,
  is_system BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM pages p
  WHERE p.path = page_path AND p.status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT SELECT ON pages TO authenticated;
GRANT EXECUTE ON FUNCTION get_page_by_path TO authenticated;

COMMIT;
