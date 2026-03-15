import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with your project details
const supabaseUrl = 'https://nhwoqzokmujucwxbdtjk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od29xem9rbXVqdWN3eGJkdGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTE2MzEsImV4cCI6MjA4OTAyNzYzMX0.EtpNWPoSIPwcgWe_VYtskWIbthQyDivu8xURd9pDvdA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCouponSystem() {
  console.log('🧪 Testing Coupon System...\n');

  // Test 1: Check if coupon exists in database
  console.log('1. Checking if JHJHK coupon exists...');
  try {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', 'JHJHK')
      .eq('active', true);

    if (error) throw error;

    if (coupons && coupons.length > 0) {
      const coupon = coupons[0];
      console.log('✅ Coupon found:', {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        minimum_amount: coupon.minimum_amount,
        active: coupon.active
      });
    } else {
      console.log('❌ Coupon JHJHK not found or inactive');
      return;
    }
  } catch (error) {
    console.log('❌ Error checking coupon:', error.message);
    return;
  }

  // Test 2: Test coupon validation function
  console.log('\n2. Testing coupon validation function...');
  try {
    const { data: validationResult, error } = await supabase.rpc('validate_coupon', {
      coupon_code: 'JHJHK',
      cart_total: 100
    });

    if (error) throw error;

    console.log('✅ Validation function returned:', validationResult);
    if (validationResult && validationResult.length > 0) {
      const result = validationResult[0];
      console.log('   - Valid:', result.is_valid);
      console.log('   - Discount Amount:', result.discount_amount);
      console.log('   - Final Total:', result.final_total);
      console.log('   - Message:', result.message);
    }
  } catch (error) {
    console.log('❌ Validation function error:', error.message);
  }

  // Test 3: Test invalid coupon
  console.log('\n3. Testing invalid coupon...');
  try {
    const { data: invalidResult, error } = await supabase.rpc('validate_coupon', {
      coupon_code: 'INVALID',
      cart_total: 100
    });

    if (error) throw error;

    console.log('✅ Invalid coupon test result:', invalidResult);
  } catch (error) {
    console.log('❌ Invalid coupon test error:', error.message);
  }

  // Test 4: Test coupon below minimum amount
  console.log('\n4. Testing coupon below minimum amount...');
  try {
    const { data: minAmountResult, error } = await supabase.rpc('validate_coupon', {
      coupon_code: 'JHJHK',
      cart_total: 1 // Very low amount
    });

    if (error) throw error;

    console.log('✅ Minimum amount test result:', minAmountResult);
  } catch (error) {
    console.log('❌ Minimum amount test error:', error.message);
  }

  console.log('\n🎉 Coupon system testing completed!');
}

// Run the test
testCouponSystem().catch(console.error);
