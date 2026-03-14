/**
 * CSO Solar — Складський облік
 * Google Apps Script Backend
 *
 * Цей файл містить усю серверну логіку для роботи з Google Sheets.
 * Деплоїться як Web App на акаунті andros82@gmail.com.
 *
 * Налаштування:
 * 1. Створити Google Таблицю з 5 аркушами: catalog, warehouses, operations, balances, users
 * 2. Вставити ID таблиці в SPREADSHEET_ID нижче
 * 3. Деплоїти: Deploy → New deployment → Web app → Execute as Me, Access: Anyone
 * 4. Скопіювати URL деплою в warehouse/src/config.js → GAS_URL
 */

// ===== КОНФІГУРАЦІЯ =====
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const BACKUP_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

// ===== WEB APP ENDPOINTS =====

function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'getUser':
        result = handleGetUser(e.parameter.email);
        break;
      case 'getSyncData':
        result = handleGetSyncData();
        break;
      case 'getProposals':
        result = handleGetProposals();
        break;
      case 'getCatalog':
        result = handleGetCatalog();
        break;
      case 'getWarehouses':
        result = handleGetWarehouses();
        break;
      case 'getOperations':
        result = handleGetOperations(e.parameter);
        break;
      case 'getBalances':
        result = handleGetBalances(e.parameter.warehouseId);
        break;
      case 'getBalancesAtDate':
        result = handleGetBalancesAtDate(e.parameter.warehouseId, e.parameter.date);
        break;
      case 'getDailyBalanceData':
        result = handleGetDailyBalanceData(e.parameter.warehouseId);
        break;
      case 'getStockReport':
        result = handleStockReport(e.parameter.warehouseId, e.parameter.date);
        break;
      case 'getCompareReport':
        result = handleCompareReport();
        break;
      case 'getMovementReport':
        result = handleMovementReport(e.parameter);
        break;
      case 'getUsers':
        result = handleGetUsers();
        break;
      case 'getCategories':
        result = handleGetCategories();
        break;
      default:
        result = { success: false, error: 'Невідома дія: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Невалідний JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = data.action;
  let result;

  try {
    switch (action) {
      case 'addProduct':
        result = handleAddProduct(data.product);
        break;
      case 'saveProposal':
        result = handleSaveProposal(data.proposal, data.user);
        break;
      case 'deleteProposal':
        result = handleDeleteProposal(data.proposalId);
        break;
      case 'saveGlobalData':
        result = handleSaveGlobalData(data.key, data.value);
        break;
      case 'updateProduct':
        result = handleUpdateProduct(data.product);
        break;
      case 'archiveProduct':
        result = handleArchiveProduct(data.productId);
        break;
      case 'addWarehouse':
        result = handleAddWarehouse(data.warehouse);
        break;
      case 'updateWarehouse':
        result = handleUpdateWarehouse(data.warehouse);
        break;
      case 'addOperation':
        result = handleAddOperation(data.operation);
        break;
      case 'updateOperation':
        result = handleUpdateOperation(data.operation);
        break;
      case 'deleteOperation':
        result = handleDeleteOperation(data.operationId);
        break;
      case 'submitDailyBalance':
        result = handleSubmitDailyBalance(data);
        break;
      case 'createBackup':
        result = handleCreateBackup();
        break;
      case 'addUser':
        result = handleAddUser(data.user);
        break;
      case 'updateUser':
        result = handleUpdateUser(data.user);
        break;
      case 'addCategory':
        result = handleAddCategory(data.category);
        break;
      case 'updateCategory':
        result = handleUpdateCategory(data.category);
        break;
      default:
        result = { success: false, error: 'Невідома дія: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== УТИЛІТИ =====

function generateUUID() {
  return Utilities.getUuid();
}

function now() {
  return new Date().toISOString();
}

function dateStr(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  return date;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const rawHeaders = data[0];
  
  // Мапінг заголовків для сумісності з фронтендом
  const headerMap = {
    'назва': 'name',
    'артикул': 'article',
    'од. виміру': 'unit',
    'од.': 'unit',
    'категорія': 'category',
    'статус': 'active',
    'активний': 'active',
    'склад': 'warehouse_id',
    'дата': 'date',
    'кількість': 'quantity',
    'товару': 'product_id', 
    'товар': 'product_id',   
    'зі складу': 'warehouse_from',
    'звідки': 'warehouse_from',
    'на склад': 'warehouse_to',
    'куди': 'warehouse_to',
    'тип': 'type',
    'коментар': 'comment',
    'користувач': 'user',
    'автор': 'user',
    'створено': 'created_at',
    'редаговано': 'edited_at',
    'ким': 'edited_by',
    'артикул': 'article',
    'категорія': 'category',
    'категорії': 'category',
    'одиниця': 'unit',
    'од. виміру': 'unit',
    'од.виміру': 'unit',
    'од виміру': 'unit',
    'од.': 'unit',
    'назва': 'name'
  };

  const sheetName = sheet.getName();
  const headers = rawHeaders.map(h => {
    const s = String(h).trim().toLowerCase();
    let mapped = headerMap[s] || s;
    
    // Спеціальний випадок для каталогу, де "Товар" — це назва
    if (sheetName === 'catalog' && (s === 'товар' || s === 'товару' || s === 'назва')) {
      mapped = 'name';
    }
    return mapped;
  });

  const objects = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = data[i][j];
      
      // Перетворення системних статусів у boolean
      if (headers[j] === 'active') {
        val = (val === true || String(val).toLowerCase() === 'true' || val === 'АКТИВНИЙ');
      }
      
      // Форматування дат (GAS часто повертає об'єкти Date)
      if (headers[j] === 'date' || headers[j] === 'created_at' || headers[j] === 'edited_at') {
        if (val instanceof Date) {
          const tz = getSpreadsheet().getSpreadsheetTimeZone();
          val = Utilities.formatDate(val, tz, "yyyy-MM-dd HH:mm:ss");
          if (headers[j] === 'date') val = val.split(' ')[0];
        } else if (val) {
          val = String(val);
        }
      }
      
      obj[headers[j]] = val;
    }
    objects.push(obj);
  }
  return objects;
}

function findRowByValue(sheet, column, value) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIndex = headers.indexOf(column);
  if (colIndex === -1) return -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(value)) return i + 1;
  }
  return -1;
}

