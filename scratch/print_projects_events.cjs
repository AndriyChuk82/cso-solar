const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const client_id = 'ece99675-0f52-4a5a-bd56-d8d0378f4945'; // Sloboda Sergiy in CRM
  
  const { data: client } = await supabase.from('clients').select('*').eq('id', client_id).single();
  const { data: projects } = await supabase.from('projects').select('*, project_payments(*), project_materials_ledger(*)').eq('client_id', client_id);
  
  const rate = 44.7; // default rate
  
  console.log(`Client: ${client.name}`);
  let globalBalanceUSD = 0;
  
  for (const project of projects) {
    console.log(`\nProject: ${project.name} (ID: ${project.id})`);
    
    // Process materials
    const processedMaterials = (project.project_materials_ledger || []).map(m => ({
      ...m,
      addedToDebt: m.added_to_debt
    }));
    
    let materialsUSD = 0;
    let materialsUAH = 0;
    processedMaterials.forEach(m => {
      if (m.addedToDebt && m.price > 0) {
        const cost = m.quantity * m.price;
        if (m.currency === 'USD') materialsUSD += cost;
        else if (m.currency === 'UAH') materialsUAH += cost;
      }
    });
    
    const agreedUSD = parseFloat(project.agreed_sum_usd) || 0;
    const agreedUAH = parseFloat(project.agreed_sum_uah) || 0;
    const baseUSD = agreedUSD - materialsUSD;
    const baseUAH = agreedUAH - materialsUAH;
    
    console.log(`  agreedUSD: ${agreedUSD}, materialsUSD: ${materialsUSD}, baseUSD: ${baseUSD}`);
    console.log(`  agreedUAH: ${agreedUAH}, materialsUAH: ${materialsUAH}, baseUAH: ${baseUAH}`);
    
    const events = [];
    
    // 1. Base Contract Sum
    if (baseUSD > 0 || baseUAH > 0 || (agreedUSD === 0 && agreedUAH === 0)) {
      events.push({
        description: 'Base Contract Sum',
        debitUSD: baseUSD,
        debitUAH: baseUAH,
        creditUSD: 0,
        creditUAH: 0
      });
    }
    
    // 2. Materials
    processedMaterials.forEach(m => {
      if (m.addedToDebt && m.price > 0) {
        const cost = m.quantity * m.price;
        events.push({
          description: `Material: ${m.name} (${m.quantity} * ${m.price})`,
          debitUSD: m.currency === 'USD' ? cost : 0,
          debitUAH: m.currency === 'UAH' ? cost : 0,
          creditUSD: 0,
          creditUAH: 0
        });
      }
    });
    
    // 3. Payments
    const validPayments = (project.project_payments || []).filter(pay => !pay.status?.toLowerCase().includes('скасовано'));
    validPayments.forEach(pay => {
      const sum = parseFloat(pay.sum) || 0;
      events.push({
        description: `Payment (${pay.date})`,
        debitUSD: 0,
        debitUAH: 0,
        creditUSD: pay.currency === 'USD' ? sum : 0,
        creditUAH: pay.currency === 'UAH' ? sum : 0
      });
    });
    
    let projDebUSD = 0, projCredUSD = 0;
    let projDebUAH = 0, projCredUAH = 0;
    
    events.forEach(e => {
      projDebUSD += e.debitUSD;
      projCredUSD += e.creditUSD;
      projDebUAH += e.debitUAH;
      projCredUAH += e.creditUAH;
      console.log(`    - ${e.description}: Debit USD=${e.debitUSD}, Credit USD=${e.creditUSD}, Debit UAH=${e.debitUAH}, Credit UAH=${e.creditUAH}`);
    });
    
    const projectNetUSD = projDebUSD - projCredUSD;
    const projectNetUAH = projDebUAH - projCredUAH;
    console.log(`  Project USD Net: ${projectNetUSD}, UAH Net: ${projectNetUAH}`);
  }
}
run();
