-- Simple working coupon validation function
DROP FUNCTION IF EXISTS validate_coupon(TEXT, NUMERIC);

CREATE OR REPLACE FUNCTION validate_coupon(coupon_code TEXT, cart_total NUMERIC)
RETURNS TABLE(is_valid BOOLEAN, discount_amount NUMERIC, final_total NUMERIC, message TEXT) AS $$
BEGIN
  -- Return invalid if coupon doesn't exist or is inactive
  IF NOT EXISTS (
    SELECT 1 FROM public.coupons 
    WHERE code = coupon_code AND active = true
  ) THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Invalid coupon code'::TEXT;
    RETURN;
  END IF;
  
  -- Check if coupon has expired
  IF EXISTS (
    SELECT 1 FROM public.coupons 
    WHERE code = coupon_code AND active = true 
    AND end_date IS NOT NULL AND end_date < now()
  ) THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Coupon has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF EXISTS (
    SELECT 1 FROM public.coupons 
    WHERE code = coupon_code AND active = true 
    AND usage_limit IS NOT NULL AND times_used >= usage_limit
  ) THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Coupon usage limit reached'::TEXT;
    RETURN;
  END IF;
  
  -- Check minimum amount and calculate discount
  RETURN QUERY SELECT 
    true as is_valid,
    CASE 
      WHEN cart_total >= (SELECT minimum_amount FROM public.coupons WHERE code = coupon_code AND active = true)
      THEN CASE 
        WHEN (SELECT discount_type FROM public.coupons WHERE code = coupon_code AND active = true) = 'percentage'
        THEN LEAST(cart_total * (SELECT discount_value FROM public.coupons WHERE code = coupon_code AND active = true) / 100, cart_total)
        ELSE LEAST((SELECT discount_value FROM public.coupons WHERE code = coupon_code AND active = true)::NUMERIC, cart_total)
      END
      ELSE 0
    END as discount_amount,
    CASE 
      WHEN cart_total >= (SELECT minimum_amount FROM public.coupons WHERE code = coupon_code AND active = true)
      THEN cart_total - CASE 
        WHEN (SELECT discount_type FROM public.coupons WHERE code = coupon_code AND active = true) = 'percentage'
        THEN LEAST(cart_total * (SELECT discount_value FROM public.coupons WHERE code = coupon_code AND active = true) / 100, cart_total)
        ELSE LEAST((SELECT discount_value FROM public.coupons WHERE code = coupon_code AND active = true)::NUMERIC, cart_total)
      END
      ELSE cart_total
    END as final_total,
    CASE 
      WHEN cart_total >= (SELECT minimum_amount FROM public.coupons WHERE code = coupon_code AND active = true)
      THEN 'Coupon applied successfully'::TEXT
      ELSE 'Minimum order amount of AUD ' || (SELECT minimum_amount FROM public.coupons WHERE code = coupon_code AND active = true) || ' required'::TEXT
    END as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
