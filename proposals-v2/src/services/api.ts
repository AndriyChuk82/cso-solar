import { CONFIG } from '../config';
import type { Product, Category, SupplierOffer } from '../types';

/**
 * Очищує значення від об'єктів Google Sheets
 */
function sanitize(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && val.valueType) {
    if (val.valueType === 'IMAGE') return 'Фото';
    return val.formattedValue || val.stringValue || val.numberValue || null;
  }
  return val;
}

function sanitizeString(val: any): string {
  const s = sanitize(val);
  return s !== null ? String(s).trim() : '';
}

function parsePrice(str: string): { value: number; currency: 'USD' | 'EUR' | 'UAH' } {
  if (!str) return { value: 0, currency: 'USD' };
  let s = str.trim();
  let currency: 'USD' | 'EUR' | 'UAH' = 'USD';

  if (s.includes('€')) currency = 'EUR';
  if (s.includes('₴') || s.toLowerCase().includes('грн')) currency = 'UAH';

  if (s.toLowerCase().includes('гот') || s.includes('/')) {
    const match = s.match(/[\d\s,.]+/);
    if (match) s = match[0];
  }

  s = s.replace(/[$€₴]|грн/gi, '').trim();
  s = s.replace(/\s/g, '').replace(',', '.');

  const val = parseFloat(s);
  return { value: isNaN(val) ? 0 : val, currency };
}

function parseVatPrice(str: string): number | undefined {
  if (!str) return undefined;
  let s = str.toString().trim().toLowerCase();
  
  if (!s.includes('пдв')) {
    return undefined;
  }
  
  // Remove unit slashes first
  s = s.replace(/\$\s*\/\s*(вт|w|шт)/g, '');
  s = s.replace(/(грн|дол)\s*\/\s*(вт|w|шт)/g, '');
  
  let targetStr = s;
  if (s.includes('/')) {
    const parts = s.split('/');
    const vatPart = parts.find(p => p.includes('пдв'));
    if (vatPart) {
      targetStr = vatPart;
    }
  }
  
  const cleaned = targetStr.replace(/[^0-9.,]/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) || val <= 0 ? undefined : val;
}

function generateStableId(base: string): string {
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash = hash & hash;
  }
  return 'prod_' + Math.abs(hash).toString(36);
}

// Базовий запит до GAS
async function gasRequest(action: string, data: any = {}) {
  try {
    console.log(`🚀 GAS Request: ${action}`, data);
    const response = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...data })
    });
    const result = await response.json();
    console.log(`📥 GAS Response: ${action}`, result);
    return result;
  } catch (error) {
    console.error(`❌ GAS error (${action}):`, error);
    return { success: false };
  }
}

// --- CSV PARSING & BIZ SOLAR INTEGRATION ---

export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
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
        if (c === '\r' && next === '\n') {
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

export async function fetchBizSolarProducts(): Promise<Product[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${CONFIG.BIZ_SOLAR_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.BIZ_SOLAR_GID}`;
    let text = '';
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      text = await response.text();
    } catch {
      // CORS fallback using config proxies
      const proxyUrl = `https://corsproxy.io/?url=` + encodeURIComponent(url);
      const response = await fetch(proxyUrl);
      text = await response.text();
    }
    
    const rows = parseCSV(text);
    const products: Product[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 18) continue;
      
      const name = (row[2] || '').trim();
      const priceStr = (row[17] || '').trim(); // Column R (Wholesale)
      const stockStr = (row[14] || '').trim(); // Column O (Availability)
      
      if (!name || name === 'Номенклатура' || name === 'Артикул' || name.length < 5) continue;
      
      const cleanedPriceStr = priceStr.replace(/\u00a0/g, '').replace(/\s/g, '').replace(',', '.');
      const price = parseFloat(cleanedPriceStr);
      if (isNaN(price) || price <= 0) continue;
      
      const inStock = !(stockStr.toLowerCase().includes('нема') || stockStr.toLowerCase().includes('відсутн') || stockStr === '0');
      
      let mainCategory = 'Інше';
      const lowName = name.toLowerCase();
      
      if (
        lowName.includes('akb') ||
        lowName.includes('акб') || 
        lowName.includes('акумул') || 
        lowName.includes('pylontech') || 
        lowName.includes('dyness') || 
        lowName.includes('bos-g') || 
        lowName.includes('se-f') || 
        lowName.includes('se-g') ||
        lowName.includes('lfp') ||
        lowName.includes('стійк') || 
        lowName.includes('rack')
      ) {
        mainCategory = 'АКБ та BMS';
      } else if (lowName.includes('інвертор')) {
        mainCategory = 'Інвертори';
      } else if (lowName.includes('батаре') || lowName.includes('панел') || lowName.includes('модул')) {
        mainCategory = 'Сонячні батареї';
      } else if (lowName.includes('кабель')) {
        mainCategory = 'Кабель';
      } else if (lowName.includes('кріпл')) {
        mainCategory = 'Кріплення';
      } else if (lowName.includes('захист') || lowName.includes('автомат')) {
        mainCategory = 'Захист та Автоматика';
      }
      
      const finalPrice = adjustSolarPanelPrice(name, price, mainCategory);
      
      products.push({
        id: `biz_${generateStableId(name + finalPrice)}`,
        name,
        category: mainCategory,
        mainCategory,
        price: finalPrice,
        currency: 'USD',
        unit: 'шт',
        inStock,
        description: ''
      });
    }
    
    return products;
  } catch (error) {
    console.error('❌ Error fetching Biz Solar products:', error);
    return [];
  }
}

