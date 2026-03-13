/* ===== CSO Solar — Commercial Proposal App ===== */

// ===== CONFIGURATION =====
const CONFIG = {
    SPREADSHEET_ID: '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g',
    SHEETS: [
        { name: 'Сонячні батареї', mainCat: 'Сонячні батареї', gid: 1271219295 },
        { name: 'Гібридні інвертори', mainCat: 'Інвертори', gid: 2087142679 },
        { name: 'Мережеві інвертори', mainCat: 'Інвертори', gid: 1047165471 },
        { name: 'АКБ', mainCat: 'АКБ та BMS', gid: 1248903265 }
    ],
    CORS_PROXIES: [
        '',
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url='
    ],
    DEFAULT_MARKUP: 15,
    DEFAULT_USD_UAH: 41.50,
    DEFAULT_EUR_USD: 1.08
};

// Detect if running on Vercel (HTTPS) vs local file://
const IS_DEPLOYED = window.location.protocol === 'https:';

let state = {
    products: [],
    categories: [],
    proposal: createEmptyProposal(),
    settings: loadSettings(),
    history: loadHistory(),
    activeCurrency: 'USD',
    favorites: loadFavorites(),
    customMaterials: loadCustomMaterials()
};

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

// ===== SETTINGS =====
function loadSettings() {
    try {
        const s = JSON.parse(localStorage.getItem('cso_settings'));
        if (s) return s;
    } catch (e) {}
    return {
        markup: CONFIG.DEFAULT_MARKUP,
        usdToUah: CONFIG.DEFAULT_USD_UAH,
        eurToUsd: CONFIG.DEFAULT_EUR_USD,
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
    if (!forceRefresh) {
        const cached = localStorage.getItem('cso_products_cache_v7');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (data && data.products && data.products.length > 0) {
                    state.products = [...data.products, ...state.customMaterials];
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

            try {
                data = await fetchViaGviz(sheet.gid, sheet.name, sheet.mainCat, sheet.spreadsheetId);
            } catch (e) { console.warn(`gviz failed for ${sheet.name}:`, e.message); }

            if (!data || data.length === 0) {
                try {
                    data = await fetchViaProxy(sheet.gid, sheet.name, sheet.mainCat, sheet.spreadsheetId);
                } catch (e) { console.warn(`proxy failed for ${sheet.name}:`, e.message); }
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

    localStorage.setItem('cso_products_cache_v7', JSON.stringify({
        products: allProducts,
        categories: [...new Set(allProducts.map(p => p.mainCategory))],
        timestamp: Date.now()
    }));

    state.products = [...allProducts, ...state.customMaterials];
    state.categories = [...new Set(state.products.map(p => p.mainCategory))];

    renderCatalog();
    showCatalogLoading(false);
    showToast(`Завантажено ${allProducts.length} товарів`, 'success');
}

// --- Method 1: Google Visualization API ---
async function fetchViaGviz(gid, categoryName, mainCat, spreadsheetId = null) {
    const sId = spreadsheetId || CONFIG.SPREADSHEET_ID;
    const url = `https://docs.google.com/spreadsheets/d/${sId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('gviz HTTP ' + resp.status);
    const csv = await resp.text();
    if (!csv || csv.length < 50) throw new Error('empty gviz response');
    return parseSheetCSV(csv, categoryName, mainCat);
}

// --- Method 2: CORS proxy + CSV export ---
async function fetchViaProxy(gid, categoryName, mainCat, spreadsheetId = null) {
    const sId = spreadsheetId || CONFIG.SPREADSHEET_ID;
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sId}/export?format=csv&gid=${gid}`;
    const proxies = [
        'https://corsproxy.io/?url=',
        'https://api.allorigins.win/raw?url=',
        'https://api.codetabs.com/v1/proxy?quest='
    ];
    for (const proxy of proxies) {
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
        const url = `https://docs.google.com/spreadsheets/d/${sId}/gviz/tq?tqx=out:json;responseHandler:${callbackName}&gid=${gid}`;

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
                                   /se-g|se-f|rw-m|rw-f|bos-g|bos-b|gb-lm|gb-lbs|pro-c|prob|pro[вb]|pro\s+[вb]/i.test(modelLower);
                const isBMS = modelLower.includes('bms');

                if (!isDeyeBrand && !isBMS) {
                    continue;
                }

                subCat = isBMS ? 'BMS / Контролери' : 'Deye';
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
            localStorage.setItem('cso_products_cache_v7', JSON.stringify({
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
                                   /se-g|se-f|rw-m|rw-f|bos-g|bos-b|gb-lm|gb-lbs|pro-c|prob|pro[вb]|pro\s+[вb]/i.test(modelLower);
                const isBMS = modelLower.includes('bms');

                if (!isDeyeBrand && !isBMS) {
                    continue;
                }

                subCat = isBMS ? 'BMS / Контролери' : 'Deye';
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

    // Handle "800 гот / 960 з ПДВ" or similar - extract the first number
    if (s.toLowerCase().includes('гот') || s.includes('/')) {
        const match = s.match(/[\d\s,.]+/);
        if (match) {
            s = match[0];
        }
    }

    s = s.replace(/[$€]/g, '').trim();
    s = s.replace(/\s/g, '');
    s = s.replace(',', '.');

    const val = parseFloat(s);
    if (isNaN(val) || val <= 0) return null;
    return { value: val, currency };
}

function convertToUSD(value, currency) {
    if (currency === 'EUR') return Math.round(value * state.settings.eurToUsd * 100) / 100;
    return value;
}

function convertCurrency(usdValue, toCurrency) {
    if (toCurrency === 'UAH') return Math.round(usdValue * state.settings.usdToUah * 100) / 100;
    return usdValue;
}

function formatMoney(value, currency) {
    if (currency === undefined) currency = state.activeCurrency;
    const sym = currency === 'UAH' ? '₴' : '$';
    const converted = convertCurrency(value, currency);
    return sym + ' ' + converted.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== CATALOG RENDERING =====
function renderCatalog() {
    const container = document.getElementById('catalogList');
    const searchVal = (document.getElementById('catalogSearch')?.value || '').toLowerCase();

    // extract main categories
    const mainCats = [...new Set(state.products.map(p => p.mainCategory))];
    
    let html = '';
    for (const mCat of mainCats) {
        const mItems = state.products.filter(p => p.mainCategory === mCat && 
             (searchVal === '' || p.model.toLowerCase().includes(searchVal) || (p.description || '').toLowerCase().includes(searchVal) || p.subCategory.toLowerCase().includes(searchVal))
        );
        if (mItems.length === 0) continue;

        const isMainExpanded = searchVal !== ''; // expanded if searching
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
    
    const customCostHtml = p.isCustom ? `<span style="font-size:0.65rem; color:var(--text-muted); display:block; margin-top:2px;">Собів: $${p.costUSD}</span>` : '';
    const deleteBtn = p.isCustom ? `<button class="product-favorite" onclick="deleteCustomMaterial(event, '${p.id}')" title="Видалити з каталогу" style="color:var(--danger)">🗑</button>` : '';

    return `<div class="product-item" title="${escHtml(p.description || '')}">
        <div class="product-info">
            <div class="product-model">${escHtml(p.model)}</div>
            <div class="product-desc">${escHtml(p.description || '')}</div>
            ${customCostHtml}
        </div>
        ${priceTag}
        <button class="product-favorite ${favClass}" onclick="toggleFavorite(event, '${p.id}')" title="Улюблене">${favIcon}</button>
        ${deleteBtn}
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
        
        let nameInput = `<div class="row-name-text">${escHtml(item.name)}</div>`;
        if (item.productId === 'custom') {
            nameInput = `<input type="text" class="tbl-input" style="width:100%;font-weight:600;margin-bottom:2px" value="${escHtml(item.name)}" onchange="updateItemField(${i},'name',this.value)" placeholder="Назва товару">`;
        }
        
        // Editable cost field
        const costVal = convertCurrency(item.costUSD, state.activeCurrency).toFixed(2);
        const costInput = `<input type="number" class="tbl-input input-price" style="width:100%" value="${costVal}" step="0.01" min="0" onchange="updateItemCost(${i},this.value)">`;

        html += `<tr>
            <td class="row-num">${i + 1}</td>
            <td>
                ${nameInput}
                <div class="${item.productId === 'custom' ? '' : 'row-name-desc'}">
                    ${item.productId === 'custom' 
                        ? `<input type="text" class="tbl-input" style="width:100%;font-size:0.75rem;color:var(--text-muted)" value="${escHtml(item.description)}" onchange="updateItemField(${i},'description',this.value)" placeholder="Опис">`
                        : escHtml(item.description)}
                </div>
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
}

function fillProposalForm() {
    document.getElementById('proposalNumber').value = state.proposal.number || '';
    document.getElementById('proposalDate').value = state.proposal.date || todayStr();
    document.getElementById('clientName').value = state.proposal.clientName || '';
    document.getElementById('clientContact').value = state.proposal.clientContact || '';
    document.getElementById('proposalNotes').value = state.proposal.notes || '';
    
    // Sync quick inputs
    document.getElementById('quickUsdUah').value = state.settings.usdToUah;
    document.getElementById('quickMarkup').value = state.settings.markup;
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
    showToast('Пропозицію збережено', 'success');
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
    showToast('Пропозицію видалено', 'info');
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
    if (state.activeCurrency === 'UAH') {
        note.textContent = `Курс: 1 USD = ${state.settings.usdToUah} UAH`;
    } else {
        note.textContent = '';
    }
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
            const pdfData = Uint8Array.from(atob(data.pdfBase64), c => c.charCodeAt(0));
            const blob = new Blob([pdfData], { type: 'application/pdf' });
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
    const showCost = state.settings.showCost;
    document.body.classList.add('hide-cost');
    const noprint = document.querySelectorAll('.no-print');
    noprint.forEach(el => el.style.display = 'none');

    const printH = document.getElementById('printHeader');
    const originalDisplay = printH.style.display;
    printH.style.display = 'flex';
    document.body.classList.add('is-exporting');

    const notes = document.querySelector('.proposal-notes-container');
    if (notes) notes.style.display = 'none';

    // Convert logo to data URL to avoid tainting
    await prepImagesForCapture();

    const el = document.getElementById('mainContent');
    const opt = {
        margin: [0, 5, 5, 5],
        filename: `proposal.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            backgroundColor: '#ffffff', 
            useCORS: true,
            allowTaint: true 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        const blob = await html2pdf().set(opt).from(el).output('blob');

        // Restore UI
        document.body.classList.remove('is-exporting');
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

        // Convert blob to base64
        const reader = new FileReader();
        const pdfBase64 = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });
        
        const caption = `📋 ${state.proposal.number || 'КП'} | ${state.proposal.clientName || ''}`;
        await telegramRequest('sendDocument', { pdfBase64, caption, filename: 'proposal.pdf' });
    } catch (err) {
        document.body.classList.remove('is-exporting');
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
        throw err;
    }
}

function exportToXls() {
    readProposalForm();
    if (state.proposal.items.length === 0) {
        showToast('Пропозиція порожня', 'warning');
        return;
    }

    if (typeof XLSX === 'undefined') {
        showToast('Помилка: Бібліотека Excel не завантажена', 'error');
        return;
    }

    showToast('Генерація Excel...', 'info');

    const cur = state.activeCurrency;
    const curSym = cur === 'UAH' ? '₴' : '$';

    // Company header rows
    const rows = [
        ["CSO Solar"],
        ["Офіс та склад: Львівська обл., м. Золочів, вул. І. Труша 1Б"],
        ["+38 067 374 08 02"],
        [],
        ["КОМЕРЦІЙНА ПРОПОЗИЦІЯ"],
        [],
        ["Номер:", state.proposal.number || "", "", "Дата:", state.proposal.date || ""],
        ["Клієнт:", state.proposal.clientName || "", "", "Контакт:", state.proposal.clientContact || ""],
        [],
        // Table headers
        ["№", "Назва товару", "Од.", "К-сть", `Ціна (${curSym})`, `Сума (${curSym})`]
    ];

    // Data rows
    state.proposal.items.forEach((it, idx) => {
        const priceValue = convertCurrency(it.price, cur);
        const sumValue = Math.round(priceValue * it.quantity * 100) / 100;
        const nameWithDesc = it.description 
            ? `${it.name}\n${it.description}` 
            : it.name;
        rows.push([
            idx + 1,
            nameWithDesc,
            it.unit,
            it.quantity,
            priceValue,
            sumValue
        ]);
    });

    // Totals
    const totalSum = state.proposal.items.reduce((s, it) => s + it.price * it.quantity, 0);
    const convertedTotal = convertCurrency(totalSum, cur);
    rows.push([]);
    rows.push(["", "", "", "", "РАЗОМ:", convertedTotal]);

    // Notes
    if (state.proposal.notes) {
        rows.push([]);
        rows.push(["Примітки:", state.proposal.notes]);
    }

    // Currency note
    if (cur === 'UAH') {
        rows.push([]);
        rows.push([`Курс: 1 USD = ${state.settings.usdToUah} UAH`]);
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Merge cells for header
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },  // CSO Solar
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },  // Address
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },  // Phone
        { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } },  // КОМЕРЦІЙНА ПРОПОЗИЦІЯ
    ];

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },   // №
        { wch: 55 },  // Назва товару
        { wch: 8 },   // Од.
        { wch: 8 },   // К-сть
        { wch: 14 },  // Ціна
        { wch: 14 }   // Сума
    ];

    // Set row heights for items with descriptions (wrap text)
    ws['!rows'] = [];
    for (let i = 0; i < rows.length; i++) {
        if (i >= 10 && i < 10 + state.proposal.items.length) {
            ws['!rows'][i] = { hpt: 36 }; // taller rows for product names
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Пропозиція");

    // Generate filename
    const rawNum = state.proposal.number || 'kp';
    const safeNum = rawNum.replace(/[^a-zA-Z0-9а-яА-ЯіїєґІЇЄҐ-]/g, '_');
    const filename = `${safeNum}.xlsx`;

    // Download
    try {
        const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        const url = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + b64;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
        
        showToast('Excel файл завантажено', 'success');
    } catch (err) {
        console.error('Excel Export Error:', err);
        showToast('Помилка при експорті', 'error');
        XLSX.writeFile(wb, filename);
    }
}

function exportInvoicePDF() {
    readProposalForm();
    if (state.proposal.items.length === 0) {
        showToast('Пропозиція порожня', 'warning');
        return;
    }

    showToast('Генерація рахунку (PDF)...', 'info');

    const uahRate = state.settings.usdToUah;
    const propNum = state.proposal.number || 'КП-001';
    const invoiceNum = propNum.replace('КП-', '');
    const invoiceDate = formatDateUA(state.proposal.date || todayStr());

    // Fill the template
    document.getElementById('invNumber').textContent = invoiceNum;
    document.getElementById('invDate').textContent = invoiceDate;
    document.getElementById('invClientName').textContent = state.proposal.clientName || '_______________';
    document.getElementById('invClientContact').textContent = state.proposal.clientContact || '';

    // Build table rows
    let totalUAH = 0;
    let tbodyHtml = '';

    state.proposal.items.forEach((it, idx) => {
        const priceUAH = Math.round(it.price * uahRate * 100) / 100;
        const sumUAH = Math.round(priceUAH * it.quantity * 100) / 100;
        totalUAH += sumUAH;

        const bg = idx % 2 === 0 ? '#ffffff' : '#f7f9fc';
        tbodyHtml += `<tr style="background:${bg};">
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:center;">${idx + 1}</td>
            <td style="padding:6px; border:1px solid #c0c8d8;">
                <strong>${escHtml(it.name)}</strong>
                ${it.description ? '<br><span style="font-size:10px; color:#666;">' + escHtml(it.description) + '</span>' : ''}
            </td>
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:center;">${it.quantity}</td>
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:center;">${it.unit}</td>
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:right;">${priceUAH.toLocaleString('uk-UA', {minimumFractionDigits: 2})}</td>
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:right; font-weight:600;">${sumUAH.toLocaleString('uk-UA', {minimumFractionDigits: 2})}</td>
        </tr>`;
    });

    // Pad empty rows to minimum 10
    for (let i = state.proposal.items.length; i < 10; i++) {
        const bg = i % 2 === 0 ? '#ffffff' : '#f7f9fc';
        tbodyHtml += `<tr style="background:${bg};">
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:center; color:#ccc;">${i + 1}</td>
            <td style="padding:6px; border:1px solid #c0c8d8;"></td>
            <td style="padding:6px; border:1px solid #c0c8d8;"></td>
            <td style="padding:6px; border:1px solid #c0c8d8; text-align:center; color:#ccc;">шт.</td>
            <td style="padding:6px; border:1px solid #c0c8d8;"></td>
            <td style="padding:6px; border:1px solid #c0c8d8;"></td>
        </tr>`;
    }

    document.getElementById('invTableBody').innerHTML = tbodyHtml;
    document.getElementById('invTotal').textContent = totalUAH.toLocaleString('uk-UA', {minimumFractionDigits: 2}) + ' грн';
    document.getElementById('invSumWords').textContent = numberToWordsUA(totalUAH);

    // Show the template, render PDF, hide it
    const template = document.getElementById('invoiceTemplate');
    const content = document.getElementById('invoiceContent');
    template.style.display = 'block';
    template.style.position = 'absolute';
    template.style.left = '-9999px';
    template.style.top = '0';

    const opt = {
        margin: [0, 5, 5, 5],
        filename: `Рахунок_${invoiceNum}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(content).save().then(() => {
        template.style.display = 'none';
        showToast('Рахунок завантажено як PDF', 'success');
    }).catch(err => {
        template.style.display = 'none';
        console.error('Invoice PDF error:', err);
        showToast('Помилка генерації рахунку', 'error');
    });
}

function exportInvoiceXLS() {
    readProposalForm();
    if (state.proposal.items.length === 0) {
        showToast('Пропозиція порожня', 'warning');
        return;
    }

    showToast('Генерація рахунку (Excel)...', 'info');

    const uahRate = state.settings.usdToUah;
    const propNum = state.proposal.number || 'КП-001';
    const invoiceNum = propNum.replace('КП-', '');
    const invoiceDate = formatDateUA(state.proposal.date || todayStr());

    const rows = [
        ["РАХУНОК-ФАКТУРА", "", "", "", "№:", invoiceNum],
        ["", "", "", "", "Дата:", invoiceDate],
        [],
        ["ПОСТАЧАЛЬНИК", "", "", "ПОКУПЕЦЬ"],
        ["Назва:", "ФОП Пастушок Марія Володимирівна", "", "Назва:", state.proposal.clientName || ""],
        ["РНОКПП:", "3090406261", "", "ЄДРПОУ:", ""],
        ["Адреса:", "Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38", "", "Адреса:", ""],
        ["IBAN:", "UA563003350000000260092475237", "", "IBAN:", ""],
        ["Банк:", 'АТ "РАЙФФАЙЗЕН БАНК"', "", "Банк:", ""],
        ["Тел:", "(067)374-08-12", "", "Тел / Email:", state.proposal.clientContact || ""],
        [],
        ["№", "Найменування товару", "К-сть", "Од.", "Ціна, грн", "Сума, грн"]
    ];

    let totalUAH = 0;
    state.proposal.items.forEach((it, idx) => {
        const priceUAH = Math.round(it.price * uahRate * 100) / 100;
        const sumUAH = Math.round(priceUAH * it.quantity * 100) / 100;
        totalUAH += sumUAH;
        const nameWithDesc = it.description ? `${it.name} (${it.description})` : it.name;
        rows.push([idx + 1, nameWithDesc, it.quantity, it.unit, priceUAH, sumUAH]);
    });

    // Pad to 10 rows
    for (let i = state.proposal.items.length; i < 10; i++) {
        rows.push([i + 1, "", "", "шт.", "", ""]);
    }

    rows.push([]);
    rows.push(["", "", "", "", "СУМА ДО СПЛАТИ:", totalUAH]);
    rows.push(["Сума прописом: " + numberToWordsUA(totalUAH) + " грн.", "", "", "", "", ""]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Title
        { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }, // Supplier header
        { s: { r: 3, c: 3 }, e: { r: 3, c: 5 } }, // Buyer header
        { s: { r: rows.length - 1, c: 0 }, e: { r: rows.length - 1, c: 5 } } // Sum in words
    ];

    ws['!cols'] = [{ wch: 8 }, { wch: 50 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 14 }];

    XLSX.utils.book_append_sheet(wb, ws, "Рахунок");
    const filename = `Рахунок_${invoiceNum}.xlsx`;

    try {
        const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        const url = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + b64;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
        showToast('Рахунок (Excel) завантажено', 'success');
    } catch (err) {
        XLSX.writeFile(wb, filename);
    }
}

function handleInvoiceClick() {
    openModal('invoiceModal');
}

function generateSelectedInvoice() {
    const format = document.querySelector('input[name="invFormat"]:checked').value;
    closeModal('invoiceModal');
    if (format === 'pdf') {
        exportInvoicePDF();
    } else {
        exportInvoiceXLS();
    }
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
    document.getElementById('settingEurUsd').value = state.settings.eurToUsd;
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
    state.settings.eurToUsd = parseFloat(document.getElementById('settingEurUsd').value) || 1.08;
    state.settings.showCost = document.getElementById('settingShowCost').checked;
    state.settings.botToken = document.getElementById('settingBotToken').value.trim();
    state.settings.chatId = document.getElementById('settingChatId').value.trim();

    document.body.classList.toggle('hide-cost', !state.settings.showCost);
    
    // Update quick inputs
    document.getElementById('quickUsdUah').value = state.settings.usdToUah;
    document.getElementById('quickMarkup').value = state.settings.markup;

    saveSettings();
    recalcAllPrices();
    closeModal('settingsModal');
    showToast('Налаштування збережено', 'success');
}

function clearAppCache() {
    if (!confirm('Ви дійсно хочете очистити кеш товарів? Після цього каталог буде завантажено заново з Google Таблиць.')) return;
    
    // Remove all versions of product cache
    for (let i = 0; i <= 10; i++) {
        localStorage.removeItem('cso_products_cache_v' + i);
    }
    
    localStorage.removeItem('cso_products_cache'); 
    
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
    document.getElementById('btnInvoice').addEventListener('click', handleInvoiceClick);
    document.getElementById('btnGenerateInvoice').addEventListener('click', generateSelectedInvoice);
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
    document.getElementById('btnAddNewMaterial').addEventListener('click', () => {
        document.getElementById('matName').value = '';
        document.getElementById('matDesc').value = '';
        document.getElementById('matCost').value = '';
        document.getElementById('matUnit').value = 'шт.';
        openModal('materialModal');
    });

    document.getElementById('btnSaveMaterial').addEventListener('click', () => {
        const name = document.getElementById('matName').value.trim();
        if (!name) return showToast('Введіть назву', 'error');
        
        const desc = document.getElementById('matDesc').value.trim();
        const cost = parseFloat(document.getElementById('matCost').value) || 0;
        const unit = document.getElementById('matUnit').value || 'шт.';
        
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
        
        closeModal('materialModal');
        renderCatalog();
        showToast('Матеріал збережено', 'success');
    });

    // Quick Settings Listeners
    document.getElementById('quickUsdUah').addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 0) {
            state.settings.usdToUah = val;
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

    // Load data
    fetchSheetData(false);
});
