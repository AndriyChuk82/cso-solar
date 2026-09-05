import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1NzcwNywiZXhwIjoyMDkxODMzNzA3fQ.n63gcYyDa-C02oOu3fhz0BBeDwIRZKX6qUS44PkqGJs';
const supabase = createClient(supabaseUrl, supabaseKey);

const SPREADSHEET_ID = process.env.PRICE_LIST_SPREADSHEET || '1Zt2uqioUsdvh55NV6gvobDzOSWMqJpCr35h0LaQwzlY';

// In-memory кеш на 60 секунд для максимальної швидкості
let cacheData = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 1000;

// Парсер CSV-рядків
function parseCsvRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Парсинг значення ціни
function parseRetailPrice(rawVal) {
  if (rawVal === undefined || rawVal === null || rawVal === '') return { amount: null, formatted: 'Уточнити в менеджера' };
  const str = String(rawVal).trim();
  if (!str || str === '-' || str === '0') return { amount: null, formatted: 'Уточнити в менеджера' };
  if (str.toLowerCase().includes('xx') || str.toLowerCase().includes('уточн')) return { amount: null, formatted: 'Уточнити в менеджера' };

  let cleanStr = str.replace(/[^\d,.-]/g, '');
  if (cleanStr.includes(',') && cleanStr.includes('.')) {
    if (cleanStr.indexOf(',') < cleanStr.indexOf('.')) {
      cleanStr = cleanStr.replace(/,/g, '');
    } else {
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    }
  } else if (cleanStr.includes(',')) {
    cleanStr = cleanStr.replace(',', '.');
  }

  const num = parseFloat(cleanStr);
  if (isNaN(num) || num <= 0) return { amount: null, formatted: 'Уточнити в менеджера' };

  // Форматування тільки у $ (наприклад: 720$, 1 060$, для кабелю 1,3$)
  let formattedNum;
  if (num % 1 === 0) {
    formattedNum = num.toLocaleString('uk-UA').replace(/\u00A0/g, ' ');
  } else {
    const minDigits = (num * 10) % 1 === 0 ? 1 : 2;
    formattedNum = num.toLocaleString('uk-UA', { minimumFractionDigits: minDigits, maximumFractionDigits: 2 }).replace(/\u00A0/g, ' ');
  }
  return { amount: num, formatted: `${formattedNum}$` };
}

// Нормалізація моделі для пошуку збігів
function normalizeModelCode(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/(\d+)\s*k(?=[-\s\d\w]|$)/g, '$1')
    .replace(/(\d+)\s*к(?=[-\s\d\w]|$)/g, '$1')
    .replace(/[^a-z0-9а-яіїєґ]/gu, '')
    .replace(/р/g, 'p').replace(/с/g, 'c').replace(/о/g, 'o').replace(/а/g, 'a')
    .replace(/х/g, 'x').replace(/у/g, 'y').replace(/е/g, 'e').replace(/і/g, 'i')
    .replace(/в/g, 'b');
}

