import CONFIG from '../config';

/**
 * Модуль для завантаження товарів із зовнішніх таблиць Комерційних Пропозицій.
 */

async function fetchSheetCSV(sId, gid, sheetName) {
  const spreadsheetId = CONFIG.CP_SPREADSHEETS[sId] || sId;
  const sheetParam = (gid !== undefined && gid !== null) ? `gid=${gid}` : `sheet=${encodeURIComponent(sheetName)}`;
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&${sheetParam}`;
  
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.text();
  } catch (e) {
    console.error(`Error fetching sheet ${sheetName}:`, e);
    return null;
  }
}

function parseCSV(csv) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    const next = csv[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { current.push(field); field = ''; }
      else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        current.push(field); field = '';
        rows.push(current); current = [];
        if (ch === '\r') i++;
      } else if (ch === '\r') {
        current.push(field); field = '';
        rows.push(current); current = [];
      } else { field += ch; }
    }
  }
  if (field || current.length) { current.push(field); rows.push(current); }
  return rows;
}

export async function fetchCPCatalog() {
  let allProducts = [];

  for (const sheet of CONFIG.CP_SHEETS) {
    const csv = await fetchSheetCSV(sheet.sId, sheet.gid, sheet.name);
    if (!csv) continue;

    const rows = parseCSV(csv);
    if (rows.length < 2) continue;

    let fallbackCategory = sheet.name;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const col0 = (row[0] || '').trim();
      const col1 = (row[1] || '').trim();
      const col2 = (row[2] || '').trim();
      const col3 = (row[3] || '').trim();

      // ДОВІДНИК_ТОВАРІВ
      if (sheet.name === 'ДОВІДНИК_ТОВАРІВ') {
        const cat = col2;
        if (cat !== 'Кріплення' && cat !== 'Розхідники' && cat !== 'Кабель') continue;
        if (!col1) continue;
        allProducts.push({
          name: col1,
          article: '',
          unit: col3 || 'шт',
          category: `КП - ${cat}`,
          isExternal: true
        });
        continue;
      }

      // Default logic for other sheets
      const isCatRow = (col0 && !col1 && col0.length < 50);
      if (isCatRow) {
        fallbackCategory = col0;
        continue;
      }

      let model = col1;
      let unit = 'шт';
      
      if (sheet.name === 'АКБ') {
        model = col0;
      }
      
      if (model && model.toLowerCase() !== 'модель' && model.length > 2) {
        // Filter brands like in CP app for Inverters
        if (sheet.mainCat === 'Інвертори') {
           const low = model.toLowerCase();
           if (!low.includes('deye') && !low.includes('solis') && !low.includes('huawei') && !low.includes('solax')) continue;
        }

        allProducts.push({
          name: model,
          article: '',
          unit: unit,
          category: `КП - ${fallbackCategory}`,
          isExternal: true
        });
      }
    }
  }

  // Remove duplicates
  const unique = [];
  const names = new Set();
  allProducts.forEach(p => {
    if (!names.has(p.name)) {
      names.add(p.name);
      unique.push(p);
    }
  });

  return unique;
}
