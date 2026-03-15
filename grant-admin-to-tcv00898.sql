-- Grant admin privileges to tcv00898@gmail.com
-- Run this in Supabase SQL Editor

-- Update user metadata to set admin role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'tcv00898@gmail.com';

-- Verify the admin role was granted
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'tcv00898@gmail.com';

-- Show all admin users for verification
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin';
