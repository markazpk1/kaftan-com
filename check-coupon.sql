-- Check if the coupon exists and its details
SELECT 
  code,
  discount_type,
  discount_value,
  minimum_amount,
  usage_limit,
  times_used,
  active,
  start_date,
  end_date,
  created_at
FROM public.coupons 
WHERE code = 'JHJHK';
