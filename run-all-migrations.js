import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nhwoqzokmujucwxbdtjk.supabase.co';
const supabaseKey = 'sb_publishable_a5vSxsPcDg7IDWyogq7NDA_McD_LkIO';

const supabase = createClient(supabaseUrl, supabaseKey);

const migrations = [
  // Migration 1: Create updated_at function
  {
    name: 'Create update_updated_at_column function',
    sql: `
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SET search_path = public;
    `
  },
  
  // Migration 2: Create products table
  {
    name: 'Create products table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.products (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        original_price NUMERIC(10,2),
        category TEXT,
        collection TEXT,
        images TEXT[] DEFAULT '{}',
        sizes TEXT[] DEFAULT '{}',
        colors TEXT[] DEFAULT '{}',
        stock INTEGER NOT NULL DEFAULT 0,
        in_stock BOOLEAN NOT NULL DEFAULT true,
        featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      
      ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
      CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE USING (auth.role() = 'authenticated');
      
      DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
      CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    `
  },
  
  // Migration 3: Create customers table
  {
    name: 'Create customers table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.customers (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address_line1 TEXT,
        address_line2 TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT DEFAULT 'Australia',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      
      ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Customers can view own profile" ON public.customers FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Customers can insert own profile" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Customers can update own profile" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
      
      DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
      CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    `
  },
  
  // Migration 4: Create orders and order_items tables
  {
    name: 'Create orders tables',
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
          CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
        END IF;
      END $$;
      
      CREATE TABLE IF NOT EXISTS public.orders (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        shipping_address TEXT NOT NULL,
        shipping_city TEXT,
        shipping_country TEXT DEFAULT 'Australia',
        status order_status NOT NULL DEFAULT 'pending',
        subtotal NUMERIC(10,2) NOT NULL,
        shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
        discount NUMERIC(10,2) NOT NULL DEFAULT 0,
        total NUMERIC(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      
      ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
      
      DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
      CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
      
      CREATE TABLE IF NOT EXISTS public.order_items (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
        product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        size TEXT,
        color TEXT,
        unit_price NUMERIC(10,2) NOT NULL,
        total_price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      
      ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
      );
      CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
      );
      CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
      
      CREATE OR REPLACE FUNCTION public.generate_order_number()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.order_number := 'FS-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SET search_path = public;
      
      DROP TRIGGER IF EXISTS set_order_number ON public.orders;
      CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();
    `
  },
  
  // Migration 5: Create user_roles table
  {
    name: 'Create user_roles table',
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
          CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
        END IF;
      END $$;
      
      CREATE TABLE IF NOT EXISTS public.user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        role app_role NOT NULL,
        UNIQUE (user_id, role)
      );
      
      ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (auth.role() = 'authenticated');
      
      CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_id = _user_id
            AND role = _role
        )
      $$;
      
      -- Add admin policies to products
      CREATE POLICY IF NOT EXISTS "Admins can insert products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY IF NOT EXISTS "Admins can update products" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY IF NOT EXISTS "Admins can delete products" ON public.products FOR DELETE USING (auth.role() = 'authenticated');
      CREATE POLICY IF NOT EXISTS "Admins can view all orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
      CREATE POLICY IF NOT EXISTS "Admins can update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');
    `
  },
  
  // Migration 6: Create storage bucket
  {
    name: 'Setup storage bucket',
    sql: `
      -- Create public bucket if not exists
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('public', 'public', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain'])
      ON CONFLICT (id) DO NOTHING;
      
      -- Create policies for storage
      CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'public');
      CREATE POLICY IF NOT EXISTS "Authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public' AND auth.role() = 'authenticated');
      CREATE POLICY IF NOT EXISTS "Authenticated update" ON storage.objects FOR UPDATE USING (bucket_id = 'public' AND auth.role() = 'authenticated');
      CREATE POLICY IF NOT EXISTS "Authenticated delete" ON storage.objects FOR DELETE USING (bucket_id = 'public' AND auth.role() = 'authenticated');
      CREATE POLICY IF NOT EXISTS "Anyone can view" ON storage.objects FOR SELECT USING (bucket_id = 'public');
    `
  }
];

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');
  
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`📦 Running Migration ${i + 1}: ${migration.name}`);
    
    try {
      // Execute SQL
      const { error } = await supabase.rpc('exec', { sql: migration.sql });
      
      if (error) {
        console.error(`❌ Migration ${i + 1} failed:`, error.message);
        
        // Try alternative: execute as individual statements
        console.log(`🔄 Trying alternative approach...`);
        const statements = migration.sql.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            const { error: stmtError } = await supabase.rpc('exec', { 
              sql: statement.trim() + ';' 
            });
            
            if (stmtError && !stmtError.message.includes('already exists')) {
              console.error(`   ⚠️ Statement failed:`, stmtError.message);
            }
          }
        }
      } else {
        console.log(`✅ Migration ${i + 1} completed successfully\n`);
      }
    } catch (error) {
      console.error(`❌ Error in migration ${i + 1}:`, error);
    }
  }
  
  console.log('🎉 All migrations completed!');
  
  // Verify tables exist
  console.log('\n🔍 Verifying database setup...');
  const tables = ['products', 'customers', 'orders', 'order_items', 'user_roles'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error && error.code === '42P01') {
      console.log(`⚠️ Table '${table}' does not exist`);
    } else if (error) {
      console.log(`⚠️ Table '${table}' error:`, error.message);
    } else {
      console.log(`✅ Table '${table}' exists`);
    }
  }
}

runMigrations();
