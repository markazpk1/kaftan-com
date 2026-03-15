-- Check current authenticated user email
SELECT 
  auth.email() as current_email,
  auth.uid() as current_user_id,
  auth.jwt() ->> 'role' as jwt_role;

-- Also check all admin-like users in the system
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email LIKE '%admin%' 
   OR email LIKE '%test%'
   OR raw_user_meta_data::text LIKE '%admin%'
ORDER BY created_at DESC;
