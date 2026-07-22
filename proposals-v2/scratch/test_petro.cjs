const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function norm(s) {
  if (!s) return '';
  let cleaned = s.toLowerCase().replace(/тов|фоп|пп|тдв|ват|пат|прат|ао|фг|дп|пбк/gi, '');
  return cleaned.replace(/[^\w\u0400-\u04FF]/g, '').trim();
}

async function testMatch() {
  const { data: buyers } = await supabase.from('buyers').select('*');
  
  const targetNorm = norm('Петро (м. Зборів)');
  console.log('targetNorm for "Петро (м. Зборів)":', `"${targetNorm}"`);

  buyers.forEach(b => {
    const bNorm = norm(b.name);
    const isExact = bNorm === targetNorm;
    const isInc1 = bNorm.length >= 3 && targetNorm.length >= 3 && bNorm.includes(targetNorm);
    const isInc2 = bNorm.length >= 3 && targetNorm.length >= 3 && targetNorm.includes(bNorm);
    if (isExact || isInc1 || isInc2) {
      console.log(`MATCHED! Buyer: "${b.name}" (norm="${bNorm}")`);
      console.log(`  Reason: exact=${isExact}, bNorm.includes(targetNorm)=${isInc1}, targetNorm.includes(bNorm)=${isInc2}`);
    }
  });
}

testMatch();
