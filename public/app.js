/* ===== CSO Solar — Commercial Proposal App ===== */

// ===== CONFIGURATION =====
const CONFIG = {
    SPREADSHEET_ID: '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g',
    SHEETS: [
        { name: 'Сонячні батареї', mainCat: 'Сонячні батареї', gid: 1271219295 },
        { name: 'Гібридні інвертори', mainCat: 'Інвертори', gid: 2087142679 },
        { name: 'Мережеві інвертори', mainCat: 'Інвертори', gid: 1047165471 },
        { name: 'АКБ', mainCat: 'АКБ та BMS', gid: 1248903265 },
        { name: 'ДОВІДНИК_ТОВАРІВ', mainCat: 'Власний матеріал', gid: 0, spreadsheetId: '1FeQGoFst-DWfLemlXI_0T5xQzMsYdSMC2Xj9Cjs5C1U' }
    ],
    CORS_PROXIES: [
        '',
        '/api/proxy?url=',
        'https://corsproxy.io/?url=',
        'https://api.allorigins.win/raw?url='
    ],
    DEFAULT_MARKUP: 15,
    DEFAULT_USD_UAH: 41.50,
    DEFAULT_EUR_UAH: 51.00,
    CACHE_VERSION: 'v49', // Останню версію кешу для примусового оновлення у всіх клієнтів
    GAS_URL: 'https://script.google.com/macros/s/AKfycbxqQEMJ4vKBExxmh5-ft-UGVpU9rms4vPd9z0XgZv3b33sJDvXyZoIntOj61TVg9fLK/exec'
};

// Detect if running on Vercel (HTTPS) vs local file://
const IS_DEPLOYED = window.location.protocol === 'https:';

const SELLERS = {
    'fop_pastushok': {
        id: 'fop_pastushok',
        shortName: 'ФОП Пастушок М. В.',
        fullName: 'ФОП Пастушок Марія Володимирівна',
        taxId: '3090406261',
        taxIdType: 'РНОКПП',
        address: 'Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38',
        office: 'Львівська обл., м. Золочів, вул. І. Труша 1Б',
        iban: 'UA563003350000000260092475237',
        bank: 'АТ "РАЙФФАЙЗЕН БАНК"',
        mfo: '300335',
        phone: '(067) 374-08-12',
        logo: 'https://i.ibb.co/32JD4dc/logo.png'
    },
    'tov_cso': {
        id: 'tov_cso',
        shortName: 'ТОВ "ЦСО"',
        fullName: 'ТОВ "Центр сервісного обслуговування"',
        taxId: '31758743',
        taxIdType: 'ЄДРПОУ',
        address: 'Україна, 80700, Львівська обл., м. Золочів, вул. І. Труша 1Б',
        office: 'Львівська обл., м. Золочів, вул. І. Труша 1Б',
        iban: 'UA333003350000000002600846582',
        bank: 'АТ «РАЙФФАЙЗЕН БАНК»',
        mfo: '300335',
        phone: '067-370-32-36, 073-370-32-36',
        logo: 'https://i.ibb.co/32JD4dc/logo.png'
    }
};

let state = {
    products: [],
    categories: [],
    proposal: createEmptyProposal(),
    settings: loadSettings(),
    history: loadHistory(),
    activeCurrency: 'USD',
    favorites: loadFavorites(),
    customMaterials: loadCustomMaterials(),
    materialOverrides: loadMaterialOverrides(),
    selectedSeller: 'fop_pastushok'
};

function loadMaterialOverrides() {
    try {
        return JSON.parse(localStorage.getItem('cso_material_overrides')) || {};
    } catch(e) { return {}; }
}

function saveMaterialOverrides() {
    localStorage.setItem('cso_material_overrides', JSON.stringify(state.materialOverrides));
}

function loadCustomMaterials() {
    try {
        return JSON.parse(localStorage.getItem('cso_custom_materials')) || [];
    } catch(e) { return []; }
}

function saveCustomMaterials() {
    localStorage.setItem('cso_custom_materials', JSON.stringify(state.customMaterials));
}

function loadFavorites() {
    try {
        return JSON.parse(localStorage.getItem('cso_favorites')) || [];
    } catch(e) { return []; }
}

function applyMaterialOverrides(productsList) {
    if (!state.materialOverrides) return;
    for (const p of productsList) {
        if (state.materialOverrides[p.id]) {
            const over = state.materialOverrides[p.id];
            p.model = over.model || p.model;
            p.description = over.description || p.description;
            if (over.priceUSD !== undefined) {
                p.price = over.price;
                p.priceUSD = over.priceUSD;
                p.costUSD = over.costUSD || over.priceUSD;
                p.priceRaw = over.priceRaw || p.priceRaw;
            }
            if (over.unit) p.unit = over.unit;
        }
    }
}

function createEmptyProposal() {
    const num = getNextProposalNumber();
    return {
        id: generateId(),
        number: num,
        date: todayStr(),
        clientName: '',
        clientContact: '',
        notes: '',
        items: []
    };
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function generateStableId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'p' + Math.abs(hash).toString(36);
}

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

function getNextProposalNumber() {
    const hist = loadHistory();
    const idx = hist.length + 1;
    return 'КП-' + String(idx).padStart(3, '0');
}

/**
 * Нормалізація рядка для пошуку (видалення розбіжностей між кирилицею та латиницею)
 */
function normalizeForSearch(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/р/g, 'p') // кирилична 'р' -> 'p'
        .replace(/с/g, 'c') // кирилична 'с' -> 'c'
        .replace(/о/g, 'o') // кирилична 'о' -> 'o'
        .replace(/а/g, 'a') // кирилична 'а' -> 'a'
        .replace(/х/g, 'x') // кирилична 'х' -> 'x'
        .replace(/у/g, 'y') // кирилична 'у' -> 'y'
        .replace(/е/g, 'e') // кирилична 'е' -> 'e'
        .replace(/і/g, 'i') // кирилична 'і' -> 'i'
        .replace(/в/g, 'b'); // кирилична 'в' -> 'b' (схожість В та B)
}

// ===== SETTINGS =====
function loadSettings() {
    try {
        const s = JSON.parse(localStorage.getItem('cso_settings'));
        if (s) return s;
    } catch (e) {}
    return {
        markup: CONFIG.DEFAULT_MARKUP,
        usdToUah: CONFIG.DEFAULT_USD_UAH,
        eurToUah: CONFIG.DEFAULT_EUR_UAH,
        showCost: true,
        botToken: '',
        chatId: ''
    };
}

function saveSettings() {
    localStorage.setItem('cso_settings', JSON.stringify(state.settings));
}

// ===== HISTORY =====
function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem('cso_history')) || [];
    } catch (e) { return []; }
}

function saveHistory() {
    localStorage.setItem('cso_history', JSON.stringify(state.history));
}

// ===== DATA FETCHING =====
async function fetchSheetData(forceRefresh = false) {
    const cacheKey = 'cso_products_cache_' + CONFIG.CACHE_VERSION;
    if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (data && data.products && data.products.length > 0) {
                    state.products = [...data.products, ...state.customMaterials];
                    applyMaterialOverrides(state.products);
                    state.categories = [...new Set(state.products.map(p => p.mainCategory))];
                    renderCatalog();
                    showToast('Каталог завантажено з кешу', 'info');
                    return;
                }
            } catch (e) {
                console.error('Cache read error', e);
            }
        }
    }

    showCatalogLoading(true);
    let allProducts = [];

    try {
        for (const sheet of CONFIG.SHEETS) {
            let data = null;

            // Try PROXY / Direct Export first to get raw data (preserves text like "800 гот")
            try {
                data = await fetchViaProxy(sheet.gid, sheet.name, sheet.mainCat, sheet.spreadsheetId);
            } catch (e) { console.warn(`proxy failed for ${sheet.name}:`, e.message); }

            // Fallback to Google Visualization API if proxy fails
            if (!data || data.length === 0) {
                try {
                    data = await fetchViaGviz(sheet.gid, sheet.name, sheet.mainCat, sheet.spreadsheetId);
                } catch (e) { console.warn(`gviz failed for ${sheet.name}:`, e.message); }
            }

            if (!data || data.length === 0) {
                try {
                    data = await fetchViaJsonp(sheet.gid, sheet.name, sheet.mainCat, sheet.spreadsheetId);
                } catch (e) { console.warn(`jsonp failed for ${sheet.name}:`, e.message); }
            }

            if (data && data.length > 0) {
                allProducts = allProducts.concat(data);
            }
        }
    } catch (e) {
        console.error('Fetch error', e);
    }

    if (allProducts.length === 0) {
        showCatalogLoading(false);
        showCatalogError();
        showToast('Помилка завантаження каталогу', 'error');
        return;
    }

    localStorage.setItem(cacheKey, JSON.stringify({
        products: allProducts,
        categories: [...new Set(allProducts.map(p => p.mainCategory))],
        timestamp: Date.now()
    }));

    state.products = [...allProducts, ...state.customMaterials];
    applyMaterialOverrides(state.products);
    state.categories = [...new Set(state.products.map(p => p.mainCategory))];

    renderCatalog();
    showCatalogLoading(false);
    showToast(`Завантажено ${allProducts.length} товарів`, 'success');
}

// --- Method 1: Google Visualization API ---
async function fetchViaGviz(gid, categoryName, mainCat, spreadsheetId = null) {
    const sId = spreadsheetId || CONFIG.SPREADSHEET_ID;
    const sheetParam = (gid !== undefined && gid !== null) ? `gid=${gid}` : `sheet=${encodeURIComponent(categoryName)}`;
    const url = `https://docs.google.com/spreadsheets/d/${sId}/gviz/tq?tqx=out:csv&${sheetParam}`;
    
    let csv = '';
    try {
        const resp = await fetch(url);
        if (resp.ok) csv = await resp.text();
    } catch (e) { console.warn('direct gviz failed:', e.message); }

    if (!csv) {
        // Try via our internal proxy
        try {
            const proxyUrl = CONFIG.CORS_PROXIES[1] + encodeURIComponent(url);
            const resp = await fetch(proxyUrl);
            if (resp.ok) csv = await resp.text();
        } catch (e) { console.warn('proxy gviz failed:', e.message); }
    }

    if (!csv || csv.length < 50) throw new Error('empty gviz response');
    return parseSheetCSV(csv, categoryName, mainCat);
}

