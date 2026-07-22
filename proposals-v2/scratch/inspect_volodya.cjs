const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectPrices() {
  console.log('=== CLIENT PRICES FOR КП-20260417-001 ===');
  const { data: prices1 } = await supabase.from('client_prices').select('*, buyers(name)').eq('source_kp_number', 'КП-20260417-001');
  console.log('Prices with KP-20260417-001:', prices1);

  console.log('\n=== ALL CLIENT PRICES FOR Енергетик UA_Володя ===');
  const { data: pricesVolodya } = await supabase.from('client_prices').select('*, buyers(name)').eq('buyer_id', 'e4676b8c-c2bc-444a-a7fa-6eded2c1a2ba');
  console.log(pricesVolodya);
}

inspectPrices();
