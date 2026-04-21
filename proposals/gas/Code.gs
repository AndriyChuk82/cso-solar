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
const SPREADSHEET_ID = '1JzZFwvw6-m5JqP2Nra2azUvoWfuoY6Bsh-3qWtLPZ_k';
const PROPOSALS_SPREADSHEET_ID = '1JzZFwvw6-m5JqP2Nra2azUvoWfuoY6Bsh-3qWtLPZ_k';
const BACKUP_FOLDER_ID = '14kNr3Ex0bdVb0gddRzShkr8X88BYhtmL';
const MATERIALS_SPREADSHEET_ID = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';
const CUSTOM_MATERIALS_SPREADSHEET_ID = '1JzZFwvw6-m5JqP2Nra2azUvoWfuoY6Bsh-3qWtLPZ_k';
const SHEETS_CONFIG = [
  { name: 'Сонячні батареї', mainCat: 'Сонячні батареї', gid: 1271219295 },
  { name: 'Гібридні інвертори', mainCat: 'Інвертори', gid: 2087142679 },
  { name: 'Мережеві інвертори', mainCat: 'Інвертори', gid: 1047165471 },
  { name: 'АКБ', mainCat: 'АКБ та BMS', gid: 1248903265 },
  { name: 'ДОВІДНИК_ТОВАРІВ', mainCat: 'Власний матеріал', gid: 0, spreadsheetId: '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g' }
];

function getSpreadsheet(id = SPREADSHEET_ID) {
  const ssId = id || SPREADSHEET_ID;
  return SpreadsheetApp.openById(ssId);
}

function getSheet(name, ssId = SPREADSHEET_ID) {
  return getSpreadsheet(ssId).getSheetByName(name);
}

function getProposalsSpreadsheet() {
  const customId = String(PROPOSALS_SPREADSHEET_ID || "").trim();
  if (customId && customId !== 'YOUR_PROPOSALS_SPREADSHEET_ID_HERE') {
    return SpreadsheetApp.openById(customId);
  }
  const mainId = String(SPREADSHEET_ID || "").trim();
  if (!mainId || mainId === 'YOUR_SPREADSHEET_ID_HERE') {
    try {
      return SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      throw new Error("ID таблиці не вказано. Будь ласка, впишіть SPREADSHEET_ID в Code.gs.");
    }
  }
  
  // Додаємо спробу відкрити через DriveApp, якщо SpreadsheetApp підводить
  try {
    return SpreadsheetApp.openById(mainId);
  } catch (e) {
    try {
      const file = DriveApp.getFileById(mainId);
      return SpreadsheetApp.open(file);
    } catch (e2) {
      throw new Error("Не вдалося відкрити таблицю " + mainId + ": " + e.toString());
    }
  }
}

// ===== WEB APP ENDPOINTS =====

