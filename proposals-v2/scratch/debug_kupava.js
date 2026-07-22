const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const gasUrl = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('=== 1. BUYERS IN SUPABASE ===');
  const { data: buyers, error: bErr } = await supabase.from('buyers').select('*');
  if (bErr) console.error('Buyers error:', bErr);
  else {
    console.log(`Total buyers: ${buyers.length}`);
    const kupavaBuyers = buyers.filter(b => b.name.toLowerCase().includes('купава'));
    console.log('Kupava in buyers:', kupavaBuyers);
  }

  console.log('\n=== 2. PROPOSALS FROM GAS ===');
  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getProposals' })
    });
    const data = await res.json();
    if (data.success && data.proposals) {
      console.log(`Total proposals: ${data.proposals.length}`);
      const kupavaProps = data.proposals.filter(p => (p.clientName || '').toLowerCase().includes('купава'));
      console.log(`Kupava proposals count: ${kupavaProps.length}`);
      kupavaProps.forEach(p => {
        console.log(`- КП ${p.number} (${p.date}): client="${p.clientName}", items count: ${p.items ? p.items.length : 0}`);
        if (p.items) {
          p.items.slice(0, 3).forEach(i => console.log(`   * ${i.name || i.productId} -> $${i.price}`));
        }
      });

      console.log('\nAll unique client names in history:');
      const names = [...new Set(data.proposals.map(p => p.clientName).filter(Boolean))];
      console.log(names);
    } else {
      console.log('GAS response error:', data);
    }
  } catch (e) {
    console.error('GAS fetch error:', e);
  }
}

test();
