-- Complete admin user setup script
-- Run this in Supabase SQL Editor

-- Step 1: Create admin user if it doesn't exist
-- Note: You may need to create the user through Supabase Auth UI first
-- Go to Authentication > Users > Add user with email: admin@fashionspectrumluxe.com

-- Step 2: Update the admin user's metadata to set role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@fashionspectrumluxe.com';

-- Step 3: Verify the admin user setup
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'admin@fashionspectrumluxe.com';

-- Step 4: Check if there are any users at all
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN raw_user_meta_data->>'role' = 'admin' THEN 1 END) as admin_users
FROM auth.users;