export async function fetchHeliusProducts(): Promise<Product[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${CONFIG.HELIUS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.HELIUS_GID}`;
    let text = '';
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      text = await response.text();
    } catch {
      // CORS fallback using config proxies
      const proxyUrl = `https://corsproxy.io/?url=` + encodeURIComponent(url);
      const response = await fetch(proxyUrl);
      text = await response.text();
    }
    
    const rows = parseCSV(text);
    const products: Product[] = [];
    let currentSection = '';
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 5) continue;
      
      const colA = (row[0] || '').trim();
      const colB = (row[1] || '').trim();
      
      // If Column A is empty and Column B has text, it's a section header!
      if (!colA && colB) {
        currentSection = colB.toLowerCase();
        continue;
      }
      
      const name = colA;
      const stockStr = (row[2] || '').trim(); // Column C (Availability)
      const priceStr = (row[4] || '').trim(); // Column E (Price)
      const priceVatStr = (row[5] || '').trim(); // Column F (Price VAT)
      
      if (!name || name.length < 5 || name === 'Модель') continue;
      
      const cleanedPriceStr = priceStr.replace(/[^0-9.,]/g, '').replace(',', '.');
      const price = parseFloat(cleanedPriceStr);
      if (isNaN(price) || price <= 0) continue;

      const cleanedPriceVatStr = priceVatStr.replace(/[^0-9.,]/g, '').replace(',', '.');
      const priceVatVal = parseFloat(cleanedPriceVatStr);
      const finalPriceVatRaw = isNaN(priceVatVal) || priceVatVal <= 0 ? undefined : priceVatVal;
      
      const inStock = !(stockStr.toLowerCase().includes('нема') || stockStr.toLowerCase().includes('відсутн') || stockStr === '0' || stockStr.toLowerCase() === 'нет');
      
      let mainCategory = 'Інше';
      const lowName = name.toLowerCase();
      const lowDesc = colB.toLowerCase();
      
      // 1. Check strong model/name identifiers first (highly reliable)
      if (
        lowName.includes('akb') || 
        lowName.includes('акб') || 
        lowName.includes('акумул') || 
        lowName.includes('pylontech') || 
        lowName.includes('dyness') || 
        lowName.includes('lifepo4') || 
        lowName.includes('se-f') || 
        lowName.includes('se-g') || 
        lowName.includes('bos-g')
      ) {
        mainCategory = 'АКБ та BMS';
      } else if (
        lowName.includes('інвертор') || 
        lowDesc.includes('інвертор') || 
        lowName.includes('sun-') || 
        lowName.startsWith('s5-') || 
        lowName.startsWith('s6-')
      ) {
        mainCategory = 'Інвертори';
      } else if (
        lowName.includes('батаре') || 
        lowName.includes('панел') || 
        lowName.includes('модул')
      ) {
        mainCategory = 'Сонячні батареї';
      } 
      // 2. Fall back to section-based classification if name matches failed
      else if (
        currentSection.includes('інвертор')
      ) {
        mainCategory = 'Інвертори';
      } else if (
        currentSection.includes('батаре') || 
        currentSection.includes('панел') || 
        currentSection.includes('модул')
      ) {
        mainCategory = 'Сонячні батареї';
      } else if (
        currentSection.includes('акб') || 
        currentSection.includes('акумул') || 
        currentSection.includes('блокування bos') || 
        currentSection.includes('стійк') ||
        currentSection.includes('rack')
      ) {
        mainCategory = 'АКБ та BMS';
      } else if (currentSection.includes('кабел') || lowName.includes('кабель')) {
        mainCategory = 'Кабель';
      } else if (currentSection.includes('комплект') || currentSection.includes('стійк') || lowName.includes('стійка')) {
        mainCategory = 'Кріплення';
      } else if (currentSection.includes('захист') || lowName.includes('захист') || lowName.includes('автомат')) {
        mainCategory = 'Захист та Автоматика';
      }
      
      const finalPrice = adjustSolarPanelPrice(name, price, mainCategory);
      const finalPriceVat = finalPriceVatRaw !== undefined ? adjustSolarPanelPrice(name, finalPriceVatRaw, mainCategory) : undefined;
      
      products.push({
        id: `helius_${generateStableId(name + finalPrice)}`,
        name,
        category: mainCategory,
        mainCategory,
        price: finalPrice,
        priceVat: finalPriceVat,
        currency: 'USD',
        unit: 'шт',
        inStock,
        description: ''
      });
    }
    
    return products;
  } catch (error) {
    console.error('❌ Error fetching Helius products:', error);
    return [];
  }
}

