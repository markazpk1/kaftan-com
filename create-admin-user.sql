-- Create or update admin user with proper metadata
-- Run this in Supabase SQL Editor

-- First, check if user exists and update metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@fashionspectrumluxe.com';

-- If you need to create a new admin user, use the Supabase Auth UI or:
-- INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
-- VALUES (
--   gen_random_uuid(),
--   'admin@fashionspectrumluxe.com',
--   NOW(),
--   '{"role": "admin"}'
-- );

-- Verify the admin user metadata
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE email = 'admin@fashionspectrumluxe.com';
