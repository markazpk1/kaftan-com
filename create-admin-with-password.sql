-- Create admin user with specific password
-- IMPORTANT: Run this in Supabase SQL Editor

-- Step 1: Insert admin user directly (bypassing email confirmation)
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin@fashionspectrumluxe.com',
  NOW(),
  '{"role": "admin"}',
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  raw_user_meta_data = jsonb_set(
    COALESCE(auth.users.raw_user_meta_data, '{}'),
    '{role}',
    '"admin"'
  ),
  email_confirmed_at = NOW();

-- Step 2: Set the password for the admin user
-- Note: This requires the user ID from the previous step
-- You may need to manually set the password through Supabase Auth UI:
-- Go to Authentication > Users > Find admin@fashionspectrumluxe.com > Reset Password

-- Step 3: Verify the admin user
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'admin@fashionspectrumluxe.com';
