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

/**
 * Парсить ціну згідно з інструкцією PRICE_PARSING_FIX.md
 * Обробляє формати "800 гот / 960 з ПДВ"
 */
function parsePrice(str: string): { value: number; currency: string } {
  if (!str) return { value: 0, currency: 'USD' };
  let s = str.trim();
  let currency = 'USD';

  if (s.includes('€')) currency = 'EUR';
  if (s.includes('₴') || s.toLowerCase().includes('грн')) currency = 'UAH';

  // Якщо формат "гот / пдв", беремо перше число
  if (s.toLowerCase().includes('гот') || s.includes('/')) {
    const match = s.match(/[\d\s,.]+/);
    if (match) {
      s = match[0];
    }
  }

  // Очистка від символів валют
  s = s.replace(/[$€₴]|грн/gi, '').trim();
  s = s.replace(/\s/g, ''); // видаляємо пробіли-розділювачі (1 200 -> 1200)
  s = s.replace(',', '.');

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

async function gasRequest(action: string, data: any = {}) {
  try {
    const response = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...data })
    });
    return await response.json();
  } catch (error) {
    console.error(`GAS failed (${action}):`, error);
    return { success: false };
  }
}

export async function fetchAllData() {
  const products: Product[] = [];
  let rates = { usd: 41.5, eur: 51.0 };
  let customMaterialsFromGAS: Product[] = [];

  try {
    const res = await gasRequest('getAllData');
    if (res.success) {
      if (res.rates) {
        rates = {
          usd: parseFloat(sanitize(res.rates.usd || res.rates.usdRate)) || 41.5,
          eur: parseFloat(sanitize(res.rates.eur || res.rates.eurRate)) || 51.0
        };
      }

      if (res.customMaterials) {
        customMaterialsFromGAS = res.customMaterials.map((m: any) => ({
          ...m,
          id: m.id || `c_${Math.random().toString(36).substring(7)}`,
          mainCategory: m.mainCategory || 'Власні матеріали',
          price: parseFloat(sanitize(m.price || 0)) || 0,
          currency: 'USD',
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

          if (mainCat === 'Інвертори') {
            const powerKW = col1;
            const specs = col3;
            priceObj = parsePrice(col5 || col4); // Retail || Wholesale
            name = `Інвертор Deye ${powerKW} kW`;
            if (specs.toLowerCase().includes('huawei')) name = name.replace('Deye', 'Huawei');
            else if (specs.toLowerCase().includes('solis')) name = name.replace('Deye', 'Solis');
            desc = specs;
          } 
          else if (mainCat === 'АКБ та BMS') {
            name = col0;
            if (name === 'Фото') name = col1;
            priceObj = parsePrice(col1); // Ціна завжди в Col 1 для АКБ
            desc = `Технологія: ${col2}, Ємність: ${col3}Ah, Напруга: ${col4}V`;
          } 
          else if (mainCat === 'Сонячні батареї') {
            const watts = parseInt(col1) || parseInt(col3.match(/\d+/)?.[0] || '0') || 0;
            const wattPriceStr = col6 || col5 || col4;
            const parsed = parsePrice(wattPriceStr);
            
            name = `Сонячна панель ${watts} Вт`;
            desc = col3;
            
            if (parsed.value > 0 && parsed.value < 2) {
              priceObj = { value: Math.round(parsed.value * watts * 100) / 100, currency: parsed.currency };
            } else {
              priceObj = parsed;
            }
          } 
          else {
            name = col1;
            if (name === 'Фото' || name.length < 2) name = col0;
            priceObj = parsePrice(col3 || col4); // За замовчуванням
            desc = col4 || col3;
          }

          return {
            id: generateStableId(mainCat + name + priceObj.value),
            name,
            description: desc,
            price: priceObj.value,
            currency: priceObj.currency,
            unit: 'шт',
            mainCategory: mainCat,
            category: sanitizeString(p.category) || mainCat,
            inStock: true
          };
        }).filter(p => p.name.length > 2 && p.name !== 'Фото' && p.price > 0);

        products.push(...mapped);
      }
    }

    return { rates, products, customMaterials: customMaterialsFromGAS };
  } catch (error) {
    console.error('Fetch all failed:', error);
    return null;
  }
}