// ===== КОРИСТУВАЧІ =====

function handleGetUser(email) {
  if (!email) return { success: false, error: 'Email не вказано' };
  const sheet = getSheet('users');
  const users = sheetToObjects(sheet);
  const user = users.find(u => String(u.email).trim().toLowerCase() === String(email).trim().toLowerCase());
  if (!user) return { success: false, error: 'Користувач не знайдений' };
  return { success: true, user: user };
}

function handleGetUsers() {
  const sheet = getSheet('users');
  return { success: true, users: sheetToObjects(sheet) };
}

function handleAddUser(userData) {
  const sheet = getSheet('users');
  sheet.appendRow([
    userData.email,
    userData.name,
    userData.role,
    userData.warehouse_id || '',
    userData.active !== false
  ]);
  return { success: true };
}

function handleUpdateUser(userData) {
  const sheet = getSheet('users');
  const row = findRowByValue(sheet, 'email', userData.email);
  if (row === -1) return { success: false, error: 'Користувач не знайдений' };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((header, idx) => {
    if (userData[header] !== undefined) {
      sheet.getRange(row, idx + 1).setValue(userData[header]);
    }
  });
  return { success: true };
}

// ===== КАТЕГОРІЇ =====

function getSheetWithInit(name, headers, defaultData) {
  let sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) {
    sheet = getSpreadsheet().insertSheet(name);
    sheet.appendRow(headers);
    if (defaultData && defaultData.length > 0) {
      defaultData.forEach(row => sheet.appendRow(row));
    }
  }
  return sheet;
}

function handleGetCategories() {
  const defaultCats = [
    ['Інвертори', true],
    ['АКБ', true],
    ['Сонячні панелі', true],
    ['Кріплення', true],
    ['Розхідники', true]
  ];
  const sheet = getSheetWithInit('categories', ['name', 'active'], defaultCats);
  return { success: true, categories: sheetToObjects(sheet) };
}

