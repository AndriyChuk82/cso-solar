
function extractModelCode(name) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('akb') || lowerName.includes('акб') || lowerName.includes('акумул') || lowerName.includes('pylontech') || lowerName.includes('lifepeo4') || lowerName.includes('lifepo4') || lowerName.includes('bos-g') || lowerName.includes('se-f') || lowerName.includes('se-g') || lowerName.includes('rw-f')) {
    if (lowerName.includes('f16') || lowerName.includes('f16-c') || lowerName.includes('f-16') || lowerName.includes('f16plus')) {
      return 'SE-F16';
    }
    if (lowerName.includes('g5.1') || lowerName.includes('g5.1pro') || lowerName.includes('g5.1-pro')) {
      return 'SE-G5.1PRO';
    }
    if (lowerName.includes('g5.3')) {
      return 'SE-G5.3';
    }
    if (lowerName.includes('m6.1')) {
      return 'RW-M6.1';
    }
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
    products.push({ name, price, supplier: 'БІЗ Солар' });
  }
  return products;
}

async function fetchHeliusProducts() {
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.HELIUS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.HELIUS_GID}`;
  const response = await fetch(url);
  const text = await response.text();
  const rows = parseCSV(text);
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) continue;
    const name = (row[0] || '').trim();
    const priceStr = (row[4] || '').trim();
    if (!name || name.length < 5 || name === 'Модель') continue;
    const price = parseFloat(priceStr.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (isNaN(price) || price <= 0) continue;
    products.push({ name, price, supplier: 'Хеліус' });
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

  const all = [...(res.products || []), ...biz, ...helius];
  const items = all.filter(p => {
    const name = String(p.name || '').toLowerCase();
    return name.includes('f16') || name.includes('g5.1') || name.includes('g5.3') || name.includes('m6.1') || name.includes('pro');
  });

  console.log(`\nFound ${items.length} raw battery items:`);
  items.forEach(r => {
    console.log(`- [${r.supplier || 'Правильне електроживлення'}] Name: "${r.name}" (Price: ${r.price})`);
  });
}

main().catch(console.error);