// --- Method 2: CORS proxy + CSV export ---
async function fetchViaProxy(gid, categoryName, mainCat, spreadsheetId = null) {
    const sId = spreadsheetId || CONFIG.SPREADSHEET_ID;
    const sheetParam = gid ? `gid=${gid}` : `sheet=${encodeURIComponent(categoryName)}`;
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sId}/export?format=csv&${sheetParam}`;
    const proxies = CONFIG.CORS_PROXIES;
    for (const proxy of proxies) {
        if (!proxy) continue; // Skip empty direct fetch as it will fail CORS anyway on Vercel
        try {
            const resp = await fetch(proxy + encodeURIComponent(exportUrl));
            if (resp.ok) {
                const csv = await resp.text();
                if (csv && csv.length > 100) {
                    return parseSheetCSV(csv, categoryName, mainCat);
                }
            }
        } catch (e) {
            continue;
        }
    }
    throw new Error('all proxies failed');
}

// --- Method 3: JSONP via script tag ---
function fetchViaJsonp(gid, categoryName, mainCat, spreadsheetId = null) {
    const sId = spreadsheetId || CONFIG.SPREADSHEET_ID;
    return new Promise((resolve, reject) => {
        const callbackName = '_gsheetCb_' + Date.now();
        const sheetParam = gid ? `gid=${gid}` : `sheet=${encodeURIComponent(categoryName)}`;
        const url = `https://docs.google.com/spreadsheets/d/${sId}/gviz/tq?tqx=out:json;responseHandler:${callbackName}&${sheetParam}`;

        const timeout = setTimeout(() => {
            delete window[callbackName];
            document.head.removeChild(script);
            reject(new Error('jsonp timeout'));
        }, 15000);

        window[callbackName] = function(response) {
            clearTimeout(timeout);
            delete window[callbackName];
            document.head.removeChild(script);
            try {
                const products = parseGvizJson(response, categoryName, mainCat);
                resolve(products);
            } catch (e) {
                reject(e);
            }
        };

        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
            clearTimeout(timeout);
            delete window[callbackName];
            document.head.removeChild(script);
            reject(new Error('jsonp script error'));
        };
        document.head.appendChild(script);
    });
}

// Parse Google Visualization JSON response into products
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
        const col4 = getVal(4); 
        const col5 = getVal(5);
        const col6 = getVal(6);
        const col10 = getVal(10);
        
        if (categoryName === 'ДОВІДНИК_ТОВАРІВ') {
            const cat = col2;
            if (cat !== 'Кріплення' && cat !== 'Розхідники') continue;
            const modelName = col1;
            if (!modelName) continue;
            products.push({
                id: generateStableId(mainCat + '_' + cat + '_' + modelName),
                mainCategory: mainCat,
                subCategory: cat,
                category: `${mainCat} - ${cat}`,
                model: modelName,
                description: '',
                unit: col3 || 'шт',
                priceRaw: '0',
                price: 0,
                priceCurrency: 'USD',
                priceUSD: 0
            });
            continue;
        }

        // Default mappings (Гібридні інвертори, etc)
        let isCatRow = (col0 && !col1 && col0.length < 50);
        let model = col1;
        let desc = col2;
        let priceStr = col3 || col4 || col10;

        if (categoryName === 'АКБ') {
            // gviz may return empty price for non-numeric values like "800 гот / 960 з ПДВ"
            // Check if any other column has data to distinguish products from headers
            const hasProductData = col2 || col3 || col4 || col5 || col6 || col10;
            isCatRow = (col0 && !col1 && !hasProductData && col0.length < 50);
            model = col0;
            desc = col2 ? `Технологія: ${col2}, Ємність: ${col3 || ''}Ah, Напруга: ${col4 || ''}V` : '';
            priceStr = col1;
        } else if (categoryName === 'Сонячні батареї') {
            priceStr = col6 || col5 || col4; // column 6 is "більше 100 кВт"
        }

        // Sub-category header
        if (isCatRow) {
            let catName = col0 || '';
            if (catName.toLowerCase().includes('фото') || catName.toLowerCase().includes('акб lifepo4')) {
                continue;
            }
            fallbackCategory = catName;
            continue;
        }

        if (model && model.toLowerCase() !== 'модель') {
            let subCat = fallbackCategory;
            
            // For АКБ, force grouping to Deye if matches brand/prefix
            if (categoryName === 'АКБ') {
                const modelLower = model.toLowerCase();
                const headLower = fallbackCategory.toLowerCase();
                const combined = modelLower + ' ' + headLower;
                
                // Aggressive check: brand name or specific series (including Cyrillic B/В)
                const isDeyeBrand = combined.includes('deye') || 
                                   /se-g|se-f|rw-m|rw-f|bos-g|bos-b|gb-lm|gb-lbs|pro[- ]*[вb]/i.test(modelLower);
                const isBMS = modelLower.includes('bms');

                if (!isDeyeBrand && !isBMS) {
                    continue;
                }

                subCat = isBMS ? 'BMS / Контролери' : 'Deye';
            } else if (mainCat === 'Інвертори') {
                const modelLower = model.toLowerCase();
                const combined = modelLower + ' ' + fallbackCategory.toLowerCase();
                let foundBrand = '';

                if (combined.includes('deye')) {
                    foundBrand = 'Deye';
                } else if (combined.includes('solis')) {
                    foundBrand = 'Solis';
                } else if (combined.includes('prosolax') || combined.includes('solax')) {
                    foundBrand = 'Prosolax';
                } else if (combined.includes('huawei') || /\bsun/i.test(modelLower) || combined.includes('luna2000')) {
                    if (combined.includes('аксесуар') || combined.includes('luna2000') || combined.includes('dongle') || combined.includes('smart power sensor')) {
                        foundBrand = 'Аксесуари для Huawei';
                    } else {
                        foundBrand = 'Huawei';
                    }
                }
                
                if (!foundBrand) {
                    continue;
                }
                subCat = foundBrand;
            } else if (categoryName !== 'АКБ' && col0 && col0.toLowerCase() !== 'фото') {
                subCat = col0;
            }

            // High priority BMS check
            if (model.toLowerCase().includes('bms')) {
                subCat = 'BMS / Контролери';
            }

            let priceVal = 0;
            let currency = 'USD';
            const p = parsePrice(priceStr);
            if (p) currency = p.currency;

            if (categoryName === 'Сонячні батареї') {
                const wattMatch = (model + ' ' + desc).match(/(\d+)\s*(?:Вт|W)/i);
                if (wattMatch && p && p.value < 1.0) { // sanity check for per-watt price
                    const watts = parseInt(wattMatch[1], 10);
                    priceVal = watts * p.value;
                } else if (p) {
                    priceVal = p.value;
                }
            } else if (p) {
                priceVal = p.value;
            }

            products.push({
                id: generateStableId(mainCat + '_' + subCat + '_' + model.trim()),
                mainCategory: mainCat,
                subCategory: subCat,
                category: `${mainCat} - ${subCat}`,
                model: model,
                description: desc,
                priceRaw: priceStr || '',
                price: priceVal,
                priceCurrency: currency,
                priceUSD: convertToUSD(priceVal, currency)
            });
        }
    }
    return products;
}

// Show error with manual CSV paste option
function showCatalogError() {
    const container = document.getElementById('catalogList');
    container.innerHTML = `
        <div class="catalog-loading" style="text-align:center">
            <p style="color:var(--danger);font-weight:600">Не вдалося завантажити дані</p>
            <p style="font-size:0.75rem;margin-top:8px;color:var(--text-muted)">
                Спробуйте оновити або вставте CSV дані вручну.
            </p>
            <button class="btn btn-sm btn-outline" style="margin-top:12px" onclick="fetchSheetData(true)">🔄 Спробувати ще раз</button>
            <button class="btn btn-sm btn-accent" style="margin-top:8px" onclick="openManualCsvImport()">📋 Вставити CSV вручну</button>
        </div>
    `;
}

// Manual CSV import
function openManualCsvImport() {
    const csv = prompt(
        'Вставте CSV дані вручну. Оскільки зараз ми парсимо декілька таблиць, цей метод використовує першу таблицю (' + CONFIG.SHEETS[0].name + ').'
    );
    if (csv && csv.length > 50) {
        const products = parseSheetCSV(csv, CONFIG.SHEETS[0].name, CONFIG.SHEETS[0].mainCat);
        if (products.length > 0) {
            state.products = products;
            state.categories = [...new Set(products.map(p => p.mainCategory))];
            const cacheKey = 'cso_products_cache_' + CONFIG.CACHE_VERSION;
            localStorage.setItem(cacheKey, JSON.stringify({
                products: state.products,
                categories: state.categories,
                timestamp: Date.now()
            }));
            renderCatalog();
            showToast(`Завантажено ${products.length} товарів`, 'success');
        } else {
            showToast('Не вдалося розпізнати дані', 'error');
        }
    }
}

// ===== CSV PARSING =====
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