function handleAddCategory(category) {
  const sheet = getSheet('categories');
  const cats = sheetToObjects(sheet);
  if (cats.some(c => String(c.name).toLowerCase() === String(category.name).toLowerCase())) {
    return { success: false, error: 'Така категорія вже існує' };
  }
  sheet.appendRow([category.name, category.active !== false]);
  return { success: true };
}

function handleUpdateCategory(category) {
  const sheet = getSheet('categories');
  const row = findRowByValue(sheet, 'name', category.oldName || category.name);
  if (row === -1) return { success: false, error: 'Категорію не знайдено' };
  
  if (category.name) sheet.getRange(row, 1).setValue(category.name);
  if (category.active !== undefined) sheet.getRange(row, 2).setValue(category.active);
  
  return { success: true };
}

// ===== КОМЕРЦІЙНІ ПРОПОЗИЦІЇ ТА ГЛОБАЛЬНІ ДАНІ Додатка (APP) =====

function handleGetSyncData() {
  const propRes = handleGetProposals();
  const globRes = handleGetGlobalData();
  return {
    success: true,
    proposals: propRes.proposals || [],
    globalData: globRes.data || {}
  };
}

function handleGetProposals() {
  const sheet = getSheetWithInit('proposals', ['id', 'date', 'user', 'json'], []);
  const data = sheet.getDataRange().getValues();
  const proposals = [];
  for (let i = 1; i < data.length; i++) {
    try {
      const p = JSON.parse(data[i][3]);
      proposals.push(p);
    } catch(e) {}
  }
  return { success: true, proposals: proposals };
}

function handleSaveProposal(proposal, user) {
  const sheet = getSheetWithInit('proposals', ['id', 'date', 'user', 'json'], []);
  const row = findRowByValue(sheet, 'id', proposal.id);
  const jsonStr = JSON.stringify(proposal);
  if (row === -1) {
    sheet.appendRow([proposal.id, dateStr(proposal.date), user || '', jsonStr]);
  } else {
    sheet.getRange(row, 2).setValue(dateStr(proposal.date));
    sheet.getRange(row, 3).setValue(user || '');
    sheet.getRange(row, 4).setValue(jsonStr);
  }
  return { success: true };
}

function handleDeleteProposal(proposalId) {
  const sheet = getSheetWithInit('proposals', ['id', 'date', 'user', 'json'], []);
  const row = findRowByValue(sheet, 'id', proposalId);
  if (row !== -1) {
    sheet.deleteRow(row);
  }
  return { success: true };
}

function handleGetGlobalData() {
  const sheet = getSheetWithInit('global_data', ['key', 'value'], []);
  const data = sheet.getDataRange().getValues();
  const result = {};
  for (let i = 1; i < data.length; i++) {
    try {
      result[data[i][0]] = JSON.parse(data[i][1]);
    } catch(e) {}
  }
  return { success: true, data: result };
}

function handleSaveGlobalData(key, value) {
  const sheet = getSheetWithInit('global_data', ['key', 'value'], []);
  const row = findRowByValue(sheet, 'key', key);
  const jsonStr = JSON.stringify(value);
  if (row === -1) {
    sheet.appendRow([key, jsonStr]);
  } else {
    sheet.getRange(row, 2).setValue(jsonStr);
  }
  return { success: true };
}

// ===== КАТАЛОГ =====

function handleGetCatalog() {
  const sheet = getSheet('catalog');
  return { success: true, products: sheetToObjects(sheet) };
}

function getNextArticle() {
  const sheet = getSheet('catalog');
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return 'арт.№001';
  
  const headers = data[0];
  // Шукаємо індекс за англійською або українською назвою
  let artIdx = headers.findIndex(h => {
    const s = String(h).toLowerCase();
    return s === 'article' || s === 'артикул';
  });
  
  // Якщо не знайшли по назві - беремо 3-тю колонку (стандарт для нашого appendRow)
  if (artIdx === -1) artIdx = 2;

  let maxNum = 0;
  for (let i = 1; i < data.length; i++) {
    const art = String(data[i][artIdx]);
    // Регулярний вираз для пошуку числа в кінці або після №
    const match = art.match(/(?:арт\.№|№|)(\d+)$/) || art.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }
  
  const nextNum = maxNum + 1;
  return 'арт.№' + String(nextNum).padStart(3, '0');
}

