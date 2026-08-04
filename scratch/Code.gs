// ===================================================================
// GOOGLE APPS SCRIPT (STANDALONE / WEB APP)
// CSO Solar: Об'єднання цін з Хеліус та ПЕ
// ===================================================================

const PRIMARY_SPREADSHEET_ID = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';

/**
 * Веб-ендпоінт для запуску оновлення через браузерське посилання
 */
function doGet(e) {
  try {
    const result = updateSupplierPrices();
    return ContentService.createTextOutput("✅ ЦІНИ УСПІШНО ОНОВЛЕНО!\n\nДеталі:\n" + JSON.stringify(result, null, 2))
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("❌ ПОМИЛКА: " + err.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Основна функція оновлення цін у стовпцях "Великий гурт" (C) та "Дрібний гурт" (D)
 */
function updateSupplierPrices() {
  const ss = SpreadsheetApp.openById(PRIMARY_SPREADSHEET_ID);
  const sheet = ss.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    return { success: false, message: 'Таблиця порожня або містить лише заголовок' };
  }

  // Отримуємо назви обладнання зі стовпця A (починаючи з рядка 2)
  const equipmentRange = sheet.getRange(2, 1, lastRow - 1, 1);
  const equipmentValues = equipmentRange.getValues();

  // Завантажуємо каталоги постачальників
  const heliusProducts = fetchHeliusCatalog();
  const peProducts = fetchPECatalog();

  const velikiyGurtValues = []; // Стовпець C (Великий гурт - Хеліус)
  const dribniyGurtValues = [];  // Стовпець D (Дрібний гурт - ПЕ)
  
  const colCNotes = [];
  const colDNotes = [];

  let matchedHeliusCount = 0;
  let matchedPECount = 0;

  for (let i = 0; i < equipmentValues.length; i++) {
    const name = String(equipmentValues[i][0] || '').trim();
    
    if (!name) {
      velikiyGurtValues.push(['']);
      dribniyGurtValues.push(['']);
      colCNotes.push(['']);
      colDNotes.push(['']);
      continue;
    }

    const pInfo = extractProductInfo(name);

    // 1. Пошук у Хеліус
    const hMatch = findBestMatch(pInfo, heliusProducts);
    if (hMatch) {
      velikiyGurtValues.push([hMatch.price]);
      colCNotes.push(['']); // очищаємо примітку
      matchedHeliusCount++;
    } else {
      velikiyGurtValues.push(['—']);
      colCNotes.push([`❌ Не знайдено у прайсі Хеліус (пошукова назва: "${name}")`]);
    }

    // 2. Пошук у ПЕ (Правильне електроживлення)
    const peMatch = findBestMatch(pInfo, peProducts);
    if (peMatch) {
      dribniyGurtValues.push([peMatch.price]);
      colDNotes.push(['']); // очищаємо примітку
      matchedPECount++;
    } else {
      dribniyGurtValues.push(['—']);
      colDNotes.push([`❌ Не знайдено у прайсі ПЕ (пошукова назва: "${name}")`]);
    }
  }

  // Записуємо результати в стовпець C (Великий гурт) та D (Дрібний гурт)
  const rangeC = sheet.getRange(2, 3, lastRow - 1, 1);
  const rangeD = sheet.getRange(2, 4, lastRow - 1, 1);

  rangeC.setValues(velikiyGurtValues);
  rangeC.setNotes(colCNotes);

  rangeD.setValues(dribniyGurtValues);
  rangeD.setNotes(colDNotes);

  return {
    success: true,
    totalItems: equipmentValues.length,
    matchedHelius: matchedHeliusCount,
    matchedPE: matchedPECount,
    updatedAt: new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kiev" })
  };
}

// ===================================================================
// ДОПОМІЖНІ ФУНКЦІЇ ПАРСИНГУ ТА ЗЧИТУВАННЯПРАЙСІВ
// ===================================================================

function fetchHeliusCatalog() {
  const url = 'https://docs.google.com/spreadsheets/d/1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy/gviz/tq?tqx=out:csv&gid=314286327';
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const csvText = response.getContentText();
  const rows = parseCSVText(csvText);
  
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) continue;
    const model = (row[0] || '').trim();
    const priceRaw = (row[4] || row[9] || '').trim();
    const price = parsePriceValue(priceRaw);
    if (model && price) {
      const info = extractProductInfo(model);
      if (info) products.push({ model, price, info });
    }
  }
  return products;
}

