-- Fix the coupon validation function
DROP FUNCTION IF EXISTS validate_coupon(TEXT, NUMERIC);

CREATE OR REPLACE FUNCTION validate_coupon(coupon_code TEXT, cart_total NUMERIC)
RETURNS RECORD AS $$
DECLARE
  coupon_record RECORD;
  result RECORD;
BEGIN
  -- Find the coupon
  SELECT * INTO coupon_record 
  FROM public.coupons 
  WHERE code = coupon_code AND active = true;
  
  -- Check if coupon exists
  IF NOT FOUND THEN
    SELECT false, 0, cart_total, 'Invalid coupon code'::TEXT INTO result;
    RETURN result;
  END IF;
  
  -- Check if coupon is within date range
  IF coupon_record.start_date > now() THEN
    SELECT false, 0, cart_total, 'Coupon is not yet active'::TEXT INTO result;
    RETURN result;
  END IF;
  
  IF coupon_record.end_date IS NOT NULL AND coupon_record.end_date < now() THEN
    SELECT false, 0, cart_total, 'Coupon has expired'::TEXT INTO result;
    RETURN result;
  END IF;
  
  -- Check usage limit
  IF coupon_record.usage_limit IS NOT NULL AND coupon_record.times_used >= coupon_record.usage_limit THEN
    SELECT false, 0, cart_total, 'Coupon usage limit reached'::TEXT INTO result;
    RETURN result;
  END IF;
  
  -- Check minimum amount
  IF cart_total < coupon_record.minimum_amount THEN
    SELECT false, 0, cart_total, 
      'Minimum order amount of AUD ' || coupon_record.minimum_amount || ' required'::TEXT INTO result;
    RETURN result;
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
    
    SELECT true, discount_amount, cart_total - discount_amount, 'Coupon applied successfully'::TEXT INTO result;
    RETURN result;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