function handleAddProduct(product) {
  const sheet = getSheet('catalog');
  const products = sheetToObjects(sheet);
  
  // Перевірка на дублікат за назвою
  const exists = products.find(p => String(p.name).trim().toLowerCase() === String(product.name).trim().toLowerCase());
  if (exists) {
    return { success: false, error: 'Товар з такою назвою вже існує в каталозі' };
  }

  const id = generateUUID();
  const article = (product.article && String(product.article).trim()) || getNextArticle();
  
  sheet.appendRow([
    id,
    product.name,
    article,
    product.unit || 'шт',
    product.category || '',
    product.active !== false
  ]);
  return {
    success: true,
    product: {
      id: id,
      name: product.name,
      article: article,
      unit: product.unit || 'шт',
      category: product.category || '',
      active: true
    }
  };
}

function handleUpdateProduct(product) {
  const sheet = getSheet('catalog');
  const row = findRowByValue(sheet, 'id', product.id);
  if (row === -1) return { success: false, error: 'Товар не знайдений' };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((header, idx) => {
    if (product[header] !== undefined && header !== 'id') {
      sheet.getRange(row, idx + 1).setValue(product[header]);
    }
  });
  return { success: true };
}

function handleArchiveProduct(productId) {
  const sheet = getSheet('catalog');
  const row = findRowByValue(sheet, 'id', productId);
  if (row === -1) return { success: false, error: 'Товар не знайдений' };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const activeIdx = headers.indexOf('active');
  if (activeIdx !== -1) {
    sheet.getRange(row, activeIdx + 1).setValue(false);
  }
  return { success: true };
}

// ===== СКЛАДИ =====

function handleGetWarehouses() {
  const sheet = getSheet('warehouses');
  return { success: true, warehouses: sheetToObjects(sheet) };
}

function handleAddWarehouse(warehouse) {
  const sheet = getSheet('warehouses');
  const id = generateUUID();
  sheet.appendRow([
    id,
    warehouse.name,
    warehouse.address || '',
    warehouse.responsible || '',
    warehouse.active !== false
  ]);
  return { success: true, id: id };
}

function handleUpdateWarehouse(warehouse) {
  const sheet = getSheet('warehouses');
  const row = findRowByValue(sheet, 'id', warehouse.id);
  if (row === -1) return { success: false, error: 'Склад не знайдений' };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((header, idx) => {
    if (warehouse[header] !== undefined && header !== 'id') {
      sheet.getRange(row, idx + 1).setValue(warehouse[header]);
    }
  });
  return { success: true };
}

// ===== ОПЕРАЦІЇ =====

function handleGetOperations(params) {
  const sheet = getSheet('operations');
  let operations = sheetToObjects(sheet);

  // Додаємо назви товарів
  const catalog = sheetToObjects(getSheet('catalog'));
  const catalogMap = {};
  catalog.forEach(p => { catalogMap[p.id] = p; });

  // Розрахуємо залишки ПІСЛЯ кожної операції по кожному складу і товару
  // Спочатку треба переконатися, що операції відсортовано хронологічно (від найстарішої до найновішої)
  operations.sort((a, b) => {
    const dateA = String(a.date || '');
    const dateB = String(b.date || '');
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const createdA = String(a.created_at || '');
    const createdB = String(b.created_at || '');
    return createdA.localeCompare(createdB);
  });

  const runningBalances = {}; // key: warehouse_id|product_id

  operations = operations.map(op => {
    const qty = parseFloat(op.quantity) || 0;
    let balance_after = 0;

    if (op.type === 'income' || op.type === 'balance') {
      if (op.warehouse_to) {
        const key = op.warehouse_to + '|' + op.product_id;
        runningBalances[key] = (runningBalances[key] || 0) + qty;
        balance_after = runningBalances[key];
      }
    } else if (op.type === 'expense') {
      if (op.warehouse_from) {
        const key = op.warehouse_from + '|' + op.product_id;
        runningBalances[key] = (runningBalances[key] || 0) - qty;
        balance_after = runningBalances[key];
      }
    }

    return {
      ...op,
      product_name: catalogMap[op.product_id]?.name || '',
      product_article: catalogMap[op.product_id]?.article || '',
      unit: catalogMap[op.product_id]?.unit || '',
      balance_after: balance_after
    };
  });

  // Фільтри
  if (params.warehouseId) {
    operations = operations.filter(op =>
      op.warehouse_from === params.warehouseId || op.warehouse_to === params.warehouseId
    );
  }
  if (params.type) {
    operations = operations.filter(op => op.type === params.type);
  }
  if (params.dateFrom) {
    operations = operations.filter(op => op.date >= params.dateFrom);
  }
  if (params.dateTo) {
    operations = operations.filter(op => op.date <= params.dateTo);
  }
  if (params.search) {
    operations = operations.filter(op => {
      const content = (op.product_name || '') + ' ' + (op.product_article || '');
      return matchesSearch(content, params.search);
    });
  }

  // Сортування: найновіші зверху
  operations.sort((a, b) => {
    const dateA = String(a.date || '');
    const dateB = String(b.date || '');
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    
    const createdA = String(a.created_at || '');
    const createdB = String(b.created_at || '');
    return createdB.localeCompare(createdA);
  });

  return { success: true, operations: operations };
}

