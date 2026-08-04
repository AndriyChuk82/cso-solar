// ===================================================================
// GOOGLE APPS SCRIPT: NATIVE SPREADSHEETAPP VERSION (БЕЗ UrlFetchApp)
// 100% захист від заблокованого екрана Google!
// ===================================================================

const PRIMARY_SPREADSHEET_ID = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
const HELIUS_SPREADSHEET_ID  = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';
const PE_SPREADSHEET_ID      = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';

/**
 * Створює меню в Google Таблиці
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Оновлення цін')
    .addItem('🔄 Оновити ціни постачальників', 'updateSupplierPrices')
    .addToUi();
}

/**
 * Основна функція оновлення цін
 */
function updateSupplierPrices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(PRIMARY_SPREADSHEET_ID);
  const sheet = ss.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    if (typeof SpreadsheetApp.getUi === 'function') {
      SpreadsheetApp.getUi().alert('Таблиця порожня або містить лише заголовок!');
    }
    return { success: false, message: 'Таблиця порожня' };
  }

  // Назви обладнання
  const equipmentRange = sheet.getRange(2, 1, lastRow - 1, 1);
  const equipmentValues = equipmentRange.getValues();

  // Завантажуємо нативно без UrlFetchApp
  const heliusProducts = fetchHeliusNative();
  const peProducts = fetchPENative();

  const velikiyGurtValues = [];
  const dribniyGurtValues = [];
  
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

    // 1. Хеліус
    const hMatch = findBestMatch(pInfo, heliusProducts);
    if (hMatch) {
      velikiyGurtValues.push([hMatch.price]);
      colCNotes.push(['']);
      matchedHeliusCount++;
    } else {
      velikiyGurtValues.push(['—']);
      colCNotes.push([`❌ Не знайдено у прайсі Хеліус (назва: "${name}")`]);
    }

    // 2. ПЕ
    const peMatch = findBestMatch(pInfo, peProducts);
    if (peMatch) {
      dribniyGurtValues.push([peMatch.price]);
      colDNotes.push(['']);
      matchedPECount++;
    } else {
      dribniyGurtValues.push(['—']);
      colDNotes.push([`❌ Не знайдено у прайсі ПЕ (назва: "${name}")`]);
    }
  }

  // Запис у C та D
  const rangeC = sheet.getRange(2, 3, lastRow - 1, 1);
  const rangeD = sheet.getRange(2, 4, lastRow - 1, 1);

  rangeC.setValues(velikiyGurtValues);
  rangeC.setNotes(colCNotes);

  rangeD.setValues(dribniyGurtValues);
  rangeD.setNotes(colDNotes);

  const msg = `✅ Успішно оновлено!\nЗнайдено у Хеліус: ${matchedHeliusCount}\nЗнайдено у ПЕ: ${matchedPECount}`;
  if (typeof SpreadsheetApp.getUi === 'function') {
    try { SpreadsheetApp.getUi().alert(msg); } catch(e) {}
  }
  return { success: true, matchedHelius: matchedHeliusCount, matchedPE: matchedPECount };
}

// ===================================================================
// НАТИВНЕ ЗЧИТУВАННЯ ТАБЛИЦЬ (БЕЗ ЗОВНІШНІХ ЗАПИТІВ)
// ===================================================================

function fetchHeliusNative() {
  const products = [];
  try {
    const ss = SpreadsheetApp.openById(HELIUS_SPREADSHEET_ID);
    const sheet = ss.getSheets()[0];
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 5) continue;
      const model = String(row[0] || '').trim();
      const priceRaw = String(row[4] || row[9] || '').trim();
      const price = parsePriceValue(priceRaw);
      if (model && price) {
        const info = extractProductInfo(model);
        if (info) products.push({ model, price, info });
      }
    }
  } catch (e) {
    Logger.log("Помилка зчитування Хеліус: " + e.toString());
  }
  return products;
}

function fetchPENative() {
  const products = [];
  try {
    const ss = SpreadsheetApp.openById(PE_SPREADSHEET_ID);
    const targetSheets = ['Гібридні інвертори', 'Мережеві інвертори', 'АКБ'];

    targetSheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;
      const rows = sheet.getDataRange().getValues();

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;
        let model = '', priceRaw = '';
        if (sheetName === 'АКБ') {
          model = String(row[0] || '').trim();
          priceRaw = String(row[1] || '').trim();
        } else {
          model = String(row[1] || '').trim();
          priceRaw = String(row[3] || row[4] || '').trim();
        }
        const price = parsePriceValue(priceRaw);
        if (model && price) {
          const info = extractProductInfo(model);
          if (info) products.push({ model, price, info });
        }
      }
    });
  } catch (e) {
    Logger.log("Помилка зчитування ПЕ: " + e.toString());
  }
  return products;
}

// ===================================================================
// МАТЧИНГ ТА ПАРСИНГ
// ===================================================================

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
  let s = String(str).trim();
  if (s.toLowerCase().includes('гот') || s.includes('/')) {
    const match = s.match(/[\d\s,.]+/);
    if (match) s = match[0];
  }
  s = s.replace(/[$€₴]|грн/gi, '').trim();
  s = s.replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(s);
  return (isNaN(val) || val <= 0) ? null : val;
}
