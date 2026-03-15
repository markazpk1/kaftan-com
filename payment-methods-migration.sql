-- =====================================================
-- PAYMENT METHODS TABLE MIGRATION
-- Run this separately after the main migrations
-- =====================================================

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('visa', 'mastercard', 'amex', 'other')),
  last4 TEXT NOT NULL CHECK (last4 ~ '^\d{4}$'),
  expiry TEXT NOT NULL CHECK (expiry ~ '^\d{2}/\d{2}$'),
  cardholder TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON public.payment_methods(user_id, is_default);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment methods" ON public.payment_methods;
CREATE POLICY "Users can insert own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment methods" ON public.payment_methods;
CREATE POLICY "Users can update own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a new payment method as default, unset all other defaults for this user
  IF NEW.is_default = true THEN
    UPDATE public.payment_methods 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for ensuring single default
DROP TRIGGER IF EXISTS ensure_single_default_payment_method_trigger ON public.payment_methods;
CREATE TRIGGER ensure_single_default_payment_method_trigger
BEFORE INSERT OR UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_payment_method();

-- =====================================================
-- PAYMENT METHODS MIGRATION COMPLETE
-- =====================================================