function handleAddOperation(operation) {
  const sheet = getSheet('operations');
  const timestamp = now();
  const date = dateStr(operation.date);

  if (operation.type === 'transfer') {
    // Переміщення — два пов'язані записи
    const transferId = generateUUID();

    operation.items.forEach(item => {
      const expenseId = generateUUID();
      const incomeId = generateUUID();

      // Розхід зі складу-відправника
      sheet.appendRow([
        expenseId, date, operation.warehouseFrom, '', item.productId,
        'expense', item.quantity, operation.comment || 'Переміщення',
        operation.user, timestamp, '', '', transferId
      ]);

      // Прихід на склад-отримувач
      sheet.appendRow([
        incomeId, date, '', operation.warehouseTo, item.productId,
        'income', item.quantity, operation.comment || 'Переміщення',
        operation.user, timestamp, '', '', transferId
      ]);

      // Оновлення залишків
      updateBalance(operation.warehouseFrom, item.productId, -item.quantity);
      updateBalance(operation.warehouseTo, item.productId, item.quantity);
    });
  } else {
    // Прихід або Розхід
    const warehouseId = operation.warehouseId;
    operation.items.forEach(item => {
      const id = generateUUID();
      const qty = parseFloat(item.quantity) || 0;
      const whFrom = operation.type === 'income' ? '' : warehouseId;
      const whTo = operation.type === 'income' ? warehouseId : '';

      sheet.appendRow([
        id, date, whFrom, whTo, item.productId,
        operation.type, qty, item.comment || operation.comment || '',
        operation.user, timestamp, '', '', ''
      ]);

      const delta = operation.type === 'income' ? qty : -qty;
      updateBalance(warehouseId, item.productId, delta);
    });
  }

  return { success: true };
}

function handleUpdateOperation(operation) {
  const sheet = getSheet('operations');
  const row = findRowByValue(sheet, 'id', operation.id);
  if (row === -1) return { success: false, error: 'Операція не знайдена' };

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Зберегти старі значення
  const oldValues = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
  const oldObj = {};
  headers.forEach((h, i) => { oldObj[h] = oldValues[i]; });

  // Оновити поля
  headers.forEach((header, idx) => {
    if (operation[header] !== undefined && header !== 'id') {
      sheet.getRange(row, idx + 1).setValue(operation[header]);
    }
  });

  // Оновити метадані редагування
  const editedAtIdx = headers.indexOf('edited_at');
  const editedByIdx = headers.indexOf('edited_by');
  if (editedAtIdx !== -1) sheet.getRange(row, editedAtIdx + 1).setValue(now());
  if (editedByIdx !== -1) sheet.getRange(row, editedByIdx + 1).setValue(operation.edited_by || '');

  // Перерахувати залишки
  recalculateBalances();

  return { success: true };
}

