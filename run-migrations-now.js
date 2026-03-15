import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://nhwoqzokmujucwxbdtjk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od29xem9rbXVqdWN3eGJkdGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTE2MzEsImV4cCI6MjA4OTAyNzYzMX0.EtpNWPoSIPwcgWe_VYtskWIbthQyDivu8xURd9pDvdA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🚀 Running all database migrations...\n');
  
  // Read the SQL file
  const sqlFile = path.join(__dirname, 'all-migrations.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Execute the entire SQL as a single RPC call if possible
  console.log('Attempting to execute migrations...\n');
  
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
      console.log('3. Copy the contents from: d:\\Australiya Project\\fashion-spectrum-luxe-main\\all-migrations.sql');
      console.log('4. Click Run\n');
    } else {
      console.log('✅ Migrations executed successfully!');
      console.log('Result:', result);
    }
  } catch (error) {
    console.error('❌ Error executing migrations:', error.message);
    console.log('\n📝 Please run the SQL manually in Supabase Dashboard\n');
    console.log('Instructions:');
    console.log('1. Go to https://supabase.com/dashboard/project/nhwoqzokmujucwxbdtjk');
    console.log('2. Click SQL Editor → New Query');
    console.log('3. Copy the contents from: all-migrations.sql');
    console.log('4. Click Run\n');
  }
  
  // Verify tables
  console.log('🔍 Verifying tables:');
  const tables = ['products', 'customers', 'orders', 'order_items', 'user_roles'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error && error.code === '42P01') {
        console.log(`⚠️  ${table}: Not found - run the migrations!`);
      } else if (error) {
        console.log(`⚠️  ${table}: ${error.message.substring(0, 50)}`);
      } else {
        console.log(`✅ ${table}: OK`);
      }
    } catch (e) {
      console.log(`⚠️  ${table}: Error checking`);
    }
  }
}

runMigrations();