function parseSheetCSV(csv, categoryName, mainCat) {
    const rows = parseCSV(csv);
    if (rows.length < 2) return [];

    const products = [];
    let fallbackCategory = categoryName;

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

        if (categoryName === 'ДОВІДНИК_ТОВАРІВ') {
            const cat = col2;
            if (cat !== 'Кріплення' && cat !== 'Розхідники') continue;
            const modelName = col1;
            if (!modelName) continue;
            products.push({
                id: generateStableId(mainCat + '_' + cat + '_' + modelName),
                mainCategory: mainCat,
                subCategory: cat,
                category: `${mainCat} - ${cat}`,
                model: modelName,
                description: '',
                unit: col3 || 'шт',
                priceRaw: '0',
                price: 0,
                priceCurrency: 'USD',
                priceUSD: 0
            });
            continue;
        }

        // Default mappings (Гібридні інвертори, etc)
        let isCatRow = (col0 && !col1 && col0.length < 50);
        let model = col1;
        let desc = col2;
        let priceStr = col3 || col4 || col10;

        if (categoryName === 'АКБ') {
            const hasProductData = col2 || col3 || col4 || col5 || col6 || col10;
            isCatRow = (col0 && !col1 && !hasProductData && col0.length < 50);
            model = col0;
            desc = col2 ? `Технологія: ${col2}, Ємність: ${col3 || ''}Ah, Напруга: ${col4 || ''}V` : '';
            priceStr = col1;
        } else if (categoryName === 'Сонячні батареї') {
            priceStr = col6 || col5 || col4;
        }

        // Sub-category row
        if (isCatRow) {
            let catName = col0 || '';
            if (catName.toLowerCase().includes('фото') || catName.toLowerCase().includes('акб lifepo4')) {
                continue;
            }
            fallbackCategory = catName;
            continue;
        }

        // Product row
        if (model && model.toLowerCase() !== 'модель') {
            let subCat = fallbackCategory;
            
            // For АКБ, force grouping to Deye if matches brand/prefix
            if (categoryName === 'АКБ') {
                const modelLower = model.toLowerCase();
                const headLower = fallbackCategory.toLowerCase();
                const combined = modelLower + ' ' + headLower;

                const isDeyeBrand = combined.includes('deye') || 
                                   /se-g|se-f|rw-m|rw-f|bos-g|bos-b|gb-lm|gb-lbs|pro[- ]*[вb]/i.test(modelLower);
                const isBMS = modelLower.includes('bms');

                if (!isDeyeBrand && !isBMS) {
                    continue;
                }

                subCat = isBMS ? 'BMS / Контролери' : 'Deye';
            } else if (mainCat === 'Інвертори') {
                const modelLower = model.toLowerCase();
                const combined = modelLower + ' ' + fallbackCategory.toLowerCase();
                let foundBrand = '';

                if (combined.includes('deye')) {
                    foundBrand = 'Deye';
                } else if (combined.includes('solis')) {
                    foundBrand = 'Solis';
                } else if (combined.includes('prosolax') || combined.includes('solax')) {
                    foundBrand = 'Prosolax';
                } else if (combined.includes('huawei') || /\bsun/i.test(modelLower) || combined.includes('luna2000')) {
                    if (combined.includes('аксесуар') || combined.includes('luna2000') || combined.includes('dongle') || combined.includes('smart power sensor')) {
                        foundBrand = 'Аксесуари для Huawei';
                    } else {
                        foundBrand = 'Huawei';
                    }
                }
                
                if (!foundBrand) {
                    continue;
                }
                subCat = foundBrand;
            } else if (categoryName !== 'АКБ' && col0 && col0.toLowerCase() !== 'фото') {
                subCat = col0;
            }

            // High priority BMS check
            if (model.toLowerCase().includes('bms')) {
                subCat = 'BMS / Контролери';
            }

            let priceVal = 0;
            let currency = 'USD';
            const p = parsePrice(priceStr);
            if (p) currency = p.currency;

            if (categoryName === 'Сонячні батареї') {
                const wattMatch = (model + ' ' + desc).match(/(\d+)\s*(?:Вт|W)/i);
                if (wattMatch && p && p.value < 1.0) { // sanity check for per-watt price
                    const watts = parseInt(wattMatch[1], 10);
                    priceVal = watts * p.value;
                } else if (p) {
                    priceVal = p.value;
                }
            } else if (p) {
                priceVal = p.value;
            }

            products.push({
                id: generateStableId(mainCat + '_' + subCat + '_' + model.trim()),
                mainCategory: mainCat,
                subCategory: subCat,
                category: `${mainCat} - ${subCat}`,
                model: model,
                description: desc,
                priceRaw: priceStr || '',
                price: priceVal,
                priceCurrency: currency,
                priceUSD: convertToUSD(priceVal, currency)
            });
        }
    }
    return products;
}

function parsePrice(str) {
    if (!str || str.trim() === '') return null;
    let s = str.trim();
    let currency = 'USD';

    if (s.includes('€')) currency = 'EUR';
    if (s.includes('₴') || s.toLowerCase().includes('грн')) currency = 'UAH';

    // Handle "800 гот / 960 з ПДВ" or similar - extract the first number
    if (s.toLowerCase().includes('гот') || s.includes('/')) {
        const match = s.match(/[\d\s,.]+/);
        if (match) {
            s = match[0];
        }
    }

    s = s.replace(/[$€₴]|грн/gi, '').trim();
    s = s.replace(/\s/g, '');
    s = s.replace(',', '.');

    const val = parseFloat(s);
    if (isNaN(val) || val <= 0) return null;
    return { value: val, currency };
}

function convertToUSD(value, currency) {
    if (currency === 'EUR') return Math.round(value * (state.settings.eurToUah / state.settings.usdToUah) * 100) / 100;
    if (currency === 'UAH') return Math.round((value / state.settings.usdToUah) * 100) / 100;
    return value;
}

function convertCurrency(usdValue, toCurrency) {
    if (toCurrency === 'UAH') return Math.round(usdValue * state.settings.usdToUah * 100) / 100;
    if (toCurrency === 'EUR') return Math.round(usdValue * (state.settings.usdToUah / state.settings.eurToUah) * 100) / 100;
    return usdValue;
}

function formatMoney(value, currency) {
    if (currency === undefined) currency = state.activeCurrency;
    const sym = currency === 'UAH' ? '₴' : (currency === 'EUR' ? '€' : '$');
    const converted = convertCurrency(value, currency);
    return sym + ' ' + converted.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== CATALOG RENDERING =====
function renderCatalog() {
    const container = document.getElementById('catalogList');
    const searchVal = (document.getElementById('catalogSearch')?.value || '').toLowerCase();
    const searchWords = searchVal.split(/\s+/).filter(w => w.length > 0);
    
    // extract main categories
    const mainCats = [...new Set(state.products.map(p => p.mainCategory))];
    
    let html = '';
    for (const mCat of mainCats) {
        const mItems = state.products.filter(p => {
            if (searchWords.length === 0) return p.mainCategory === mCat;
            if (p.mainCategory !== mCat) return false;
            
            const content = normalizeForSearch(p.model + ' ' + p.subCategory + ' ' + p.mainCategory);
            return searchWords.every(word => content.includes(normalizeForSearch(word)));
        });
        if (mItems.length === 0) continue;

        const isMainExpanded = searchWords.length > 0; // expanded if searching
        const mainCollapsedClass = isMainExpanded ? '' : 'collapsed';

        html += `<div class="category-main">
            <div class="category-main-header ${mainCollapsedClass}" onclick="toggleCategory(this)">
                <span class="arrow">▼</span>
                <span>${escHtml(mCat)}</span>
            </div>
            <div class="category-main-content ${mainCollapsedClass}">`;

        // Favorites Subgroup
        const favItems = mItems.filter(p => state.favorites.includes(p.id));
        if (favItems.length > 0 && searchVal === '') {
            html += `<div class="category-group" style="margin-left:8px; border-left:2px solid var(--accent); border-radius:0;">
                <div class="category-header ${mainCollapsedClass}" onclick="toggleCategory(this)" style="color:var(--accent);">
                    <span class="arrow">▼</span>
                    <span>Улюблені</span>
                    <span class="cat-count">${favItems.length}</span>
                </div>
                <div class="category-items ${mainCollapsedClass}">`;
            for (const p of favItems) {
                html += renderProductItem(p);
            }
            html += '</div></div>';
        }

        const subCats = [...new Set(mItems.map(p => p.subCategory))];
        for (const sCat of subCats) {
            const items = mItems.filter(p => p.subCategory === sCat);
            if (items.length === 0) continue;

            html += `<div class="category-group" style="margin-left:8px; border-left:2px solid var(--border); border-radius:0;">
                <div class="category-header ${mainCollapsedClass}" onclick="toggleCategory(this)">
                    <span class="arrow">▼</span>
                    <span>${escHtml(sCat)}</span>
                    <span class="cat-count">${items.length}</span>
                </div>
                <div class="category-items ${mainCollapsedClass}">`;

            for (const p of items) {
                html += renderProductItem(p);
            }

            html += '</div></div>';
        }
        html += '</div></div>';
    }

    if (html === '') {
        html = '<div class="catalog-loading"><p>Товарів не знайдено</p></div>';
    }

    container.innerHTML = html;
}

function renderProductItem(p) {
    const priceTag = p.priceUSD > 0
        ? `<span class="product-price-tag">${formatMoney(p.priceUSD, 'USD')}</span>`
        : `<span class="product-price-tag no-price">—</span>`;

    const isFav = state.favorites.includes(p.id);
    const favClass = isFav ? 'active' : '';
    const favIcon = isFav ? '★' : '☆';
    
    // Show cost only for items that are marked custom or are overrides
    const showCost = p.isCustom || p.mainCategory === 'Власний матеріал';
    const customCostHtml = showCost && p.costUSD > 0 ? `<span style="font-size:0.65rem; color:var(--text-muted); display:block; margin-top:2px;">Собів: $${p.costUSD}</span>` : '';
    
    let actionsHtml = '';
    if (p.mainCategory === 'Власний матеріал' || p.isCustom || p.mainCategory === 'Витратні матеріали') {
        actionsHtml = `
            <button class="product-favorite" onclick="editMaterial('${p.id}')" title="Редагувати" style="color:var(--accent)">✎</button>
            ${p.isCustom ? `<button class="product-favorite" onclick="deleteCustomMaterial(event, '${p.id}')" title="Видалити з каталогу" style="color:var(--danger)">🗑</button>` : ''}
        `;
    }

    return `<div class="product-item" title="${escHtml(p.description || '')}">
        <div class="product-info">
            <div class="product-model">${escHtml(p.model)}</div>
            <div class="product-desc">${escHtml(p.description || '')}</div>
            ${customCostHtml}
        </div>
        ${priceTag}
        <button class="product-favorite ${favClass}" onclick="toggleFavorite(event, '${p.id}')" title="Улюблене">${favIcon}</button>
        ${actionsHtml}
        <button class="product-add" onclick="addProductToProposal('${p.id}')" title="Додати">+</button>
    </div>`;
}

function deleteCustomMaterial(e, id) {
    if (e) e.stopPropagation();
    if (!confirm('Видалити цей матеріал з каталогу назавжди?')) return;
    state.customMaterials = state.customMaterials.filter(m => m.id !== id);
    saveCustomMaterials();
    state.products = state.products.filter(p => p.id !== id);
    renderCatalog();
}

function toggleFavorite(e, id) {
    if (e) e.stopPropagation();
    if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(x => x !== id);
    } else {
        state.favorites.push(id);
    }
    localStorage.setItem('cso_favorites', JSON.stringify(state.favorites));
    renderCatalog();
}

function toggleCategory(el) {
    el.classList.toggle('collapsed');
    const items = el.nextElementSibling;
    items.classList.toggle('collapsed');
}

function showCatalogLoading(show) {
    const loader = document.getElementById('catalogLoading');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

// ===== PROPOSAL MANAGEMENT =====
function addCustomItem() {
    state.proposal.items.push({
        id: generateId(),
        productId: 'custom',
        name: 'Нова позиція',
        description: '',
        unit: 'шт.',
        quantity: 1,
        costUSD: 0,
        price: 0,
        markup: 0
    });
    renderProposalTable();
    showToast('Додано пусту позицію', 'info');
}

function addProductToProposal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const costUSD = product.priceUSD;
    const markup = state.settings.markup;
    const price = Math.round(costUSD * (1 + markup / 100) * 100) / 100;

    state.proposal.items.push({
        id: generateId(),
        productId: product.id,
        name: product.model,
        description: product.description || '',
        unit: product.unit || 'шт.',
        quantity: 1,
        costUSD: costUSD,
        price: price,
        markup: markup
    });

    renderProposalTable();
    showToast(`Додано: ${product.model}`, 'success');
}

