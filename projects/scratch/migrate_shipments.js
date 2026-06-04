const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read credentials from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase URL or Anon Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  console.log('Starting migration of shipment items to project_materials_ledger...');

  // 1. Fetch shipments
  const { data: shipments, error: sErr } = await supabase
    .from('project_shipments')
    .select('*');

  if (sErr) {
    console.error('Error fetching shipments:', sErr);
    process.exit(1);
  }
  console.log(`Loaded ${shipments.length} shipments.`);

  // 2. Fetch shipment items
  const { data: shipmentItems, error: siErr } = await supabase
    .from('shipment_items')
    .select('*');

  if (siErr) {
    console.error('Error fetching shipment items:', siErr);
    process.exit(1);
  }
  console.log(`Loaded ${shipmentItems.length} shipment items.`);

  // 3. Fetch project items
  const { data: projectItems, error: piErr } = await supabase
    .from('project_items')
    .select('*');

  if (piErr) {
    console.error('Error fetching project items:', piErr);
    process.exit(1);
  }
  console.log(`Loaded ${projectItems.length} project items.`);

  // 4. Fetch existing ledger notes to prevent double migration
  const { data: ledgerItems, error: lErr } = await supabase
    .from('project_materials_ledger')
    .select('note');

  if (lErr) {
    console.error('Error fetching ledger items:', lErr);
    process.exit(1);
  }

  const existingMigrationTags = new Set(
    ledgerItems
      .map(item => {
        const match = (item.note || '').match(/Migrated: shipment-item-([\w-]+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
  );

  console.log(`Found ${existingMigrationTags.size} already migrated items.`);

  // 5. Migrate items
  const itemsToInsert = [];
  
  for (const si of shipmentItems) {
    // Check if already migrated
    if (existingMigrationTags.has(si.id)) {
      continue;
    }

    const shipment = shipments.find(s => s.id === si.shipment_id);
    if (!shipment) {
      console.warn(`Warning: Shipment ${si.shipment_id} not found for shipment_item ${si.id}`);
      continue;
    }

    const projectItem = projectItems.find(pi => pi.id === si.project_item_id);
    
    const name = si.custom_name || (projectItem ? projectItem.name : 'Невідомий товар');
    const price = si.custom_price !== null ? parseFloat(si.custom_price) : (projectItem ? parseFloat(projectItem.price) : 0);
    const currency = si.custom_currency || 'USD';
    const unit = projectItem ? (projectItem.unit || 'шт.') : 'шт.';

    const migrationTag = `[Migrated: shipment-item-${si.id}]`;
    const logisticNote = `[Накладна від ${shipment.date}, Перевізник: ${shipment.carrier}${shipment.tracking_number ? `, ТТН: ${shipment.tracking_number}` : ''}]`;
    const userNotes = [shipment.note, si.note].filter(n => n && n.trim() !== '').join(' | ');
    const note = [migrationTag, logisticNote, userNotes].filter(Boolean).join(' ');

    itemsToInsert.push({
      project_id: shipment.project_id,
      name,
      quantity: parseFloat(si.quantity),
      unit,
      price,
      currency,
      status: 'Видано',
      issued_at: shipment.date ? new Date(shipment.date).toISOString() : new Date().toISOString(),
      issued_by: 'Комірник',
      is_priced: price > 0,
      note,
      added_to_debt: si.added_to_debt || false
    });
  }

  if (itemsToInsert.length === 0) {
    console.log('No new shipment items to migrate.');
    return;
  }

  console.log(`Migrating ${itemsToInsert.length} shipment items to project_materials_ledger...`);
  
  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < itemsToInsert.length; i += batchSize) {
    const batch = itemsToInsert.slice(i, i + batchSize);
    const { error: insErr } = await supabase
      .from('project_materials_ledger')
      .insert(batch);

    if (insErr) {
      console.error('Error inserting batch:', insErr);
      process.exit(1);
    }
  }

  console.log('Migration completed successfully!');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
