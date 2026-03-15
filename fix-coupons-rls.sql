-- Fix RLS for coupons table
-- Run this in Supabase SQL Editor

-- First, let's see what email you're authenticated with
SELECT auth.email() as current_email;

-- Now let's create proper RLS policies that work
-- Drop all existing policies first
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can view coupons" ON public.coupons;

-- Create policies that check for specific admin emails
-- Replace 'your-admin-email@example.com' with your actual admin email
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (
  active = true
);

CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (
  auth.email() IN ('admin@example.com', 'tcv00898@gmail.com')
) WITH CHECK (
  auth.email() IN ('admin@example.com', 'tcv00898@gmail.com')
);

-- Re-enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
