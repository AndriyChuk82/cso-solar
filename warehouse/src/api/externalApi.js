import CONFIG from '../config';

/**
 * Модуль для завантаження товарів із зовнішніх таблиць Комерційних Пропозицій.
 */

// --- JSONP via script tag (дозволяє браузеру використати сесію Google для закритих таблиць) ---
function fetchViaJsonp(gid, categoryName, mainCat, spreadsheetId) {
  const sId = spreadsheetId || CONFIG.SPREADSHEET_ID;
  return new Promise((resolve, reject) => {
    const callbackName = '_gsheetCb_' + Math.random().toString(36).substr(2, 9);
    const sheetParam = (gid !== undefined && gid !== null) ? `gid=${gid}` : `sheet=${encodeURIComponent(categoryName)}`;
    const url = `https://docs.google.com/spreadsheets/d/${sId}/gviz/tq?tqx=out:json;responseHandler:${callbackName}&${sheetParam}`;

    const timeout = setTimeout(() => {
      delete window[callbackName];
      document.head.removeChild(script);
      resolve([]); // Замість reject повертаємо порожній масив, щоб не ламати інші
    }, 15000);

    window[callbackName] = function(response) {
      clearTimeout(timeout);
      delete window[callbackName];
      document.head.removeChild(script);
      try {
        const products = parseGvizJson(response, categoryName, mainCat);
        resolve(products);
      } catch (e) {
        console.error('Parse error JSONP', e);
        resolve([]);
      }
    };

    const script = document.createElement('script');
    script.src = url;
    script.onerror = () => {
      clearTimeout(timeout);
      delete window[callbackName];
      document.head.removeChild(script);
      resolve([]);
    };
    document.head.appendChild(script);
  });
}

function parseGvizJson(response, categoryName, mainCat) {
  if (!response || !response.table) return [];
  const table = response.table;
  const products = [];
  let fallbackCategory = categoryName;

  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    if (!row || !row.c) continue;

    const getVal = (idx) => {
      const cell = row.c[idx];
      if (!cell) return '';
      return (cell.f || cell.v || '').toString().trim();
    };

    const col0 = getVal(0); 
    const col1 = getVal(1); 
    const col2 = getVal(2); 
    const col3 = getVal(3); 
    
    // ДОВІДНИК_ТОВАРІВ (відповідає за Пробки, Розхідники тощо)
    if (categoryName === 'ДОВІДНИК_ТОВАРІВ') {
      const cat = col2;
      if (cat !== 'Кріплення' && cat !== 'Розхідники' && cat !== 'Кабель') continue;
      const modelName = col1;
      if (!modelName) continue;
      products.push({
        name: modelName,
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
    
    if (categoryName === 'АКБ') {
      model = col0;
    }
    
    if (model && model.toLowerCase() !== 'модель' && model.length > 2) {
      // Filter brands like in CP app for Inverters
      if (mainCat === 'Інвертори') {
         const low = model.toLowerCase();
         if (!low.includes('deye') && !low.includes('solis') && !low.includes('huawei') && !low.includes('solax')) continue;
      }

      products.push({
        name: model,
        article: '',
        unit: unit,
        category: `КП - ${fallbackCategory}`,
        isExternal: true
      });
    }
  }
  return products;
}

export async function fetchCPCatalog() {
  let allProducts = [];

  const promises = CONFIG.CP_SHEETS.map(sheet => {
    const spreadsheetId = CONFIG.CP_SPREADSHEETS[sheet.sId] || sheet.sId;
    return fetchViaJsonp(sheet.gid, sheet.name, sheet.mainCat, spreadsheetId);
  });

  const results = await Promise.all(promises);
  for (const prods of results) {
    if (prods && prods.length > 0) {
      allProducts = allProducts.concat(prods);
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
