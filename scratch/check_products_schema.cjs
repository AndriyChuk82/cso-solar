const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing inserting a custom product with category_id: Розхідники...');
  const testId = crypto.randomUUID ? crypto.randomUUID() : 'test-' + Date.now();
  const { data: insertRes, error: insertErr } = await supabase
    .from('products')
    .insert([{
      id: testId,
      name: 'Тестовий довільний товар Розхідники',
      active: true,
      unit: 'шт',
      category_id: 'Розхідники'
    }])
    .select();
  
  if (insertErr) {
    console.error('Insert product failed:', insertErr.message);
  } else {
    console.log('Insert product succeeded!', insertRes);
    // Clean it up
    await supabase.from('products').delete().eq('id', testId);
  }
}

run();
