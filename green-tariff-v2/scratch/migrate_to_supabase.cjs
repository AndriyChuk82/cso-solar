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

const FIELD_MAPPING = {
  id: ['id', 'ID'],
  status: ['Стан проєкту', 'Статус', 'Стан', 'field1'],
  paymentStatus: ['Розрахунок', 'Оплата', 'field2'],
  projectNumber: ['№ проекту', 'field3'],
  fullName: ['ПІБ фізичної особи', 'ПІБ', 'Прізвище', 'field4'],
  taxId: ['ІПН', 'ІПН/ЄДРПОУ', 'РНОКПП', 'field5'],
  propertyRegNumber: [
    'реєстраційний номер об’єкта нерухомого майна',
    'Реєстраційний номер об\'єкта',
    'реєстраційний номер об’єкта',
    'реєстраційний номер об\'єкта',
    'Реєстр. номер',
    'Реєстраційний номер об’єкта майна',
    'field6'
  ],
  titleDeedNumber: [
    'Номер запису про право власності',
    'Номер запису на право власності',
    'Запис про право власності',
    'Номер запису про право',
    'field7'
  ],
  unzr: [
    'Унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності)', 
    'Унікальний номер запису в Єдиному державному демографічному реєстрі',
    'Унікальний номер', 
    'УНЗР',
    'field8'
  ],
  contractNumber: ['№ Договору', 'Номер договору', '№ договору', 'Договір №', 'field9'],
  contractDate: ['Дата договору', 'field10'],
  testingTime: ['Час тестування', 'field11'],
  eicCode: ['EIC-код точки розподілу', 'EIC-код', 'field12'],
  permittedPower: ['Дозволена потужність', 'Дозволена потужність, кВт', 'field13'],
  substation: ['Підстанція', 'field14'],
  line: ['Лінія', 'field15'],
  utilityPole: ['Опора', 'field16'],
  meterModel: ['Лічильник', 'field17'],
  voltage: ['Напруга', 'field18'],
  inputBreaker: ['Вхідний автомат', 'Автомат', 'field19'],
  voltageProtector: ['Відсікач', 'field20'],
  installationLocation: ['Місце розташування генеруючої установки', 'Адреса об\'єкта', 'Місце', 'field21'],
  totalPanelPower: ['Потужність генеруючих установок споживача, кВт', 'Сумарна потужність, кВт', 'Сумарна потужність', 'field22'],
  panelCount: ['К-сть панелей', 'Кількість панелей', 'field23'],
  panelInstallationLocation: ['Місце встановлення панелей', 'Встановлення панелей', 'field24'],
  email: ['електронною поштою', 'Email', 'Електронна пошта', 'field25'],
  phone: ['конт телефон', 'Телефон', 'Контактний телефон', 'field26'],
  inverterModel: ['Інвертор', 'Модель інвертора', 'field27'],
  inverterPower: ['Потужність інвертора, кВт', 'Потужність інвертора', 'field28'],
  inverterSerialNumber: ['с/н інвертора', 'Серійний номер інвертора', 'field29'],
  inverterManufacturer: ['Виробник Інвертора', 'field30'],
  inverterFirmware: ['Прошивка інвертора', 'Прошивка', 'field31'],
  inverterWarranty: ['Гарантія на інвертор, р.', 'Гарантія на інвертор', 'field32'],
  panelManufacturer: ['Виробник сонячних панелей', 'field33'],
  panelModel: ['Сонячна панель', 'Модель панелі', 'Панель (Модель)', 'Панель', 'field34'],
  panelWarranty: ['Гарантія на панелі, років', 'Гарантія на панелі', 'field35'],
  batteryModel: ['Акумуляторна батарея', 'Модель АКБ', 'АКБ', 'Батарея', 'field36'],
  batteryPower: ['Номінальна потужність, кВт*год', 'Номінальна потужність АКБ', 'Номінальна потужність батарей', 'field37'],
  workCost: ['Вартість робіт', 'field38'],
  workCostInWords: ['Сума прописом', 'field39'],
  passportData: ['Паспортні дані', 'Паспорт', 'field40'],
  advanceUsd: ['Аванс, USD', 'field41'],
  balanceUsd: ['Залишок, USD', 'field42'],
  stationType: ['Тип станції', 'Модель станції', 'field43'],
  internalComment: ['Коментар', 'Внутрішній коментар', 'Нотатки', 'Field 44', 'field44'],
  reserve: ['Резерв', 'Field 45', 'field45'],
  folderUrl: ['folderurl', 'Folder URL'],
  createdAt: ['createdat', 'Created At'],
};

function getProp(obj, keys) {
  if (!obj) return '';

  const normalize = (s) =>
    (s || '')
      .toString()
      .toLowerCase()
      .replace(/[\n\r"]/g, '')
      .replace(/[’'‘`]/g, "'") // Unify all apostrophe variants
      .replace(/\s+/g, '')
      .trim();

  const objKeys = Object.keys(obj);

  // 1. Direct match or normalized exact match
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== '') return String(obj[k]);
    const normalizedK = normalize(k);
    const exactKey = objKeys.find((ak) => normalize(ak) === normalizedK);
    if (exactKey && obj[exactKey] !== undefined && obj[exactKey] !== '') return String(obj[exactKey]);
  }

  // 2. Soft matching (substring checks) for long headers
  for (const k of keys) {
    const normalizedK = normalize(k);
    if (normalizedK.length < 8) continue; // Skip short keys to prevent false positives

    const foundKey = objKeys.find((ak) => {
      if (!ak) return false;
      const normActual = normalize(ak);
      return normActual.includes(normalizedK);
    });
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== '') return String(obj[foundKey]);
  }

  return '';
}

function mapToSupabase(raw) {
  const project = {};
  
  for (const key in FIELD_MAPPING) {
    let val = raw[key];
    if (val === undefined || val === '') {
      val = getProp(raw, FIELD_MAPPING[key]);
    }
    
    project[key] = String(val || '');
  }

  // ID handling
  project.id = raw.id || getProp(raw, ['id', 'ID']);
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!project.id || !uuidRegex.test(project.id)) {
    project.id = crypto.randomUUID();
  }

  // projectNumber unique constraint fallback
  if (project.projectNumber) {
    project.projectNumber = project.projectNumber.trim();
    if (project.projectNumber === '') {
      project.projectNumber = null;
    }
  } else {
    project.projectNumber = null;
  }

  // createdAt formatting
  const rawDate = raw.createdat || getProp(raw, ['createdat', 'Created At']);
  if (rawDate) {
    try {
      project.createdAt = new Date(rawDate).toISOString();
    } catch (e) {
      console.warn(`Некоректна дата створення для проекту ${project.fullName}:`, rawDate);
      delete project.createdAt;
    }
  } else {
    delete project.createdAt;
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
        .upsert(batch, { onConflict: 'projectNumber' });

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