function removeItem(index) {
    state.proposal.items.splice(index, 1);
    renderProposalTable();
}

function moveItemUp(index) {
    if (index > 0) {
        const item = state.proposal.items[index];
        state.proposal.items.splice(index, 1);
        state.proposal.items.splice(index - 1, 0, item);
        renderProposalTable();
    }
}

function moveItemDown(index) {
    if (index < state.proposal.items.length - 1) {
        const item = state.proposal.items[index];
        state.proposal.items.splice(index, 1);
        state.proposal.items.splice(index + 1, 0, item);
        renderProposalTable();
    }
}

function renderProposalTable() {
    const tbody = document.getElementById('proposalBody');
    const foot = document.getElementById('proposalFoot');
    const emptyRow = document.getElementById('emptyRow');
    const items = state.proposal.items;

    if (items.length === 0) {
        tbody.innerHTML = `<tr class="empty-row" id="emptyRow"><td colspan="8">
            <div class="empty-state"><span class="empty-icon">☀</span><p>Додайте товари з каталогу зліва</p></div>
        </td></tr>`;
        foot.style.display = 'none';
        return;
    }

    foot.style.display = '';
    let html = '';

    items.forEach((item, i) => {
        const sum = Math.round(item.price * item.quantity * 100) / 100;
        const sumCost = Math.round(item.costUSD * item.quantity * 100) / 100;
        
        let nameInput = `<div class="row-name-text editable-text" contenteditable="plaintext-only" spellcheck="false" 
            data-placeholder="Назва товару"
            onblur="updateItemField(${i},'name',this.innerText.trim())">${escHtml(item.name)}</div>`;
        
        let descInput = `<div class="row-name-desc editable-text" contenteditable="plaintext-only" spellcheck="false" 
            data-placeholder="Опис"
            onblur="updateItemField(${i},'description',this.innerText.trim())">${escHtml(item.description)}</div>`;
        
        // Editable cost field
        const costVal = convertCurrency(item.costUSD, state.activeCurrency).toFixed(2);
        const costInput = `<input type="number" class="tbl-input input-price" style="width:100%" value="${costVal}" step="0.01" min="0" onchange="updateItemCost(${i},this.value)">`;

        html += `<tr>
            <td class="row-num" style="white-space:nowrap; text-align:center; padding: 2px;">
                <div class="no-print" style="display:inline-flex; flex-direction:column; vertical-align:middle; margin-right:4px;">
                    <button class="move-btn" onclick="moveItemUp(${i})" ${i === 0 ? 'disabled' : ''} title="Вгору">▲</button>
                    <button class="move-btn" onclick="moveItemDown(${i})" ${i === items.length - 1 ? 'disabled' : ''} title="Вниз">▼</button>
                </div>
                <span style="display:inline-block; vertical-align:middle; width:15px; text-align:left;">${i + 1}</span>
            </td>
            <td>
                ${nameInput}
                ${descInput}
            </td>
            <td><input class="tbl-input input-unit" value="${escHtml(item.unit)}" onchange="updateItemField(${i},'unit',this.value)"></td>
            <td><input type="number" class="tbl-input input-qty" value="${item.quantity}" min="1" onchange="updateItemField(${i},'quantity',this.value)"></td>
            <td class="row-cost cost-column">${costInput}</td>
            <td class="row-cost cost-column">${formatMoney(sumCost)}</td>
            <td><input type="number" class="tbl-input input-price" value="${convertCurrency(item.price, state.activeCurrency).toFixed(2)}" step="0.01" min="0" onchange="updateItemPrice(${i},this.value)"></td>
            <td class="row-sum">${formatMoney(sum)}</td>
            <td class="no-print"><button class="delete-btn" onclick="removeItem(${i})" title="Видалити">✕</button></td>
        </tr>`;
    });

    tbody.innerHTML = html;
    updateTotals();
}

function updateItemField(index, field, value) {
    if (field === 'quantity') {
        state.proposal.items[index].quantity = Math.max(1, parseInt(value) || 1);
    } else {
        state.proposal.items[index][field] = value;
    }
    renderProposalTable();
}

function updateItemCost(index, value) {
    let numVal = parseFloat(value) || 0;
    if (state.activeCurrency === 'UAH') {
        numVal = numVal / state.settings.usdToUah;
    } else if (state.activeCurrency === 'EUR') {
        numVal = numVal * (state.settings.eurToUah / state.settings.usdToUah);
    }
    state.proposal.items[index].costUSD = Math.round(numVal * 100) / 100;
    
    // Auto update price with global markup
    const markup = state.settings.markup;
    state.proposal.items[index].price = Math.round(state.proposal.items[index].costUSD * (1 + markup / 100) * 100) / 100;
    
    renderProposalTable();
}

function updateItemPrice(index, value) {
    let numVal = parseFloat(value) || 0;
    if (state.activeCurrency === 'UAH') {
        numVal = numVal / state.settings.usdToUah;
    } else if (state.activeCurrency === 'EUR') {
        numVal = numVal * (state.settings.eurToUah / state.settings.usdToUah);
    }
    state.proposal.items[index].price = Math.round(numVal * 100) / 100;
    renderProposalTable();
}

function updateTotals() {
    const items = state.proposal.items;
    let totalSum = 0;
    let totalCost = 0;
    items.forEach(item => {
        totalSum += item.price * item.quantity;
        totalCost += item.costUSD * item.quantity;
    });

    document.getElementById('totalSum').textContent = formatMoney(totalSum);
    document.getElementById('totalCost').textContent = formatMoney(totalCost);
}

function recalcAllPrices() {
    state.proposal.items.forEach(item => {
        item.price = Math.round(item.costUSD * (1 + state.settings.markup / 100) * 100) / 100;
    });
    renderProposalTable();
}

// ===== SAVE / LOAD PROPOSALS =====
function readProposalForm() {
    state.proposal.number = document.getElementById('proposalNumber').value;
    state.proposal.date = document.getElementById('proposalDate').value;
    state.proposal.clientName = document.getElementById('clientName').value;
    state.proposal.clientContact = document.getElementById('clientContact').value;
    state.proposal.notes = document.getElementById('proposalNotes').value;
    state.selectedSeller = document.getElementById('sellerSelect').value;
}

function fillProposalForm() {
    document.getElementById('proposalNumber').value = state.proposal.number || '';
    const rawDate = state.proposal.date || todayStr();
    document.getElementById('proposalDate').value = rawDate.split('T')[0];
    document.getElementById('clientName').value = state.proposal.clientName || '';
    document.getElementById('clientContact').value = state.proposal.clientContact || '';
    document.getElementById('proposalNotes').value = state.proposal.notes || '';
    document.getElementById('sellerSelect').value = state.proposal.sellerId || state.selectedSeller || 'fop_pastushok';
    
    syncSellerUI();
}

function syncSellerUI() {
    const seller = SELLERS[document.getElementById('sellerSelect').value] || SELLERS.fop_pastushok;
    
    // Header
    document.getElementById('printHeaderAddress').textContent = 'Офіс та склад: ' + seller.office;
    document.getElementById('printHeaderPhone').textContent = seller.phone;
    
    // Invoice
    document.getElementById('invSellerName').textContent = seller.fullName;
    document.getElementById('invSellerIdType').textContent = seller.taxIdType + ':';
    document.getElementById('invSellerId').textContent = seller.taxId;
    document.getElementById('invSellerAddress').textContent = seller.address;
    document.getElementById('invSellerIban').textContent = seller.iban;
    document.getElementById('invSellerBank').textContent = seller.bank;
    document.getElementById('invSellerMfo').textContent = seller.mfo || '';
    document.getElementById('invSellerPhone').textContent = seller.phone;
    
    // Delivery Note
    document.getElementById('dnSellerName').textContent = seller.shortName;
    document.getElementById('dnSellerPhone').textContent = seller.phone;
    
    state.selectedSeller = seller.id;
    state.proposal.sellerId = seller.id;
}

// ===== GOOGLE SHEETS SYNC =====
async function gasRequest(action, params = {}, method = 'POST') {
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
        return { success: false, error: e.message };
    }
}

async function saveProposalToSheet(proposal) {
    const userEmail = "frontend-user"; 
    const gasProposal = {
        id: proposal.id,
        number: proposal.number,
        date: proposal.date,
        clientName: proposal.clientName,
        clientPhone: proposal.clientContact,
        courseUSD: state.settings.usdToUah,
        markup: state.settings.markup,
        totalAmount: proposal.totalSum,
        status: "Надіслано",
        comment: proposal.notes,
        items: proposal.items.map(it => ({
            productName: it.name,
            productArticle: "", 
            unit: it.unit || "шт",
            quantity: it.quantity,
            price: it.price,
            total: it.price * it.quantity
        }))
    };
    
    showToast('Синхронізація з Google Sheets...', 'info');
    const res = await gasRequest('saveProposal', { proposal: gasProposal, user: userEmail });
    if (res.success) {
        showToast('Збережено в Google Sheets', 'success');
    } else {
        console.error('Sync Error:', res.error);
        showToast('Помилка синхронізації: ' + res.error, 'error');
    }
}

async function syncProposalsFromSheet() {
    try {
        const res = await gasRequest('getProposals');
        if (res.success && res.proposals) {
            const sheetProposals = res.proposals.map(p => ({
                id: p.id,
                number: p.number,
                date: p.date,
                clientName: p.clientName,
                clientContact: p.clientPhone,
                notes: p.comment,
                totalSum: p.totalAmount,
                savedAt: p.updatedAt,
                items: p.items.map(it => ({
                    name: it.productName,
                    quantity: it.quantity,
                    price: it.price,
                    unit: it.unit || 'шт.',
                    costUSD: it.price / (1 + (p.markup || 15) / 100) 
                }))
            }));
            
            // Merge with local history (prefer sheet data)
            const localIds = state.history.map(h => h.id);
            const merged = [...sheetProposals];
            state.history.forEach(lh => {
                if (!merged.find(sh => sh.id === lh.id)) {
                    merged.push(lh);
                }
            });

            state.history = merged;
            saveHistory();
            renderHistory();
            return true;
        }
    } catch (e) {
        console.error('Sync failed', e);
    }
    return false;
}

function saveCurrentProposal() {
    readProposalForm();
    const existing = state.history.findIndex(h => h.id === state.proposal.id);
    const copy = JSON.parse(JSON.stringify(state.proposal));
    copy.savedAt = new Date().toISOString();
    copy.totalSum = state.proposal.items.reduce((s, it) => s + it.price * it.quantity, 0);

    if (existing >= 0) {
        state.history[existing] = copy;
    } else {
        state.history.push(copy);
    }
    saveHistory();
    showToast('Пропозицію збережено локально', 'success');
    saveProposalToSheet(copy);
}

