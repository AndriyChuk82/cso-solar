import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('project_payments')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching payments:', error);
  } else {
    console.log('Sample payment keys:', data.length > 0 ? Object.keys(data[0]) : 'No payments found');
  }
}

check();