export function extractModelCode(name: string): string | null {
  const originalLower = name.toLowerCase();

  // ── EXCLUDE KITS / SETS FROM NORMALIZATION ────────────────────────────────
  // Kits/Sets should never be normalized as individual battery modules or inverters.
  if (
    originalLower.includes('комплект') ||
    originalLower.includes('набір') ||
    originalLower.includes('набори') ||
    /\bkit\b/i.test(originalLower) ||
    /\bset\b/i.test(originalLower)
  ) {
    return null;
  }

  const lowerName = normalizeForSearch(name);

  // ── BATTERY MODEL NORMALIZATION ──────────────────────────────────────────
  // All name variants of the same physical battery are mapped to one canonical
  // model code so that mergeSupplierProducts can group them into a single card.
  // Priority: check most-specific patterns first.

  // Deye SE-F16 family (314Ah / 51.2V LiFePO4)
  if (
    lowerName.includes('se-f16') ||
    lowerName.includes('rw-f16') ||
    /\b314\s*ah\b/.test(lowerName) ||
    /2b314ar/i.test(name) ||
    /f16plus/i.test(lowerName) ||
    /f-16\b/.test(lowerName)
  ) {
    if (/\brw-f16\b|\brw\s+f16\b/i.test(lowerName)) {
      return 'RW-F16';
    }
    if (/\bf16plus\b|\bf16\s+plus\b|\bplus-l\b|\bplus\s+l\b/i.test(lowerName)) {
      return 'SE-F16-PLUS-L';
    }
    if (/\bse-f16-l\b|\bse-f16\s+l\b/i.test(lowerName)) {
      return 'SE-F16-L';
    }
    if (/\bse-f16-c\b|\bse-f16\s+c\b/i.test(lowerName)) {
      return 'SE-F16-C';
    }
    return 'SE-F16';
  }

  // Deye SE-F12 family (230Ah / 51.2V)
  if (lowerName.includes('se-f12') || lowerName.includes('f-12') || /\b230\s*ah\b/.test(lowerName)) {
    if (/\bse-f12-l\b|\bse-f12\s+l\b/i.test(lowerName)) {
      return 'SE-F12-L';
    }
    if (/\bse-f12-c\b|\bse-f12\s+c\b/i.test(lowerName)) {
      return 'SE-F12-C';
    }
    return 'SE-F12-C';
  }

  // Deye SE-F10 family  (100Ah / 51.2V)
  if (lowerName.includes('se-f10') || lowerName.includes('rw-f10') || /f10plus/i.test(lowerName)) {
    return 'SE-F10';
  }

  // Deye SE-G5.1 Pro-B / Pro family (5.12kWh / 51.2V)
  // Maps g5.1 pro, g5.1 pro-b, g5.1 proв, g5.1-pro etc.
  if (
    lowerName.includes('g5.1') || 
    /g5\.1\s*pro/i.test(lowerName) || 
    /g5\.1\s*pro\s*[bв]/i.test(lowerName)
  ) {
    return 'SE-G5.1-PRO-B';
  }

  // Deye SE-F5 PRO-C / PRO-L family (5.12kWh / 51.2V)
  if (lowerName.includes('f5') || /f\s*5/i.test(lowerName)) {
    if (lowerName.includes('pro-c') || lowerName.includes('proc') || lowerName.includes('pro-с') || lowerName.includes('proс') || /f\s*5\s*-\s*pro\s*-\s*[cс]/i.test(lowerName) || /pro\s*-\s*[cс]/i.test(lowerName)) {
      return 'SE-F5-PRO-C';
    }
    if (lowerName.includes('pro-l') || lowerName.includes('prol') || /f\s*5\s*-\s*pro\s*-\s*l/i.test(lowerName) || /pro\s*-\s*l/i.test(lowerName)) {
      return 'SE-F5-PRO-L';
    }
  }

  // Deye SE-G5.3 family  (5.32kWh)
  if (lowerName.includes('g5.3') || lowerName.includes('se-g5.3')) {
    return 'SE-G5.3';
  }

  // Dyness / BOS RW-M6.1 family
  if (lowerName.includes('rw-m6.1') || lowerName.includes('m6.1')) {
    return 'RW-M6.1';
  }

  // Deye BOS-G BMS / Control Box family
  if ((lowerName.includes('bos-g') || lowerName.includes('bosg') || /bos\s*-\s*g/i.test(lowerName)) && 
      (lowerName.includes('bms') || lowerName.includes('control') || lowerName.includes('pdu') || lowerName.includes('контрол') || lowerName.includes('керув') || lowerName.includes('hvb'))) {
    return 'BOS-G-BMS';
  }

  // Deye BOS-G PRO / BOS-G family (5.12kWh / 51.2V / 100Ah module)
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

  // Pylontech US5000 family
  if (/us5000/i.test(lowerName)) { return 'US5000'; }
  // Pylontech US3000 family
  if (/us3000/i.test(lowerName)) { return 'US3000'; }

  // Huawei SUN2000 family (e.g. SUN2000-30KTL-M3 EU / UA)
  if (lowerName.includes('sun2000') || lowerName.includes('sun 2000')) {
    const powerMatch = lowerName.match(/(\d+ktl)/i);
    const power = powerMatch ? powerMatch[1].toUpperCase() : '';
    const versionMatch = lowerName.match(/(m\d+)/i);
    const version = versionMatch ? versionMatch[1].toUpperCase() : '';
    let region = 'UA'; // Default to UA
    if (/(?:^|[\s\W_])(eu|еu)(?:$|[\s\W_])/i.test(lowerName)) {
      region = 'EU';
    }
    
    if (power && version) {
      return `SUN2000-${power}-${version}-${region}`;
    } else if (power) {
      return `SUN2000-${power}-${region}`;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

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

  // 1. Clean up typical prefixes/categories, parentheses and noise words
  let cleanName = name.toUpperCase()
    .replace(/\(.*?\)/g, '') // Remove everything in parentheses first
    .replace(/\s+/g, '') // Strip all spaces/tabs
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

  // 2. Replace Cyrillic homoglyphs with Latin counterparts to avoid visually identical character mismatches (e.g. Cyrillic 'В' vs Latin 'B')
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

  // 3. Match hyphenated model numbers like SE-F5-PRO-C or SUN-10K-SG02LP1 (allowing dots for models like SE-G5.1)
  const matches = cleanName.match(/[A-Z0-9]{2,}-[A-Z0-9.-]{3,}/gi);
  if (matches && matches.length > 0) {
    let code = matches[0].toUpperCase();
    
    // Strip any leading garbage before known prefixes like SE-, SUN-, LR-, RSM-
    const prefixIdx = code.search(/(SE-|SUN-|LR\d*-|RSM\d*-)/i);
    if (prefixIdx !== -1) {
      code = code.substring(prefixIdx);
    }
    
    // Normalize leading zero in kilowatt count (e.g. SUN-05K -> SUN-5K, SUN-06K -> SUN-6K)
    code = code.replace(/SUN-0+(\d+K)/gi, 'SUN-$1');
    
    // Ensure standard format for power-hybrid models: e.g. SUN-12KSG -> SUN-12K-SG, SUN-6KSG -> SUN-6K-SG
    code = code.replace(/SUN-(\d+)K-?SG/gi, 'SUN-$1K-SG');
    
    // Normalize missing 'K' in Deye hybrid inverters: e.g. SUN-20-SG -> SUN-20K-SG, SUN-12-SG -> SUN-12K-SG
    code = code.replace(/SUN-(\d+(?:\.\d+)?)-SG/gi, 'SUN-$1K-SG');
    
    return code;
  }
  
  // 4. Fallback for simple model codes like US5000, SE-F5, SE-G5.1, SUN-10K
  const simpleModelMatch = cleanName.match(/(US\d{4}[A-Z]?|SUN-\d+[A-Z0-9-]+|SE-[FG]\d+[A-Z0-9.-]*)/i);
  if (simpleModelMatch) {
    let code = simpleModelMatch[1].toUpperCase();
    const prefixIdx = code.search(/(SE-|SUN-|LR\d*-|RSM\d*-)/i);
    if (prefixIdx !== -1) {
      code = code.substring(prefixIdx);
    }
    code = code.replace(/SUN-0+(\d+K)/gi, 'SUN-$1');
    code = code.replace(/SUN-(\d+)K-?SG/gi, 'SUN-$1K-SG');
    code = code.replace(/SUN-(\d+(?:\.\d+)?)-SG/gi, 'SUN-$1K-SG');
    return code;
  }
  
  return null;
}

export function extractPanelPower(name: string): number | null {
  if (!name) return null;
  // 1. Match patterns like "620Вт", "620 Вт", "620W", "620 W", "620w", "620M"
  const match = name.match(/(\d{3})\s*(Вт|W|w|M)/i);
  if (match) {
    return parseInt(match[1]);
  }
  // 2. Match hyphenated/slashed power, e.g. "-620", "/620"
  const hyphenMatch = name.match(/[-/](3[5-9]\d|[456]\d{2})\b/);
  if (hyphenMatch) {
    return parseInt(hyphenMatch[1]);
  }
  // 3. Match any standalone 3-digit number between 350 and 750
  const standaloneMatch = name.match(/\b(3[5-9]\d|[456]\d{2})\b/);
  if (standaloneMatch) {
    return parseInt(standaloneMatch[1]);
  }
  return null;
}

export function adjustSolarPanelPrice(name: string, price: number, category: string): number {
  if (category === 'Сонячні батареї' && price > 0 && price < 2.0) {
    const power = extractPanelPower(name);
    if (power) {
      return price * power;
    }
  }
  return price;
}

export function cleanAndFormatProductName(name: string): string {
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

  // If it's an inverter, battery or solar panel and we found a model code, simplify the name!
  const modelCode = extractModelCode(clean);
  
  if (modelCode === '3U-LRACK' || modelCode === '3U-HRACK') {
    return modelCode === '3U-LRACK'
      ? 'Deye Стійка 3U-LRack (на 8-9 АКБ)'
      : 'Deye Стійка 3U-HRack (на 12-13 АКБ)';
  }

  if (modelCode === 'BOS-G-PRO') {
    return splitGluedWords('Deye BOS-G Pro (5.12 kWh)');
  }

  if (modelCode === 'BOS-G-BMS') {
    return 'Deye BMS Контролер Bos-G 120-750V (HVB750V/100A-EU)';
  }

  if (modelCode === 'RW-F16') {
    return splitGluedWords('Deye RW-F16 LiFePO4 LV 51.2V 314Ah');
  }

  if (modelCode === 'SE-F16-C') {
    return splitGluedWords('Deye SE-F16-C LiFePO4 LV 51.2V 314Ah');
  }

  if (modelCode === 'SE-F16-L') {
    return splitGluedWords('Deye SE-F16-L LiFePO4 LV 51.2V 314Ah');
  }

  if (modelCode === 'SE-F16-PLUS-L') {
    return splitGluedWords('Deye SE-F16 Plus-L LiFePO4 LV 51.2V 314Ah');
  }

  if (modelCode === 'SE-F16') {
    return splitGluedWords('Deye SE-F16 LiFePO4 LV 51.2V 314Ah');
  }

  if (modelCode === 'SE-F12-L') {
    return splitGluedWords('Deye SE-F12-L LiFePO4 LV 51.2V 230Ah');
  }

  if (modelCode === 'SE-F12-C') {
    return splitGluedWords('Deye SE-F12-C LiFePO4 LV 51.2V 230Ah');
  }

  if (modelCode === 'SE-F10') {
    return splitGluedWords('Deye SE-F10 LiFePO4 LV 51.2V 100Ah');
  }

  if (modelCode === 'SE-F5-PRO-C') {
    return splitGluedWords('Deye SE-F5 Pro-C LiFePO4 LV 51.2V 100Ah');
  }

  if (modelCode === 'SE-F5-PRO-L') {
    return splitGluedWords('Deye SE-F5 Pro-L LiFePO4 LV 51.2V 100Ah');
  }

  if (modelCode === 'SE-G5.1-PRO-B') {
    return splitGluedWords('Deye SE-G5.1 Pro-B LiFePO4 LV 51.2V 100Ah');
  }

  // Known Deye battery canonical codes — always render as "Deye <model>"
  const DEYE_BATTERY_CODES = ['SE-F16', 'SE-F16-C', 'SE-F16-L', 'SE-F16-PLUS-L', 'RW-F16', 'SE-F12-C', 'SE-F12-L', 'SE-F10', 'SE-G5.1-PRO-B', 'SE-F5-PRO-C', 'SE-F5-PRO-L', 'SE-G5.3', 'RW-M6.1', 'BOS-G-PRO'];
  if (modelCode && DEYE_BATTERY_CODES.includes(modelCode)) {
    return splitGluedWords(`Deye ${modelCode}`);
  }

  // Known Huawei inverter canonical codes - always render as "Huawei SUN2000-<Power>-<Version> <Region>"
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
    // Clean up trailing noise model suffixes like -P1 or -P
    let cleanModel = modelCode;
    cleanModel = cleanModel.replace(/-P\d+$/i, '').replace(/-P$/i, '');
    
    const formattedResult = `${detectedBrand} ${cleanModel}`;
    return splitGluedWords(formattedResult);
  }
  
  // Fallback brand-front realignment
  if (detectedBrand) {
    const startRegex = new RegExp(`^${detectedBrand}\\b`, 'i');
    if (!startRegex.test(clean)) {
      clean = clean.replace(new RegExp(`\\s*\\b${detectedBrand}\\b\\s*`, 'gi'), ' ').trim();
      // Clean up double spaces
      clean = clean.replace(/\s+/g, ' ');
      clean = `${detectedBrand} ${clean}`;
    }
  }
  
  return splitGluedWords(clean);
}

function splitGluedWords(str: string): string {
  if (!str) return str;
  let res = str
    .replace(/(\d{3}M)BIF(I|A)CIAL/gi, '$1 BIFICIAL')
    .replace(/(\d{3}M)BIF(I|A)CIAL/gi, '$1 BIFICIAL')
    .replace(/LIFEPO4/gi, ' LiFePO4')
    .replace(/LV(\d)/gi, ' LV $1')
    .replace(/LV/gi, ' LV')
    .replace(/HV(\d)/gi, ' HV $1')
    .replace(/HV/gi, ' HV')
    .replace(/(\d+(?:\.\d+)?V)/gi, ' $1')
    .replace(/(\d+AH)/gi, ' $1')
    .replace(/\s+/g, ' ')
    .trim();

  const low = res.toLowerCase();
  
  // 1. Акумулятори (Акумуляторна батарея)
  const isBattery = (low.includes('pylontech') || low.includes('dyness') || low.includes('akb') || low.includes('акб') || low.includes('акумул') || low.includes('lifepo4') || low.includes('se-f') || low.includes('se-g') || low.includes('rw-m') || low.includes('bos-g') || low.includes('lfp')) &&
                    !low.includes('стійк') &&
                    !low.includes('кабель') &&
                    !low.includes('bms') &&
                    !low.includes('pdu') &&
                    !low.includes('бмс') &&
                    !low.includes('контрол') &&
                    !low.includes('шаф') &&
                    !low.includes(' cabinet') &&
                    !low.includes('rack');

  if (isBattery && !low.includes('акумуляторна батарея') && !low.includes('акумуляторний модуль') && !low.includes('комплект')) {
    res = `Акумуляторна батарея ${res}`;
  }

  // 2. Інвертори (Гібридний інвертор / Мережевий інвертор)
  const isInverter = (low.includes('growatt') || low.includes('must') || low.includes('victron') || low.includes('solis') || low.includes('huawei') || low.includes('sun-') || low.includes('sun2000') || low.includes('s5-') || low.includes('s6-') || low.includes('ktl')) &&
                     !low.includes('інвертор') &&
                     !low.includes('акб') &&
                     !low.includes('акумул') &&
                     !low.includes('bms') &&
                     !low.includes('бмс') &&
                     !low.includes('панел') &&
                     !low.includes('батаре') &&
                     !low.includes('стійк') &&
                     !low.includes('rack') &&
                     !low.includes('smart logger') &&
                     !low.includes('datalogger') &&
                     !low.includes('stick') &&
                     !low.includes('монітор') &&
                     !low.includes('wifi') &&
                     !low.includes('модуль') &&
                     !low.includes('кабель');

  if (isInverter) {
    if (low.includes('sg') || low.includes('hyb') || low.includes('гібрид')) {
      res = `Гібридний інвертор ${res}`;
    } else {
      res = `Мережевий інвертор ${res}`;
    }
  }

  return res;
}

export function mergeSupplierProducts(
  pravylneProducts: Product[],
  bizSolarProducts: Product[],
  heliusProducts: Product[],
  solarverseProducts: Product[] = []
): Product[] {
  const mergedMap = new Map<string, Product>();
  
  // 1. Load Pravylne (Primary) products
  pravylneProducts.forEach(p => {
    const adjustedPrice = adjustSolarPanelPrice(p.name, p.price, p.mainCategory);
    const adjustedPriceVat = p.priceVat !== undefined ? adjustSolarPanelPrice(p.name, p.priceVat, p.mainCategory) : undefined;
    const key = p.id;
    const offers: SupplierOffer[] = [
      {
        supplierName: 'Правильне електроживлення',
        price: adjustedPrice,
        priceVat: adjustedPriceVat,
        currency: p.currency,
        inStock: p.inStock !== false,
        originalName: p.name,
        availabilityDate: p.availabilityDate
      }
    ];
    mergedMap.set(key, {
      ...p,
      price: adjustedPrice,
      priceVat: adjustedPriceVat,
      name: cleanAndFormatProductName(p.name),
      offers,
      selectedSupplier: 'Правильне електроживлення'
    });
  });
  
  const suppliers = [
    { name: 'БІЗ Солар', products: bizSolarProducts },
    { name: 'Хеліус', products: heliusProducts },
    { name: 'Solarverse', products: solarverseProducts }
  ];
  
  // Track which products from each supplier have been matched in Pass 1
  const matchedSupplierProductIds = new Set<string>();
  
  // 2. PASS 1: Merge Biz Solar and Helius products that match EXACTLY
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
            console.log(`[PASS 1 MATCH SUCCESS] ${supplier.name} "${supP.name}" (cat: "${supP.mainCategory}") matches "${p.name}" (cat: "${p.mainCategory}")`);
            if (!p.offers) p.offers = [];
            
            if (!p.offers.some(o => o.supplierName === supplier.name)) {
              p.offers.push({
                supplierName: supplier.name,
                price: supP.price,
                priceVat: supP.priceVat,
                currency: supP.currency,
                inStock: supP.inStock !== false,
                originalName: supP.name,
                availabilityDate: supP.availabilityDate
              });
              
              // Auto-select lowest price that is in stock
              if (supP.price < p.price && supP.inStock !== false) {
                p.price = supP.price;
                p.priceVat = supP.priceVat;
                p.currency = supP.currency;
                p.selectedSupplier = supplier.name;
              }
            }
            
            matchedSupplierProductIds.add(`${supplier.name}_${supP.id}`);
            break;
          } else {
            if (cleanSupModel && (cleanSupModel.includes('G51') || cleanSupModel.includes('F5'))) {
              console.log(`[PASS 1 MATCH FAIL] ${supplier.name} "${supP.name}" (model: "${cleanSupModel}", cat: "${supP.mainCategory}") VS "${p.name}" (model: "${cleanPModel}", cat: "${p.mainCategory}")`);
            }
          }
        }
      }
    });
  });
  
  // 3. PASS 2: Merge remaining products using substring / normalized name comparisons
  suppliers.forEach(supplier => {
    supplier.products.forEach(supP => {
      if (matchedSupplierProductIds.has(`${supplier.name}_${supP.id}`)) return;
      
      const supModel = extractModelCode(supP.name);
      const cleanSupModel = supModel ? supModel.replace(/[^A-Z0-9]/gi, '') : '';
      let matchedProduct: Product | undefined;
      
      for (const p of mergedMap.values()) {
        if (p.mainCategory !== supP.mainCategory) continue;
        
        const pModel = extractModelCode(p.name);
        const cleanPModel = pModel ? pModel.replace(/[^A-Z0-9]/gi, '') : '';
        
        // A. Substring check
        if (cleanSupModel && cleanPModel) {
          if (cleanSupModel.includes(cleanPModel) || cleanPModel.includes(cleanSupModel)) {
            if (!p.offers?.some(o => o.supplierName === supplier.name)) {
              matchedProduct = p;
              break;
            }
          }
        }
        
        // B. Normalized name comparison
        const norm1 = normalizeForComparison(p.name);
        const norm2 = normalizeForComparison(supP.name);
        
        const cleanNorm1 = norm1.replace(/deye|longi|pylontech|solax/gi, '');
        const cleanNorm2 = norm2.replace(/deye|longi|pylontech|solax/gi, '');
        
        if (cleanNorm1.includes(cleanNorm2) || cleanNorm2.includes(cleanNorm1) || norm1 === norm2) {
          if (!p.offers?.some(o => o.supplierName === supplier.name)) {
            matchedProduct = p;
            break;
          }
        }
      }
      
      const offer: SupplierOffer = {
        supplierName: supplier.name,
        price: supP.price,
        priceVat: supP.priceVat,
        currency: supP.currency,
        inStock: supP.inStock !== false,
        originalName: supP.name,
        availabilityDate: supP.availabilityDate
      };
      
      if (matchedProduct) {
        if (!matchedProduct.offers) {
          matchedProduct.offers = [];
        }
        matchedProduct.offers.push(offer);
        
        if (supP.price < matchedProduct.price && supP.inStock !== false) {
          matchedProduct.price = supP.price;
          matchedProduct.priceVat = supP.priceVat;
          matchedProduct.currency = supP.currency;
          matchedProduct.selectedSupplier = supplier.name;
        }
      } else {
        if (cleanSupModel && (cleanSupModel.includes('G51') || cleanSupModel.includes('F5'))) {
          console.log(`[PASS 2 MATCH FAIL - NEW CARD CREATED] ${supplier.name} "${supP.name}" (model: "${cleanSupModel}", cat: "${supP.mainCategory}")`);
        }
        const newProduct: Product = {
          ...supP,
          name: cleanAndFormatProductName(supP.name),
          offers: [offer],
          selectedSupplier: supplier.name
        };
        mergedMap.set(supP.id, newProduct);
      }
    });
  });
  
  // 4. Final post-processing pass: select the best supplier offer (prefer in-stock, then lowest price)
  mergedMap.forEach(p => {
    if (p.offers && p.offers.length > 0) {
      const inStockOffers = p.offers.filter(o => o.inStock !== false);
      let bestOffer = p.offers[0];
      
      if (inStockOffers.length > 0) {
        bestOffer = inStockOffers.reduce((min, o) => o.price < min.price ? o : min, inStockOffers[0]);
      } else {
        bestOffer = p.offers.reduce((min, o) => o.price < min.price ? o : min, p.offers![0]);
      }
      
      p.selectedSupplier = bestOffer.supplierName;
      p.price = bestOffer.price;
      p.priceVat = bestOffer.priceVat;
      p.currency = bestOffer.currency;
      p.inStock = bestOffer.inStock !== false;
      p.availabilityDate = bestOffer.availabilityDate;
    }
  });
  
  return Array.from(mergedMap.values());
}

