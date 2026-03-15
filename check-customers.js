const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomers() {
  try {
    console.log('Checking customers...');
    
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Customers found:', customers?.length || 0);
    console.log('Customers:', customers);
    
    // Also check orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.error('Orders error:', ordersError);
      return;
    }
    
    console.log('Orders found:', orders?.length || 0);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkCustomers();
