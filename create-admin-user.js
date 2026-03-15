import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nhwoqzokmujucwxbdtjk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od29xem9rbXVqdWN3eGJkdGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTE2MzEsImV4cCI6MjA4OTAyNzYzMX0.EtpNWPoSIPwcgWe_VYtskWIbthQyDivu8xURd9pDvdA';

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'admin@fashionspectrum.com';
const ADMIN_PASSWORD = 'admin123';

async function createAdminUser() {
  console.log('Creating admin user...\n');
  
  try {
    // Step 1: Sign up the user
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    
    if (authError) {
      console.error('Error creating auth user:', authError.message);
      
      // If user already exists, try to sign in
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        console.log('User already exists, signing in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        
        if (signInError) {
          console.error('Error signing in:', signInError.message);
          return;
        }
        
        if (signInData.user) {
          console.log('Signed in successfully, user ID:', signInData.user.id);
          await assignAdminRole(signInData.user.id);
        }
      }
      return;
    }
    
    if (authData.user) {
      console.log('✅ Auth user created:', authData.user.id);
      
      // Step 2: Assign admin role
      await assignAdminRole(authData.user.id);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function assignAdminRole(userId) {
  console.log('\nStep 2: Assigning admin role...');
  
  // Check if admin role already exists
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
  
  if (existingRole) {
    console.log('✅ Admin role already assigned');
    console.log('\n🎉 Admin user is ready!');
    console.log('\nLogin credentials:');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    return;
  }
  
  // Insert admin role
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: 'admin'
    });
  
  if (roleError) {
    console.error('❌ Error assigning admin role:', roleError.message);
  } else {
    console.log('✅ Admin role assigned successfully');
    console.log('\n🎉 Admin user created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
  }
}

createAdminUser();
