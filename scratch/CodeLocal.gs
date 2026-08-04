// ===================================================================
// GOOGLE APPS SCRIPT: 100% LOCAL SCOPE VERSION
// Світлодіодний обхід блокування Google Workspace (spreadsheets.currentonly)
// ===================================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Оновлення цін')
    .addItem('🔄 Оновити ціни постачальників', 'updateSupplierPrices')
    .addToUi();
}

function updateSupplierPrices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('Таблиця порожня або містить лише заголовок!');
    return;
  }

  // 1. Зчитуємо дані з вкладок-помічників
  const heliusProducts = fetchHeliusLocal(ss);
  const peProducts = fetchPELocal(ss);

  const equipmentValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

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

    // Хеліус
    const hMatch = findBestMatch(pInfo, heliusProducts);
    if (hMatch) {
      velikiyGurtValues.push([hMatch.price]);
      colCNotes.push(['']);
      matchedHeliusCount++;
    } else {
      velikiyGurtValues.push(['—']);
      colCNotes.push([`❌ Не знайдено у прайсі Хеліус (назва: "${name}")`]);
    }

    // ПЕ
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

  sheet.getRange(2, 3, lastRow - 1, 1).setValues(velikiyGurtValues).setNotes(colCNotes);
  sheet.getRange(2, 4, lastRow - 1, 1).setValues(dribniyGurtValues).setNotes(colDNotes);

  SpreadsheetApp.getUi().alert(`✅ Ціни оновлено!\n\nХеліус: ${matchedHeliusCount}\nПЕ: ${matchedPECount}`);
}

function fetchHeliusLocal(ss) {
  const products = [];
  const sheet = ss.getSheetByName('Прайс_Хеліус');
  if (!sheet) return products;
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
  return products;
}

function fetchPELocal(ss) {
  const products = [];
  const targetSheets = ['Прайс_ПЕ_Гібридні', 'Прайс_ПЕ_Мережеві', 'Прайс_ПЕ_АКБ'];

  targetSheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      let model = '', priceRaw = '';
      if (sheetName === 'Прайс_ПЕ_АКБ') {
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