// --- ОСНОВНА ФУНКЦІЯ (АВТОРИЗОВАНА ЧЕРЕЗ GAS, ГАРАНТІЯ ПРАВИЛЬНИХ ЦІН) ---
export async function fetchAllData() {
  let rates: { usd: number; eur: number; source?: string; debug?: any[] } = { usd: 44.0, eur: 51.43, source: 'default' };
  let customMaterialsFromGAS: Product[] = [];
  let gasProducts: Product[] = [];
  let solarverseProducts: Product[] = [];
  
  const startTime = performance.now();
  console.log('🚀 Завантаження каталогів постачальників (ПЕ + БІЗ + ХЕЛ + СВ)...');
  
  try {
    const [res, bizProducts, heliusProducts] = await Promise.all([
      gasRequest('getAllData'),
      fetchBizSolarProducts().catch((err: any) => {
        console.error('❌ Failed to fetch Biz Solar products:', err);
        return [] as Product[];
      }),
      fetchHeliusProducts().catch((err: any) => {
        console.error('❌ Failed to fetch Helius products:', err);
        return [] as Product[];
      })
    ]);
    
    if (res.success) {
      if (res.rates) {
        rates = {
          usd: parseFloat(sanitize(res.rates.usd || res.rates.usdRate)) || 44.0,
          eur: parseFloat(sanitize(res.rates.eur || res.rates.eurRate)) || 51.43,
          source: sanitize(res.rates.source),
          debug: res.rates.debug
        };
      }
      
      if (res.customMaterials) {
        customMaterialsFromGAS = res.customMaterials
          .filter((m: any) => {
            const cat = (m.category || '').toLowerCase();
            return !cat.includes('інвертор') && 
                   !cat.includes('панел') && 
                   !cat.includes('батаре') && 
                   !cat.includes('акб') && 
                   !cat.includes('акумул');
          })
          .map((m: any) => ({
            ...m,
            id: m.id || `c_${Math.random().toString(36).substring(7)}`,
            mainCategory: m.mainCategory || 'Власні матеріали',
            price: parseFloat(sanitize(m.price || 0)) || 0,
            currency: m.currency || 'USD',
            inStock: true
          }));
      }
      
      if (res.products && Array.isArray(res.products)) {
        gasProducts = res.products.map((p: any) => {
          const col0 = sanitizeString(p.name);
          const col1 = sanitizeString(p.price);
          const col2 = sanitizeString(p.currency);
          const col3 = sanitizeString(p.unit);
          const col4 = sanitizeString(p.description);
          const col5 = sanitizeString(p.manufacturer);
          const col6 = sanitizeString(p.power);
          const col7 = p.raw && p.raw[6] ? sanitizeString(p.raw[6]) : ''; 
          const originalName = sanitizeString(p.originalName);
          
          let mCatRaw = sanitizeString(p.mainCategory || '');
          let mainCat = mCatRaw;
          const lowMCat = mCatRaw.toLowerCase();
          
          if (lowMCat.includes('батареї') || lowMCat.includes('панелі')) mainCat = 'Сонячні батареї';
          else if (lowMCat.includes('інвертор')) mainCat = 'Інвертори';
          else if (lowMCat.includes('акб') || lowMCat.includes('акумул')) mainCat = 'АКБ та BMS';
          else if (lowMCat.includes('власні') || lowMCat.includes('свої')) mainCat = 'Власні матеріали';
          else if (lowMCat.includes('кріпл')) mainCat = 'Кріплення';
          else if (lowMCat.includes('кабель')) mainCat = 'Кабель';
          else if (lowMCat.includes('захист')) mainCat = 'Захист та Автоматика';
          else mainCat = mCatRaw || 'Інше';
          
          let name = col0;
          let desc = col3 || col4;
          let priceObj: { value: number; currency: 'USD' | 'EUR' | 'UAH' } = { value: 0, currency: 'USD' };
          
          let exactName = '';
          if (col0 === 'Фото' || col0 === '') {
            if (originalName && isNaN(Number(originalName)) && originalName.length > 2) exactName = originalName;
            else if (col1 && isNaN(Number(col1)) && col1.length > 2) exactName = col1;
          } else {
            exactName = col0;
          }
          
          if (mainCat === 'Інвертори') {
            const powerKW = col1;
            const specs = col3;
            priceObj = parsePrice(col4);
            
            name = exactName && exactName !== 'Фото' ? exactName : `Інвертор ${powerKW} kW`;
            desc = specs || (powerKW ? `Потужність: ${powerKW} kW` : '');
            
            const availability = p.raw && p.raw[7] ? sanitizeString(p.raw[7]) : '';
            if (availability.toLowerCase().includes('нема') || availability.toLowerCase().includes('відсутн')) {
              p.inStock = false;
            }
          } 
          else if (mainCat === 'АКБ та BMS') {
            name = col0;
            priceObj = parsePrice(originalName || col1);
            const tech = col3;
            const capacity = col4;
            const voltage = col5;
            desc = `Технологія: ${tech}, Ємність: ${capacity}Ah, Напруга: ${voltage}V`;
            
            const availability = p.raw && p.raw[10] ? sanitizeString(p.raw[10]) : '';
            if (availability.toLowerCase().includes('закінчились') || availability.toLowerCase().includes('нема')) {
              p.inStock = false;
            }
          } 
          else if (mainCat === 'Сонячні батареї') {
            const match = exactName.match(/\d+(?=\s*Вт|\s*W)/i) || exactName.match(/\d{3}/);
            const watts = match ? parseInt(match[0]) : 0;
            const wattPriceStr = col7;
            const parsedPrice = parsePrice(wattPriceStr);
            const isPerWatt = parsedPrice.value > 0 && parsedPrice.value < 2;
            
            name = exactName || `Сонячна панель ${watts} Вт`;
            desc = col3 || col2 || ''; 
            
            let finalPrice = parsedPrice.value;
            if (isPerWatt && watts > 0) {
              finalPrice = Math.round(parsedPrice.value * watts * 100) / 100;
            } else if (parsedPrice.value <= 0) {
              finalPrice = parsePrice(col1)?.value || 0; 
            }
            
            priceObj = { value: finalPrice, currency: parsedPrice.currency };
          } 
          else {
            name = col1;
            if (name === 'Фото' || name.length < 2) name = col0;
            priceObj = parsePrice(col3 || col4);
            desc = col4 || col3;
          }
          // Parse priceVat
          let priceVat: number | undefined = undefined;
          if (mainCat === 'Інвертори') {
            let valStr = '';
            if (p.raw && p.raw[4] !== undefined) {
              valStr = String(p.raw[4]).trim();
            }
            if (!valStr && p.subRows && p.subRows.length > 0) {
              const sub = p.subRows.find((r: any) => r[4] !== undefined && String(r[4]).trim() !== '');
              if (sub) {
                valStr = String(sub[4]).trim();
              }
            }
            if (valStr) {
              const parsed = parsePrice(valStr);
              if (parsed.value > 0) {
                priceVat = parsed.value;
              }
            }
          } 
          else if (mainCat === 'АКБ та BMS') {
            let valStr = '';
            if (p.raw && p.raw[1] !== undefined) {
              valStr = String(p.raw[1]).trim();
            }
            if (!valStr && p.subRows && p.subRows.length > 0) {
              const sub = p.subRows.find((r: any) => r[1] !== undefined && String(r[1]).trim() !== '');
              if (sub) {
                valStr = String(sub[1]).trim();
              }
            }
            if (valStr) {
              priceVat = parseVatPrice(valStr);
            }
          } 
          else if (mainCat === 'Сонячні батареї') {
            const match = exactName.match(/\d+(?=\s*Вт|\s*W)/i) || exactName.match(/\d{3}/);
            const watts = match ? parseInt(match[0]) : 0;
            
            let valStr = '';
            if (p.raw && p.raw[6] !== undefined) {
              valStr = String(p.raw[6]).trim();
            }
            if (!valStr.toLowerCase().includes('пдв') && p.subRows && p.subRows.length > 0) {
              const sub = p.subRows.find((r: any) => r[6] !== undefined && String(r[6]).toLowerCase().includes('пдв'));
              if (sub) {
                valStr = String(sub[6]).trim();
              }
            }
            if (valStr) {
              const parsedVat = parseVatPrice(valStr);
              if (parsedVat !== undefined) {
                const isPerWatt = parsedVat > 0 && parsedVat < 2;
                if (isPerWatt && watts > 0) {
                  priceVat = Math.round(parsedVat * watts * 100) / 100;
                } else {
                  priceVat = parsedVat;
                }
              }
            }
          }
          
          return {
            id: generateStableId(mainCat + name + priceObj.value),
            name, description: desc, price: priceObj.value, currency: priceObj.currency,
            priceVat,
            unit: 'шт', mainCategory: mainCat, category: sanitizeString(p.category) || mainCat, 
            inStock: p.inStock !== undefined ? p.inStock : true,
            availabilityDate: p.availabilityDate
          };
        }).filter((p: any) => p.name.length > 2 && p.name !== 'Фото' && p.price > 0);
      }
      
      if (res.solarverseProducts && Array.isArray(res.solarverseProducts)) {
        solarverseProducts = res.solarverseProducts.map((p: any) => {
          return {
            id: p.id || `sv_${Math.random().toString(36).substring(7)}`,
            name: sanitizeString(p.name),
            originalName: sanitizeString(p.originalName || p.name),
            price: parseFloat(p.price) || 0,
            priceVat: p.priceVat ? parseFloat(p.priceVat) : undefined,
            currency: (p.currency || 'USD') as 'USD' | 'EUR' | 'UAH',
            unit: sanitizeString(p.unit || 'шт'),
            description: sanitizeString(p.description || ''),
            manufacturer: sanitizeString(p.manufacturer || ''),
            mainCategory: sanitizeString(p.mainCategory || 'Інше'),
            category: sanitizeString(p.category || p.mainCategory || 'Інше'),
            inStock: p.inStock !== false,
            availabilityDate: p.availabilityDate
          };
        }).filter((p: any) => p.name.length > 2 && p.price > 0);
      }
    }
    
    // Merge Pravylne Elektrozhivlenya, Biz Solar, Helius, and Solarverse products
    const products = mergeSupplierProducts(gasProducts, bizProducts, heliusProducts, solarverseProducts);
    
    const endTime = performance.now();
    console.log(`⚡ Каталоги завантажено та злито за ${Math.round(endTime - startTime)}мс! Усього згрупованих товарів: ${products.length}`);
    return { rates, products, customMaterials: customMaterialsFromGAS };
  } catch (error) {
    console.error('Fetch all failed:', error);
    return null;
  }
}

