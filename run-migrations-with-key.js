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
  
  // Read and execute the SQL file
  const sqlFile = path.join(__dirname, 'all-migrations.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // Split into statements
  const statements = sql.split(';').filter(s => s.trim());
  
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;
    
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: statement + ';' 
      });
      
      if (error) {
        // Check if it's just "already exists" error
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('already a member')) {
          console.log(`✅ Statement ${i + 1}: Already exists (skipped)`);
          successCount++;
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, error.message.substring(0, 100));
          errorCount++;
        }
      } else {
        console.log(`✅ Statement ${i + 1}: Success`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Statement ${i + 1} error:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n🎉 Migrations Complete!`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  
  // Verify tables
  console.log('\n🔍 Verifying tables:');
  const tables = ['products', 'customers', 'orders', 'order_items', 'user_roles'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error && error.code === '42P01') {
        console.log(`⚠️  ${table}: Not found`);
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
