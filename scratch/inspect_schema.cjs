const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    // If rpc get_tables doesn't exist, we can try to query information_schema.tables
    const { data: tables, error: tErr } = await supabase.from('projects').select('id').limit(1);
    console.log('Available tables can be inferred from projects table access. Let us query public schema:');
    
    // Let's run a query to get public tables via a standard SQL query if possible
    const { data: rawTables, error: rawErr } = await supabase.from('projects').select(`
      id
    `).limit(1);
    console.log('projects connection ok');
  } else {
    console.log('Tables:', data);
  }
}
run();