// --- КУРСИ ВАЛЮТ (Швидкий проксі) ---
export async function fetchRates() {
  console.log('📡 Отримання курсів валют...');
  
  // 1. Спробуємо Hoverla напряму з браузера (оскільки IP користувача не заблоковано Cloudflare)
  try {
    const payload = {
      operationName: "Point",
      variables: { alias: "goverla-ua" },
      query: "query Point($alias: Alias!) { point(alias: $alias) { rates { currency { codeAlpha } bid { absolute } ask { absolute } } } }"
    };
    const response = await fetch('https://api.goverla.ua/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const data = await response.json();
      const rates = data?.data?.point?.rates || [];
      const usdRateObj = rates.find((r: any) => r.currency.codeAlpha === 'USD');
      const eurRateObj = rates.find((r: any) => r.currency.codeAlpha === 'EUR');
      
      const usd = usdRateObj ? usdRateObj.ask.absolute / 100 : 0;
      const eur = eurRateObj ? eurRateObj.ask.absolute / 100 : 0;
      
      if (usd > 0 && eur > 0) {
        console.log('✅ Курси отримано напряму з Hoverla:', { usd, eur });
        return { usd, eur, source: 'hoverla_direct' };
      }
    }
  } catch (err) {
    console.warn('⚠️ Direct Hoverla request failed, trying Vercel...');
  }

  // 2. Спробуємо спеціальний надійний проксі на Vercel
  try {
    const response = await fetch('/api/fetch-rates');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Курси отримано через Vercel API:', data);
      return { usd: data.usd, eur: data.eur, source: 'vercel_api' };
    }
  } catch (err) {
    console.warn('⚠️ Vercel Proxy for rates failed, trying GAS...');
  }

  // 3. Якщо проксі впав, пробуємо GAS
  try {
    const res = await gasRequest('getRates');
    if (res.success && res.usd && res.eur) {
      console.log('✅ Курси отримано через GAS:', res);
      return { usd: res.usd, eur: res.eur, source: 'gas' };
    }
  } catch (e) {
    console.error('❌ GAS fetch for rates failed:', e);
  }

  // 4. Якщо все провалилося — повертаємо об'єкт помилки
  return { 
    usd: null, 
    eur: null, 
    error: '⚠️ Не вдалося оновити курси валют з Hoverla.ua. Будь ласка, спробуйте пізніше.' 
  };
}