// Виділення ключових маркерів для порівняння назв
function extractProductModelKeys(name = '') {
  const n = String(name).toLowerCase();
  const keys = [];

  if (n.includes('3u-lrack') || (n.includes('8') && (n.includes('стійк') || n.includes('rack')) && (n.includes('батарей') || n.includes('акб') || n.includes('deye')))) {
    keys.push('RACK_8');
  }
  if (n.includes('3u-hrack') || ((n.includes('12') || n.includes('13')) && (n.includes('стійк') || n.includes('rack')) && (n.includes('батарей') || n.includes('акб') || n.includes('deye')))) {
    keys.push('RACK_13');
  }

  if ((n.includes('bms') || n.includes('контролер') || n.includes('pdu')) && (n.includes('bos-g') || n.includes('bos g') || n.includes('pdu2') || n.includes('120-750'))) {
    keys.push('DEYE_BMS_PDU2');
  }

  if (n.includes('240kwh') || n.includes('240 kwh') || n.includes('240 квт') || (n.includes('bos-b') && (n.includes('240') || n.includes('15 шт') || n.includes('15шт') || n.includes('комплект') || (n.includes('a3') && n.includes('pro')))) && !n.includes('pack16') && !n.includes('accessory') && !n.includes('pdu-2-a')) {
    keys.push('DEYE_BOS_B_240');
  } else if ((n.includes('bos-g') || n.includes('bos g')) && !n.includes('стійк') && !n.includes('rack') && !n.includes('контролер') && !n.includes('bms') && !n.includes('pdu') && !n.includes('accessory') && !n.includes('кабел')) {
    keys.push('DEYE_BOS_G_5_1');
  } else if ((n.includes('5.1') || n.includes('5,1')) && (n.includes('pro-b') || n.includes('prob') || n.includes('proв') || n.includes('pro b') || n.includes('pro в') || n.includes('se-g5.1') || n.includes('se5.1')) && !n.includes('bos-b') && !n.includes('bos-g')) {
    keys.push('DEYE_SE_5_1_PRO_B');
  } else if (n.includes('se-f5') || n.includes('se f5')) {
    keys.push('DEYE_SE_F5');
  } else if (n.includes('se-f12') || n.includes('se f12')) {
    keys.push('DEYE_SE_F12');
  } else if (n.includes('se-f16') || n.includes('se f16')) {
    keys.push('DEYE_SE_F16');
  }

  if (n.includes('615m') || n.includes('lr8-66hgd') || n.includes('lr8 66hgd')) {
    keys.push('LONGI_615');
  }
  if (n.includes('645m') || n.includes('lr7-72hvd') || n.includes('lr7 72hvd')) {
    keys.push('LONGI_645');
  }
  if (n.includes('jam54d41') || (n.includes('jasolar') && n.includes('455'))) {
    keys.push('JASOLAR_455');
  }

  if (n.includes('sun2000-30ktl') || n.includes('30ktl-m3') || (n.includes('huawei') && n.includes('30ktl'))) {
    keys.push('HUAWEI_30KTL');
  }
  if (n.includes('s5-gc30k') || (n.includes('solis') && n.includes('gc30k'))) {
    keys.push('SOLIS_30K');
  }

  if ((n.includes('кабель') || n.includes('провід') || n.includes('cable')) && (n.includes('солярн') || n.includes('solar')) && (n.includes('6мм') || n.includes('6 мм') || n.includes('6mm') || n.includes('6 mm'))) {
    keys.push('SOLAR_CABLE_6');
  }

  const deyeMatch = n.match(/sun[-\s]*(\d+)\s*k?[-\s]*([a-z0-9]+)/i);
  if (deyeMatch) {
    const power = deyeMatch[1];
    let series = deyeMatch[2].toLowerCase().replace(/[-_]?(eu|sm2|am3)/g, '');
    keys.push(`DEYE_SUN_${power}_${series}`);
  }

  return keys;
}

function isProductMatching(prodName, sheetName) {
  if (!prodName || !sheetName) return false;
  const normDb = normalizeModelCode(prodName);
  const normSheet = normalizeModelCode(sheetName);
  if (normDb.length >= 4 && normSheet.length >= 4 && normDb === normSheet) return true;

  const dbKeys = extractProductModelKeys(prodName);
  const sheetKeys = extractProductModelKeys(sheetName);
  if (dbKeys.length > 0 && sheetKeys.length > 0) {
    for (const k of dbKeys) {
      if (sheetKeys.includes(k)) return true;
    }
  }
  return false;
}

