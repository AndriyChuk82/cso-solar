const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const gasUrl = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function norm(s) {
  if (!s) return '';
  let cleaned = s.toLowerCase().replace(/тов|фоп|пп|тдв|ват|пат|прат|ао|фг|дп|пбк/gi, '');
  return cleaned.replace(/[^\w\u0400-\u04FF]/g, '').trim();
}

async function debugEnergetik() {
  console.log('=== BUYERS STARTING WITH ЕНЕРГЕТИК ===');
  const { data: buyers } = await supabase.from('buyers').select('*');
  const energBuyers = buyers.filter(b => b.name.toLowerCase().includes('енергетик'));
  energBuyers.forEach(b => console.log(`ID: ${b.id} | Name: "${b.name}" | Norm: "${norm(b.name)}"`));

  console.log('\n=== PROPOSALS FOR ENERGETIK ===');
  const res = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getProposals' })
  });
  const data = await res.json();
  const props = data.proposals || [];
  const targetProp = props.find(p => p.number === 'КП-20260417-001' || p.number.includes('20260417'));
  if (targetProp) {
    console.log('Found КП-20260417-001:', {
      number: targetProp.number,
      clientName: targetProp.clientName,
      normClientName: norm(targetProp.clientName),
      date: targetProp.date
    });
  } else {
    console.log('КП-20260417-001 not found directly, searching all proposals with client containing "енергетик":');
    props.filter(p => (p.clientName || '').toLowerCase().includes('енергетик')).forEach(p => {
      console.log(`- КП ${p.number} (${p.date}): clientName="${p.clientName}" | norm="${norm(p.clientName)}"`);
    });
  }

  console.log('\n=== TESTING MATCHES FOR ALL ENERGETIK PROPOSALS ===');
  props.filter(p => (p.clientName || '').toLowerCase().includes('енергетик')).forEach(p => {
    const targetNorm = norm(p.clientName);
    const matched = energBuyers.filter(b => {
      const bNorm = norm(b.name);
      return bNorm === targetNorm || (bNorm.length >= 3 && targetNorm.length >= 3 && (bNorm.includes(targetNorm) || targetNorm.includes(bNorm)));
    });
    console.log(`Proposal КП ${p.number} ("${p.clientName}") -> Matched buyers:`, matched.map(m => m.name));
  });
}

debugEnergetik();