export async function fetchAllProducts() {
  const data = await fetchAllData();
  return data ? data.products : [];
}

export async function saveProposalToSheet(proposal: any) {
  return gasRequest('saveProposal', { proposal });
}

export async function fetchProposalsHistory() {
  const res = await gasRequest('getProposals');
  if (!res || !res.success) {
    throw new Error(res?.error || 'Не вдалося завантажити історію з Google Sheets');
  }
  return res.proposals || [];
}

export async function deleteProposalFromSheet(proposalId: string) {
  return gasRequest('deleteProposal', { proposalId });
}

export async function addCustomMaterial(material: any) {
  return gasRequest('addCustomMaterial', { product: material });
}

export async function deleteCustomMaterial(id: string) {
  return gasRequest('deleteCustomMaterial', { productId: id });
}

export async function updateMaterialPrice(id: string, price: number) {
  return gasRequest('updateMaterialPrice', { id, priceUsd: price });
}

function normalizeForSearch(str: string): string {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/а/g, 'a')
    .replace(/в/g, 'b')
    .replace(/е/g, 'e')
    .replace(/о/g, 'o')
    .replace(/с/g, 'c')
    .replace(/х/g, 'x')
    .replace(/р/g, 'p')
    .replace(/і/g, 'i')
    .replace(/к/g, 'k')
    .replace(/н/g, 'h')
    .replace(/м/g, 'm')
    .replace(/т/g, 't')
    .replace(/у/g, 'y');
}

