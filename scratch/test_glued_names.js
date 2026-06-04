const CONFIG = {
  BIZ_SOLAR_SPREADSHEET_ID: '1Xajw9ZJj-fCdlxbbsj1OqZPvFeyolMKD',
  BIZ_SOLAR_GID: 461092007,
  HELIUS_SPREADSHEET_ID: '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy',
  HELIUS_GID: 314286327
};

function extractModelCode(name) {
  const lowerName = name.toLowerCase();

  // Exclude kits
  if (
    lowerName.includes('комплект') ||
    lowerName.includes('набір') ||
    lowerName.includes('набори') ||
    /\bkit\b/i.test(lowerName) ||
    /\bset\b/i.test(lowerName)
  ) {
    return null;
  }

  if (
    lowerName.includes('se-f16') ||
    lowerName.includes('rw-f16') ||
    /\b314\s*ah\b/.test(lowerName) ||
    /2b314ar/i.test(name) ||
    /f16plus/i.test(lowerName) ||
    /f-16\b/.test(lowerName)
  ) { return 'SE-F16'; }

  if (lowerName.includes('se-f10') || lowerName.includes('rw-f10') || /f10plus/i.test(lowerName)) {
    return 'SE-F10';
  }

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
    if (lowerName.includes('pro-l') || lowerName.includes('prol') || /f\s*5\s*-\s*pro\s*-\s*l/i.test(lowerName) || /pro\s*-\s*l/i.test(lowerName)) {
      return 'SE-F5-PRO-L';
    }
  }

  if (lowerName.includes('g5.3') || lowerName.includes('se-g5.3')) {
    return 'SE-G5.3';
  }

  if (lowerName.includes('rw-m6.1') || lowerName.includes('m6.1')) {
    return 'RW-M6.1';
  }

  if ((lowerName.includes('bos-g') || lowerName.includes('bosg') || /bos\s*-\s*g/i.test(lowerName)) && 
      (lowerName.includes('bms') || lowerName.includes('control') || lowerName.includes('pdu') || lowerName.includes('контрол') || lowerName.includes('керув') || lowerName.includes('hvb'))) {
    return 'BOS-G-BMS';
  }

  if ((lowerName.includes('bos-g') || lowerName.includes('bosg') || /bos\s*-\s*g/i.test(lowerName)) && 
      !lowerName.includes('control') && 
      !lowerName.includes('bms') && 
      !lowerName.includes('бмс') && 
      !lowerName.includes('керув') && 
      !lowerName.includes('контрол') &&
      !lowerName.includes('rack') &&
      !lowerName.includes('стійк') &&
      !lowerName.includes('шаф') &&
      !lowerName.includes('корпус') &&
      !lowerName.includes('cabinet')) {
    return 'BOS-G-PRO';
  }

  if (/us5000/i.test(lowerName)) { return 'US5000'; }
  if (/us3000/i.test(lowerName)) { return 'US3000'; }

  if (lowerName.includes('sun2000') || lowerName.includes('sun 2000')) {
    const powerMatch = lowerName.match(/(\d+ktl)/i);
    const power = powerMatch ? powerMatch[1].toUpperCase() : '';
    const versionMatch = lowerName.match(/(m\d+)/i);
    const version = versionMatch ? versionMatch[1].toUpperCase() : '';
    let region = 'EU';
    if (lowerName.includes('ua') && !lowerName.includes('eua')) {
      region = 'UA';
    }
    if (power && version) {
      return `SUN2000-${power}-${version}-${region}`;
    } else if (power) {
      return `SUN2000-${power}-${region}`;
    }
  }

  const isRack = (lowerName.includes('стійк') || lowerName.includes('lrack') || lowerName.includes('hrack') || lowerName.includes('rack-11') || lowerName.includes('rack14')) &&
                 !lowerName.includes('комплект') &&
                 !lowerName.includes('бмс') &&
                 !lowerName.includes('акб life') &&
                 !lowerName.includes('bms');
  
  if (isRack) {
    if (lowerName.includes('lrack') || lowerName.includes(' 8 ') || lowerName.includes('8 акб') || lowerName.includes(' 9 ') || lowerName.includes('9 рівн') || lowerName.includes('8 шт')) {
      return '3U-LRACK';
    }
    if (lowerName.includes('hrack') || lowerName.includes('12') || lowerName.includes('13') || lowerName.includes('14')) {
      return '3U-HRACK';
    }
  }

  let cleanName = name.toUpperCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, '')
    .replace(/ГІБРИДНИЙ/g, '')
    .replace(/МЕРЕЖЕВИЙ/g, '')
    .replace(/ІНВЕРТОР/g, '')
    .replace(/АКУМУЛЯТОР/g, '')
    .replace(/БАТАРЕЯ/g, '')
    .replace(/ПАНЕЛЬ/g, '')
    .replace(/СОНЯЧНА/g, '')
    .replace(/АКБ/g, '')
    .replace(/DEYE/g, '')
    .replace(/WIFI/g, '');

  cleanName = cleanName
    .replace(/А/g, 'A')
    .replace(/В/g, 'B')
    .replace(/Е/g, 'E')
    .replace(/С/g, 'C')
    .replace(/Н/g, 'H')
    .replace(/К/g, 'K')
    .replace(/М/g, 'M')
    .replace(/О/g, 'O')
    .replace(/Р/g, 'P')
    .replace(/Т/g, 'T')
    .replace(/Х/g, 'X')
    .replace(/І/g, 'I');

  const matches = cleanName.match(/[A-Z0-9]{2,}-[A-Z0-9.-]{3,}/gi);
  if (matches && matches.length > 0) {
    let code = matches[0].toUpperCase();
    const prefixIdx = code.search(/(SE-|SUN-|LR\d*-|RSM\d*-)/i);
    if (prefixIdx !== -1) {
      code = code.substring(prefixIdx);
    }
    code = code.replace(/SUN-0+(\d+K)/gi, 'SUN-$1');
    code = code.replace(/SUN-(\d+)K-?SG/gi, 'SUN-$1K-SG');
    return code;
  }
  
  const simpleModelMatch = cleanName.match(/(US\d{4}[A-Z]?|SUN-\d+[A-Z0-9-]+|SE-[FG]\d+[A-Z0-9.-]*)/i);
  if (simpleModelMatch) {
    let code = simpleModelMatch[1].toUpperCase();
    const prefixIdx = code.search(/(SE-|SUN-|LR\d*-|RSM\d*-)/i);
    if (prefixIdx !== -1) {
      code = code.substring(prefixIdx);
    }
    code = code.replace(/SUN-0+(\d+K)/gi, 'SUN-$1');
    code = code.replace(/SUN-(\d+)K-?SG/gi, 'SUN-$1K-SG');
    return code;
  }
  
  return null;
}

