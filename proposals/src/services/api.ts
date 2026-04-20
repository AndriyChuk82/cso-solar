import { CONFIG } from '../config';
import type { Product } from '../types';

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

function parsePrice(str: string): { value: number; currency: string } {
  if (!str) return { value: 0, currency: 'USD' };
  let s = str.trim();
  let currency = 'USD';

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
    
    // Спеціальний лог для налагодження курсів
    if (action === 'getAllData' && result.rates && result.rates.debug) {
      console.log('🐞 Hoverla Debug Info:', result.rates.debug);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ GAS error (${action}):`, error);
    return { success: false };
  }
}

// --- ОСНОВНА ФУНКЦІЯ (нова) ---
export async function fetchAllData() {
  const products: Product[] = [];
  let rates: { usd: number; eur: number; source?: string; debug?: any[] } = { usd: 44.0, eur: 51.43, source: 'default' };
  let customMaterialsFromGAS: Product[] = [];

  try {
    const res = await gasRequest('getAllData');
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
        const mapped = res.products.map((p: any) => {
          const col0 = sanitizeString(p.name);
          const col1 = sanitizeString(p.price);
          const col2 = sanitizeString(p.currency);
          const col3 = sanitizeString(p.unit);
          const col4 = sanitizeString(p.description);
          const col5 = sanitizeString(p.manufacturer);
          const col6 = sanitizeString(p.power);
          const col7 = p.raw && p.raw[6] ? sanitizeString(p.raw[6]) : ''; // Стовпець G (7-й)
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
          let priceObj = { value: 0, currency: 'USD' };

          // Витягуємо точну назву для тих таблиць, де перша колонка це "Фото"
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

            // Стовпець H (index 7) - Наявність
            const availability = p.raw && p.raw[7] ? sanitizeString(p.raw[7]) : '';
            if (availability.toLowerCase().includes('нема') || availability.toLowerCase().includes('відсутн')) {
              p.inStock = false;
            }
          } 
          else if (mainCat === 'АКБ та BMS') {
            // Для АКБ col0 - це завжди назва
            name = col0;
            // originalName зберігає сиру ціну ("800 гот / 960 з ПДВ")
            priceObj = parsePrice(originalName || col1);
            // Дані зміщені бекендом: unit=row[2], description=row[3], manufacturer=row[4]
            const tech = col3; // LiFePO4
            const capacity = col4; // 100
            const voltage = col5; // 51.2
            desc = `Технологія: ${tech}, Ємність: ${capacity}Ah, Напруга: ${voltage}V`;

            // Стовпець K (col9 -> index 9) - Наявність для АКБ
            const availability = p.raw && p.raw[9] ? sanitizeString(p.raw[9]) : '';
            if (availability.toLowerCase().includes('закінчились')) {
              p.inStock = false;
            }
          } 
          else if (mainCat === 'Сонячні батареї') {
            const match = exactName.match(/\d+(?=\s*Вт|\s*W)/i) || exactName.match(/\d{3}/);
            const watts = match ? parseInt(match[0]) : 0;
            const wattPriceStr = col7;
            const parsedPrice = parsePrice(wattPriceStr);
            const isPerWatt = parsedPrice.value > 0 && parsedPrice.value < 2;

            // Точна назва (наприклад: "Longi Solar LR8-66HGD-620M Bificial")
            name = exactName || `Сонячна панель ${watts} Вт`;
            // Опис - це технічні характеристики (наприклад: "605 Вт, 12 BB, N type")
            desc = col3 || col2 || ''; 
            
            let finalPrice = parsedPrice.value;
            if (isPerWatt && watts > 0) {
              finalPrice = Math.round(parsedPrice.value * watts * 100) / 100;
            } else if (parsedPrice.value <= 0) {
              finalPrice = parsePrice(col1)?.value || 0; 
            }

            priceObj = { value: finalPrice, currency: parsedPrice.currency || 'USD' };
          } 
          else {
            name = col1;
            if (name === 'Фото' || name.length < 2) name = col0;
            priceObj = parsePrice(col3 || col4);
            desc = col4 || col3;
          }

          return {
            id: generateStableId(mainCat + name + priceObj.value),
            name, description: desc, price: priceObj.value, currency: priceObj.currency,
            unit: 'шт', mainCategory: mainCat, category: sanitizeString(p.category) || mainCat, 
            inStock: p.inStock !== undefined ? p.inStock : true
          };
        }).filter((p: any) => p.name.length > 2 && p.name !== 'Фото' && p.price > 0);

        products.push(...mapped);
      }
    }
    return { rates, products, customMaterials: customMaterialsFromGAS };
  } catch (error) {
    console.error('Fetch all failed:', error);
    return null;
  }
}

// --- ВІДНОВЛЕНІ ФУНКЦІЇ ДЛЯ СУМІСНОСТІ ТА БІЛДУ ---

export async function fetchRates() {
  console.log('📡 Отримання курсів валют...');
  
  // 1. Спочатку пробуємо через GAS
  try {
    const data = await fetchAllData();
    if (data && data.rates && data.rates.source !== 'default') {
      console.log('✅ Курси отримано через GAS:', data.rates);
      return data.rates;
    }
  } catch (e) {
    console.warn('⚠️ GAS fetch failed, trying Vercel proxy...');
  }
  
  // 2. Спеціальний надійний проксі на Vercel
  console.log('🚀 Пробуємо отримати курси через Vercel API...');
  try {
    const response = await fetch('/api/fetch-rates');
    if (response.ok) {
      const data = await response.json();
      console.log('✅✅ Курси отримано через Vercel API:', data);
      return { usd: data.usd, eur: data.eur };
    }
  } catch (err) {
    console.error('❌ Vercel Proxy failed:', err);
  }

  // 3. Якщо все провалилося — дефолтні значення
  return { usd: 44.0, eur: 51.43 };
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
  return res.success ? res.proposals : [];
}

export async function addCustomMaterial(material: any) {
  return gasRequest('addCustomMaterial', { material });
}

export async function deleteCustomMaterial(id: string) {
  return gasRequest('deleteCustomMaterial', { id });
}

export async function updateMaterialPrice(id: string, price: number) {
  return gasRequest('updateMaterialPrice', { id, price });
}

function normalizeForSearch(str: string): string {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/а/g, 'a')
    .replace(/в/g, 'b') // Cyrillic в -> Latin b
    .replace(/е/g, 'e')
    .replace(/о/g, 'o')
    .replace(/с/g, 'c')
    .replace(/х/g, 'x')
    .replace(/р/g, 'p')
    .replace(/і/g, 'i');
}

export function searchProducts(products: Product[], query: string): Product[] {
  const words = query.trim().split(/\s+/).map(w => normalizeForSearch(w)).filter(w => w.length > 0);
  
  if (words.length === 0) return products;

  return products.filter(p => {
    const name = normalizeForSearch(p.name);
    
    // Всі слова запиту повинні бути в назві
    return words.every(word => name.includes(word));
  });
}
