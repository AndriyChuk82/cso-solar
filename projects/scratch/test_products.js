import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Querying products...');
  const { data, error } = await supabase.from('products').select('name, unit');
  if (error) {
    console.error('Error fetching products:', error);
  } else {
    console.log('Products fetched count:', data ? data.length : 0);
    console.log('First 5 products:', data ? data.slice(0, 5) : []);
  }
}

test();
