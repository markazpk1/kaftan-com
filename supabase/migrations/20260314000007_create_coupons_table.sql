-- ===== COUPONS TABLE =====

-- Create discount_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create coupons table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  minimum_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  usage_limit INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can view coupons" ON public.coupons;

CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (
  active = true
);

CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT WITH CHECK (
  auth.email() = 'admin@example.com'
);
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE USING (
  auth.email() = 'admin@example.com'
) WITH CHECK (
  auth.email() = 'admin@example.com'
);
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE USING (
  auth.email() = 'admin@example.com'
);
CREATE POLICY "Admins can view coupons" ON public.coupons FOR SELECT USING (
  auth.email() = 'admin@example.com'
);

-- Trigger for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes (drop if exist first)
DROP INDEX IF EXISTS idx_coupons_code;
DROP INDEX IF EXISTS idx_coupons_active;
DROP INDEX IF EXISTS idx_coupons_dates;

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(active);
CREATE INDEX idx_coupons_dates ON public.coupons(start_date, end_date);

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  coupon_code TEXT,
  cart_total NUMERIC
) RETURNS TABLE(
  valid BOOLEAN,
  discount_amount NUMERIC,
  final_total NUMERIC,
  message TEXT
) AS $$
DECLARE
  coupon_record RECORD;
  current_time TIMESTAMPTZ := now();
BEGIN
  -- Find the coupon
  SELECT * INTO coupon_record 
  FROM public.coupons 
  WHERE code = coupon_code AND active = true;
  
  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Invalid coupon code'::TEXT;
    RETURN;
  END IF;
  
  -- Check if coupon is within date range
  IF coupon_record.start_date > current_time THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Coupon is not yet active'::TEXT;
    RETURN;
  END IF;
  
  IF coupon_record.end_date IS NOT NULL AND coupon_record.end_date < current_time THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Coupon has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF coupon_record.usage_limit IS NOT NULL AND coupon_record.times_used >= coupon_record.usage_limit THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Coupon usage limit reached'::TEXT;
    RETURN;
  END IF;
  
  -- Check minimum amount
  IF cart_total < coupon_record.minimum_amount THEN
    RETURN QUERY SELECT false, 0, cart_total, 
      'Minimum order amount of AUD ' || coupon_record.minimum_amount || ' required'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate discount
  DECLARE
    discount_amount NUMERIC := 0;
  BEGIN
    IF coupon_record.discount_type = 'percentage' THEN
      discount_amount := cart_total * (coupon_record.discount_value / 100);
    ELSE
      discount_amount := coupon_record.discount_value;
    END IF;
    
    -- Ensure discount doesn't exceed cart total
    discount_amount := LEAST(discount_amount, cart_total);
    
    RETURN QUERY SELECT 
      true, 
      discount_amount, 
      cart_total - discount_amount, 
      'Coupon applied successfully'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.coupons 
  SET times_used = times_used + 1 
  WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
