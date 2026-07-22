const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTable() {
  console.log('Testing client_prices table in Supabase...');
  const { data, error } = await supabase.from('client_prices').select('*').limit(1);
  if (error) {
    console.error('❌ Error selecting from client_prices:', error);
  } else {
    console.log('✅ client_prices table exists! Data:', data);
  }

  console.log('\nTesting is_kp_client column in buyers...');
  const { data: bData, error: bError } = await supabase.from('buyers').select('id, name, is_kp_client').limit(3);
  if (bError) {
    console.error('❌ Error selecting is_kp_client from buyers:', bError);
  } else {
    console.log('✅ is_kp_client column exists! Data:', bData);
  }
}

testTable();
