import { Product, Category, Proposal } from '../types';
import { CONFIG, getGoogleSheetsUrl } from '../config';
import { parsePrice, generateStableId } from '../utils/priceParser';

/**
 * Виконує запит до Google Apps Script
 */
async function gasRequest(action: string, params: any = {}): Promise<any> {
  try {
    const body = { action, ...params };
    const response = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (e) {
    console.error('GAS Request Error:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Завантажує історію пропозицій з Google Sheets
 */
export async function fetchProposalsHistory(): Promise<Proposal[]> {
  try {
    const res = await gasRequest('getProposals');
    if (res.success && res.proposals) {
      return res.proposals.map((p: any) => ({
        id: p.id,
        number: p.number,
        date: p.date,
        clientName: p.clientName,
        clientPhone: p.clientPhone,
        clientEmail: p.clientEmail || '',
        clientAddress: p.clientAddress || '',
        items: (p.items || []).map((it: any) => ({
          id: it.id || `item_${Date.now()}_${Math.random()}`,
          productId: it.productId || '',
          product: {
            id: it.productId || '',
            name: it.productName,
            category: it.category || '',
            mainCategory: it.mainCategory || '',
            price: it.price,
            currency: it.currency || 'USD',
            unit: it.unit || 'шт',
          },
          quantity: it.quantity,
          costPrice: it.costPrice || it.price / (1 + (p.markup || 15) / 100),
          price: it.price,
          total: it.price * it.quantity,
          name: it.productName,
          unit: it.unit || 'шт',
        })),
        subtotal: p.subtotal || p.totalAmount,
        markup: p.markup || 15,
        total: p.totalAmount,
        currency: p.currency || 'USD',
        notes: p.comment || '',
        seller: p.seller || { id: 'fop_pastushok' },
        status: p.status === 'Надіслано' ? 'sent' : 'draft',
        createdAt: p.createdAt || p.updatedAt,
        updatedAt: p.updatedAt,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch proposals history:', error);
  }
  return [];
}

/**
 * Зберігає пропозицію в Google Sheets
 */
export async function saveProposalToSheet(proposal: Proposal): Promise<boolean> {
  try {
    const gasProposal = {
      id: proposal.id,
      number: proposal.number,
      date: proposal.date,
      clientName: proposal.clientName,
      clientPhone: proposal.clientPhone,
      courseUSD: 41.5, // Можна взяти з settings
      markup: proposal.markup,
      totalAmount: proposal.total,
      status: proposal.status === 'sent' ? 'Надіслано' : 'Чернетка',
      comment: proposal.notes,
      items: proposal.items.map(item => ({
        productName: item.name || item.product.name,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit || item.product.unit,
      })),
      updatedAt: proposal.updatedAt,
    };

    const res = await gasRequest('saveProposal', { proposal: gasProposal });
    return res.success;
  } catch (error) {
    console.error('Failed to save proposal to sheet:', error);
    return false;
  }
}

/**
 * Очищає дані від об'єктів Google Sheets (наприклад {valueType: ...})
 */
function sanitize(val: any): any {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    // Якщо це складний об'єкт комірки Google, спробуємо дістати значення
    return sanitize(val.value || val.formattedValue || '');
  }
  return val;
}

/**
 * Примусово перетворює значення на рядок (для безпечних операцій .toLowerCase())
 */
function sanitizeString(val: any): string {
  const sanitized = sanitize(val);
  return sanitized !== null && sanitized !== undefined ? String(sanitized).trim() : '';
}

/**
 * Завантажує всі дані одним запитом (швидше ніж окремі запити)
 */
export async function fetchAllData(): Promise<{
  rates: { usd: number; eur: number };
  products: Product[];
  customMaterials: Product[];
} | null> {
  try {
    const res = await gasRequest('getAllData');
    if (res.success) {
      if (res.products && res.products.length > 0) {
        console.log('📦 GAS Products Count:', res.products.length);
        console.log('📦 GAS Sample (first 10):', res.products.slice(0, 10));
      }

      // Очищуємо всі товари та курси від можливих об'єктів Google
      const products = (res.products || []).map((p: any) => {
        // "Розумний" мапінг полів
        const name = sanitizeString(p.name || p.productName || p.model || p.назва || p.модель || p.Модель || '');
        const desc = sanitizeString(p.description || p.desc || p.характеристики || p.опис || '');
        let category = sanitizeString(p.category || p.категорія || '');
        let mainCategory = sanitizeString(p.mainCategory || p.головна_категорія || '');
        const priceVal = parseFloat(sanitize(p.price || p.priceUsd || p.ціна || p.Ціна || 0)) || 0;
        
        // Якщо категорії пусті, пробуємо вгадати за назвою (тільки якщо це не "Фото")
        if (name && name.toLowerCase() !== 'фото' && !mainCategory) {
          const n = name.toLowerCase();
          if (n.includes('inverter') || n.includes('інвертор') || n.includes('solis') || n.includes('deye') || n.includes('huawei')) {
            mainCategory = 'Інвертори';
          } else if (n.includes('solar') || n.includes('панель') || n.includes('модуль') || n.includes('ja') || n.includes('longi') || n.includes('trina')) {
            mainCategory = 'Сонячні батареї';
          } else if (n.includes('batt') || n.includes('акб') || n.includes('pylontech') || n.includes('dyness')) {
            mainCategory = 'АКБ та BMS';
          }
        }

        return {
          id: sanitizeString(p.id) || generateStableId(mainCategory + '_' + name + '_' + priceVal),
          name,
          description: desc,
          price: priceVal,
          currency: sanitizeString(p.currency || p.валюта) || 'USD',
          unit: sanitizeString(p.unit || p.од_вим) || 'шт',
          category: category || mainCategory,
          mainCategory: mainCategory,
          subCategory: sanitizeString(p.subCategory || ''),
          inStock: p.inStock !== false && p.active !== false,
        };
      }).filter((p: any) => {
        const nameLower = p.name.toLowerCase();
        // Відфільтровуємо заголовки та пусті рядки
        return nameLower.length > 0 && 
               nameLower !== 'фото' && 
               nameLower !== 'модель' && 
               nameLower !== 'назва' &&
               p.price > 0;
      });

      const rates = {
        usd: parseFloat(sanitize(res.rates?.usd || res.usdRate)) || 41.5,
        eur: parseFloat(sanitize(res.rates?.eur || res.eurRate)) || 51.0
      };

      return {
        rates,
        products,
        customMaterials: res.customMaterials || []
      };
    }
  } catch (error) {
    console.error('Failed to fetch all data:', error);
  }
  return null;
}

/**
 * Отримує курси валют з API
 */
export async function fetchRates(): Promise<{ usd: number; eur: number } | null> {
  // 1. Спробуємо наш власний Serverless API (найнадійніший метод у продакшні)
  try {
    const res = await fetch('/api/fetch-rates');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.usd && data.eur) {
        return { usd: data.usd, eur: data.eur };
      }
    }
  } catch (e) {
    console.warn('Local /api/fetch-rates failed', e);
  }

  // 2. Спробуємо через Google Apps Script
  try {
    const res = await gasRequest('getRates');
    if (res.success && res.usd && res.eur) {
      return { usd: Number(res.usd), eur: Number(res.eur) };
    }
  } catch (e) {
    console.warn('GAS Rates failed', e);
  }

  // 3. Резерв 1: Говерла через нативний /api/proxy (без corsproxy.io)
  try {
    const payload = {
      operationName: "Point",
      variables: { alias: "goverla-ua" },
      query: "query Point($alias: Alias!) { point(alias: $alias) { rates { currency { codeAlpha } bid { absolute } ask { absolute } } } }"
    };
    
    // Використовуємо власний проксі для Говерли
    const govRes = await fetch(`/api/proxy?url=${encodeURIComponent('https://api.goverla.ua/graphql')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (govRes.ok) {
      const data = await govRes.json();
      const rates = data?.data?.point?.rates || [];
      const usdObj = rates.find((r: any) => r.currency.codeAlpha === 'USD');
      const eurObj = rates.find((r: any) => r.currency.codeAlpha === 'EUR');
      if (usdObj && eurObj) {
        return {
          usd: usdObj.ask.absolute / 100,
          eur: eurObj.ask.absolute / 100
        };
      }
    }
  } catch (e) {
    console.warn('Goverla fallback failed', e);
  }

  // 4. Резервний випадок 2: PrivatBank API 
  try {
    const pbRes = await fetch('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');
    if (pbRes.ok) {
      const data = await pbRes.json();
      const usdObj = data.find((r: any) => r.ccy === 'USD');
      const eurObj = data.find((r: any) => r.ccy === 'EUR');
      if (usdObj && eurObj) {
        return {
          usd: parseFloat(usdObj.sale),
          eur: parseFloat(eurObj.sale)
        };
      }
    }
  } catch (e) {
    console.warn('PrivatBank fallback failed:', e);
  }

  // 4. Якщо все впало
  return null;
}



/**
 * Парсить CSV рядок у масив рядків/стовпців (точно як у старому app.js)
 */
function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
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

/**
 * Завантажує продукти з листа через CSV-export (зберігає текст "800 гот / 960 з ПДВ")
 * Використовує внутрішній проксі щоб обійти CORS.
 * Це основний метод — точно як у старому app.js.
 */
async function fetchSheetProductsViaCSV(sheetConfig: any): Promise<Product[]> {
  const spreadsheetId = sheetConfig.spreadsheetId || CONFIG.SPREADSHEET_ID;
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetConfig.gid}`;
  
  // Перебираємо проксі з конфігу якщо перший не спрацював
  const proxies = CONFIG.CORS_PROXIES;
  let lastError: any = null;

  for (const proxy of proxies) {
    try {
      const url = proxy ? `${proxy}${encodeURIComponent(exportUrl)}` : exportUrl;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const csv = await resp.text();
      if (!csv || csv.length < 50) continue;
      
      console.log(`✅ Дані з "${sheetConfig.name}" завантажено через ${proxy || 'direct'}`);
      return parseSheetProductsFromCSV(csv, sheetConfig);
    } catch (e) {
      lastError = e;
      continue;
    }
  }

  throw lastError || new Error(`Failed to fetch CSV for ${sheetConfig.name} after trying all proxies`);
}

/**
 * Парсить CSV у масив продуктів — логіка ідентична parseSheetCSV у старому app.js
 */
function parseSheetProductsFromCSV(csv: string, sheetConfig: any): Product[] {
  const rows = parseCSV(csv);
  if (rows.length < 2) return [];

  const products: Product[] = [];
  let fallbackCategory = sheetConfig.name;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const col0 = (row[0] || '').trim();
    const col1 = (row[1] || '').trim();
    const col2 = (row[2] || '').trim();
    const col3 = (row[3] || '').trim();
    const col4 = (row[4] || '').trim();
    const col5 = (row[5] || '').trim();
    const col6 = (row[6] || '').trim();
    const col10 = (row[10] || '').trim();

    if (sheetConfig.name === 'ДОВІДНИК_ТОВАРІВ') {
      const modelName = col1;
      if (!modelName || modelName.toLowerCase() === 'модель' || modelName.toLowerCase() === 'назва') continue;
      
      const cat = col2 || 'Різне';
      const priceStr = col4 || col10 || col3; // Спробуємо знайти ціну
      const p = parsePrice(priceStr);

      products.push({
        id: generateStableId(sheetConfig.mainCat + '_' + cat + '_' + modelName) + `_${i}`,
        mainCategory: sheetConfig.mainCat,
        subCategory: cat,
        category: `${sheetConfig.mainCat} - ${cat}`,
        name: modelName,
        description: col5 || '', // Додаємо характеристики якщо є
        unit: col3 || 'шт',
        price: p ? p.value : 0,
        currency: p ? (p.currency as 'USD' | 'EUR' | 'UAH') : 'USD',
      });
      continue;
    }

    const hasProductData = col2 || col3 || col4 || col5 || col6 || col10;
    let isCatRow = (col0 && !col1 && col0.length < 50);
    let model = col1;
    let desc = col2;
    // За замовчуванням: ціна в col3/col4, fallback на col10 (Наявність)
    let priceStr = col3 || col4 || col10;

    if (sheetConfig.name === 'АКБ') {
      isCatRow = (col0 && !col1 && !hasProductData && col0.length < 50);
      model = col0;
      desc = col2 ? `Технологія: ${col2}, Ємність: ${col3 || ''}Ah, Напруга: ${col4 || ''}V` : '';
      // Ціна в колонці B, якщо порожня - беремо з колонки K (Наявність/коментарі)
      priceStr = col1 || col10;
    } else if (sheetConfig.name === 'Сонячні батареї') {
      // Ціна в G/F/E, якщо порожня - беремо з колонки K (Наявність/коментарі)
      priceStr = col6 || col5 || col4 || col10;
    }

    if (isCatRow) {
      const catName = col0 || '';
      if (catName.toLowerCase().includes('фото') || catName.toLowerCase().includes('акб lifepo4')) continue;
      fallbackCategory = catName;
      continue;
    }

    if (model && model.toLowerCase() !== 'модель') {
      let subCat = fallbackCategory;

      if (sheetConfig.name === 'АКБ') {
        const modelLower = model.toLowerCase();
        const combined = modelLower + ' ' + fallbackCategory.toLowerCase();
        const isDeyeBrand = combined.includes('deye') || /se-g|se-f|rw-m|rw-f|bos-g|bos-b|gb-lm|gb-lbs|pro[- ]*[вb]/i.test(modelLower);
        const isBMS = modelLower.includes('bms');
        if (!isDeyeBrand && !isBMS) continue;
        subCat = isBMS ? 'BMS / Контролери' : 'Deye';
      } else if (sheetConfig.mainCat === 'Інвертори') {
        const modelLower = model.toLowerCase();
        const combined = modelLower + ' ' + fallbackCategory.toLowerCase();
        let foundBrand = '';
        if (combined.includes('deye')) foundBrand = 'Deye';
        else if (combined.includes('solis')) foundBrand = 'Solis';
        else if (combined.includes('prosolax') || combined.includes('solax')) foundBrand = 'Prosolax';
        else if (combined.includes('huawei') || /\bsun/i.test(modelLower) || combined.includes('luna2000')) {
          foundBrand = (combined.includes('аксесуар') || combined.includes('luna2000') || combined.includes('dongle') || combined.includes('smart power sensor')) ? 'Аксесуари для Huawei' : 'Huawei';
        }
        if (!foundBrand) continue;
        subCat = foundBrand;
      } else if (sheetConfig.name !== 'АКБ' && col0 && col0.toLowerCase() !== 'фото') {
        subCat = col0;
      }

      if (model.toLowerCase().includes('bms')) subCat = 'BMS / Контролери';

      const p = parsePrice(priceStr);
      let priceVal = 0;
      let currency = p ? p.currency : 'USD';

      if (sheetConfig.name === 'Сонячні батареї') {
        const wattMatch = (model + ' ' + desc).match(/(\d+)\s*(?:Вт|W)/i);
        if (wattMatch && p && p.value < 1.0) {
          priceVal = parseInt(wattMatch[1], 10) * p.value;
        } else if (p) {
          priceVal = p.value;
        }
      } else if (p) {
        priceVal = p.value;
      }

      if (priceVal === 0) {
        console.warn(`⚠️ [CSV] Ціна = 0 для: ${model} | priceStr="${priceStr}"`);
      }

      products.push({
        id: generateStableId(sheetConfig.mainCat + '_' + subCat + '_' + model.trim()) + `_${i}`,
        mainCategory: sheetConfig.mainCat,
        subCategory: subCat,
        category: `${sheetConfig.mainCat} - ${subCat}`,
        name: model,
        description: desc,
        price: priceVal,
        currency: currency as 'USD' | 'EUR' | 'UAH',
        unit: 'шт',
        inStock: true,
      });
    }
  }
  return products;
}


/**
 * Завантажує всі продукти з Google Sheets.
 * Працює через CSV-експорт проксі-сервером для закритої таблиці,
 * що дозволяє успішно розбирати текст типу "800 гот / 960 з ПДВ".
 *

 * @param eurToUsdRate - Курс EUR/USD для конвертації цін (якщо не вказано, EUR залишається без змін)
 */
export async function fetchAllProducts(eurToUsdRate?: number): Promise<{
  products: Product[];
  categories: Category[];
}> {
  try {
    console.log('Loading products from Google Sheets...');
    let allProducts: Product[] = [];

    // МЕТОД 1: Google Apps Script (GAS) — Найнадійніший для закритих таблиць
    try {
      const res = await gasRequest('getAllData');
      if (res.success && res.products && res.products.length > 0) {
        console.log(`✅ [GAS] Завантажено ${res.products.length} товарів`);
        allProducts = res.products.map((p: any) => ({
          ...p,
          id: p.id || generateStableId(p.mainCategory + '_' + (p.subCategory || p.category) + '_' + p.name)
        }));
      }
    } catch (e) {
      console.warn('⚠️ GAS getAllData не вдався, пробуємо CSV...', e);
    }

    // МЕТОД 2: CSV через проксі (якщо GAS не повернув дані)
    if (allProducts.length === 0) {
      for (const sheet of CONFIG.SHEETS) {
        try {
          const data = await fetchSheetProductsViaCSV(sheet);
          if (data && data.length > 0) {
            console.log(`✅ [CSV] Завантажено ${data.length} товарів з "${sheet.name}"`);
            allProducts.push(...data);
          }
        } catch (e) {
          console.warn(`⚠️ CSV завантаження не вдалося для "${sheet.name}":`, e instanceof Error ? e.message : e);
        }
      }
    }

    // Завантажуємо власні матеріали (розхідники та кріплення)
    try {
      const customMaterials = await fetchCustomMaterials();
      if (customMaterials.length > 0) {
        console.log(`✅ Завантажено ${customMaterials.length} власних матеріалів`);
        allProducts.push(...customMaterials);
      }
    } catch (e) {
      console.warn('⚠️ Не вдалося завантажити власні матеріали:', e);
    }

    console.log(`Всього завантажено: ${allProducts.length} товарів`);

    // Конвертуємо EUR → USD якщо передано курс
    if (eurToUsdRate && eurToUsdRate > 0) {
      allProducts.forEach(product => {
        if (product.currency === 'EUR') {
          product.price = product.price * eurToUsdRate;
          product.currency = 'USD';
        }
      });
      console.log(`✅ Конвертовано EUR → USD за курсом ${eurToUsdRate}`);
    }

    // Створюємо категорії
    const categoryMap = new Map<string, number>();
    allProducts.forEach((product: Product) => {
      categoryMap.set(
        product.mainCategory,
        (categoryMap.get(product.mainCategory) || 0) + 1
      );
    });

    const categories: Category[] = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      mainCategory: name,
      count,
    }));

    if (allProducts.length === 0) {
      console.log('No products loaded, using mock data');
      return getMockData();
    }

    return { products: allProducts, categories };
  } catch (error) {
    console.error('Failed to load from Google Sheets, using mock data:', error);
    return getMockData();
  }
}

/**
 * Mock дані для тестування
 */
function getMockData(): { products: Product[]; categories: Category[] } {
  const products: Product[] = [
    {
      id: 'mock_1',
      name: 'Сонячна панель JA Solar 550W',
      category: 'Сонячні батареї',
      mainCategory: 'Сонячні батареї',
      price: 120,
      currency: 'USD',
      unit: 'шт',
      description: 'Монокристалічна панель 550Вт',
      manufacturer: 'JA Solar',
      power: '550W',
      warranty: '25 років',
      inStock: true,
    },
    {
      id: 'mock_2',
      name: 'Інвертор Growatt 10kW',
      category: 'Гібридні інвертори',
      mainCategory: 'Інвертори',
      price: 850,
      currency: 'USD',
      unit: 'шт',
      description: 'Гібридний інвертор 10кВт',
      manufacturer: 'Growatt',
      power: '10kW',
      warranty: '10 років',
      inStock: true,
    },
    {
      id: 'mock_3',
      name: 'Акумулятор Pylontech US5000',
      category: 'АКБ',
      mainCategory: 'АКБ та BMS',
      price: 1200,
      currency: 'USD',
      unit: 'шт',
      description: 'Літій-іонний акумулятор 4.8кВт·год',
      manufacturer: 'Pylontech',
      power: '4.8kWh',
      warranty: '10 років',
      inStock: true,
    },
  ];

  const categories: Category[] = [
    { name: 'Сонячні батареї', mainCategory: 'Сонячні батареї', count: 1 },
    { name: 'Інвертори', mainCategory: 'Інвертори', count: 1 },
    { name: 'АКБ та BMS', mainCategory: 'АКБ та BMS', count: 1 },
  ];

  return { products, categories };
}

/**
 * Завантажує розхідники та кріплення з Google Sheets
 */
export async function fetchCustomMaterials(): Promise<Product[]> {
  try {
    const res = await gasRequest('getCustomMaterials');
    if (res.success && res.products) {
      // Фільтруємо тільки потрібні категорії
      const allowedCategories = ['Кріплення', 'Розхідники', 'Кабель солярний'];

      return res.products
        .filter((p: any) => allowedCategories.includes(p.category))
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          mainCategory: p.mainCategory || 'Власні матеріали',
          subCategory: p.category,
          price: p.price || 0,
          priceUah: p.priceUah || 0,
          currency: p.currency || 'USD',
          unit: p.unit || 'шт',
          article: p.article || '',
          description: p.article ? `Артикул: ${p.article}` : '',
          isCustom: true,
          inStock: p.active !== false,
        }));
    }
  } catch (error) {
    console.error('Failed to fetch custom materials:', error);
  }
  return [];
}

