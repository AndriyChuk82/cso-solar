const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Checking schema of buyer_transaction_items table...');
  const { data, error } = await supabase
    .rpc('get_table_info', { table_name: 'buyer_transaction_items' });
  
  if (error) {
    // If custom RPC doesn't exist, let's query a sample row or postgres catalog
    console.log('Error calling RPC, trying direct SQL query or sample fetch...');
    const { data: sample, error: sErr } = await supabase
      .from('buyer_transaction_items')
      .select('*')
      .limit(1);
    console.log('Sample row:', sample);
    
    // Let's test inserting a row with product_id: null!
    console.log('Testing insertion of a row with product_id = null...');
    // We need a transaction_id to test, let's find one
    const { data: txs } = await supabase.from('buyer_transactions').select('id').limit(1);
    if (txs && txs.length > 0) {
      const testTxId = txs[0].id;
      const { data: insertRes, error: insertErr } = await supabase
        .from('buyer_transaction_items')
        .insert([{
          transaction_id: testTxId,
          product_id: null, // Test nullable
          warehouse_id: null,
          quantity: 1,
          price: 100,
          currency: 'USD'
        }])
        .select();
      
      if (insertErr) {
        console.error('Insert failed:', insertErr.message);
      } else {
        console.log('Insert succeeded! Nullable is allowed!', insertRes);
        // Clean up the test row
        await supabase.from('buyer_transaction_items').delete().eq('id', insertRes[0].id);
      }
    }
  } else {
    console.log('Table schema details:', data);
  }
}

run();