// Визначення типу/категорії товару
function inferProductType(name = '', category = '') {
  const n = String(name).toLowerCase();
  
  // 0. Кріплення та монтажні елементи (перевіряємо першими щоб не сплутати з "міжпанельними" прижимами)
  if (n.includes('кріплен') || n.includes('профіль') || n.includes('затискач') || n.includes('прижим') || n.includes('болт') || n.includes('гайка')) {
    return 'Кріплення та конструкції';
  }

  // 1. Сонячні фотомодулі
  if (n.includes('панел') || n.includes('модул') || n.includes('longi') || n.includes('jasolar') || n.includes('jinko') || /lr\d-/i.test(n) || /jam\d/i.test(n) || n.includes('bificial') || n.includes('bifacial')) {
    return 'Сонячний фотомодуль';
  }

  // 2. BMS та Контролери
  if (n.includes('bms') || n.includes('pdu') || n.includes('контролер')) {
    return 'Контролер BMS';
  }

  // 3. Стійки під АКБ
  if (n.includes('стійк') || n.includes('rack') || n.includes('шаф')) {
    return 'Стійка під АКБ';
  }

  // 4. Акумулятори
  if (n.includes('bos-g') || n.includes('bos-b') || n.includes('se-f') || n.includes('se5.1') || n.includes('акб') || n.includes('акумулятор') || n.includes('battery')) {
    return 'Акумуляторний блок';
  }

  // 5. Кабель та комутація
  if (n.includes('кабель') || n.includes('провід') || n.includes('cable') || n.includes('mc4')) {
    return 'Кабель та комутація';
  }


  // 7. Інвертори
  if (n.includes('інвертор') || n.includes('inverter') || n.includes('sun-') || n.includes('solis') || n.includes('huawei') || n.includes('deye')) {
    if (n.includes('lp1') || n.includes('1 фаз') || n.includes('1-фаз') || n.includes('1ф') || n.includes('1 f')) {
      return 'Інвертор гібрид 1 фаза LV';
    }
    if (n.includes('lp3') || n.includes('sg05lp3') || n.includes('sg04lp3') || (n.includes('3 фаз') && n.includes('lv'))) {
      return 'Інвертор гібрид 3 фази LV';
    }
    if (n.includes('hp3') || n.includes('sg01hp3') || n.includes('sg02hp3') || (n.includes('3 фаз') && n.includes('hv')) || n.includes('високовольт')) {
      return 'Інвертор гібрид 3 фази HV';
    }
    if (n.includes('мережев') || n.includes('grid') || n.includes('ktl') || n.includes('gc30k') || n.includes('g04') || n.includes('gr3p')) {
      return 'Інвертор мережевий';
    }
    return 'Інвертор гібрид';
  }

  if (category && category !== 'Інше обладнання') {
    return category;
  }
  return 'Обладнання';
}

function inferCategoryGroup(type = '', name = '') {
  const tp = String(type || '').toLowerCase();
  const n = String(name || '').toLowerCase();

  // 1. Кріплення та конструкції (перевіряємо першими, щоб "міжпанельні" прижими не потрапляли в панелі через корінь "панел")
  if (tp.includes('кріплен') || tp.includes('конструкці') || n.includes('кріплен') || n.includes('прижим') || n.includes('профіль') || n.includes('затискач') || n.includes('болт') || n.includes('гайка') || n.includes('монтаж')) {
    return 'Кріплення';
  }

  // 2. Інвертори
  if (tp.includes('інвертор') || n.includes('інвертор') || n.includes('inverter') || n.includes('sun-') || n.includes('solis') || n.includes('huawei')) {
    return 'Інвертори';
  }

  // 3. Акумулятори та BMS
  if (tp.includes('акумулятор') || tp.includes('bms') || tp.includes('стійк') || n.includes('акумулятор') || n.includes('акб') || n.includes('battery') || n.includes('bms') || n.includes('стійк') || n.includes('rack') || n.includes('bos-g') || n.includes('bos-b') || n.includes('se-f')) {
    return 'Акумулятори та BMS';
  }

  // 4. Кабель та комутація
  if (tp.includes('кабель') || tp.includes('комутац') || n.includes('кабель') || n.includes('cable') || n.includes('провід') || n.includes('mc4')) {
    return 'Кабель';
  }

  // 5. Сонячні панелі (фотомодулі)
  if (tp.includes('фотомодуль') || tp.includes('панел') || n.includes('фотомодуль') || n.includes('сонячн') || n.includes('longi') || n.includes('jasolar') || n.includes('jinko') || n.includes('trina') || n.includes('tongwei') || /lr\d-/i.test(n) || /jam\d/i.test(n) || n.includes('bificial') || n.includes('bifacial') || (n.includes('панел') && !n.includes('міжпанел'))) {
    return 'Сонячні панелі';
  }

  return 'Інше';
}

