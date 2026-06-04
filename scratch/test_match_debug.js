
function extractModelCode(name) {
  const lowerName = name.toLowerCase();
  
  // Deye SE-G5.1 Pro-B / Pro family
  if (
    lowerName.includes('g5.1') || 
    /g5\.1\s*pro/i.test(lowerName) || 
    /g5\.1\s*pro\s*[bв]/i.test(lowerName)
  ) {
    return 'SE-G5.1-PRO-B';
  }

  // Deye SE-F5 PRO-C / PRO-L family
  if (lowerName.includes('f5') || /f\s*5/i.test(lowerName)) {
    if (lowerName.includes('pro-c') || lowerName.includes('proc') || lowerName.includes('pro-с') || lowerName.includes('proс') || /f\s*5\s*-\s*pro\s*-\s*[cс]/i.test(lowerName) || /pro\s*-\s*[cс]/i.test(lowerName)) {
      return 'SE-F5-PRO-C';
    }
    if (lowerName.includes('pro-l') || lowerName.includes('prol') || /f\s*5\s*-\s*pro\s*-\s*l/i.test(lowerName) || /pro\s*-\s*l/i.test(lowerName)) {
      return 'SE-F5-PRO-L';
    }
  }

  if (lowerName.includes('g5.3') || lowerName.includes('se-g5.3')) {
    return 'SE-G5.3';
  }
  return null;
}

const CONFIG = {
  BIZ_SOLAR_SPREADSHEET_ID: '1Xajw9ZJj-fCdlxbbsj1OqZPvFeyolMKD',
  BIZ_SOLAR_GID: 461092007,
  HELIUS_SPREADSHEET_ID: '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy',
  HELIUS_GID: 314286327
};

function parseCSV(text) {
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

async function fetchBizSolarProducts() {
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.BIZ_SOLAR_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.BIZ_SOLAR_GID}`;
  const response = await fetch(url);
  const text = await response.text();
  const rows = parseCSV(text);
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 18) continue;
    const name = (row[2] || '').trim();
    const priceStr = (row[17] || '').trim();
    if (!name || name.length < 5) continue;
    const price = parseFloat(priceStr.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(price) || price <= 0) continue;
    
    let mainCategory = 'Інше';
    const lowName = name.toLowerCase();
    if (lowName.includes('акб') || lowName.includes('акумул') || lowName.includes('pylontech') || lowName.includes('dyness') || lowName.includes('стійк') || lowName.includes('rack')) {
      mainCategory = 'АКБ та BMS';
    }
    
    products.push({ name, price, mainCategory, supplier: 'БІЗ Солар', id: `biz_${i}` });
  }
  return products;
}

async function fetchHeliusProducts() {
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.HELIUS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.HELIUS_GID}`;
  const response = await fetch(url);
  const text = await response.text();
  const rows = parseCSV(text);
  const products = [];
  let currentSection = '';
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) continue;
    const colA = (row[0] || '').trim();
    const colB = (row[1] || '').trim();
    
    if (!colA && colB) {
      currentSection = colB.toLowerCase();
      continue;
    }
    const name = colA;
    const priceStr = (row[4] || '').trim();
    if (!name || name.length < 5 || name === 'Модель') continue;
    const price = parseFloat(priceStr.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (isNaN(price) || price <= 0) continue;
    
    let mainCategory = 'Інше';
    const lowName = name.toLowerCase();
    if (
      currentSection.includes('акб') || 
      currentSection.includes('акумул') || 
      lowName.includes('se-f') || 
      lowName.includes('se-g')
    ) {
      mainCategory = 'АКБ та BMS';
    }
    
    products.push({ name, price, mainCategory, supplier: 'Хеліус', id: `helius_${i}` });
  }
  return products;
}

async function main() {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';
  const [res, biz, helius] = await Promise.all([
    fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getAllData' })
    }).then(r => r.json()),
    fetchBizSolarProducts(),
    fetchHeliusProducts()
  ]);

  const gasProducts = (res.products || []).map(p => {
    let mainCategory = 'Інше';
    const nameStr = typeof p.name === 'object' && p.name ? (p.name.formattedValue || p.name.stringValue || '') : String(p.name || '');
    const lowCat = String(p.mainCategory || '').toLowerCase();
    if (lowCat.includes('акб') || lowCat.includes('акумул')) {
      mainCategory = 'АКБ та BMS';
    }
    return { name: nameStr, price: p.price, mainCategory, supplier: 'Правильне електроживлення', id: p.id || `gas_${Math.random()}` };
  });

  // Let's filter for relevant battery codes: SE-G5.1 and SE-F5
  const peB = gasProducts.find(p => p.name.includes('SE-G5.1'));
  const bizB = biz.find(p => p.name.includes('SE-G5.1'));
  const helB = helius.find(p => p.name.includes('SE-G5.1'));

  console.log('--- G5.1 Battery Raw Data ---');
  console.log('PE:', peB);
  console.log('BIZ:', bizB);
  console.log('HELIUS:', helB);

  console.log('\n--- Model Code Extraction ---');
  if (peB) console.log('PE Model Code:', extractModelCode(peB.name));
  if (bizB) console.log('BIZ Model Code:', extractModelCode(bizB.name));
  if (helB) console.log('HELIUS Model Code:', extractModelCode(helB.name));

  // Let's debug categories
  console.log('\n--- Categories ---');
  if (peB) console.log('PE Category:', peB.mainCategory);
  if (bizB) console.log('BIZ Category:', bizB.mainCategory);
  if (helB) console.log('HELIUS Category:', helB.mainCategory);
}

main().catch(console.error);