function loadProposal(id) {
    const p = state.history.find(h => h.id === id);
    if (!p) return;
    state.proposal = JSON.parse(JSON.stringify(p));
    fillProposalForm();
    renderProposalTable();
    closeModal('historyModal');
    showToast(`Завантажено: ${p.number}`, 'info');
}

function deleteProposal(id) {
    if (!confirm('Видалити цю пропозицію?')) return;
    state.history = state.history.filter(h => h.id !== id);
    saveHistory();
    renderHistory();
    showToast('Пропозицію видалено локально', 'info');
    
    // Delete from sheet
    gasRequest('deleteProposal', { proposalId: id }).then(res => {
        if (res.success) showToast('Пропозицію видалено з Google Sheets', 'success');
    });
}

function newProposal() {
    state.proposal = createEmptyProposal();
    fillProposalForm();
    renderProposalTable();
    showToast('Створено нову пропозицію', 'info');
}

// ===== HISTORY RENDERING =====
function renderHistory() {
    const container = document.getElementById('historyList');
    const searchVal = (document.getElementById('historySearch')?.value || '').toLowerCase();

    const filtered = state.history.filter(p => {
        if (!searchVal) return true;
        return (p.number || '').toLowerCase().includes(searchVal) ||
               (p.clientName || '').toLowerCase().includes(searchVal) ||
               (p.clientContact || '').toLowerCase().includes(searchVal);
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p class="empty-history">${searchVal ? 'Нічого не знайдено' : 'Збережених пропозицій немає'}</p>`;
        return;
    }

    let html = '';
    const sorted = [...filtered].sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
    for (const p of sorted) {
        const sum = p.totalSum || 0;
        html += `<div class="history-item">
            <div class="history-meta">
                <div class="history-num">${escHtml(p.number || 'Без номера')}</div>
                <div class="history-info">${escHtml(p.date || '')} | ${escHtml(p.clientName || 'Без клієнта')} | ${p.items ? p.items.length : 0} поз.</div>
            </div>
            <div class="history-sum">${formatMoney(sum, 'USD')}</div>
            <div class="history-actions">
                <button class="btn btn-sm btn-outline" onclick="loadProposal('${p.id}')">Відкрити</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProposal('${p.id}')">✕</button>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}

// ===== PRINT =====
async function printProposal() {
    readProposalForm();
    
    // Convert logo to data URL before printing to ensure it's loaded
    await prepImagesForCapture();
    
    const note = document.getElementById('printCurrencyNote');
    note.textContent = `Курс: 1 USD = ${state.settings.usdToUah} грн; 1 EUR = ${state.settings.eurToUah} грн`;
    window.print();
}

// ===== TELEGRAM =====
async function sendToTelegram() {
    const format = document.querySelector('input[name="tgFormat"]:checked')?.value || 'pdf';

    // When deployed on Vercel — use server proxy (token hidden)
    // When local — use direct Telegram API with settings
    if (!IS_DEPLOYED) {
        const token = state.settings.botToken;
        const chatId = state.settings.chatId;
        if (!token || !chatId) {
            showToast('Вкажіть Telegram Bot Token та Chat ID в налаштуваннях', 'error');
            return;
        }
    }

    readProposalForm();
    closeModal('telegramModal');
    showToast('Відправка...', 'info');

    try {
        if (format === 'text') {
            await sendTelegramText();
        } else if (format === 'photo') {
            await sendTelegramPhoto();
        } else {
            await sendTelegramPdf();
        }
        showToast('Відправлено в Telegram!', 'success');
    } catch (e) {
        console.error(e);
        showToast('Помилка відправки: ' + e.message, 'error');
    }
}

// Helper: send a request to Telegram (via server proxy or direct)
async function telegramRequest(action, data) {
    if (IS_DEPLOYED) {
        // Server-side proxy — token is hidden
        const resp = await fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, chatId: state.settings.chatId, ...data })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error || 'Server error');
        return result;
    } else {
        // Direct Telegram API (local development)
        const token = state.settings.botToken;
        const chatId = data.chatId || state.settings.chatId;
        
        if (action === 'sendMessage') {
            const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: data.text, parse_mode: data.parseMode || 'HTML' })
            });
            if (!resp.ok) throw new Error(await resp.text());
        } else if (action === 'sendPhoto') {
            const photoData = Uint8Array.from(atob(data.photoBase64), c => c.charCodeAt(0));
            const blob = new Blob([photoData], { type: 'image/png' });
            const fd = new FormData();
            fd.append('chat_id', chatId);
            fd.append('photo', blob, 'proposal.png');
            if (data.caption) fd.append('caption', data.caption);
            const resp = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: fd });
            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.description || 'Telegram API error');
            }
        } else if (action === 'sendDocument') {
            const dataBytes = Uint8Array.from(atob(data.base64 || data.pdfBase64), c => c.charCodeAt(0));
            const blob = new Blob([dataBytes], { type: data.contentType || 'application/pdf' });
            const fd = new FormData();
            fd.append('chat_id', chatId);
            fd.append('document', blob, data.filename || 'proposal.pdf');
            if (data.caption) fd.append('caption', data.caption);
            const resp = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: 'POST', body: fd });
            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.description || 'Telegram API error');
            }
        }
    }
}

async function sendTelegramText() {
    const p = state.proposal;
    let text = `📋 <b>${escHtml(p.number)}</b> від ${p.date}\n`;
    if (p.clientName) text += `👤 ${escHtml(p.clientName)}\n`;
    if (p.clientContact) text += `📞 ${escHtml(p.clientContact)}\n`;
    text += '\n';

    p.items.forEach((item, i) => {
        const sum = item.price * item.quantity;
        // Text format doesn't show cost column to client
        text += `${i + 1}. ${escHtml(item.name)}\n   ${item.quantity} ${item.unit} × ${formatMoney(item.price)} = ${formatMoney(sum)}\n`;
    });

    const totalSum = p.items.reduce((s, it) => s + it.price * it.quantity, 0);
    text += `\n💰 <b>Разом: ${formatMoney(totalSum)}</b>`;
    if (p.notes) text += `\n📝 ${escHtml(p.notes)}`;

    await telegramRequest('sendMessage', { text, parseMode: 'HTML' });
}

async function sendTelegramPhoto() {
    const showCost = state.settings.showCost;
    document.body.classList.add('hide-cost');
    
    const noprint = document.querySelectorAll('.no-print');
    noprint.forEach(el => el.style.display = 'none');

    const printH = document.getElementById('printHeader');
    const originalDisplay = printH.style.display;
    printH.style.display = 'flex';
    document.body.classList.add('is-exporting');
    document.body.classList.add('is-photo');

    const notes = document.querySelector('.proposal-notes-container');
    if (notes) notes.style.display = 'none';

    // Convert logo to data URL to avoid tainting
    await prepImagesForCapture();
    
    const el = document.getElementById('mainContent');
    try {
        const canvas = await html2canvas(el, { 
            backgroundColor: '#ffffff', 
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            scrollY: -window.scrollY,
            windowHeight: el.scrollHeight
        });
        
        // Restore UI
        document.body.classList.remove('is-exporting');
        document.body.classList.remove('is-photo');
        printH.style.display = originalDisplay;
        printH.style.flexDirection = '';
        printH.style.justifyContent = '';
        printH.style.alignItems = '';
        printH.style.marginBottom = '';
        printH.style.paddingBottom = '';
        printH.style.borderBottom = '';
        noprint.forEach(el => el.style.display = '');
        if (notes) notes.style.display = '';
        if (showCost) document.body.classList.remove('hide-cost');
        else document.body.classList.add('hide-cost');

        // Convert canvas to base64
        const dataUrl = canvas.toDataURL('image/png');
        const photoBase64 = dataUrl.split(',')[1];
        const caption = `📋 ${state.proposal.number || 'КП'} | ${state.proposal.clientName || ''}`;

        await telegramRequest('sendPhoto', { photoBase64, caption });
    } catch (err) {
        document.body.classList.remove('is-exporting');
        document.body.classList.remove('is-photo');
        printH.style.display = originalDisplay;
        noprint.forEach(el => el.style.display = '');
        if (showCost) document.body.classList.remove('hide-cost');
        throw err;
    }
}

