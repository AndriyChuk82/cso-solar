// ===== CSO Solar — Green Tariff to Supabase Migration Script =====

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// 1. Manually parse .env.local to avoid extra dependencies
const envPath = path.resolve(__dirname, '../../.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const fileContent = fs.readFileSync(envPath, 'utf8');
  fileContent.split('\n').forEach(line => {
    const matched = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (matched) {
      let value = matched[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      envConfig[matched[1]] = value.trim();
    }
  });
}

const supabaseUrl = envConfig['VITE_SUPABASE_URL'];
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY'];
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxc21z2v5vbzF4n4lLRoS-SEkKI6b4QD2ddR9XeWN3QOCpm4HwCUh3MGxxy_05Z8ZCwhw/exec';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Помилка: VITE_SUPABASE_URL або VITE_SUPABASE_ANON_KEY не знайдено в .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function mapToSupabase(raw) {
  const project = {
    id: raw.id || undefined,
    status: raw.field1 || 'В процесі',
    paymentStatus: raw.field2 || '',
    projectNumber: (raw.field3 && raw.field3.trim()) ? raw.field3.trim() : null,
    fullName: raw.field4 || '',
    taxId: raw.field5 || '',
    propertyRegNumber: raw.field6 || '',
    titleDeedNumber: raw.field7 || '',
    unzr: raw.field8 || '',
    contractNumber: raw.field9 || '',
    contractDate: raw.field10 || '',
    testingTime: raw.field11 || '',
    eicCode: raw.field12 || '',
    permittedPower: raw.field13 || '',
    substation: raw.field14 || '',
    line: raw.field15 || '',
    utilityPole: raw.field16 || '',
    meterModel: raw.field17 || '',
    voltage: raw.field18 || '',
    inputBreaker: raw.field19 || '',
    voltageProtector: raw.field20 || '',
    installationLocation: raw.field21 || '',
    totalPanelPower: raw.field22 || '',
    panelCount: raw.field23 || '',
    panelInstallationLocation: raw.field24 || '',
    email: raw.field25 || '',
    phone: raw.field26 || '',
    inverterModel: raw.field27 || '',
    inverterPower: raw.field28 || '',
    inverterSerialNumber: raw.field29 || '',
    inverterManufacturer: raw.field30 || '',
    inverterFirmware: raw.field31 || '',
    inverterWarranty: raw.field32 || '',
    panelManufacturer: raw.field33 || '',
    panelModel: raw.field34 || '',
    panelWarranty: raw.field35 || '',
    batteryModel: raw.field36 || '',
    batteryPower: raw.field37 || '',
    workCost: raw.field38 || '',
    workCostInWords: raw.field39 || '',
    passportData: raw.field40 || '',
    advanceUsd: raw.field41 || '',
    balanceUsd: raw.field42 || '',
    stationType: raw.field43 || '',
    internalComment: raw.field44 || '',
    reserve: raw.field45 || '',
    folderUrl: raw.folderurl || '',
  };

  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!project.id || !uuidRegex.test(project.id)) {
    project.id = crypto.randomUUID();
  }

  if (raw.createdat) {
    try {
      project.createdAt = new Date(raw.createdat).toISOString();
    } catch (e) {
      console.warn(`Некоректна дата створення для проекту ${project.fullName}:`, raw.createdat);
    }
  }

  return project;
}

async function run() {
  console.log('🔄 Отримання даних з Google Sheets...');
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'getProjects' })
    });
    
    const result = await response.json();
    if (!result.success || !result.projects) {
      throw new Error(result.error || 'Не вдалося завантажити проекти з GAS');
    }

    const rawProjects = result.projects;
    console.log(`✅ Отримано ${rawProjects.length} проектів з Google Sheets.`);

    let mappedProjects = rawProjects.map(mapToSupabase);
    
    // Видаляємо дублікати спочатку за ID, потім за номером проекту
    const uniqueById = new Map();
    mappedProjects.forEach(p => {
      if (p.id) {
        uniqueById.set(p.id, p);
      } else {
        const tempKey = `empty_id_${Math.random()}`;
        uniqueById.set(tempKey, p);
      }
    });
    let deduped = Array.from(uniqueById.values());

    const uniqueByNum = new Map();
    deduped.forEach(p => {
      if (p.projectNumber) {
        // Уніфікуємо регістр і пробіли для точного порівняння
        const normalizedNum = p.projectNumber.trim().toLowerCase();
        uniqueByNum.set(normalizedNum, p);
      } else {
        const tempKey = `empty_num_${Math.random()}`;
        uniqueByNum.set(tempKey, p);
      }
    });
    mappedProjects = Array.from(uniqueByNum.values());
    console.log(`🧹 Після видалення дублікатів (за ID та номером): ${mappedProjects.length} проектів (з вихідних ${rawProjects.length}).`);
    
    console.log('🧹 Очищення таблиці green_tariff_projects перед імпортом...');
    const { error: deleteError } = await supabase
      .from('green_tariff_projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
      
    if (deleteError) {
      throw deleteError;
    }
    
    console.log('📤 Імпорт проектів у Supabase (таблиця green_tariff_projects)...');

    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < mappedProjects.length; i += batchSize) {
      const batch = mappedProjects.slice(i, i + batchSize);
      const { error } = await supabase
        .from('green_tariff_projects')
        .upsert(batch, { onConflict: 'projectNumber' }); // Avoid duplication if run multiple times

      if (error) {
        throw error;
      }
      console.log(`   Прогрес: ${Math.min(i + batchSize, mappedProjects.length)}/${mappedProjects.length} імпортовано.`);
    }

    console.log('🎉 Міграція завершена успішно!');
  } catch (err) {
    console.error('❌ Помилка під час міграції:', err);
    process.exit(1);
  }
}

run();