function doGet(e) {
  // Якщо action немає - по замовчуванню робимо ping для діагностики
  const action = e.parameter.action || 'ping';
  let result;

  try {
    switch (action) {
      case 'getUser':
        result = handleGetUser(e.parameter.email);
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
      case 'getUsersForLogin':
        result = handleGetUsersForLogin();
        break;
      case 'getCategories':
        result = handleGetCategories();
        break;
      case 'getProjects':
        result = handleGetProjects(e.parameter.email || e.parameter.userEmail);
        break;
      case 'getProjectDetails':
        result = handleGetProjectDetails(e.parameter.projectId);
        break;
      case 'getProposals':
        result = handleGetProposals();
        break;
      case 'getAllProducts':
        result = getAllProducts();
        break;
      case 'getCustomMaterials':
        result = getCustomMaterials();
        break;
      case 'getRates':
        result = getRates();
        break;
      case 'getAllData':
        result = getAllData();
        break;
      case 'ping':
        result = handlePing();
        break;
      case 'syncProjectItems':
        result = handleSyncProjectItems(e.parameter.projectId);
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
      case 'saveProposal':
        console.log("POST: saveProposal received");
        result = handleSaveProposal(data.proposal, data.userEmail || data.user || data.email);
        break;
      case 'getProposals':
        result = handleGetProposals();
        break;
      case 'getProjects':
        result = handleGetProjects(data.userEmail || data.email);
        break;
      case 'getProjectDetails':
        result = handleGetProjectDetails(data.projectId);
        break;
      case 'saveProject':
        result = handleSaveProject(data.project, data.user);
        break;
      case 'saveProjectItem':
        result = handleSaveProjectItem(data.item);
        break;
      case 'deleteProjectItem':
        result = handleDeleteProjectItem(data.itemId);
        break;
      case 'savePayment':
        result = handleSavePayment(data.payment, data.user);
        break;
      case 'cancelPayment':
        result = handleCancelPayment(data.paymentId, data.user);
        break;
      case 'deleteProposal':
        result = handleDeleteProposal(data.proposalId);
        break;
      case 'syncProjectItems':
        result = handleSyncProjectItems(data.projectId);
        break;
      case 'getAllProducts':
        result = getAllProducts();
        break;
      case 'getCustomMaterials':
        result = getCustomMaterials();
        break;
      case 'updateMaterialPrice':
        result = updateMaterialPrice(data.id, data.priceUsd, data.priceUah);
        break;
      case 'addCustomMaterial':
        result = addCustomMaterial(data.product);
        break;
      case 'deleteCustomMaterial':
        result = deleteCustomMaterial(data.productId);
        break;
      case 'getRates':
        result = getRates();
        break;
      case 'getAllData':
        result = getAllData();
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

const HEADER_MAP = {
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
  'категорії': 'category',
  'одиниця': 'unit',
  'од.виміру': 'unit',
  'од виміру': 'unit',
  'роль': 'role',
  'емейл': 'email',
  'пошта': 'email',
  'email': 'email',
  'login': 'email',
  'пароль': 'password',
  'склад id': 'warehouse_id',
  'id складу': 'warehouse_id',
  'клієнт': 'client_name',
  'телефон': 'client_phone',
  'адреса': 'address',
  'примітки': 'notes',
  'id кп': 'proposal_id',
  'id проекту': 'project_id',
  'ціна': 'price',
  'сума': 'sum',
  'примітка': 'note',
  'оновлено': 'updated_at',
  'погоджена сума': 'agreed_sum',
  'тип платежу': 'payment_type',
  'дата закриття': 'closed_date',
  'номер': 'project_number',
  'проєкти': 'project_access',
  'проекти': 'project_access',
  'доступні проєкти': 'project_access',
  'доступ до проєктів': 'project_access',
  'модулі': 'module_access',
  'розділи': 'module_access',
  'доступ до розділів': 'module_access',
  'стан': 'active',
  // Англійські версії для надійності
  'client': 'client_name',
  'customer': 'client_name',
  'phone': 'client_phone',
  'contact': 'client_phone',
  'address': 'address',
  'notes': 'notes',
  'note': 'notes',
  'proposal_id': 'proposal_id',
  'project_id': 'project_id',
  'project_number': 'project_number',
  'agreed_sum': 'agreed_sum',
  'closed_date': 'closed_date'
};

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const rawHeaders = data[0];

  const sheetName = sheet.getName();
  const headers = rawHeaders.map(h => {
    const s = String(h).trim().toLowerCase();
    let mapped = HEADER_MAP[s] || s;
    
    // Спеціальний випадок: для каталогу "Товар" — це назва
    if (sheetName === 'catalog' && (s === 'товар' || s === 'товару' || s === 'назва')) {
      mapped = 'name';
    }
    
    // Спеціальний випадок: для проектів і платежів "Статус" — це текст, а не логічне значення "active"
    if ((sheetName === 'projects' || sheetName === 'project_payments') && mapped === 'active') {
      mapped = 'status';
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
  const rawHeaders = data[0];
  const sheetName = sheet.getName();
  const headers = rawHeaders.map(h => {
    const s = String(h).trim().toLowerCase();
    let mapped = HEADER_MAP[s] || s;
    if ((sheetName === 'projects' || sheetName === 'project_payments') && mapped === 'active') {
      mapped = 'status';
    }
    return mapped;
  });
  const colIndex = headers.indexOf(column);
  if (colIndex === -1) return -1;
  const searchVal = String(value || '').trim().toLowerCase();
  for (let i = 1; i < data.length; i++) {
    const cellVal = String(data[i][colIndex] || '').trim().toLowerCase();
    if (cellVal === searchVal) return i + 1;
  }
  return -1;
}

function isRoleAdmin(role) {
  const r = String(role || '').toLowerCase().trim();
  return r === 'admin' || r === 'адмін' || r === 'адміністратор';
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
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const hLower = headers.map(h => String(h).trim().toLowerCase());
  
  // Додаємо колонку паролю
  if (hLower.indexOf('пароль') === -1) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue('пароль');
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  
  // Додаємо колонку проєктів
  if (hLower.indexOf('проєкти') === -1 && hLower.indexOf('проекти') === -1) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue('проєкти');
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  // Додаємо колонку модулів
  if (hLower.indexOf('модулі') === -1 && hLower.indexOf('розділи') === -1) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue('модулі');
  }
  
  return { success: true, users: sheetToObjects(sheet) };
}

function handleGetUsersForLogin() {
  const sheet = getSheet('users');
  return { success: true, users: sheetToObjects(sheet) };
}

function handleAddUser(userData) {
  const sheet = getSheet('users');
  sheet.appendRow([
    userData.email || '',
    userData.name || '',
    userData.role || 'user',
    userData.warehouse_id || '',
    userData.active !== false,
    userData.password || '',
    userData.project_access || '',
    userData.module_access || ''
  ]);
  SpreadsheetApp.flush();
  return { success: true };
}

function handleUpdateUser(userData) {
  const sheet = getSheet('users');
  const row = findRowByValue(sheet, 'email', userData.email);
  if (row === -1) return { success: false, error: 'Користувач не знайдений' };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((header, idx) => {
    const s = String(header).trim().toLowerCase();
    const mapped = HEADER_MAP[s] || s;
    if (userData[mapped] !== undefined) {
      sheet.getRange(row, idx + 1).setValue(userData[mapped]);
    }
  });
  SpreadsheetApp.flush();
  return { success: true };
}

// ===== КАТЕГОРІЇ =====

function getSheetWithInit(name, headers, defaultData, ss) {
  try {
    const targetSs = ss || getSpreadsheet();
    let sheet = targetSs.getSheetByName(name);
    if (!sheet) {
      console.log("Створюю новий аркуш: " + name);
      sheet = targetSs.insertSheet(name);
      if (headers && headers.length > 0) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
        sheet.setFrozenRows(1);
      }
      if (defaultData && defaultData.length > 0) {
        defaultData.forEach(row => sheet.appendRow(row));
      }
    }
    return sheet;
  } catch (e) {
    console.error("Помилка getSheetWithInit: " + e.toString());
    return null;
  }
}

function handlePing() {
  try {
    const ss = getProposalsSpreadsheet();
    // Використовуємо уніфіковані заголовки
    const headers = [
      'ID', 'Номер', 'Дата', 'Клієнт', 'Контакт', 
      'Курс $', 'Націнка %', 'Сума Разом', 'Статус', 
      'Товари (JSON)', 'Примітки', 'Автор', 'Оновлено'
    ];
    const sheet = getSheetWithInit('proposals', headers, [], ss);
    
    return {
      success: true,
      spreadsheetName: ss.getName(),
      id: ss.getId(),
      sheets: ss.getSheets().map(s => s.getName()),
      user: Session.getActiveUser().getEmail(),
      proposalsSheetCreated: !!sheet,
      version: '1.3'
    };
  } catch (e) {
    return { success: false, error: "Ping failed: " + e.toString() };
  }
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


// (Старий блок функцій видалено для уникнення дублювання. Повна логіка нижче у розділі КОМЕРЦІЙНІ ПРОПОЗИЦІЇ)

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

  // Додаємо імена авторів замість логінів
  const users = sheetToObjects(getSheet('users'));
  const userMap = {};
  users.forEach(u => {
    if (u.email) userMap[String(u.email).toLowerCase().trim()] = u.name || u.email;
  });

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
      product_category: catalogMap[op.product_id]?.category || '',
      unit: catalogMap[op.product_id]?.unit || '',
      user_name: userMap[String(op.user || '').toLowerCase().trim()] || op.user || '—',
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
      product_category: catalogMap[b.product_id]?.category || '',
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
    'Кількість': b.quantity,
    'category': catalogMap[b.product_id]?.category || ''
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

  const columns = ['Товар', 'Од.', 'Всього'];
  warehouses.forEach(w => { columns.push(w.name); });

  const items = Object.entries(productMap).map(([productId, whBalances]) => {
    const product = catalogMap[productId] || {};
    const row = {
      'Товар': product.name || productId,
      'Од.': product.unit || '',
      'category': product.category || ''
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

  const users = sheetToObjects(getSheet('users'));
  const userMap = {};
  users.forEach(u => {
    if (u.email) userMap[String(u.email).toLowerCase().trim()] = u.name || u.email;
  });

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
      'Автор': userMap[String(op.user || '').toLowerCase().trim()] || op.user || '—',
      'category': catalogMap[op.product_id]?.category || ''
    };
  });

  return { success: true, columns: columns, items: items };
}

// ===== КОМЕРЦІЙНІ ПРОПОЗИЦІЇ - ФУНКЦІЇ ЗБЕРІГАННЯ І БЕКАПУ =====
 
/**
 * Обробляє збереження комерційної пропозиції у Google Sheets
 * Викликається з фронтенду при натисканні " Зберегти пропозицію"
 */
function handleSaveProposal(proposal, userParams) {
  // 1. Визначаємо автора (пошту)
  let userEmail = "";
  if (typeof userParams === 'string') {
    userEmail = userParams;
  } else if (userParams && typeof userParams === 'object') {
    userEmail = userParams.email || userParams.userEmail || userParams.user || "";
  }
  if (!userEmail && proposal.userEmail) userEmail = proposal.userEmail;

  console.log("Raw proposal data received: " + JSON.stringify(proposal));
  
  try {
    if (!proposal) throw new Error("Дані КП відсутні");
    
    const ss = getProposalsSpreadsheet();
    const sheetName = 'proposals';
    
    // Заголовки згідно зі скріншотом
    const headers = [
      'ID', 'Номер', 'Дата', 'Клієнт', 'Контакт', 
      'Курс $', 'Націнка %', 'Сума Разом', 'Статус', 
      'Товари (JSON)', 'Примітки', 'Автор', 'Оновлено'
    ];
    
    const sheet = getSheetWithInit(sheetName, headers, [], ss);
    if (!sheet) throw new Error("Не вдалося відкрити аркуш proposals");
    
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    const pId = String(proposal.id);

    // Шукаємо за ID для оновлення або створення
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === pId) {
        rowIndex = i + 1;
        break;
      }
    }
    
    // Формуємо рядок за скріншотом
    const usdRate = Number(proposal.rates?.usdToUah || proposal.courseUSD || proposal.usdRate || 0);
    const totalAmount = Number(proposal.total || proposal.totalAmount || 0);
    const markupValue = Number(proposal.markup || 0);

    const rowData = [
      pId,                                              // 0: ID (прихований)
      proposal.number || "",                            // 1: НОМЕР
      proposal.date || "",                              // 2: ДАТА
      proposal.clientName || "",                        // 3: КЛІЄНТ
      proposal.clientPhone || "",                       // 4: КОНТАКТ
      usdRate,                                          // 5: КУРС $
      markupValue,                                      // 6: НАЦІНКА %
      totalAmount,                                      // 7: СУМА
      proposal.status || "Чернетка",                    // 8: СТАТУС
      JSON.stringify({ 
        ...proposal,
        items: proposal.items || [],
        rates: proposal.rates || { usdToUah: usdRate, eurToUah: proposal.eurToUah || proposal.courseEUR || 0 },
        total: totalAmount,
        subtotal: proposal.subtotal || totalAmount
      }),                                               // 9: ПОЗИЦІЇ ТА НАЛАШТУВАННЯ
      proposal.notes || proposal.comment || "",         // 10: ПРИМІТКИ
      userEmail || "невідомо",                          // 11: АВТОР
      new Date().toISOString()                          // 12: ОНОВЛЕНО (ISO для кращого парсингу)
    ];
    
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    SpreadsheetApp.flush();
    
    return { 
      success: true, 
      message: 'КП ' + (proposal.number || '') + ' збережено в таблицю' 
    };
  } catch (err) {
    console.error("Save Error: " + err.toString());
    return { success: false, error: err.toString() };
  }
}
 
/**
 * Отримує всі КП з Google Sheets
 * Викликається з фронтенду для завантаження списку збережених КП
 */
function handleGetProposals() {
  try {
    const ss = getProposalsSpreadsheet();
    const sheet = ss.getSheetByName('proposals');
    
    if (!sheet) {
      return { 
        success: true, 
        proposals: [], 
        debug: 'Аркуш "proposals" не знайдено в таблиці ' + ss.getName() + '. Доступні аркуші: ' + ss.getSheets().map(s => s.getName()).join(', ')
      };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, proposals: [] };

    const proposals = [];
    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];
        let itemsData = {};
        try {
          itemsData = typeof row[9] === 'string' ? JSON.parse(row[9]) : (row[9] || {});
        } catch (e) { console.warn("Error parsing items for row " + i); }

        // Визначаємо структуру items (масив або об'єкт)
        let items = [];
        if (Array.isArray(itemsData)) {
          items = itemsData;
        } else if (itemsData && itemsData.items) {
          items = itemsData.items;
        }

        // Мапінг статусів
        let status = row[8] || 'draft';
        if (status === 'Чернетка') status = 'draft';
        if (status === 'Відправлено') status = 'sent';
        if (status === 'Прийнято') status = 'accepted';
        if (status === 'Відхилено') status = 'rejected';

        // Валідація дати оновлення
        let updatedAt = row[12] || row[2] || new Date().toISOString(); 

        // Відновлюємо дані з JSON якщо в колонках нулі (Recovery logic)
        const total = parseFloat(row[7]) || itemsData.total || itemsData.totalAmount || 0;
        const usdRate = parseFloat(row[5]) || itemsData.rates?.usdToUah || itemsData.courseUSD || 0;
        const eurRate = itemsData.rates?.eurToUah || itemsData.courseEUR || 0;
        const markup = parseFloat(row[6]) || itemsData.markup || 0;
        const subtotal = itemsData.subtotal || items.reduce((sum, item) => sum + (item.total || 0), 0);

        proposals.push({
          id: row[0],
          number: row[1],
          date: row[2],
          clientName: row[3],
          clientPhone: row[4],
          rates: {
            usdToUah: usdRate,
            eurToUah: eurRate
          },
          markup: markup,
          total: total,
          status: status,
          items: items,
          discountType: itemsData.discountType || 'percentage',
          discountValue: itemsData.discountValue || 0,
          sellerId: itemsData.sellerId || 'fop_pastushok',
          currency: itemsData.currency || (total > 10000 ? 'UAH' : 'USD'),
          subtotal: subtotal,
          vatMode: itemsData.vatMode || 'none',
          vatAmount: itemsData.vatAmount || 0,
          notes: row[10] || itemsData.notes || '',
          userEmail: row[11] || '',
          updatedAt: updatedAt,
          createdAt: row[2] || updatedAt
        });
      } catch (parseErr) {
        console.warn('Помилка рядка ' + (i + 1) + ':', parseErr);
      }
    }
    return { success: true, proposals: proposals };
  } catch (err) {
    console.error('handleGetProposals error:', err);
    return { success: false, error: err.toString() };
  }
}
 