async function sendTelegramPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    // --- 1. Load Cyrillic font (DejaVu Sans) ---
    // Using the full DejaVu Sans to ensure 100% Cyrillic character support without missing glyphs.
    let fontLoaded = false;
    try {
        const resp = await fetch('https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf'); 
        if (resp.ok) {
            const buf = await resp.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.length; i += 10000) {
                binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 10000));
            }
            const b64 = btoa(binary);
            doc.addFileToVFS('DejaVuSans.ttf', b64);
            doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
            doc.setFont('DejaVuSans');
            fontLoaded = true;
        }
    } catch (e) {
        console.warn('Font load failed:', e);
    }

    const fontName = fontLoaded ? 'DejaVuSans' : 'helvetica';
    const boldStyle = 'normal'; // Use normal weight throughout (no bold font loaded)
    const pageWidth = 210;
    const marginL = 15;
    const marginR = 15;
    const usable = pageWidth - marginL - marginR;
    let y = 15;

    // --- 2. Header ---
    // Logo: load directly from URL and preserve aspect ratio
    try {
        const logoUrl = 'https://i.ibb.co/32JD4dc/logo.png';
        const logoObj = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const targetWidth = 300; 
                const scale = Math.min(1, targetWidth / img.naturalWidth);
                const w = img.naturalWidth * scale;
                const h = img.naturalHeight * scale;
                
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                
                // Fill with white since PNG might be transparent (JPEG doesn't support alpha)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                
                resolve({
                    data: canvas.toDataURL('image/jpeg', 0.85),
                    aspectRatio: img.naturalHeight / img.naturalWidth
                });
            };
            img.onerror = () => reject('Logo load failed');
            img.src = logoUrl;
        });
        
        // Calculate dynamic height to preserve correct aspect ratio
        const renderWidth = 24; // Target width in mm (reduced by ~30% from 35)
        const renderHeight = renderWidth * logoObj.aspectRatio;
        
        doc.addImage(logoObj.data, 'JPEG', marginL, 5, renderWidth, renderHeight); // Move to top edge (y=5)
    } catch (e) { console.warn('Logo skip:', e); }

    // Company name & info (right side)
    doc.setFont(fontName, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(245, 158, 11); // Orange accent
    doc.text('КОМЕРЦІЙНА ПРОПОЗИЦІЯ', pageWidth - marginR, y + 5, { align: 'right' });
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.setFont(fontName, 'normal');
    doc.text('Офіс та склад: Львівська обл., м. Золочів, вул. І. Труша 1Б', pageWidth - marginR, y + 10, { align: 'right' });
    doc.text('+38 067 374 08 02', pageWidth - marginR, y + 14, { align: 'right' });

    // Orange line
    y += 18;
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.8);
    doc.line(marginL, y, pageWidth - marginR, y);
    y += 6;

    // --- 3. Proposal info ---
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont(fontName, 'normal');
    doc.text('НОМЕР', marginL, y);
    doc.text('ДАТА', marginL + 50, y);
    y += 4;
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(state.proposal.number || '', marginL, y);
    doc.text(state.proposal.date || '', marginL + 50, y);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('КЛІЄНТ', marginL, y);
    doc.text('КОНТАКТ', marginL + 90, y);
    y += 4;
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(state.proposal.clientName || '', marginL, y);
    doc.text(state.proposal.clientContact || '', marginL + 90, y);
    y += 8;

    // --- 4. Table via autotable ---
    const cur = state.activeCurrency;
    const curSym = cur === 'USD' ? '$' : (cur === 'EUR' ? '€' : '₴');
    const showCost = state.settings.showCost;

    // Formatter for prices
    const formatPrice = (num) => num.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const head = [['№', 'Назва товару', 'Од.', 'К-сть', `Ціна (${curSym})`, `Сума (${curSym})`]];
    const body = state.proposal.items.map((it, idx) => {
        const priceVal = convertCurrency(it.price, cur);
        const sumVal = priceVal * it.quantity;
        const name = it.description ? `${it.name}\n${it.description}` : it.name;
        return [
            idx + 1,
            name,
            it.unit || 'шт.',
            it.quantity,
            formatPrice(priceVal),
            formatPrice(sumVal)
        ];
    });

    // Total
    const totalSum = state.proposal.items.reduce((s, it) => s + it.price * it.quantity, 0);
    const convertedTotal = convertCurrency(totalSum, cur);

    doc.autoTable({
        startY: y,
        head: head,
        body: body,
        foot: [['', '', '', '', 'РАЗОМ:', `${curSym} ${formatPrice(convertedTotal)}`]],
        theme: 'grid',
        styles: {
            font: fontName,
            fontSize: 8.5,
            cellPadding: 3,
            textColor: [30, 30, 30],
            lineColor: [220, 220, 220],
            lineWidth: 0.3,
            valign: 'middle'
        },
        headStyles: {
            fillColor: [245, 245, 245],
            textColor: [60, 60, 60],
            fontStyle: 'normal',
            fontSize: 7.5,
            halign: 'center'
        },
        footStyles: {
            fillColor: [255, 251, 235],
            textColor: [180, 83, 9],
            fontStyle: 'normal',
            fontSize: 9.5,
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 'auto', halign: 'left' },
            2: { halign: 'center', cellWidth: 24 }, // Extended width for 'комплект' / 'послуга'
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'center', cellWidth: 25 },
            5: { halign: 'center', cellWidth: 28 }
        },
        margin: { left: marginL, right: marginR },
        didDrawPage: function(data) {
            // Footer on each page
            doc.setFontSize(7);
            doc.setTextColor(180, 180, 180);
            doc.text('CSO Solar — комерційна пропозиція', marginL, 290);
            doc.text(`Стор. ${doc.internal.getNumberOfPages()}`, pageWidth - marginR, 290, { align: 'right' });
        }
    });

    // --- 5. Notes & currency info ---
    let finalY = doc.lastAutoTable.finalY + 8;

    if (cur === 'UAH') {
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        doc.setFont(fontName, 'normal');
        const rateNote = `Курс: 1 USD = ${state.settings.usdToUah} грн; 1 EUR = ${state.settings.eurToUah} грн`;
        doc.text(rateNote, pageWidth - marginR, finalY, { align: 'right' });
        finalY += 6;
    }

    if (state.proposal.notes) {
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text('Примітки:', marginL, finalY);
        finalY += 4;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const noteLines = doc.splitTextToSize(state.proposal.notes, usable);
        doc.text(noteLines, marginL, finalY);
    }

    // --- 6. Convert to base64 and send ---
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const caption = `📋 ${state.proposal.number || 'КП'} | ${state.proposal.clientName || ''}`;
    await telegramRequest('sendDocument', { pdfBase64, caption, filename: 'proposal.pdf' });
}

function printProposal() {
    readProposalForm();
    window.print();
}




function printInvoice() {
    readProposalForm();
    if (state.proposal.items.length === 0) {
        showToast('Пропозиція порожня', 'warning');
        return;
    }

    showToast('Підготовка рахунку до друку...', 'info');

    const uahRate = state.settings.usdToUah;
    const propNum = state.proposal.number || 'КП-001';
    const invoiceNum = propNum.replace('КП-', '');
    const invoiceDate = formatDateUA(state.proposal.date || todayStr());

    // Fill common document dynamic fields
    document.getElementById('invNumber').textContent = invoiceNum;
    document.getElementById('invDate').textContent = invoiceDate;
    document.getElementById('invClientName').textContent = state.proposal.clientName || '_______________';
    const clientContact = document.getElementById('invClientContact');
    if (clientContact) clientContact.textContent = state.proposal.clientContact || '';

    // Build the table
    const tableBody = document.getElementById('invTableBody');
    tableBody.innerHTML = '';
    let totalUAH = 0;

    state.proposal.items.forEach((it, idx) => {
        const priceUAH = Math.round(it.price * uahRate * 100) / 100;
        const sumUAH = Math.round(priceUAH * it.quantity * 100) / 100;
        totalUAH += sumUAH;

        const bg = idx % 2 === 0 ? '#ffffff' : '#f7f9fc';
        const row = document.createElement('tr');
        row.style.background = bg;
        row.innerHTML = `
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:center;">${idx + 1}</td>
            <td style="padding:6px; border:1px solid #c0c8d8;">
                <strong>${escHtml(it.name)}</strong>
                ${it.description ? '<br><span style="font-size:10px; color:#666;">' + escHtml(it.description) + '</span>' : ''}
            </td>
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:center;">${it.quantity}</td>
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:center;">${it.unit || 'шт.'}</td>
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:right;">${priceUAH.toLocaleString('uk-UA', {minimumFractionDigits: 2})}</td>
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:right; font-weight:600;">${sumUAH.toLocaleString('uk-UA', {minimumFractionDigits: 2})}</td>
        `;
        tableBody.appendChild(row);
    });

    // Pad empty rows
    for (let i = state.proposal.items.length; i < 10; i++) {
        const bg = i % 2 === 0 ? '#ffffff' : '#f7f9fc';
        const row = document.createElement('tr');
        row.style.background = bg;
        row.style.height = '30px';
        row.innerHTML = `<td style="border:1px solid #c0c8d8;"></td><td style="border:1px solid #c0c8d8;"></td><td style="border:1px solid #c0c8d8;"></td><td style="border:1px solid #c0c8d8;"></td><td style="border:1px solid #c0c8d8;"></td><td style="border:1px solid #c0c8d8;"></td>`;
        tableBody.appendChild(row);
    }

    // Totals
    const totalEl = document.getElementById('invTotal');
    if (totalEl) totalEl.textContent = totalUAH.toLocaleString('uk-UA', {minimumFractionDigits: 2}) + ' грн';
    
    // Also update sub-totals if they exist (from a previous ID version)
    const subVat = document.getElementById('invTotalWithoutVat');
    if (subVat) subVat.textContent = totalUAH.toLocaleString('uk-UA', {minimumFractionDigits: 2});
    const subTotal = document.getElementById('invTotalWithVat');
    if (subTotal) subTotal.textContent = totalUAH.toLocaleString('uk-UA', {minimumFractionDigits: 2});

    document.getElementById('invSumWords').textContent = numberToWordsUA(totalUAH);

    // Sync seller rekvizity (ensure they are current)
    syncSellerUI();

    // Trigger Print
    document.body.classList.add('print-inv');
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            document.body.classList.remove('print-inv');
        }, 500);
    }, 100);
}

function printDeliveryNote() {
    readProposalForm();
    if (state.proposal.items.length === 0) {
        showToast('Пропозиція порожня', 'warning');
        return;
    }

    showToast('Підготовка накладної до друку...', 'info');

    const propNum = state.proposal.number || '001';
    const dnNum = propNum.replace('КП-', '');
    const dnDate = formatDateUA(state.proposal.date || todayStr());

    // Fill the template
    document.getElementById('dnNumber').textContent = dnNum;
    document.getElementById('dnDate').textContent = dnDate;
    document.getElementById('dnClientName').textContent = state.proposal.clientName || '_______________';
    document.getElementById('dnClientContact').textContent = state.proposal.clientPhone || '';

    // Build table rows
    let tbodyHtml = '';
    state.proposal.items.forEach((it, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f7f9fc';
        tbodyHtml += `<tr style="background:${bg};">
            <td style="padding:10px; border:1px solid #c0c8d8; text-align:center;">${idx + 1}</td>
            <td style="padding:10px; border:1px solid #c0c8d8;">
                <strong>${escHtml(it.name)}</strong>
            </td>
            <td style="padding:10px; border:1px solid #c0c8d8; text-align:center;">${it.quantity}</td>
            <td style="padding:10px; border:1px solid #c0c8d8; text-align:center;">${it.unit || 'шт.'}</td>
        </tr>`;
    });

    // Pad empty rows
    for (let i = state.proposal.items.length; i < 8; i++) {
        tbodyHtml += `<tr style="height:35px;">
            <td style="border:1px solid #c0c8d8; text-align:center; color:#ccc;">${i + 1}</td>
            <td style="border:1px solid #c0c8d8;"></td>
            <td style="border:1px solid #c0c8d8;"></td>
            <td style="border:1px solid #c0c8d8;"></td>
        </tr>`;
    }

    document.getElementById('dnTableBody').innerHTML = tbodyHtml;

    // Trigger Print
    document.body.classList.add('print-dn');
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            document.body.classList.remove('print-dn');
        }, 500);
    }, 100);
}



// Format date as DD.MM.YYYY
function formatDateUA(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
}

