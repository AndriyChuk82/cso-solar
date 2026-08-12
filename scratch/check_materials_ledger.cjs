const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const projectId0 = '0b89f3b2-6b17-4c91-a4bc-03672682c42c';
  
  console.log('--- Project 0 Materials Ledger: ---');
  const { data: ledger } = await supabase.from('project_materials_ledger').select('*').eq('project_id', projectId0);
  if (ledger) {
    ledger.forEach(l => {
      console.log(l);
    });
  } else {
    console.log('No ledger records');
  }
}
run();