/**
 * Видаляє КП з Google Sheets
 */
function handleDeleteProposal(proposalId) {
  try {
    const ss = getProposalsSpreadsheet();
    const sheet = ss.getSheetByName('proposals');
    
    if (!sheet) {
      return { success: false, error: 'Аркуш proposals не знайдено' };
    }
 
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === proposalId) {
        sheet.deleteRow(i + 1); // +1 тому що нумерація починається з 1
        return { success: true, message: 'Пропозиція видалена' };
      }
    }
 
    return { success: false, error: 'Пропозиція не знайдена' };
 
  } catch (err) {
    console.error('handleDeleteProposal error:', err);
    return { success: false, error: err.toString() };
  }
}
 
/**
 * Створює резервну копію ВСІХ даних, включаючи КП
 * Це покращена версія handleCreateBackup()
 */
function handleCreateBackupWithProposals() {
  try {
    const ss = getProposalsSpreadsheet();
    const folder = DriveApp.getFolderById(BACKUP_FOLDER_ID);
    const dateStamp = Utilities.formatDate(new Date(), 'Europe/Kyiv', 'yyyy-MM-dd_HH-mm-ss');
    
    // Основна таблиця - складський облік
    const mainFileName = 'backup_main_' + dateStamp + '.xlsx';
    const mainBlob = ss.getBlob().setName(mainFileName);
    const mainFile = folder.createFile(mainBlob);
 
    let proposalsFileName = null;
    let proposalsFile = null;
 
    // Якщо існує окрема таблиця для КП
    if (PROPOSALS_SPREADSHEET_ID && PROPOSALS_SPREADSHEET_ID !== SPREADSHEET_ID) {
      try {
        const proposalsSs = SpreadsheetApp.openById(PROPOSALS_SPREADSHEET_ID);
        proposalsFileName = 'backup_proposals_' + dateStamp + '.xlsx';
        const proposalsBlob = proposalsSs.getBlob().setName(proposalsFileName);
        proposalsFile = folder.createFile(proposalsBlob);
      } catch (e) {
        console.warn('Не вдалося створити бекап КП (окрема таблиця):', e);
      }
    }
 
    // Видалити старі копії (залишити 90 днів)
    cleanOldBackups(folder, 90);
 
    const result = {
      success: true,
      mainFileName: mainFileName,
      mainFileId: mainFile.getId(),
      timestamp: dateStamp
    };
 
    if (proposalsFile) {
      result.proposalsFileName = proposalsFileName;
      result.proposalsFileId = proposalsFile.getId();
    }
 
    return result;
 
  } catch (err) {
    console.error('handleCreateBackupWithProposals error:', err);
    return { success: false, error: err.toString() };
  }
}
 