// Convert number to Ukrainian words (simplified)
function numberToWordsUA(num) {
    const ones = ['', 'одна', 'дві', 'три', 'чотири', "п'ять", 'шість', 'сім', 'вісім', "дев'ять"];
    const teens = ['десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять', "п'ятнадцять", 
                   'шістнадцять', 'сімнадцять', 'вісімнадцять', "дев'ятнадцять"];
    const tens = ['', '', 'двадцять', 'тридцять', 'сорок', "п'ятдесят", 'шістдесят', 'сімдесят', 'вісімдесят', "дев'яносто"];
    const hundreds = ['', 'сто', 'двісті', 'триста', 'чотириста', "п'ятсот", 'шістсот', 'сімсот', 'вісімсот', "дев'ятсот"];

    const intPart = Math.floor(num);
    const kopPart = Math.round((num - intPart) * 100);

    if (intPart === 0) return `нуль грн. ${String(kopPart).padStart(2, '0')} коп.`;

    function convertGroup(n) {
        if (n === 0) return '';
        let result = '';
        if (n >= 100) {
            result += hundreds[Math.floor(n / 100)] + ' ';
            n %= 100;
        }
        if (n >= 10 && n < 20) {
            result += teens[n - 10] + ' ';
            return result;
        }
        if (n >= 20) {
            result += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        }
        if (n > 0) {
            result += ones[n] + ' ';
        }
        return result;
    }

    let words = '';
    
    if (intPart >= 1000000) {
        const millions = Math.floor(intPart / 1000000);
        words += convertGroup(millions);
        if (millions % 10 === 1 && millions % 100 !== 11) words += 'мільйон ';
        else if ([2,3,4].includes(millions % 10) && ![12,13,14].includes(millions % 100)) words += 'мільйони ';
        else words += 'мільйонів ';
    }
    
    const thousands = Math.floor((intPart % 1000000) / 1000);
    if (thousands > 0) {
        let thWords = convertGroup(thousands);
        // Fix gender: одна тисяча, дві тисячі
        thWords = thWords.replace('одна ', 'одна ').replace('дві ', 'дві ');
        words += thWords;
        if (thousands % 10 === 1 && thousands % 100 !== 11) words += 'тисяча ';
        else if ([2,3,4].includes(thousands % 10) && ![12,13,14].includes(thousands % 100)) words += 'тисячі ';
        else words += 'тисяч ';
    }

    const remainder = intPart % 1000;
    if (remainder > 0) {
        words += convertGroup(remainder);
    }

    words = words.trim();
    // Capitalize first letter
    words = words.charAt(0).toUpperCase() + words.slice(1);
    
    return `${words} грн. ${String(kopPart).padStart(2, '0')} коп.`;
}

async function prepImagesForCapture() {
    const imgs = document.querySelectorAll('#mainContent img');
    for (let img of imgs) {
        if (img.src && !img.src.startsWith('data:')) {
            try {
                const b64 = await convertImgToBase64(img.src);
                img.src = b64;
            } catch (e) {
                console.warn('Could not convert img to base64:', img.src, e);
            }
        }
    }
}

function convertImgToBase64(url) {
    return new Promise((resolve) => {
        if (!url || url.startsWith('data:')) return resolve(url);
        
        const img = new Image();
        // If it's a remote URL, we need Anonymous
        if (url.startsWith('http')) {
            img.crossOrigin = 'Anonymous';
        }
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch (err) {
                // If it fails (tainted), just use the original URL
                resolve(url);
            }
        };
        img.onerror = () => resolve(url); // Don't crash, just use URL
        img.src = url;
    });
}

// ===== UI HELPERS =====
function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + type + ' show';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.classList.remove('show'); }, 3000);
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function setCurrency(cur) {
    state.activeCurrency = cur;
    document.querySelectorAll('.cur-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.currency === cur);
    });
    renderProposalTable();
}

// ===== SETTINGS UI =====
function openSettings() {
    document.getElementById('settingMarkup').value = state.settings.markup;
    document.getElementById('settingUsdUah').value = state.settings.usdToUah;
    document.getElementById('settingEurUah').value = state.settings.eurToUah;
    document.getElementById('settingShowCost').checked = state.settings.showCost;
    document.getElementById('settingBotToken').value = state.settings.botToken || '';
    document.getElementById('settingChatId').value = state.settings.chatId || '';
    
    // Also sync header quick inputs
    document.getElementById('quickUsdUah').value = state.settings.usdToUah;
    document.getElementById('quickMarkup').value = state.settings.markup;
    
    openModal('settingsModal');
}

function applySettings() {
    state.settings.markup = parseFloat(document.getElementById('settingMarkup').value) || 15;
    state.settings.usdToUah = parseFloat(document.getElementById('settingUsdUah').value) || 41.5;
    state.settings.eurToUah = parseFloat(document.getElementById('settingEurUah').value) || 51.0;
    state.settings.showCost = document.getElementById('settingShowCost').checked;
    state.settings.botToken = document.getElementById('settingBotToken').value.trim();
    state.settings.chatId = document.getElementById('settingChatId').value.trim();

    document.body.classList.toggle('hide-cost', !state.settings.showCost);
    const toolbarToggle = document.getElementById('toolbarShowCost');
    if (toolbarToggle) toolbarToggle.checked = state.settings.showCost;
    
    // Update quick inputs
    document.getElementById('quickUsdUah').value = state.settings.usdToUah;
    document.getElementById('quickMarkup').value = state.settings.markup;

    // IMPORTANT: Recalculate USD prices for ALL catalog items 
    // to maintain correct original prices in EUR/UAH
    if (state.products && state.products.length > 0) {
        state.products.forEach(p => {
            p.priceUSD = convertToUSD(p.price, p.priceCurrency);
        });
    }

    saveSettings();
    recalcAllPrices();
    closeModal('settingsModal');
    showToast('Налаштування збережено', 'success');
}

