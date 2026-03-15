-- Debug coupon validation logic step by step
SELECT 
  'JHJHK' as test_coupon,
  (SELECT minimum_amount FROM public.coupons WHERE code = 'JHJHK' AND active = true) as min_amount,
  (SELECT discount_type FROM public.coupons WHERE code = 'JHJHK' AND active = true) as discount_type,
  (SELECT discount_value FROM public.coupons WHERE code = 'JHJHK' AND active = true) as discount_value,
  (SELECT CASE 
    WHEN (SELECT discount_type FROM public.coupons WHERE code = 'JHJHK' AND active = true) = 'percentage'
    THEN 100 * (SELECT discount_value FROM public.coupons WHERE code = 'JHJHK' AND active = true) / 100
    ELSE (SELECT discount_value FROM public.coupons WHERE code = 'JHJHK' AND active = true)
  END) as calculated_discount;
