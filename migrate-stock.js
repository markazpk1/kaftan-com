import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://aggpfzdyspgtwuonkhsc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZ3BmemR5c3BndHd1b25raHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzA0MTcsImV4cCI6MjA4ODU0NjQxN30.YdQ8JjTzsbi0GTJulvPZZ_0aUB4ZiYWAhvfNiijaAdE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addStockColumn() {
  try {
    console.log('Adding stock column to products table...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'add-stock-column.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try alternative approach - execute statements one by one
      console.log('Trying alternative approach...');
      
      // Add column
      const { error: colError } = await supabase.rpc('exec', {
        sql: `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;`
      });
      
      if (colError) {
        console.error('Error adding column:', colError);
      } else {
        console.log('✅ Stock column added successfully');
      }
      
    } else {
      console.log('✅ Stock column migration completed successfully!');
    }
    
    // Verify the column was added
    const { data, error: verifyError } = await supabase
      .from('products')
      .select('stock')
      .limit(1);
    
    if (verifyError) {
      console.error('Error verifying column:', verifyError);
    } else {
      console.log('✅ Stock column verified:', data);
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

addStockColumn();