function cleanAndFormatProductName(name) {
  if (!name || typeof name !== 'string') return '';
  let clean = name.trim();
  
  const brands = [
    'JA Solar', 'JA', 'Longi Solar', 'Longi', 'Jinko Solar', 'Jinko', 'Trina Solar', 'Trina', 
    'Victron Energy', 'Victron', 'Deye', 'Solis', 'Huawei', 'Pylontech', 'Growatt', 
    'Axioma Energy', 'Axioma', 'Fronius', 'Risen', 'Dyness', 'Must', 'Altek',
    'DAS Solar', 'DAS', 'GCL'
  ];
  
  let detectedBrand = '';
  for (const brand of brands) {
    const brandRegex = new RegExp(`\\b${brand}\\b`, 'i');
    if (brandRegex.test(clean)) {
      detectedBrand = brand;
      break;
    }
  }

  const modelCode = extractModelCode(clean);
  
  if (modelCode === '3U-LRACK' || modelCode === '3U-HRACK') {
    return modelCode === '3U-LRACK'
      ? 'Deye Стійка 3U-LRack (на 8-9 АКБ)'
      : 'Deye Стійка 3U-HRack (на 12-13 АКБ)';
  }

  if (modelCode === 'BOS-G-PRO') {
    return 'Deye BOS-G Pro (5.12 kWh)';
  }

  if (modelCode === 'BOS-G-BMS') {
    return 'Deye BMS Контролер Bos-G 120-750V (HVB750V/100A-EU)';
  }

  const DEYE_BATTERY_CODES = ['SE-F16', 'SE-F10', 'SE-G5.1-PRO-B', 'SE-F5-PRO-C', 'SE-F5-PRO-L', 'SE-G5.3', 'RW-M6.1', 'BOS-G-PRO'];
  if (modelCode && DEYE_BATTERY_CODES.includes(modelCode)) {
    return `Deye ${modelCode}`;
  }

  if (modelCode && modelCode.startsWith('SUN2000-')) {
    const parts = modelCode.split('-');
    if (parts.length >= 4) {
      return `Huawei SUN2000-${parts[1]}-${parts[2]} ${parts[3]}`;
    } else if (parts.length === 3) {
      return `Huawei SUN2000-${parts[1]} ${parts[2]}`;
    }
  }

  if (modelCode && detectedBrand && (
    clean.toLowerCase().includes('інвертор') || 
    clean.toLowerCase().includes('акб') || 
    clean.toLowerCase().includes('акумул') || 
    clean.toLowerCase().includes('панел') || 
    clean.toLowerCase().includes('батаре') || 
    modelCode.startsWith('SUN-') || 
    modelCode.startsWith('S5-') || 
    modelCode.startsWith('S6-') || 
    modelCode.startsWith('SE-') ||
    modelCode.startsWith('US') ||
    modelCode.startsWith('LR') ||
    modelCode.startsWith('JAM') ||
    modelCode.startsWith('TSM') ||
    modelCode.startsWith('RSM') ||
    modelCode.startsWith('DAS') ||
    modelCode.startsWith('GCL')
  )) {
    let cleanModel = modelCode;
    cleanModel = cleanModel.replace(/-P\d+$/i, '').replace(/-P$/i, '');
    
    return `${detectedBrand} ${cleanModel}`;
  }
  
  if (detectedBrand) {
    const startRegex = new RegExp(`^${detectedBrand}\\b`, 'i');
    if (!startRegex.test(clean)) {
      clean = clean.replace(new RegExp(`\\s*\\b${detectedBrand}\\b\\s*`, 'gi'), ' ').trim();
      clean = clean.replace(/\s+/g, ' ');
      clean = `${detectedBrand} ${clean}`;
    }
  }
  
  let finalClean = clean;
  finalClean = finalClean
    .replace(/615MBIFICIAL/g, '615M BIFICIAL')
    .replace(/615MBIFACIAL/g, '615M BIFACIAL')
    .replace(/SE-F12LIFEPO4LV51.2V/g, 'SE-F12 LiFePO4 LV 51.2V')
    .replace(/SE-F12LIFEPO4HV51.2V/g, 'SE-F12 LiFePO4 HV 51.2V');
    
  return finalClean;
}

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
    if (!name || name.length < 5) continue;
    products.push({ name, supplier: 'БІЗ Солар' });
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
    const colA = (row[0] || '').trim();
    if (!colA || colA.length < 5 || colA === 'Модель') continue;
    products.push({ name: colA, supplier: 'Хеліус' });
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

  const peProducts = (res.products || []).map(p => {
    const nameStr = typeof p.name === 'object' && p.name ? (p.name.formattedValue || p.name.stringValue || '') : String(p.name || '');
    return { name: nameStr, supplier: 'Правильне електроживлення' };
  });

  const allProducts = [...peProducts, ...biz, ...helius];
  
  console.log('--- ANALYSIS OF GLUED PRODUCTS ---');
  
  const results = [];
  for (const p of allProducts) {
    const model = extractModelCode(p.name);
    const formatted = cleanAndFormatProductName(p.name);
    
    const lowercaseThenUppercase = /[a-z][A-Z]/.test(formatted);
    const hasGluedWord = 
      formatted.includes('LIFEPO4') || 
      formatted.includes('BIFICIAL') || 
      formatted.includes('BIFACIAL') ||
      formatted.includes('51.2V') ||
      /SE-F\d{2}[A-Z]/.test(formatted) ||
      /LR\d-[A-Z0-9]+[A-Z]/.test(formatted) ||
      /\d+V[A-Z]/.test(formatted) ||
      /\d+Ah[A-Z]/.test(formatted) ||
      lowercaseThenUppercase;

    if (hasGluedWord || p.name.toLowerCase().includes('bms') || p.name.toLowerCase().includes('se-f12')) {
      results.push({
        supplier: p.supplier,
        original: p.name,
        modelCode: model,
        formatted: formatted
      });
    }
  }
  
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