function handleDeleteOperation(operationId) {
  const sheet = getSheet('operations');
  const row = findRowByValue(sheet, 'id', operationId);
  if (row === -1) return { success: false, error: 'Операція не знайдена' };

  sheet.deleteRow(row);
  recalculateBalances();

  return { success: true };
}

// ===== ЗАЛИШКИ =====

function updateBalance(warehouseId, productId, delta) {
  const sheet = getSheet('balances');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const whIdx = headers.indexOf('warehouse_id');
  const pIdx = headers.indexOf('product_id');
  const qIdx = headers.indexOf('quantity');
  const uIdx = headers.indexOf('updated_at');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][whIdx]) === String(warehouseId) && String(data[i][pIdx]) === String(productId)) {
      const newQty = (parseFloat(data[i][qIdx]) || 0) + delta;
      sheet.getRange(i + 1, qIdx + 1).setValue(newQty);
      sheet.getRange(i + 1, uIdx + 1).setValue(now());
      return;
    }
  }

  // Новий запис
  sheet.appendRow([warehouseId, productId, delta, now()]);
}

function recalculateBalances() {
  const opsSheet = getSheet('operations');
  const balSheet = getSheet('balances');

  // Очистити залишки (залишити заголовки)
  if (balSheet.getLastRow() > 1) {
    balSheet.deleteRows(2, balSheet.getLastRow() - 1);
  }

  const operations = sheetToObjects(opsSheet);
  const balances = {};

  operations.forEach(op => {
    const qty = parseFloat(op.quantity) || 0;

    if (op.type === 'income' || op.type === 'balance') {
      if (op.warehouse_to) {
        const key = op.warehouse_to + '|' + op.product_id;
        balances[key] = (balances[key] || 0) + qty;
      }
    } else if (op.type === 'expense') {
      if (op.warehouse_from) {
        const key = op.warehouse_from + '|' + op.product_id;
        balances[key] = (balances[key] || 0) - qty;
      }
    }
  });

  const timestamp = now();
  const rows = Object.entries(balances).map(([key, qty]) => {
    const [warehouseId, productId] = key.split('|');
    return [warehouseId, productId, qty, timestamp];
  });

  if (rows.length > 0) {
    balSheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }
}

function handleGetBalances(warehouseId) {
  const sheet = getSheet('balances');
  let balances = sheetToObjects(sheet);
  if (warehouseId) {
    balances = balances.filter(b => b.warehouse_id === warehouseId);
  }
  return { success: true, balances: balances };
}

function handleGetBalancesAtDate(warehouseId, date) {
  const operations = sheetToObjects(getSheet('operations'));
  const balances = {};

  operations.forEach(op => {
    if (op.date > date) return;
    const qty = parseFloat(op.quantity) || 0;

    if ((op.type === 'income' || op.type === 'balance') && op.warehouse_to) {
      if (!warehouseId || op.warehouse_to === warehouseId) {
        const key = op.warehouse_to + '|' + op.product_id;
        balances[key] = (balances[key] || 0) + qty;
      }
    } else if (op.type === 'expense' && op.warehouse_from) {
      if (!warehouseId || op.warehouse_from === warehouseId) {
        const key = op.warehouse_from + '|' + op.product_id;
        balances[key] = (balances[key] || 0) - qty;
      }
    }
  });

  const result = Object.entries(balances).map(([key, qty]) => {
    const [wId, pId] = key.split('|');
    return { warehouse_id: wId, product_id: pId, quantity: qty };
  });

  return { success: true, balances: result };
}

function handleGetDailyBalanceData(warehouseId) {
  if (!warehouseId) return { success: false, error: 'Склад не вказано' };

  const balances = sheetToObjects(getSheet('balances')).filter(b => b.warehouse_id === warehouseId);
  const catalog = sheetToObjects(getSheet('catalog'));
  const catalogMap = {};
  catalog.forEach(p => { catalogMap[p.id] = p; });

  const items = balances
    .filter(b => (parseFloat(b.quantity) || 0) !== 0)
    .map(b => ({
      product_id: b.product_id,
      product_name: catalogMap[b.product_id]?.name || '',
      product_article: catalogMap[b.product_id]?.article || '',
      unit: catalogMap[b.product_id]?.unit || 'шт',
      quantity: parseFloat(b.quantity) || 0
    }));

  return { success: true, items: items };
}