export function normalizeForComparison(str: string): string {
  if (!str) return '';
  return normalizeForSearch(str).trim().replace(/[\s\W_]/g, '');
}

export function searchProducts(products: Product[], query: string): Product[] {
  const words = query.trim().split(/\s+/).map(w => normalizeForSearch(w)).filter(w => w.length > 0);
  
  if (words.length === 0) return products;

  const filtered = products.filter(p => {
    const name = normalizeForSearch(p.name);
    const desc = p.description ? normalizeForSearch(p.description) : '';
    const manufacturer = p.manufacturer ? normalizeForSearch(p.manufacturer) : '';
    const category = p.category ? normalizeForSearch(p.category) : '';
    const mainCategory = p.mainCategory ? normalizeForSearch(p.mainCategory) : '';
    
    // Normalize and group supplier names for easy searching (e.g. typing "СВ" or "ПЕ")
    const supplierNames = p.offers ? normalizeForSearch(p.offers.map(o => {
      const sName = o.supplierName.toLowerCase();
      if (sName.includes('solarverse')) return 'solarverse св sv';
      if (sName.includes('правильне')) return 'правильне електроживлення пе pe';
      if (sName.includes('біз')) return 'біз солар біз biz';
      if (sName.includes('хеліус')) return 'хеліус хел helius';
      return sName;
    }).join(' ')) : '';
    
    return words.every(word => {
      const isShortNumber = /^\d+$/.test(word) && word.length < 3;

      // 1. Direct match in fields (bypass name/desc substring matching for short numbers to prevent false positives like 230V matching 30)
      if (
        (!isShortNumber && (name.includes(word) || desc.includes(word))) ||
        manufacturer.includes(word) || 
        category.includes(word) || 
        mainCategory.includes(word) ||
        supplierNames.includes(word)
      ) {
        return true;
      }
      
      // 2. Exact match rules for numbers (e.g. 6 in "SUN-6K")
      if (isShortNumber) {
        const numRegex = new RegExp(`\\b${word}\\b|\\b${word}k|\\b${word}кв|-` + word + `k|/` + word + `|\\b${word}w`, 'i');
        return numRegex.test(name) || numRegex.test(desc);
      }
      
      // 3. Special manufacturer code heuristics:
      // If searching for "deye" (or "деє"), match Deye model codes (SE-, SUN-\d, SG-\d, SG\d) while excluding Huawei SUN2000
      if (word === 'deye' || word === 'деє') {
        return /se-|sun-\d|sg-\d|sg\d/i.test(p.name);
      }
      
      // If searching for "pylontech" (or "пілонтех", "пилонтех"), match US2000, US3000, US5000, Force L2
      if (word === 'pylontech' || word === 'пілонтех' || word === 'пилонтех' || word === 'пайлонтех') {
        return /\bus\d{4}\b|\bforce\b/i.test(p.name);
      }
      
      return false;
    });
  });

  // Score and sort by relevancy
  return filtered.map(p => {
    const name = normalizeForSearch(p.name);
    const desc = p.description ? normalizeForSearch(p.description) : '';
    const manufacturer = p.manufacturer ? normalizeForSearch(p.manufacturer) : '';
    let score = 0;
    
    words.forEach(word => {
      // 1. Exact token match (e.g. "6" matching "6K" or "6" surrounded by non-alphanumeric/boundaries)
      const exactRegex = new RegExp(`\\b${word}\\b`, 'i');
      const kwRegex = new RegExp(`\\b${word}k`, 'i');
      
      if (exactRegex.test(name) || kwRegex.test(name)) {
        score += 100;
      } else {
        // Check if the number is matched exactly as part of power spec, e.g. "SUN-6K" contains "6"
        const modelPowerRegex = new RegExp(`-${word}k\\b`, 'i');
        if (modelPowerRegex.test(name)) {
          score += 80;
        } else if (name.includes(word)) {
          score += 10;
        } else if (desc.includes(word)) {
          score += 5;
        } else if (manufacturer.includes(word)) {
          score += 20;
        }
      }
      
      // If the query is just a single digit like "6", and it matches inside "16" or "60", it's a very low score
      // Let's penalize if it's part of another number: e.g. "16", "60", "26", etc.
      const otherNumberRegex = new RegExp(`\\d+${word}|${word}\\d+`, 'g');
      if (otherNumberRegex.test(name) && !exactRegex.test(name) && !kwRegex.test(name)) {
        score -= 40;
      }
    });

    return { product: p, score };
  })
  .sort((a, b) => b.score - a.score)
  .map(item => item.product);
}