function fetchPECatalog() {
  const gids = [
    { name: 'Гібридні інвертори', gid: '2087142679' },
    { name: 'Мережеві інвертори', gid: '1047165471' },
    { name: 'АКБ', gid: '1248903265' }
  ];
  
  const products = [];
  for (let g = 0; g < gids.length; g++) {
    const url = 'https://docs.google.com/spreadsheets/d/1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g/gviz/tq?tqx=out:csv&gid=' + gids[g].gid;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const csvText = response.getContentText();
    const rows = parseCSVText(csvText);
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      let model = '', priceRaw = '';
      if (gids[g].name === 'АКБ') {
        model = (row[0] || '').trim();
        priceRaw = (row[1] || '').trim();
      } else {
        model = (row[1] || '').trim();
        priceRaw = (row[3] || row[4] || '').trim();
      }
      const price = parsePriceValue(priceRaw);
      if (model && price) {
        const info = extractProductInfo(model);
        if (info) products.push({ model, price, info });
      }
    }
  }
  return products;
}

function extractProductInfo(name) {
  if (!name) return null;
  const s = name.trim();
  const low = s.toLowerCase();

  if (low.includes('кабель')) return { type: 'cable', key: 'кабель6мм' };
  if (low.includes('стійка') || low.includes('rack')) {
    if (low.includes('8') || low.includes('lrack')) return { type: 'rack', key: 'rack8' };
    if (low.includes('13') || low.includes('hrack')) return { type: 'rack', key: 'rack13' };
    return { type: 'rack', key: cleanStr(s) };
  }
  if (low.includes('pdu2') || low.includes('bms')) return { type: 'bms', key: 'bmspdu2' };

  let m = low.match(/se[-_\s]*f5[-_\s]*pro[-_\s]*c/);
  if (m) return { type: 'battery', key: 'sef5proc' };

  m = low.match(/se[-_\s]*5\.?1[-_\s]*pro[-_\s]*b/);
  if (m) return { type: 'battery', key: 'seg51prob' };

  m = low.match(/se[-_\s]*f12/);
  if (m) return { type: 'battery', key: 'sef12' };

  m = low.match(/se[-_\s]*f16/);
  if (m) return { type: 'battery', key: 'sef16' };

  m = low.match(/bos[-_\s]*g[-_\s]*5\.?1/);
  if (m) return { type: 'battery', key: 'bosg51' };

  m = low.match(/bos[-_\s]*b[-_\s]*a3/);
  if (m) return { type: 'battery', key: 'bosba3' };

  m = low.match(/sun[-_\s]*(\d+k?)[-_\s]*(sg\d+)[-_\s]*([lh]p\d+)?/);
  if (m) {
    const kw = m[1].replace('k', '');
    const sg = m[2];
    const p = m[3] || '';
    return { type: 'inverter', key: ('sun_' + kw + 'k_' + sg + '_' + p).replace(/_+$/, '') };
  }

  m = low.match(/solis[-_\s]*s5[-_\s]*gc30k/);
  if (m) return { type: 'inverter', key: 'solis_s5_gc30k' };

  m = low.match(/sun\s*2000[-_\s]*30ktl[-_\s]*m3/);
  if (m) return { type: 'inverter', key: 'huawei_sun2000_30ktl_m3' };

  if (low.includes('longi') || low.includes('jasolar') || low.includes('solar')) {
    return { type: 'panel', key: cleanStr(s) };
  }

  return { type: 'other', key: cleanStr(s) };
}

function findBestMatch(targetInfo, catalog) {
  if (!targetInfo) return null;
  return catalog.find(item => {
    if (item.info.type !== targetInfo.type) return false;
    if (item.info.key === targetInfo.key) return true;
    if (targetInfo.key.length > 5 && (item.info.key.includes(targetInfo.key) || targetInfo.key.includes(item.info.key))) return true;
    return false;
  }) || null;
}

function cleanStr(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
}

function parsePriceValue(str) {
  if (!str) return null;
  let s = str.trim();
  if (s.toLowerCase().includes('гот') || s.includes('/')) {
    const match = s.match(/[\d\s,.]+/);
    if (match) s = match[0];
  }
  s = s.replace(/[$€₴]|грн/gi, '').trim();
  s = s.replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(s);
  return (isNaN(val) || val <= 0) ? null : val;
}

function parseCSVText(text) {
  const lines = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(cell);
        cell = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') {
          i++;
        }
        row.push(cell);
        lines.push(row);
        row = [];
        cell = '';
      } else {
        cell += c;
      }
    }
  }
  if (row.length > 0 || cell) {
    row.push(cell);
    lines.push(row);
  }
  return lines;
}
