-- Check if the migration was applied
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- Check if the is_admin function exists
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'is_admin';

-- Test the is_admin function
SELECT public.is_admin();
