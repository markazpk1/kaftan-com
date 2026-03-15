import { supabase } from "@/integrations/supabase/client";

export interface CouponValidationResult {
  valid: boolean;
  discount_amount: number;
  final_total: number;
  message: string;
}

export const validateCoupon = async (couponCode: string, cartTotal: number): Promise<CouponValidationResult> => {
  try {
    const { data, error } = await (supabase.rpc as any)('validate_coupon', {
      coupon_code: couponCode,
      cart_total: cartTotal
    });

    if (error) throw error;

    return data?.[0] || {
      valid: false,
      discount_amount: 0,
      final_total: cartTotal,
      message: 'Invalid coupon code'
    };
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return {
      valid: false,
      discount_amount: 0,
      final_total: cartTotal,
      message: error.message || 'Failed to validate coupon'
    };
  }
};

export const incrementCouponUsage = async (couponCode: string): Promise<void> => {
  try {
    const { error } = await (supabase.rpc as any)('increment_coupon_usage', {
      coupon_code: couponCode
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Error incrementing coupon usage:', error);
    throw error;
  }
};
