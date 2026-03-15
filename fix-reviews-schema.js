import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://nhwoqzokmujucwxbdtjk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od29xem9rbXVqdWN3eGJkdGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTE2MzEsImV4cCI6MjA4OTAyNzYzMX0.EtpNWPoSIPwcgWe_VYtskWIbthQyDivu8xURd9pDvdA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixReviewsSchema() {
  console.log('🔧 Fixing reviews schema issues...\n');
  
  // Read the SQL file
  const sqlFile = path.join(__dirname, 'fix-reviews-schema.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('📝 Executing schema fixes...\n');
  
  try {
    // Try executing via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql: sql })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.log('⚠️ Could not execute via REST API:', result.message || 'Unknown error');
      console.log('📝 Please run the SQL manually in Supabase Dashboard\n');
      console.log('Instructions:');
      console.log('1. Go to https://supabase.com/dashboard/project/nhwoqzokmujucwxbdtjk');
      console.log('2. Click SQL Editor → New Query');
      console.log('3. Copy the contents from: d:\\Australiya Project\\fashion-spectrum-luxe-main\\fix-reviews-schema.sql');
      console.log('4. Click Run\n');
    } else {
      console.log('✅ Schema fixes executed successfully!');
      console.log('Result:', result);
    }
  } catch (error) {
    console.error('❌ Error executing schema fixes:', error.message);
    console.log('\n📝 Please run the SQL manually in Supabase Dashboard\n');
    console.log('Instructions:');
    console.log('1. Go to https://supabase.com/dashboard/project/nhwoqzokmujucwxbdtjk');
    console.log('2. Click SQL Editor → New Query');
    console.log('3. Copy the contents from: fix-reviews-schema.sql');
    console.log('4. Click Run\n');
  }
  
  // Verify the fixes
  console.log('🔍 Verifying schema fixes:');
  
  try {
    // Test the reviews relationship
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        *,
        customers:customer_id (first_name, last_name)
      `)
      .limit(1);
    
    if (reviewsError) {
      console.log(`⚠️  Reviews relationship: ${reviewsError.message}`);
    } else {
      console.log('✅ Reviews relationship: OK');
    }
    
    // Test the stored procedures
    const { data: procData, error: procError } = await supabase
      .rpc('has_delivered_order_for_product', {
        p_customer_id: '00000000-0000-0000-0000-000000000000',
        p_product_id: '00000000-0000-0000-0000-000000000000'
      });
    
    if (procError) {
      console.log(`⚠️  Stored procedure: ${procError.message}`);
    } else {
      console.log('✅ Stored procedure: OK');
    }
    
    // Check customers table structure
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('first_name, last_name, user_id')
      .limit(1);
    
    if (customersError) {
      console.log(`⚠️  Customers table: ${customersError.message}`);
    } else {
      console.log('✅ Customers table: OK');
    }
    
  } catch (e) {
    console.log('⚠️ Error verifying fixes:', e.message);
  }
}

fixReviewsSchema();
