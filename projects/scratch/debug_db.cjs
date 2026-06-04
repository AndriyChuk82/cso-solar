const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    console.log("Fetching active supplier deals...");
    const { data: activeDeals, error: dError } = await supabase
      .from('supplier_deals')
      .select('id, title, supplier_id, paid_at, paid_sum, currency, suppliers(name)')
      .eq('status', 'Активна');

    if (dError) {
      return console.error("Error fetching deals:", dError);
    }
    
    const dealIds = activeDeals.map(d => d.id);
    console.log("Deal IDs:", dealIds);

    const { data: items, error: iError } = await supabase
      .from('supplier_deal_items')
      .select('*')
      .in('deal_id', dealIds);

    if (iError) {
      return console.error("Error fetching items:", iError);
    }

    console.log("Items count:", items.length);
    console.log("Items:", JSON.stringify(items, null, 2));

  } catch (err) {
    console.error("Exception:", err);
  }
}

run();