export default async function handler(req, res) {
  // CORS & Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const now = Date.now();
  if (cacheData && (now - cacheTime < CACHE_TTL_MS)) {
    return res.status(200).json(cacheData);
  }

  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0&_t=${now}`;

    // Завантажуємо паралельно дані з Google Sheet та Каталог товарів
    const [csvRes, prodRes] = await Promise.allSettled([
      fetch(csvUrl).then(r => r.text()),
      supabase.from('products').select('id, name, article, unit, category_id, active').order('name')
    ]);

    // Завантажуємо всі операції з пагінацією (для точного розрахунку залишків)
    let allOps = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: opsData, error: opsError } = await supabase
        .from('operations')
        .select('product_id, type, quantity')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (opsError) {
        console.warn('Ops fetch error:', opsError);
        break;
      }
      if (opsData && opsData.length > 0) {
        allOps = allOps.concat(opsData);
        if (opsData.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    // 1. Google Sheets items
    const sheetItems = [];
    if (csvRes.status === 'fulfilled' && csvRes.value) {
      try {
        const rows = parseCsvRows(csvRes.value);
        if (rows.length > 1) {
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const name = (row[0] || '').trim();
            if (!name) continue;

            const retailRaw = row[2];
            const col4 = row[3] !== undefined ? String(row[3]).trim().toLowerCase() : '';
            const retailStr = String(retailRaw || '').trim().toLowerCase();

            // Перевірка на приховування:
            // 1. У стовпці D (4-й стовпець): "приховати", "hide", "ні", "no", "0", "false" або знята галочка
            // 2. У стовпці C (роздрібна ціна): слово "приховати", "hide", "сховати" або "-"
            // 3. Знак "#" або "!" на початку назви товару в таблиці (напр. "#SUN-6K")
            let isHidden = false;
            if (
              col4 === 'приховати' ||
              col4 === 'сховати' ||
              col4 === 'hide' ||
              col4 === 'ні' ||
              col4 === 'no' ||
              col4 === '0' ||
              col4 === 'false' ||
              col4 === '-' ||
              col4 === 'х' ||
              col4 === 'x'
            ) {
              isHidden = true;
            }

            if (
              retailStr === 'приховати' ||
              retailStr === 'сховати' ||
              retailStr === 'hide' ||
              retailStr === '-' ||
              retailStr === 'no'
            ) {
              isHidden = true;
            }

            if (name.startsWith('#') || name.startsWith('!')) {
              isHidden = true;
            }

            const cleanName = name.replace(/^[#!]\s*/, '');
            const retail = parseRetailPrice(retailRaw);
            sheetItems.push({ name, cleanName, retail, isHidden });
          }
        }
      } catch (e) {
        console.warn('CSV parse warning:', e);
      }
    }

    // 2. Розрахунок залишків з операцій
    const stockMap = {}; // productId -> number
    allOps.forEach(op => {
      const pid = op.product_id;
      if (!pid) return;
      const qty = parseFloat(op.quantity) || 0;
      if (!stockMap[pid]) stockMap[pid] = 0;
      if (op.type === 'income' || op.type === 'balance') {
        stockMap[pid] += qty;
      } else if (op.type === 'expense') {
        stockMap[pid] -= qty;
      }
    });

    // 3. Каталог активних товарів
    const catalogProducts = (prodRes.status === 'fulfilled' && prodRes.value?.data
      ? prodRes.value.data
      : []).filter(p => p.active !== false);

    const publicItems = [];

    catalogProducts.forEach(prod => {
      const prodName = prod.name.trim();

      // Шукаємо роздрібну ціну в Google Sheet
      let matchedSheetItem = null;
      for (const sh of sheetItems) {
        if (isProductMatching(prodName, sh.name) || (sh.cleanName && isProductMatching(prodName, sh.cleanName))) {
          matchedSheetItem = sh;
          break;
        }
      }

      // Якщо товар у Google Таблиці позначено як прихований — не показуємо його на публічній сторінці!
      if (matchedSheetItem && matchedSheetItem.isHidden) {
        return;
      }

      let retail = { amount: null, formatted: 'Уточнити в менеджера' };
      if (matchedSheetItem && matchedSheetItem.retail?.formatted) {
        retail = matchedSheetItem.retail;
      }

      // Перевизначення ціни з каталогу якщо є
      if (prod.price_retail) {
        const catRetail = parseRetailPrice(prod.price_retail);
        if (catRetail.amount !== null) {
          retail = catRetail;
        }
      }

      const totalStock = stockMap[prod.id] || 0;

      // Логіка статусів за ТЗ:
      // > 5 => "В наявності"
      // 1..5 => "Наявність уточняйте"
      // <= 0 => "Закінчилось"
      let stockStatus = 'out_of_stock';
      let stockLabel = 'Закінчилось';
      let inStock = false;

      if (totalStock > 5) {
        stockStatus = 'in_stock';
        stockLabel = 'В наявності';
        inStock = true;
      } else if (totalStock > 0 && totalStock <= 5) {
        stockStatus = 'low_stock';
        stockLabel = 'Наявність уточняйте';
        inStock = true;
      } else {
        stockStatus = 'out_of_stock';
        stockLabel = 'Закінчилось';
        inStock = false;
      }

      const rawCategory = prod.category_id || '';
      const type = inferProductType(prodName, rawCategory);
      const categoryGroup = inferCategoryGroup(type, prodName);

      publicItems.push({
        id: prod.id,
        name: prodName,
        type: type,
        category: categoryGroup,
        price: retail.formatted || 'Уточнити в менеджера',
        priceAmount: retail.amount,
        stockStatus,
        stockLabel,
        inStock,
        unit: prod.unit || 'шт'
      });
    });

    // Сортуємо: категорія, потім назва з натуральним числовим порядком (SUN-6 -> SUN-8 -> SUN-10 -> ...)
    publicItems.sort((a, b) => {
      const catComp = (a.category || '').localeCompare(b.category || '', 'uk');
      if (catComp !== 0) return catComp;
      return (a.name || '').localeCompare(b.name || '', 'uk', { numeric: true, sensitivity: 'base' });
    });

    // Унікальні групи категорій для фільтрів
    const categoriesSet = new Set(publicItems.map(i => i.category).filter(Boolean));
    const categories = ['Всі', ...Array.from(categoriesSet)];

    const nowKyiv = new Date().toLocaleTimeString('uk-UA', {
      timeZone: 'Europe/Kyiv',
      hour: '2-digit',
      minute: '2-digit'
    });

    const responsePayload = {
      success: true,
      items: publicItems,
      categories,
      totalCount: publicItems.length,
      inStockCount: publicItems.filter(i => i.inStock).length,
      updatedAt: nowKyiv
    };

    // Оновлюємо кеш
    cacheData = responsePayload;
    cacheTime = now;

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Public prices API error:', err);
    return res.status(500).json({
      success: false,
      error: 'Не вдалося завантажити прайс-лист'
    });
  }
}
