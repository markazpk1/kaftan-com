# Coupons System Setup

## Overview
The coupons system is now fully functional with database integration, allowing you to create, manage, and validate discount codes in your fashion store.

## 🚀 Database Setup

### Run this SQL Query in Supabase

Go to your Supabase dashboard: https://app.supabase.com/project/nhwoqzokmujucwxbdtjk/sql

Copy and execute the following SQL:

```sql
-- ===== COUPONS TABLE =====

CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');

CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  minimum_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  usage_limit INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (
  active = true OR 
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(active);
CREATE INDEX idx_coupons_dates ON public.coupons(start_date, end_date);

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  coupon_code TEXT,
  cart_total NUMERIC
) RETURNS TABLE(
  valid BOOLEAN,
  discount_amount NUMERIC,
  final_total NUMERIC,
  message TEXT
) AS $$
DECLARE
  coupon_record RECORD;
  current_time TIMESTAMPTZ := now();
BEGIN
  -- Find the coupon
  SELECT * INTO coupon_record 
  FROM public.coupons 
  WHERE code = coupon_code AND active = true;
  
  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Invalid coupon code'::TEXT;
    RETURN;
  END IF;
  
  -- Check if coupon is within date range
  IF coupon_record.start_date > current_time THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Coupon is not yet active'::TEXT;
    RETURN;
  END IF;
  
  IF coupon_record.end_date IS NOT NULL AND coupon_record.end_date < current_time THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Coupon has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF coupon_record.usage_limit IS NOT NULL AND coupon_record.times_used >= coupon_record.usage_limit THEN
    RETURN QUERY SELECT false, 0, cart_total, 'Coupon usage limit reached'::TEXT;
    RETURN;
  END IF;
  
  -- Check minimum amount
  IF cart_total < coupon_record.minimum_amount THEN
    RETURN QUERY SELECT false, 0, cart_total, 
      'Minimum order amount of AUD ' || coupon_record.minimum_amount || ' required'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate discount
  DECLARE
    discount_amount NUMERIC := 0;
  BEGIN
    IF coupon_record.discount_type = 'percentage' THEN
      discount_amount := cart_total * (coupon_record.discount_value / 100);
    ELSE
      discount_amount := coupon_record.discount_value;
    END IF;
    
    -- Ensure discount doesn't exceed cart total
    discount_amount := LEAST(discount_amount, cart_total);
    
    RETURN QUERY SELECT 
      true, 
      discount_amount, 
      cart_total - discount_amount, 
      'Coupon applied successfully'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.coupons 
  SET times_used = times_used + 1 
  WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## ✅ Features Implemented

### Admin Panel Features
- **Create Coupons**: Add new discount codes with flexible options
- **Edit Coupons**: Modify existing coupon details
- **Delete Coupons**: Remove unwanted coupons
- **Toggle Active/Inactive**: Enable/disable coupons without deleting
- **Usage Tracking**: Monitor how many times each coupon has been used
- **Copy Code**: Easy coupon code copying to clipboard

### Coupon Types
- **Percentage Discounts**: e.g., 10% off entire order
- **Fixed Amount Discounts**: e.g., $20 off entire order

### Validation Rules
- **Unique Codes**: No duplicate coupon codes allowed
- **Usage Limits**: Set maximum number of uses per coupon
- **Minimum Order Amount**: Require minimum cart value
- **Date Restrictions**: Set start and expiry dates
- **Active Status**: Only active coupons can be used

## 🎯 How to Use

### 1. Access Admin Panel
- Go to `/admin/coupons` (must be logged in as admin)
- Click "ADD COUPON" to create new discounts

### 2. Create a Coupon
- **Code**: Unique coupon code (auto-uppercase)
- **Type**: Percentage or Fixed Amount
- **Value**: Discount amount
- **Min Order**: Minimum cart value required
- **Max Uses**: Usage limit (leave blank for unlimited)
- **Expiry Date**: When coupon expires (optional)

### 3. In Checkout Process
Use the coupon validation functions:

```typescript
import { validateCoupon, incrementCouponUsage } from '@/lib/coupons';

// Validate coupon
const result = await validateCoupon('SAVE20', cartTotal);
if (result.valid) {
  // Apply discount
  const finalTotal = result.final_total;
  
  // After successful order, increment usage
  await incrementCouponUsage('SAVE20');
}
```

## 🔧 Technical Details

### Database Schema
- `coupons` table stores all coupon information
- Row Level Security (RLS) ensures only admins can manage coupons
- Indexes for performance on common queries

### API Functions
- `validate_coupon()`: Validates coupon and calculates discount
- `increment_coupon_usage()`: Tracks coupon usage after successful orders

### Frontend Integration
- AdminCoupons.tsx: Full CRUD interface for coupon management
- coupons.ts: Utility functions for checkout integration
- Real-time updates with Supabase subscriptions

## 🎨 UI Features
- Responsive design for mobile and desktop
- Loading states and error handling
- Toast notifications for user feedback
- Progress bars showing usage limits
- Copy-to-clipboard functionality
- Beautiful modal forms with date pickers

The coupons system is now ready to use! Run the SQL query in your Supabase dashboard to activate the functionality.