/**
 * Тригер для автоматичного щоденного бекапу з КП
 * Встановити: Edit → Triggers → Add Trigger
 * → Function: dailyBackupWithProposalsTrigger
 * → Time-driven → Day timer → 23:00 (11pm)
 */
function dailyBackupWithProposalsTrigger() {
  handleCreateBackupWithProposals();
  console.log('Щоденний бекап завершено: ' + new Date());
}
 
/**
 * Експортує всі КП у CSV формат для завантаження
 */
function handleExportProposalsAsCSV() {
  try {
    const result = handleGetProposals();
    if (!result.success) {
      return result;
    }
 
    const proposals = result.proposals;
    let csv = 'Номер,Дата,Клієнт,Контакт,Сума (СОБ),Сума (Продаж),Валюта,Статус,Користувач\n';
 
    proposals.forEach(p => {
      csv += [
        p.number || '',
        p.date || '',
        p.client || '',
        p.contact || '',
        p.costSum || 0,
        p.saleSum || 0,
        p.currency || 'USD',
        p.status || '',
        p.user || ''
      ].map(v => '"' + (v.toString().replace(/"/g, '""')) + '"').join(',') + '\n';
    });
 
    return {
      success: true,
      csv: csv,
      fileName: 'proposals_export_' + Utilities.formatDate(new Date(), 'Europe/Kyiv', 'yyyy-MM-dd') + '.csv'
    };
  } catch (err) {
    console.error('handleExportProposalsAsCSV error:', err);
    return { success: false, error: err.toString() };
  }
}

function handleMovementReport(params) {
  const operations = sheetToObjects(getSheet('operations'));
  const catalog = sheetToObjects(getSheet('catalog'));
  const warehouses = sheetToObjects(getSheet('warehouses'));

  const catalogMap = {};
  catalog.forEach(p => { catalogMap[p.id] = p; });
  const whMap = {};
  warehouses.forEach(w => { whMap[w.id] = w.name; });

  const users = sheetToObjects(getSheet('users'));
  const userMap = {};
  users.forEach(u => {
    if (u.email) userMap[String(u.email).toLowerCase().trim()] = u.name || u.email;
  });

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
      'Автор': userMap[String(op.user || '').toLowerCase().trim()] || op.user || '—',
      'category': catalogMap[op.product_id]?.category || ''
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
// ===== УПРАВЛІННЯ ПРОЕКТАМИ (СОНЯЧНІ СТАНЦІЇ) =====

function handleGetProjects(userEmail) {
  const ss = getSpreadsheet();
  const projectsSheet = getSheetWithInit('projects', [
    'ID', 'Назва', 'Клієнт', 'Телефон', 'Адреса', 'Статус', 'Примітки', 'ID КП',
    'Погоджена сума', 'Номер', 'Дата закриття', 'Створено', 'Оновлено'
  ], [], ss);
  
  // Отримуємо проєкти
  const projects = sheetToObjects(projectsSheet);

  // Фільтрація за доступом користувача
  let allowedProjectIds = null;
  let isAdmin = true;

  if (userEmail) {
    const userRes = handleGetUser(userEmail);
    if (userRes.success && userRes.user) {
      isAdmin = isRoleAdmin(userRes.user.role);
      
      if (!isAdmin) {
        // Якщо не адмін — дивимось доступні проєкти
        const access = String(userRes.user.project_access || '').trim();
        if (access) {
          allowedProjectIds = access.split(',').map(s => s.trim()).filter(s => s);
        } else {
          allowedProjectIds = []; // Немає доступу до жодного проєкту
        }
      }
    }
  }

  const paymentsSheet = getSheetWithInit('project_payments', [
    'ID', 'ID Проекту', 'Дата', 'Сума', 'Статус', 'Примітка', 'Тип платежу', 'Автор', 'Створено'
  ], [], ss);
  
  const itemsSheet = getSheetWithInit('project_items', [
    'ID', 'ID Проекту', 'Назва', 'Кількість', 'Ціна', 'Сума', 'Примітка'
  ], [], ss);

  const payments = sheetToObjects(paymentsSheet);
  const items = sheetToObjects(itemsSheet);

  // Додаємо агреговані дані
  let enrichedProjects = projects.map(p => {
    const projectItems = items.filter(i => String(i.project_id) === String(p.id));
    const totalCost = projectItems.reduce((acc, i) => acc + (parseFloat(i.sum) || 0), 0);
    
    const projectPayments = payments.filter(pay => {
      const isCorrectProject = String(pay.project_id) === String(p.id);
      const statusValue = String(pay.status || pay.active || '').toLowerCase();
      const isPaid = statusValue.includes('оплачено') && !statusValue.includes('скасовано');
      return isCorrectProject && isPaid;
    });
    const totalPaid = projectPayments.reduce((acc, pay) => acc + (parseFloat(pay.sum) || 0), 0);
    
    const agreedSum = parseFloat(p['погоджена сума'] || p.agreed_sum || 0) || totalCost;
    return {
      ...p,
      agreed_sum: agreedSum,
      total_cost: totalCost,
      total_paid: totalPaid,
      balance: agreedSum - totalPaid
    };
  });

  // Власне фільтрація за списком ID
  if (!isAdmin && allowedProjectIds !== null) {
    enrichedProjects = enrichedProjects.filter(p => allowedProjectIds.includes(String(p.id)));
  }

  return { success: true, projects: enrichedProjects };
}

function handleGetProjectDetails(projectId) {
  if (!projectId) return { success: false, error: 'ID проекту не вказано' };
  
  const ss = getSpreadsheet();
  const projectsSheet = getSheet('projects', ss.getId());
  const projects = sheetToObjects(projectsSheet);
  const project = projects.find(p => String(p.id) === String(projectId));
  
  if (!project) return { success: false, error: 'Проект не знайдено' };

  // Lookup linked proposal number from КП spreadsheet
  let proposalNumber = null;
  if (project.proposal_id) {
    try {
      const propSs = getProposalsSpreadsheet();
      const propSheet = propSs.getSheetByName('proposals');
      if (propSheet) {
        const proposals = sheetToObjects(propSheet);
        const prop = proposals.find(p => String(p.id) === String(project.proposal_id));
        if (prop) proposalNumber = prop.project_number || prop['номер'] || prop.number || null;
      }
    } catch(e) {
      console.warn('Could not fetch proposal number: ' + e.message);
    }
  }

  const itemsSheet    = getSheet('project_items',    ss.getId());
  const paymentsSheet = getSheet('project_payments', ss.getId());
  const projectItems    = sheetToObjects(itemsSheet).filter(i => String(i.project_id) === String(projectId));
  const projectPayments = sheetToObjects(paymentsSheet).filter(p => String(p.project_id) === String(projectId));

  // Map fields correctly, especially agreed_sum
  const enrichedProject = {
    ...project,
    proposal_number: proposalNumber,
    agreed_sum: project.agreed_sum !== undefined ? project.agreed_sum : parseFloat(project['погоджена сума']) || 0
  };

  return { 
    success: true, 
    project: enrichedProject,
    items: projectItems,
    payments: projectPayments
  };
}

function handleSaveProject(projectData, userEmail) {
  const ss = getSpreadsheet();
  const sheet = getSheet('projects', ss.getId());
  const headersList = ['ID', 'Назва', 'Клієнт', 'Телефон', 'Адреса', 'Статус', 'Примітки', 'ID КП',
                   'Погоджена сума', 'Номер', 'Дата закриття', 'Створено', 'Оновлено'];
  
  // Переконуємось, що аркуш має заголовки
  let currentLastCol = sheet.getLastColumn();
  if (currentLastCol === 0) {
    sheet.appendRow(headersList);
    currentLastCol = headersList.length;
  }
  
  // Додаємо відсутні заголовки
  let headerRow = sheet.getRange(1, 1, 1, currentLastCol).getValues()[0];
  let headersChanged = false;
  headersList.forEach(eh => {
    const lowerEH = eh.toLowerCase();
    if (!headerRow.some(h => String(h).trim().toLowerCase() === lowerEH)) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(eh);
      headersChanged = true;
    }
  });
  
  if (headersChanged) {
    headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  
  let row = findRowByValue(sheet, 'id', projectData.id);
  if (row === -1) row = findRowByValue(sheet, 'ID', projectData.id);
  const ts = now();

  if (row === -1) {
    // Створення
    const newId = projectData.id || generateUUID();
    const projectNum = projectData.proposal_id
      ? (projectData.project_number || '')
      : (projectData.project_number || dateStr());
    
    const fullData = {
      ...projectData,
      id: newId,
      name: projectData.name || 'Новий проєкт',
      status: projectData.status || 'В роботі',
      project_number: projectNum,
      created_at: ts,
      updated_at: ts
    };

    const rowData = headerRow.map(h => {
      const s = String(h).trim().toLowerCase();
      const mapped = HEADER_MAP[s] || s;
      if (mapped === 'created_at' || s === 'створено') return ts;
      if (mapped === 'updated_at' || s === 'оновлено') return ts;
      return fullData[mapped] !== undefined ? fullData[mapped] : "";
    });

    sheet.appendRow(rowData);
    
    // ... (копіювання товарів)
    if (projectData.items_from_cp && projectData.items_from_cp.length > 0) {
      const itemsSheet = getSheet('project_items', ss.getId());
      projectData.items_from_cp.forEach(item => {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.price) || 0;
        const name = item.name || item.productName || 'Товар';
        const note = item.note || item.productArticle || '';
        itemsSheet.appendRow([generateUUID(), newId, name, qty, price, (qty * price), note]);
      });
    }
    
    return { success: true, id: newId };
  } else {
    // Оновлення
    headerRow.forEach((h, idx) => {
      const s = String(h).trim().toLowerCase();
      const mapped = HEADER_MAP[s] || s;
      if (projectData[mapped] !== undefined && mapped !== 'id') {
        sheet.getRange(row, idx + 1).setValue(projectData[mapped]);
      } else if (mapped === 'updated_at' || s === 'оновлено') {
        sheet.getRange(row, idx + 1).setValue(ts);
      }
    });
    return { success: true, id: projectData.id };
  }
}

function handleSaveProjectItem(itemData) {
  const ss = getSpreadsheet();
  const sheet = getSheet('project_items', ss.getId());
  let row = findRowByValue(sheet, 'ID', itemData.id);

  const sum = (parseFloat(itemData.quantity) * parseFloat(itemData.price)) || 0;

  if (row === -1) {
    sheet.appendRow([
      itemData.id || generateUUID(),
      itemData.project_id,
      itemData.name,
      itemData.quantity,
      itemData.price,
      sum,
      itemData.note || ''
    ]);
  } else {
    // ID, ID Проекту, Назва, Кількість, Ціна, Сума, Примітка
    sheet.getRange(row, 3).setValue(itemData.name);
    sheet.getRange(row, 4).setValue(itemData.quantity);
    sheet.getRange(row, 5).setValue(itemData.price);
    sheet.getRange(row, 6).setValue(sum);
    sheet.getRange(row, 7).setValue(itemData.note || '');
  }
  return { success: true };
}

function handleDeleteProjectItem(itemId) {
  const ss = getSpreadsheet();
  const sheet = getSheet('project_items', ss.getId());
  const row = findRowByValue(sheet, 'ID', itemId);
  if (row !== -1) {
    sheet.deleteRow(row);
    return { success: true };
  }
  return { success: false, error: 'Товар не знайдено' };
}

function handleSavePayment(paymentData, userEmail) {
  const ss = getSpreadsheet();
  const sheet = getSheet('project_payments', ss.getId());
  
  const headers = ['ID', 'ID Проекту', 'Дата', 'Сума', 'Статус', 'Примітка', 'Тип платежу', 'Автор', 'Створено'];
  let currentLastCol = sheet.getLastColumn();
  // Safe fallback if sheet is completely empty
  if (currentLastCol === 0) currentLastCol = 1; 
  let headerRow = sheet.getRange(1, 1, 1, currentLastCol).getValues()[0] || [];
  
  // Auto-append missing headers if schema changed
  let addedCols = 0;
  headers.forEach(eh => {
    const lowerEH = eh.toLowerCase();
    if (!headerRow.some(h => String(h).trim().toLowerCase() === lowerEH)) {
      headerRow.push(eh);
      sheet.getRange(1, currentLastCol + addedCols + 1).setValue(eh);
      addedCols++;
    }
  });

  let row = findRowByValue(sheet, 'ID', paymentData.id);
  
  const valueMap = {
    'id': paymentData.id || generateUUID(),
    'id проекту': paymentData.projectId || paymentData.project_id,
    'дата': paymentData.date || dateStr(),
    'сума': paymentData.sum,
    'статус': paymentData.status || 'Оплачено',
    'примітка': paymentData.note || '',
    'тип платежу': paymentData.payment_type || 'Повна оплата',
    'автор': userEmail || 'Система',
    'створено': now()
  };

  if (row === -1) {
    const appendData = headerRow.map(h => {
      const key = String(h).trim().toLowerCase();
      return valueMap[key] !== undefined ? valueMap[key] : '';
    });
    sheet.appendRow(appendData);
  } else {
    // update
    headerRow.forEach((h, idx) => {
      const key = String(h).trim().toLowerCase();
      if (key === 'дата') sheet.getRange(row, idx + 1).setValue(paymentData.date);
      if (key === 'сума') sheet.getRange(row, idx + 1).setValue(paymentData.sum);
      if (key === 'статус') sheet.getRange(row, idx + 1).setValue(paymentData.status);
      if (key === 'примітка') sheet.getRange(row, idx + 1).setValue(paymentData.note || '');
      if (key === 'тип платежу') sheet.getRange(row, idx + 1).setValue(paymentData.payment_type || '');
    });
  }
  return { success: true };
}

function handleCancelPayment(paymentId, userEmail) {
  const ss = getSpreadsheet();
  const sheet = getSheet('project_payments', ss.getId());
  const row = findRowByValue(sheet, 'ID', paymentId);
  if (row !== -1) {
    sheet.getRange(row, 5).setValue('❌ Скасовано');
    return { success: true };
  }
  return { success: false, error: 'Платіж не знайдено' };
}

function handleSyncProjectItems(projectId) {
  if (!projectId) return { success: false, error: 'ID проекту не вказано' };
  
  const ss = getSpreadsheet();
  const projectsSheet = getSheet('projects', ss.getId());
  const projects = sheetToObjects(projectsSheet);
  const project = projects.find(p => String(p.id) === String(projectId));
  
  if (!project || !project.proposal_id) {
    return { success: false, error: 'Проект не знайдено або в нього не вказано ID КП' };
  }
  
  // Отримуємо КП
  const proposalsSs = getProposalsSpreadsheet();
  const proposalsSheet = proposalsSs.getSheetByName('proposals');
  if (!proposalsSheet) return { success: false, error: 'Аркуш КП не знайдено' };
  
  const proposalRow = findRowByValue(proposalsSheet, 'ID', project.proposal_id);
  if (proposalRow === -1) return { success: false, error: 'КП не знайдено в базі' };
  
  const proposalData = proposalsSheet.getRange(proposalRow, 1, 1, proposalsSheet.getLastColumn()).getValues()[0];
  let items = [];
  try {
    const parsed = JSON.parse(proposalData[9] || '[]');
    // Підтримуємо обидва формати: масив або об'єкт {items: [...]}
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.items)) {
      items = parsed.items;
    }
  } catch (e) {
    return { success: false, error: 'Помилка читання товарів з КП' };
  }
  
  if (items.length === 0) return { success: false, error: 'У вибраній КП немає товарів' };
  
  const itemsSheet = getSheet('project_items', ss.getId());
  // Видаляємо старі товари проекту і записуємо заново (оновлення)
  const existingItems = sheetToObjects(itemsSheet);
  for (let i = existingItems.length - 1; i >= 0; i--) {
     if (String(existingItems[i].project_id) === String(projectId)) {
        const rowToDelete = i + 2; // +1 за хедер, +1 за 0-індекс
        itemsSheet.deleteRow(rowToDelete);
     }
  }
  
  // Додаємо нові товари
  items.forEach(item => {
    const qty = parseFloat(item.quantity) || 1;
    const price = parseFloat(item.price || item.unitPrice || item.total || 0);
    const name = item.name || item.productName || 'Товар';
    const note = item.note || item.productArticle || item.article || '';
    
    itemsSheet.appendRow([
      generateUUID(),
      projectId,
      name,
      qty,
      price,
      (qty * price),
      note
    ]);
  });
  
  return { success: true, count: items.length };
}

// ===== PROPOSALS MODULE - ДОДАТКОВІ ФУНКЦІЇ =====

/**
 * Завантажує всі продукти з усіх категорій (зовнішня база для proposals)
 */
function getAllProducts() {
  try {
    const allProducts = [];

    SHEETS_CONFIG.forEach(sheet => {
      if (sheet.name === 'ДОВІДНИК_ТОВАРІВ' || sheet.mainCat === 'Власний матеріал' || sheet.mainCat === 'Власні матеріали') {
        return;
      }

      const spreadsheetId = sheet.spreadsheetId || MATERIALS_SPREADSHEET_ID;
      const sheetData = getSheetDataForProposals(sheet.name, spreadsheetId, sheet.gid);

      if (sheetData.success && sheetData.data) {
        sheetData.data.forEach((row, index) => {
          if (!row[0] || row[0].toString().trim() === "" || row[0] === "Модель") return;

          allProducts.push({
            id: generateProductId(row[0] && typeof row[0] === 'string' ? row[0] : 'img_'+index, sheet.name),
            name: row[0] || '',
            originalName: row[1] || '',
            price: parsePriceFromString(row[1]),
            currency: parseCurrencyFromString(row[1]),
            unit: row[2] || 'шт',
            description: row[3] || '',
            manufacturer: row[4] || '',
            power: row[5] || '',
            warranty: row[6] || '',
            raw: row,
            category: sheet.name,
            mainCategory: sheet.mainCat,
            inStock: true
          });
        });
      }
    });

    return { success: true, products: allProducts };
  } catch (err) {
    return { success: false, error: 'getAllProducts error: ' + err.toString() };
  }
}

function getSheetDataForProposals(sheetName, spreadsheetId, gid) {
  try {
    spreadsheetId = spreadsheetId || SPREADSHEET_ID;
    let data;

    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        data = sheet.getDataRange().getValues();
      } else {
        throw new Error('Sheet not found by name');
      }
    } catch (e) {
      if (!gid && gid !== 0) {
         return { success: false, error: 'GID is required for CSV fallback' };
      }
      const csvUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=csv&gid=' + gid;
      const response = UrlFetchApp.fetch(csvUrl, { muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) {
         return { success: false, error: 'Cannot fetch CSV' };
      }
      const csvText = response.getContentText();
      data = Utilities.parseCsv(csvText);
    }

    if (!data || data.length < 2) {
      return { success: false, error: 'No data or empty sheet' };
    }

    const rows = data.slice(1).filter(row => row[0] && row[1]);
    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function parsePriceFromString(str) {
  if (!str) return 0;
  const cleaned = str.toString().replace(/\s+/g, '').replace(/,/g, '.');
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function parseCurrencyFromString(str) {
  if (!str) return 'USD';
  const s = str.toString().toUpperCase();
  if (s.includes('€') || s.includes('EUR')) return 'EUR';
  if (s.includes('₴') || s.includes('UAH') || s.includes('ГРН')) return 'UAH';
  return 'USD';
}

function generateProductId(name, category) {
  const str = (name + category).toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'prod_' + Math.abs(hash).toString(36);
}

function getCustomMaterials() {
  try {
    const ss = SpreadsheetApp.openById(CUSTOM_MATERIALS_SPREADSHEET_ID);
    const sheet = ss.getSheets()[0];
    if (!sheet) return { success: false, error: 'Sheet not found' };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id');
    const nameIdx = headers.indexOf('name');
    const articleIdx = headers.indexOf('article');
    const unitIdx = headers.indexOf('unit');
    const categoryIdx = headers.indexOf('category');
    const activeIdx = headers.indexOf('active');
    const priceUsdIdx = headers.indexOf('price_usd');
    const priceUahIdx = headers.indexOf('price_uah');
    const updatedIdx = headers.indexOf('updated_at');

    const products = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[nameIdx] || (activeIdx >= 0 && row[activeIdx] === false)) continue;

      products.push({
        id: row[idIdx] || 'custom_' + i,
        name: row[nameIdx] || '',
        article: row[articleIdx] || '',
        unit: row[unitIdx] || 'шт',
        category: row[categoryIdx] || 'Різне',
        mainCategory: 'Власні матеріали',
        price: parseFloat(row[priceUsdIdx]) || 0,
        priceUah: parseFloat(row[priceUahIdx]) || 0,
        currency: 'USD',
        active: activeIdx >= 0 ? row[activeIdx] : true,
        updatedAt: row[updatedIdx] || '',
        isCustom: true
      });
    }
    return { success: true, products: products };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function getRates() {
  let result = { success: true, usd: 44.0, eur: 51.43, source: 'default', debug: [] };
  
  const aliases = ["goverla-ua", "main"];
  
  for (let alias of aliases) {
    try {
      const payload = {
        query: "query Point($alias: Alias!) { point(alias: $alias) { rates { currency { codeAlpha } ask { absolute } } } }",
        variables: { alias: alias }
      };

      const options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://goverla.ua/'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch('https://api.goverla.ua/graphql', options);
      const code = response.getResponseCode();
      const text = response.getContentText();
      
      result.debug.push({ alias, code, text: text.substring(0, 200) });

      if (code === 200) {
        const data = JSON.parse(text);
        const point = data?.data?.point;
        
        if (point && point.rates) {
          const rates = point.rates;
          const usd = rates.find(r => r.currency.codeAlpha === 'USD');
          const eur = rates.find(r => r.currency.codeAlpha === 'EUR');
          
          if (usd || eur) {
            if (usd) result.usd = usd.ask.absolute / 100;
            if (eur) result.eur = eur.ask.absolute / 100;
            result.source = 'hoverla_' + alias;
            return result;
          }
        }
      }
    } catch (err) {
      result.debug.push({ alias, error: err.toString() });
    }
  }

  return result;
}

function getAllData() {
  try {
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      rates: { usd: 41.5, eur: 45.0 },
      products: [],
      customMaterials: []
    };

    try {
      const ratesResult = getRates();
      result.rates = { 
        usd: ratesResult.usd, 
        eur: ratesResult.eur,
        source: ratesResult.source,
        debug: ratesResult.debug
      };
    } catch (e) { 
      console.warn('Failed to fetch rates:', e); 
      result.rates.error = e.toString();
    }

    try {
      const productsResult = getAllProducts();
      if (productsResult.success && productsResult.products) {
        result.products = productsResult.products;
      }
    } catch (e) { console.warn('Failed to fetch products:', e); }

    try {
      const customResult = getCustomMaterials();
      if (customResult.success && customResult.products) {
        result.customMaterials = customResult.products;
      }
    } catch (e) { console.warn('Failed to fetch custom materials:', e); }

    return result;
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function updateMaterialPrice(productId, priceUsd, priceUah) {
  try {
    const ss = SpreadsheetApp.openById(CUSTOM_MATERIALS_SPREADSHEET_ID);
    const sheet = ss.getSheets()[0];
    if (!sheet) return { success: false, error: 'Sheet not found' };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id');
    const priceUsdIdx = headers.indexOf('price_usd');
    const priceUahIdx = headers.indexOf('price_uah');
    const updatedIdx = headers.indexOf('updated_at');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === productId) {
        const rowNum = i + 1;
        if (priceUsdIdx >= 0 && priceUsd !== undefined) {
          sheet.getRange(rowNum, priceUsdIdx + 1).setValue(priceUsd);
        }
        if (priceUahIdx >= 0 && priceUah !== undefined) {
          sheet.getRange(rowNum, priceUahIdx + 1).setValue(priceUah);
        }
        if (updatedIdx >= 0) {
          sheet.getRange(rowNum, updatedIdx + 1).setValue(new Date().toISOString());
        }
        return { success: true, message: 'Price updated' };
      }
    }
    return { success: false, error: 'Product not found: ' + productId };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function addCustomMaterial(product) {
  try {
    const ss = SpreadsheetApp.openById(CUSTOM_MATERIALS_SPREADSHEET_ID);
    const sheet = ss.getSheets()[0];
    if (!sheet) return { success: false, error: 'Sheet not found' };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const requiredHeaders = ['id', 'name', 'article', 'unit', 'category', 'active', 'price_usd', 'price_uah', 'updated_at'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return { success: false, error: 'Missing headers: ' + missingHeaders.join(', ') };
    }

    const productId = product.id || 'custom_' + Date.now();
    const idIdx = headers.indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === productId) {
        return { success: false, error: 'Product with this ID already exists' };
      }
    }

    const rowData = [];
    headers.forEach(header => {
      switch(header) {
        case 'id': rowData.push(productId); break;
        case 'name': rowData.push(product.name || ''); break;
        case 'article': rowData.push(product.article || ''); break;
        case 'unit': rowData.push(product.unit || 'шт'); break;
        case 'category': rowData.push(product.category || 'Різне'); break;
        case 'active': rowData.push(true); break;
        case 'price_usd': rowData.push(parseFloat(product.price) || 0); break;
        case 'price_uah': rowData.push(parseFloat(product.priceUah) || 0); break;
        case 'updated_at': rowData.push(new Date().toISOString()); break;
        default: rowData.push('');
      }
    });

    sheet.appendRow(rowData);
    SpreadsheetApp.flush();

    return {
      success: true,
      product: {
        id: productId,
        name: product.name,
        article: product.article || '',
        unit: product.unit || 'шт',
        category: product.category || 'Різне',
        mainCategory: 'Власні матеріали',
        price: parseFloat(product.price) || 0,
        priceUah: parseFloat(product.priceUah) || 0,
        currency: 'USD',
        active: true,
        isCustom: true
      }
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function deleteCustomMaterial(productId) {
  try {
    const ss = SpreadsheetApp.openById(CUSTOM_MATERIALS_SPREADSHEET_ID);
    const sheet = ss.getSheets()[0];
    if (!sheet) return { success: false, error: 'Sheet not found' };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id');
    const activeIdx = headers.indexOf('active');

    if (idIdx === -1 || activeIdx === -1) {
      return { success: false, error: 'Required columns not found' };
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === productId) {
        const rowNum = i + 1;
        sheet.getRange(rowNum, activeIdx + 1).setValue(false);
        const updatedIdx = headers.indexOf('updated_at');
        if (updatedIdx >= 0) {
          sheet.getRange(rowNum, updatedIdx + 1).setValue(new Date().toISOString());
        }
        SpreadsheetApp.flush();
        return { success: true, message: 'Product deactivated' };
      }
    }
    return { success: false, error: 'Product not found: ' + productId };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
