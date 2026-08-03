const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: buyers, error: bErr } = await supabase
    .from('buyers')
    .select('*')
    .ilike('name', '%Енергетик%');

  console.log('Buyers:', buyers);

  if (buyers && buyers.length > 0) {
    for (const b of buyers) {
      console.log('--- BUYER:', b.name, b.id, '---');
      const { data: txs, error: txErr } = await supabase
        .from('buyer_transactions')
        .select('*')
        .eq('buyer_id', b.id)
        .order('date', { ascending: true });

      console.log('Transactions count:', txs?.length);
      console.log(JSON.stringify(txs, null, 2));
    }
  }
}

run();
