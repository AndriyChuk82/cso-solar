const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simulating getAllOwedMaterials
async function getAllOwedMaterials() {
  const { data: activeDeals, error: dError } = await supabase
    .from('supplier_deals')
    .select('id, title, supplier_id, paid_at, paid_sum, currency, suppliers(name)')
    .eq('status', 'Активна');

  if (dError) throw dError;
  if (!activeDeals || activeDeals.length === 0) return [];

  const dealIds = activeDeals.map(d => d.id);

  const { data: items, error: iError } = await supabase
    .from('supplier_deal_items')
    .select('*')
    .in('deal_id', dealIds);

  if (iError) throw iError;
  
  return items.map(item => {
    const deal = activeDeals.find(d => d.id === item.deal_id);
    return {
      ...item,
      supplier_name: deal?.suppliers?.name || 'Невідомий постачальник',
      deal_title: deal?.title || 'Без назви',
      paid_at: deal?.paid_at,
      currency: deal?.currency || 'USD',
      paid_sum: parseFloat(deal?.paid_sum) || 0,
      supplier_id: deal?.supplier_id // Wait, is supplier_id mapped here?
    };
  });
}

async function run() {
  const sups = await supabase.from('suppliers').select('*');
  const owed = await getAllOwedMaterials();
  console.log("Suppliers count:", sups.data.length);
  console.log("Suppliers:", sups.data);
  console.log("Owed materials count:", owed.length);
  console.log("Owed materials:", JSON.stringify(owed, null, 2));

  // Simulating the filteredMaterials and cards logic
  const filteredMaterials = owed.filter(item => {
    const remaining = parseFloat(item.quantity) - parseFloat(item.received_quantity);
    return remaining > 0;
  });

  console.log("Filtered materials:", filteredMaterials);

  const supplierCards = sups.data.map(sup => {
    const supMaterials = filteredMaterials.filter(item => item.supplier_id === sup.id);
    console.log(`Supplier ${sup.name} ID: ${sup.id}, matching materials count: ${supMaterials.length}`);
    return {
      supplier: sup,
      supMaterials
    };
  });
}

run();
