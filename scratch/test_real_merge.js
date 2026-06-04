
function extractModelCode(name) {
  const lowerName = name.toLowerCase();
  
  if (
    lowerName.includes('g5.1') || 
    /g5\.1\s*pro/i.test(lowerName) || 
    /g5\.1\s*pro\s*[bв]/i.test(lowerName)
  ) {
    return 'SE-G5.1-PRO-B';
  }

  if (lowerName.includes('f5') || /f\s*5/i.test(lowerName)) {
    if (lowerName.includes('pro-c') || lowerName.includes('proc') || lowerName.includes('pro-с') || lowerName.includes('proс') || /f\s*5\s*-\s*pro\s*-\s*[cс]/i.test(lowerName) || /pro\s*-\s*[cс]/i.test(lowerName)) {
      return 'SE-F5-PRO-C';
    }
  }

  return null;
}

function cleanAndFormatProductName(name) {
  const modelCode = extractModelCode(name);
  const DEYE_BATTERY_CODES = ['SE-G5.1-PRO-B', 'SE-F5-PRO-C'];
  if (modelCode && DEYE_BATTERY_CODES.includes(modelCode)) {
    return `Deye ${modelCode}`;
  }
  return name;
}

function mergeSupplierProducts(pravylneProducts, bizSolarProducts, heliusProducts) {
  const mergedMap = new Map();
  
  pravylneProducts.forEach(p => {
    const key = p.id;
    const offers = [
      {
        supplierName: 'Правильне електроживлення',
        price: p.price,
        originalName: p.name
      }
    ];
    mergedMap.set(key, {
      ...p,
      name: cleanAndFormatProductName(p.name),
      offers,
      selectedSupplier: 'Правильне електроживлення'
    });
  });
  
  const suppliers = [
    { name: 'БІЗ Солар', products: bizSolarProducts },
    { name: 'Хеліус', products: heliusProducts }
  ];
  
  const matchedSupplierProductIds = new Set();
  
  // PASS 1
  suppliers.forEach(supplier => {
    supplier.products.forEach(supP => {
      const supModel = extractModelCode(supP.name);
      const cleanSupModel = supModel ? supModel.replace(/[^A-Z0-9]/gi, '') : '';
      
      if (cleanSupModel) {
        for (const p of mergedMap.values()) {
          if (p.mainCategory !== supP.mainCategory) continue;
          const pModel = extractModelCode(p.name);
          const cleanPModel = pModel ? pModel.replace(/[^A-Z0-9]/gi, '') : '';
          
          if (cleanSupModel === cleanPModel) {
            console.log(`[PASS 1 MATCH] ${supplier.name} "${supP.name}" matches ${p.selectedSupplier} "${p.name}"`);
            
            if (!p.offers) p.offers = [];
            
            if (!p.offers.some(o => o.supplierName === supplier.name)) {
              p.offers.push({
                supplierName: supplier.name,
                price: supP.price,
                originalName: supP.name
              });
            }
            
            matchedSupplierProductIds.add(`${supplier.name}_${supP.id}`);
            break;
          }
        }
      }
    });
  });

  // PASS 2
  suppliers.forEach(supplier => {
    supplier.products.forEach(supP => {
      if (matchedSupplierProductIds.has(`${supplier.name}_${supP.id}`)) return;
      
      const supModel = extractModelCode(supP.name);
      const cleanSupModel = supModel ? supModel.replace(/[^A-Z0-9]/gi, '') : '';
      let matchedProduct = null;
      
      for (const p of mergedMap.values()) {
        if (p.mainCategory !== supP.mainCategory) continue;
        
        const pModel = extractModelCode(p.name);
        const cleanPModel = pModel ? pModel.replace(/[^A-Z0-9]/gi, '') : '';
        
        if (cleanSupModel && cleanPModel) {
          if (cleanSupModel.includes(cleanPModel) || cleanPModel.includes(cleanSupModel)) {
            matchedProduct = p;
            break;
          }
        }
      }
      
      const offer = {
        supplierName: supplier.name,
        price: supP.price,
        originalName: supP.name
      };
      
      if (matchedProduct) {
        console.log(`[PASS 2 MATCH] ${supplier.name} "${supP.name}" matches ${matchedProduct.selectedSupplier} "${matchedProduct.name}"`);
        if (!matchedProduct.offers) matchedProduct.offers = [];
        matchedProduct.offers.push(offer);
      } else {
        console.log(`[NO MATCH - NEW CARD] ${supplier.name} "${supP.name}"`);
        const newProduct = {
          ...supP,
          name: cleanAndFormatProductName(supP.name),
          offers: [offer],
          selectedSupplier: supplier.name
        };
        mergedMap.set(supP.id, newProduct);
      }
    });
  });
  
  return Array.from(mergedMap.values());
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
    if (lowName.includes('акб') || lowName.includes('акумул') || lowName.includes('pylontech') || lowName.includes('dyness') || lowName.includes('стійк') || lowName.includes('rack') || lowName.includes('se-g')) {
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
    if (lowCat.includes('акб') || lowCat.includes('акумул') || nameStr.includes('SE-G5.1') || nameStr.includes('SE-F5')) {
      mainCategory = 'АКБ та BMS';
    }
    return { name: nameStr, price: p.price, mainCategory, supplier: 'Правильне електроживлення', id: p.id || `gas_${Math.random()}` };
  });

  const merged = mergeSupplierProducts(gasProducts, biz, helius);
}

main().catch(console.error);