function handleSubmitDailyBalance(data) {
  const sheet = getSheet('operations');
  const timestamp = now();
  const date = dateStr(data.date);
  
  // Додаємо тип 'adjustment' для кращої ідентифікації в журналі
  // або використовуємо стандартні income/expense, але з чітким коментарем
  
  data.items.forEach(item => {
    const diff = parseFloat(item.diff) || 0;
    if (diff === 0) return;

    const id = generateUUID();
    const type = diff > 0 ? 'income' : 'expense';
    const qty = Math.abs(diff);
    const whFrom = diff < 0 ? data.warehouseId : '';
    const whTo = diff > 0 ? data.warehouseId : '';
    const comment = `📦 Коригування залишків (Підсумок дня ${date})`;

    sheet.appendRow([
      id, date, whFrom, whTo, item.productId,
      type, qty, comment, data.user, timestamp, '', '', ''
    ]);

    updateBalance(data.warehouseId, item.productId, diff);
  });

  return { success: true };
}

// ===== ЗВІТИ =====

function handleStockReport(warehouseId, date) {
  const balResult = date
    ? handleGetBalancesAtDate(warehouseId, date)
    : handleGetBalances(warehouseId);

  const catalog = sheetToObjects(getSheet('catalog'));
  const catalogMap = {};
  catalog.forEach(p => { catalogMap[p.id] = p; });

  const warehouses = sheetToObjects(getSheet('warehouses'));
  const warehousesMap = {}; // Renamed from whMap to warehousesMap to match snippet
  warehouses.forEach(w => { warehousesMap[w.id] = w.name; });

  const items = (balResult.balances || []).map(b => ({
    'Товар': catalogMap[b.product_id]?.name || b.product_id,
    'Одиниця': catalogMap[b.product_id]?.unit || '',
    'Склад': warehousesMap[b.warehouse_id] || b.warehouse_id,
    'Кількість': b.quantity
  }));

  return {
    success: true,
    columns: ['Товар', 'Одиниця', 'Склад', 'Кількість'],
    items: items
  };
}

function handleCompareReport() {
  const balances = sheetToObjects(getSheet('balances'));
  const catalog = sheetToObjects(getSheet('catalog'));
  const warehouses = sheetToObjects(getSheet('warehouses')).filter(w => w.active);

  const catalogMap = {};
  catalog.forEach(p => { catalogMap[p.id] = p; });

  // Збираємо дані
  const productMap = {};
  balances.forEach(b => {
    if (!productMap[b.product_id]) {
      productMap[b.product_id] = {};
    }
    productMap[b.product_id][b.warehouse_id] = parseFloat(b.quantity) || 0;
  });

  const columns = ['Товар', 'Од.'];
  warehouses.forEach(w => { columns.push(w.name); });
  columns.push('Всього');

  const items = Object.entries(productMap).map(([productId, whBalances]) => {
    const product = catalogMap[productId] || {};
    const row = {
      'Товар': product.name || productId,
      'Од.': product.unit || ''
    };
    let total = 0;
    warehouses.forEach(w => {
      const qty = whBalances[w.id] || 0;
      row[w.name] = qty;
      total += qty;
    });
    row['Всього'] = total;
    return row;
  });

  return { success: true, columns: columns, items: items };
}