function clearAppCache() {
    if (!confirm('Ви дійсно хочете очистити кеш товарів? Після цього каталог буде завантажено заново з Google Таблиць.')) return;
    
    // Видаляємо всі ключі, що починаються з cso_products_cache
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cso_products_cache')) {
            localStorage.removeItem(key);
        }
    });
    
    showToast('Кеш очищено. Перезавантаження...', 'info');
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Fill form
    fillProposalForm();

    // Apply settings
    document.body.classList.toggle('hide-cost', !state.settings.showCost);
    const toolbarToggle = document.getElementById('toolbarShowCost');
    if (toolbarToggle) {
        toolbarToggle.checked = state.settings.showCost;
        toolbarToggle.addEventListener('change', (e) => {
            state.settings.showCost = e.target.checked;
            document.body.classList.toggle('hide-cost', !state.settings.showCost);
            const modalToggle = document.getElementById('settingShowCost');
            if (modalToggle) modalToggle.checked = state.settings.showCost;
            saveSettings();
        });
    }

    // Show logout button and hide Telegram settings when deployed on Vercel
    if (IS_DEPLOYED) {
        const logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) logoutBtn.style.display = '';
        
        // Hide Telegram token/chatId fields in settings (server handles it)
        const tokenField = document.getElementById('settingBotToken');
        const chatIdField = document.getElementById('settingChatId');
        if (tokenField) tokenField.closest('.form-group').style.display = 'none';
        if (chatIdField) chatIdField.closest('.form-group').style.display = 'none';
    }

    // Buttons
    document.getElementById('btnRefreshData').addEventListener('click', () => fetchSheetData(true));
    document.getElementById('btnSettings').addEventListener('click', openSettings);
    document.getElementById('btnHistory').addEventListener('click', () => { renderHistory(); openModal('historyModal'); });
    document.getElementById('btnSave').addEventListener('click', saveCurrentProposal);
    document.getElementById('btnNewProposal').addEventListener('click', newProposal);
    document.getElementById('btnInvoice').addEventListener('click', printInvoice);
    document.getElementById('btnDeliveryNote').addEventListener('click', printDeliveryNote);
    
    document.getElementById('sellerSelect').addEventListener('change', syncSellerUI);
    
    // TTN Button
    document.getElementById('btnTtn').addEventListener('click', () => {
        readProposalForm();
        if (state.proposal.items.length === 0) {
            showToast('Додайте хоча б один товар', 'error');
            return;
        }
        
        // Pre-fill sender from selected seller
        const seller = SELLERS[state.selectedSeller] || SELLERS.fop_pastushok;
        document.getElementById('ttnSender').value = `${seller.fullName} ${seller.taxIdType} ${seller.taxId}`;

        // Pre-fill date with today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('ttnDate').value = today;
        
        // Try filling receiver if not filled
        if (!document.getElementById('ttnReceiver').value && state.proposal.clientName) {
            document.getElementById('ttnReceiver').value = state.proposal.clientName;
        }
        
        // Populate TTN items list
        const container = document.getElementById('ttnItemsContainer');
        container.innerHTML = '';
        state.proposal.items.forEach((item, index) => {
            const wrap = document.createElement('div');
            wrap.className = 'warranty-item-row'; // reuse the same styling
            wrap.dataset.idx = index;
            
            // Delete button
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-remove-item';
            btnDelete.innerHTML = '&times;';
            btnDelete.title = 'Видалити з ТТН';
            btnDelete.onclick = () => {
                wrap.remove();
                if (container.children.length === 0) {
                    showToast('Вантаж не може бути порожнім', 'warning');
                }
            };
            wrap.appendChild(btnDelete);
            
            const title = document.createElement('div');
            title.style.fontWeight = 'bold';
            title.style.fontSize = '0.9rem';
            title.style.paddingRight = '30px'; 
            title.textContent = `${item.name} — ${item.quantity} ${item.unit || 'шт.'}`;
            wrap.appendChild(title);
            
            container.appendChild(wrap);
        });
        
        openModal('ttnModal');
    });

    document.getElementById('btnGenerateTtn').addEventListener('click', () => {
        const selectedItems = [];
        document.querySelectorAll('#ttnItemsContainer .warranty-item-row').forEach(wrap => {
            const idx = parseInt(wrap.dataset.idx);
            selectedItems.push(state.proposal.items[idx]);
        });

        if (selectedItems.length === 0) {
            showToast('Виберіть хоча б один товар', 'error');
            return;
        }

        const ttnData = {
            date: document.getElementById('ttnDate').value,
            car: document.getElementById('ttnCar').value,
            trailer: document.getElementById('ttnTrailer').value,
            carrier: document.getElementById('ttnCarrier').value,
            driver: document.getElementById('ttnDriver').value,
            sender: document.getElementById('ttnSender').value,
            receiver: document.getElementById('ttnReceiver').value,
            loadPoint: document.getElementById('ttnLoadPoint').value,
            unloadPoint: document.getElementById('ttnUnloadPoint').value,
            items: selectedItems
        };
        
        sessionStorage.setItem('cso_ttn_data', JSON.stringify(ttnData));
        window.open('/ttn.html', '_blank');
        closeModal('ttnModal');
    });
    
    // Warranty Button
    document.getElementById('btnWarranty').addEventListener('click', () => {
        readProposalForm();
        if (state.proposal.items.length === 0) {
            showToast('Додайте хоча б один товар', 'error');
            return;
        }
        
        // Pre-fill seller from selected seller
        const seller = SELLERS[state.selectedSeller] || SELLERS.fop_pastushok;
        document.getElementById('warrantySeller').value = seller.fullName;

        // Pre-fill date with today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('warrantyDate').value = today;
        
        // Try filling buyer if not filled
        if (!document.getElementById('warrantyBuyer').value && state.proposal.clientName) {
            document.getElementById('warrantyBuyer').value = state.proposal.clientName;
        }
        
        // Genereate dynamic item inputs
        const container = document.getElementById('warrantyItemsContainer');
        container.innerHTML = '';
        state.proposal.items.forEach((item, index) => {
            const wrap = document.createElement('div');
            wrap.className = 'warranty-item-row';
            
            // Delete button
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-remove-item';
            btnDelete.innerHTML = '&times;';
            btnDelete.title = 'Видалити з талону';
            btnDelete.onclick = () => wrap.remove();
            wrap.appendChild(btnDelete);
            
            const title = document.createElement('div');
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '8px';
            title.style.fontSize = '0.9rem';
            title.style.paddingRight = '30px'; // Space for delete btn
            title.textContent = `${index + 1}. ${item.name} (${item.quantity} шт.)`;
            
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '10px';
            
            const divSerial = document.createElement('div');
            divSerial.style.flex = '2';
            divSerial.innerHTML = `<label style="font-size:0.8rem">Серійні номери (через кому)</label>
                <input type="text" class="form-input w-serial" data-idx="${index}" placeholder="S/N...">`;
                
            const divPeriod = document.createElement('div');
            divPeriod.style.flex = '1';
            divPeriod.innerHTML = `<label style="font-size:0.8rem">Гарантія</label>
                <input type="text" class="form-input w-period" data-idx="${index}" value="5 років">`;
            
            row.appendChild(divSerial);
            row.appendChild(divPeriod);
            wrap.appendChild(title);
            wrap.appendChild(row);
            container.appendChild(wrap);
        });
        
        openModal('warrantyModal');
    });

    document.getElementById('btnGenerateWarranty').addEventListener('click', () => {
        const itemsData = [];
        document.querySelectorAll('.warranty-item-row').forEach(wrap => {
            const serialInput = wrap.querySelector('.w-serial');
            const periodInput = wrap.querySelector('.w-period');
            if (serialInput && periodInput) {
                const idx = parseInt(serialInput.dataset.idx);
                const item = state.proposal.items[idx];
                itemsData.push({
                    name: item.name,
                    quantity: item.quantity,
                    serial: serialInput.value.trim(),
                    period: periodInput.value.trim() || '5 років'
                });
            }
        });
        
        if (itemsData.length === 0) {
            showToast('Виберіть хоча б один товар для талону', 'error');
            return;
        }
    
        const warrantyData = {
            date: document.getElementById('warrantyDate').value,
            seller: document.getElementById('warrantySeller').value,
            sellerAddress: document.getElementById('warrantySellerAddress').value,
            buyer: document.getElementById('warrantyBuyer').value,
            items: itemsData
        };
        
        sessionStorage.setItem('cso_warranty_data', JSON.stringify(warrantyData));
        window.open('/warranty.html', '_blank');
        closeModal('warrantyModal');
    });
    document.getElementById('btnPrint').addEventListener('click', printProposal);
    document.getElementById('btnTelegram').addEventListener('click', () => openModal('telegramModal'));
    document.getElementById('btnSendTelegram').addEventListener('click', sendToTelegram);
    document.getElementById('btnSaveSettings').addEventListener('click', applySettings);
    document.getElementById('btnAddCustom').addEventListener('click', addCustomItem);
    document.getElementById('btnClearCache').addEventListener('click', clearAppCache);

    // Currency toggle
    document.querySelectorAll('.cur-btn').forEach(btn => {
        btn.addEventListener('click', () => setCurrency(btn.dataset.currency));
    });

    // Catalog search
    document.getElementById('catalogSearch').addEventListener('input', () => renderCatalog());

    // Custom material logic
    let editingMatId = null;

    document.getElementById('btnAddNewMaterial').addEventListener('click', () => {
        editingMatId = null;
        document.getElementById('matName').value = '';
        document.getElementById('matDesc').value = '';
        document.getElementById('matCost').value = '';
        document.getElementById('matUnit').value = 'шт.';
        openModal('materialModal');
    });

    window.editMaterial = function(id) {
        const item = state.products.find(p => p.id === id);
        if (!item) return;
        editingMatId = id;
        document.getElementById('matName').value = item.model;
        document.getElementById('matDesc').value = item.description || '';
        document.getElementById('matCost').value = item.costUSD || item.priceUSD || 0;
        document.getElementById('matUnit').value = item.unit || 'шт.';
        openModal('materialModal');
    };

    document.getElementById('btnSaveMaterial').addEventListener('click', () => {
        const name = document.getElementById('matName').value.trim();
        if (!name) return showToast('Введіть назву', 'error');
        
        const desc = document.getElementById('matDesc').value.trim();
        const cost = parseFloat(document.getElementById('matCost').value) || 0;
        const unit = document.getElementById('matUnit').value || 'шт.';
        
        if (editingMatId) {
            // Check if it's a manual custom material
            let isManualCustom = false;
            const customIdx = state.customMaterials.findIndex(m => m.id === editingMatId);
            if (customIdx >= 0) {
                state.customMaterials[customIdx].model = name;
                state.customMaterials[customIdx].description = desc;
                state.customMaterials[customIdx].priceRaw = cost.toString();
                state.customMaterials[customIdx].price = cost;
                state.customMaterials[customIdx].costUSD = cost;
                state.customMaterials[customIdx].priceUSD = cost;
                state.customMaterials[customIdx].unit = unit;
                saveCustomMaterials();
                isManualCustom = true;
            } else {
                // Must be an override on Google Sheet item
                state.materialOverrides[editingMatId] = {
                    model: name,
                    description: desc,
                    priceRaw: cost.toString(),
                    price: cost,
                    costUSD: cost,
                    priceUSD: cost,
                    unit: unit
                };
                saveMaterialOverrides();
            }

            // Update in products array
            const prodIdx = state.products.findIndex(p => p.id === editingMatId);
            if (prodIdx >= 0) {
                state.products[prodIdx].model = name;
                state.products[prodIdx].description = desc;
                state.products[prodIdx].priceRaw = cost.toString();
                state.products[prodIdx].price = cost;
                state.products[prodIdx].costUSD = cost;
                state.products[prodIdx].priceUSD = cost;
                state.products[prodIdx].unit = unit;
            }

            editingMatId = null;
        } else {
            const newMat = {
                id: generateStableId('mat_' + Date.now() + name),
                mainCategory: 'Витратні матеріали',
                subCategory: 'Мої матеріали',
                category: 'Витратні матеріали - Мої матеріали',
                model: name,
                description: desc,
                unit: unit,
                priceRaw: cost.toString(),
                price: cost,
                costUSD: cost,
                priceCurrency: 'USD',
                priceUSD: cost,
                isCustom: true
            };
            
            state.customMaterials.push(newMat);
            saveCustomMaterials();
            
            state.products.push(newMat);
            if (!state.categories.includes('Витратні матеріали')) {
                state.categories.push('Витратні матеріали');
            }
        }
        
        closeModal('materialModal');
        renderCatalog();
        showToast('Матеріал збережено', 'success');
    });

    // Quick Settings Listeners
    document.getElementById('quickUsdUah').addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 0) {
            state.settings.usdToUah = val;
            
            // Recalculate all underlying USD prices
            if (state.products && state.products.length > 0) {
                state.products.forEach(p => {
                    p.priceUSD = convertToUSD(p.price, p.priceCurrency);
                });
            }
            
            saveSettings();
            recalcAllPrices();
            showToast(`Курс змінено на ${val}`, 'info');
        }
    });

    document.getElementById('quickMarkup').addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            state.settings.markup = val;
            saveSettings();
            showToast(`Націнку за замовчуванням змінено на ${val}%`, 'info');
        }
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.close || btn.closest('.modal-overlay')?.id;
            if (id) closeModal(id);
        });
    });

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });

    // Sidebar toggle (mobile)
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('sidebarClose').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });

    // Telegram format selection styling
    document.querySelectorAll('.tg-option input').forEach(input => {
        input.addEventListener('change', () => {
            document.querySelectorAll('.tg-option').forEach(opt => opt.classList.remove('selected'));
            input.closest('.tg-option').classList.add('selected');
        });
    });

    // Markup apply
    document.getElementById('btnApplyGlobalMarkup').addEventListener('click', () => {
        const val = prompt('Вкажіть відсоток націнки (%) для всіх товарів у пропозиції:', state.settings.markup);
        if (val !== null) {
            const markup = parseFloat(val);
            if (!isNaN(markup)) {
                state.settings.markup = markup;
                saveSettings();
                recalcAllPrices();
                showToast(`Застосовано націнку ${markup}% до всіх товарів`, 'success');
            }
        }
    });

    async function checkAuth() {
        try {
            const res = await fetch('/api/verify');
            const data = await res.json();
            if (data.authenticated) {
                document.getElementById('headerUser').style.display = 'flex';
                document.getElementById('userNameDisplay').textContent = data.name || data.user;
                document.getElementById('btnLogout').style.display = 'flex';

                // Role-based navigation visibility
                const role = (data.role || '').toLowerCase();
                const isAdmin = (role === 'admin' || role === 'адмін' || role === 'адміністратор');
                const moduleAccess = (data.module_access || '').split(',');

                if (document.getElementById('navWarehouse')) {
                    document.getElementById('navWarehouse').style.display = (isAdmin || moduleAccess.includes('warehouse')) ? 'inline-flex' : 'none';
                }
                if (document.getElementById('navKP')) {
                    document.getElementById('navKP').style.display = (isAdmin || moduleAccess.includes('proposals')) ? 'inline-flex' : 'none';
                }
                if (document.getElementById('navProjects')) {
                    document.getElementById('navProjects').style.display = (isAdmin || moduleAccess.includes('projects')) ? 'inline-flex' : 'none';
                }
                if (document.getElementById('navGT')) {
                    document.getElementById('navGT').style.display = (isAdmin || moduleAccess.includes('gt')) ? 'inline-flex' : 'none';
                }
            }
        } catch (e) {
            console.error('Auth check failed', e);
        }
    }

    // Load data
    checkAuth();
    fetchSheetData(false);
    syncProposalsFromSheet();
});
