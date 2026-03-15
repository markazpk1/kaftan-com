-- Fix RLS policy to allow admins to see ALL customers regardless of customer roles
-- Drop existing policy and recreate with proper admin access

DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;

CREATE POLICY "Admins can view all customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  -- Allow users with admin role to see ALL customers
  public.has_role(auth.uid(), 'admin') OR
  -- Allow users to see their own profile
  auth.uid() = user_id
);

-- Also ensure admins can manage customer data if needed
CREATE POLICY "Admins can manage customers"
ON public.customers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Test the policy
SELECT 
    'Policy test' as test_type,
    COUNT(*) as visible_customers
FROM public.customers;
