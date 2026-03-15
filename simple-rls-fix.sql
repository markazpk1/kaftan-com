-- Simple RLS fix - allow any authenticated user to manage coupons
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (
  active = true
);

CREATE POLICY "Authenticated users can manage coupons" ON public.coupons FOR ALL USING (
  auth.uid() IS NOT NULL
) WITH CHECK (
  auth.uid() IS NOT NULL
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