function handleMovementReport(params) {
  const operations = sheetToObjects(getSheet('operations'));
  const catalog = sheetToObjects(getSheet('catalog'));
  const warehouses = sheetToObjects(getSheet('warehouses'));

  const catalogMap = {};
  catalog.forEach(p => { catalogMap[p.id] = p; });
  const whMap = {};
  warehouses.forEach(w => { whMap[w.id] = w.name; });

  let filtered = operations;
  if (params.warehouseId) {
    filtered = filtered.filter(op =>
      op.warehouse_from === params.warehouseId || op.warehouse_to === params.warehouseId
    );
  }
  if (params.productId) {
    filtered = filtered.filter(op => op.product_id === params.productId);
  }
  if (params.dateFrom) {
    filtered = filtered.filter(op => op.date >= params.dateFrom);
  }
  if (params.dateTo) {
    filtered = filtered.filter(op => op.date <= params.dateTo);
  }
  if (params.type) {
    filtered = filtered.filter(op => op.type === params.type);
  }

  filtered.sort((a, b) => a.date.localeCompare(b.date));

  const columns = ['Дата', 'Тип', 'Товар', 'Склад', 'К-сть', 'Коментар', 'Автор'];
  const items = filtered.map(op => {
    const typeLabels = { income: 'Прихід', expense: 'Розхід', transfer: 'Переміщення', balance: 'Підсумок дня' };
    return {
      'Дата': op.date,
      'Тип': typeLabels[op.type] || op.type,
      'Товар': catalogMap[op.product_id]?.name || '',
      'Склад': whMap[op.warehouse_from || op.warehouse_to] || '',
      'К-сть': op.quantity,
      'Коментар': op.comment || '',
      'Автор': op.user || ''
    };
  });

  return { success: true, columns: columns, items: items };
}

// ===== БЕКАПИ =====

function handleCreateBackup() {
  try {
    const ss = getSpreadsheet();
    const folder = DriveApp.getFolderById(BACKUP_FOLDER_ID);
    const dateStamp = Utilities.formatDate(new Date(), 'Europe/Kyiv', 'yyyy-MM-dd');
    const fileName = 'backup_' + dateStamp + '.xlsx';

    // Створити копію як Excel
    const blob = ss.getBlob().setName(fileName);
    const file = folder.createFile(blob);

    // Видалити старі копії (залишити 90)
    cleanOldBackups(folder, 90);

    return { success: true, fileName: fileName, fileId: file.getId() };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function cleanOldBackups(folder, keepCount) {
  const files = folder.getFilesByType(MimeType.MICROSOFT_EXCEL);
  const fileList = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().startsWith('backup_')) {
      fileList.push(file);
    }
  }

  // Сортувати за датою (найновіші першими)
  fileList.sort((a, b) => b.getDateCreated() - a.getDateCreated());

  // Видалити старіші за keepCount
  for (let i = keepCount; i < fileList.length; i++) {
    fileList[i].setTrashed(true);
  }
}

// ===== АВТОМАТИЧНИЙ БЕКАП (тригер) =====

/**
 * Цю функцію потрібно встановити як щоденний тригер:
 * Edit → Triggers → Add Trigger → dailyBackupTrigger → Time-driven → Day timer → 11pm to midnight
 */
function dailyBackupTrigger() {
  handleCreateBackup();
}
/**
 * Повна транслітерація кирилиці в латиницю для пошуку.
 * Дозволяє знаходити товари навіть при введенні латинськими літерами.
 * Наприклад: "prob" знайде "Пробка", "solar" знайде "Солар"
 * Ця логіка повністю синхронізована з фронтендом (searchUtils.js).
 */
function normalizeForSearch(str) {
  if (!str) return '';
  var TRANSLIT_MAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'ґ': 'g', 'д': 'd',
    'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i',
    'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ь': '', 'ю': 'yu', 'я': 'ya', 'ъ': '', 'ы': 'y', 'э': 'e'
  };
  var lower = str.toString().toLowerCase();
  var result = '';
  for (var i = 0; i < lower.length; i++) {
    var ch = lower[i];
    result += (TRANSLIT_MAP[ch] !== undefined) ? TRANSLIT_MAP[ch] : ch;
  }
  return result;
}

/**
 * Перевіряє чи рядок content відповідає пошуковому запиту query.
 * Шукає і по оригіналу (lowercase), і по транслітерації.
 */
function matchesSearch(content, query) {
  if (!query || !query.trim()) return true;
  var searchWords = query.trim().toLowerCase().split(/\s+/);
  var original = (content || '').toString().toLowerCase();
  var transliterated = normalizeForSearch(content);

  for (var i = 0; i < searchWords.length; i++) {
    var word = searchWords[i];
    var wordTranslit = normalizeForSearch(word);
    if (!(original.indexOf(word) >= 0 || transliterated.indexOf(word) >= 0 || transliterated.indexOf(wordTranslit) >= 0)) {
      return false;
    }
  }
  return true;
}