/**
 * Оновлює ціну товару в Google Sheets
 */
export async function updateMaterialPrice(
  productId: string,
  priceUsd: number,
  priceUah?: number
): Promise<boolean> {
  try {
    const res = await gasRequest('updateMaterialPrice', {
      id: productId,
      priceUsd,
      priceUah,
    });
    return res.success;
  } catch (error) {
    console.error('Failed to update material price:', error);
    return false;
  }
}

/**
 * Додає новий власний матеріал у Google Sheets
 */
export async function addCustomMaterial(product: Product): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const res = await gasRequest('addCustomMaterial', {
      product: {
        id: product.id,
        name: product.name,
        article: product.article || '',
        unit: product.unit || 'шт',
        category: product.category || 'Різне',
        price: product.price,
        priceUah: product.priceUah || 0,
      }
    });
    return res;
  } catch (error) {
    console.error('Failed to add custom material:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Видаляє власний матеріал з Google Sheets
 */
export async function deleteCustomMaterial(productId: string): Promise<boolean> {
  try {
    const res = await gasRequest('deleteCustomMaterial', {
      productId
    });
    return res.success;
  } catch (error) {
    console.error('Failed to delete custom material:', error);
    return false;
  }
}

/**
 * Нормалізує рядок для пошуку
 */
export function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яіїєґ]/g, '');
}

/**
 * Фільтрує продукти за пошуковим запитом (логіка "And" для кожного слова)
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) return products;

  const normalizedTerms = terms.map(t => normalizeForSearch(t));

  return products.filter(product => {
    const searchIn = normalizeForSearch(product.name);
    
    // Перевіряємо чи КОЖНЕ слово запиту є в НАЗВІ товару
    return normalizedTerms.every(term => searchIn.includes(term));
  });
}
