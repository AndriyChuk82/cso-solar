const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fixing transaction 66e768d3-da96-4989-b057-646b999a33bd amount to 242779.4...');
  const { data, error } = await supabase
    .from('buyer_transactions')
    .update({ amount: 242779.4 })
    .eq('id', '66e768d3-da96-4989-b057-646b999a33bd')
    .select();

  if (error) {
    console.error('Error updating transaction:', error);
  } else {
    console.log('Updated transaction:', data);
  }
}

run();
