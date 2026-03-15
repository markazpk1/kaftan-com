import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nhwoqzokmujucwxbdtjk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od29xem9rbXVqdWN3eGJkdGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTE2MzEsImV4cCI6MjA4OTAyNzYzMX0.EtpNWPoSIPwcgWe_VYtskWIbthQyDivu8xURd9pDvdA';

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'admin@fashionspectrum.com';
const ADMIN_PASSWORD = 'admin123';

async function confirmAdminEmail() {
  console.log('Confirming admin email...\n');
  
  try {
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError.message);
      
      if (signInError.message.includes('Email not confirmed')) {
        console.log('Email not confirmed. Creating new admin user...');
        await createNewAdminUser();
      }
      return;
    }
    
    if (signInData.user) {
      console.log('✅ Admin signed in successfully!');
      console.log('User ID:', signInData.user.id);
      console.log('Email confirmed:', signInData.user.email_confirmed_at ? 'YES' : 'NO');
      
      if (!signInData.user.email_confirmed_at) {
        console.log('Email still not confirmed. Creating new admin user...');
        await createNewAdminUser();
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function createNewAdminUser() {
  console.log('\nCreating new admin user with confirmed email...');
  
  // Delete existing user (if possible)
  try {
    await supabase.auth.admin.deleteUser('f8c5ad83-6ef9-449c-9267-334b73a598ad');
    console.log('Old admin user deleted');
  } catch (e) {
    console.log('Could not delete old user (might not have permissions)');
  }
  
  // Create new user with email confirmation
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });
  
  if (error) {
    console.error('Error creating admin user:', error.message);
    return;
  }
  
  if (data.user) {
    console.log('✅ New admin user created:', data.user.id);
    
    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: data.user.id,
        role: 'admin'
      });
    
    if (roleError) {
      console.error('Error assigning admin role:', roleError.message);
    } else {
      console.log('✅ Admin role assigned');
      console.log('\n🎉 Admin user is ready!');
      console.log('\nLogin credentials:');
      console.log('Email:', ADMIN_EMAIL);
      console.log('Password:', ADMIN_PASSWORD);
    }
  }
}

confirmAdminEmail();
