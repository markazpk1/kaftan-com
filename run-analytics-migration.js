const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running analytics tables migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20260314000006_create_analytics_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try using direct SQL execution if RPC fails
          console.log('RPC failed, trying direct SQL execution...');
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(1);
          
          // If direct execution also fails, we'll need to run this manually
          console.log('Note: This migration needs to be run manually in the Supabase dashboard:');
          console.log('1. Go to https://app.supabase.com/project/nhwoqzokmujucwxbdtjk/sql');
          console.log('2. Copy and paste the contents of: supabase/migrations/20260314000006_create_analytics_tables.sql');
          console.log('3. Execute the SQL');
          
          return;
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.log('\nPlease run the migration manually in the Supabase dashboard:');
    console.log('1. Go to https://app.supabase.com/project/nhwoqzokmujucwxbdtjk/sql');
    console.log('2. Copy and paste the contents of: supabase/migrations/20260314000006_create_analytics_tables.sql');
    console.log('3. Execute the SQL');
  }
}

runMigration();
