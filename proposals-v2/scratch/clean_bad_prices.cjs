const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanBadPrices() {
  console.log('Deleting wrong prices from client_prices for КП-20260417-001 under Енергетик UA_Володя...');
  const { data, error } = await supabase
    .from('client_prices')
    .delete()
    .eq('buyer_id', 'e4676b8c-c2bc-444a-a7fa-6eded2c1a2ba')
    .eq('source_kp_number', 'КП-20260417-001')
    .select();

  if (error) {
    console.error('Error deleting:', error);
  } else {
    console.log(`Successfully deleted ${data.length} invalid price entries:`, data.map(d => d.product_name));
  }
}

cleanBadPrices();
