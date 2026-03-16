import CONFIG from '../config';

/**
 * Модуль взаємодії з Google Apps Script бекендом.
 * Усі запити надсилаються на GAS Web App URL.
 */

async function gasRequest(action, params = {}, method = 'GET') {
  const url = new URL(CONFIG.GAS_URL);

  if (method === 'GET') {
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'text/plain' }
    });

    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }
    return response.json();
  }

  const response = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...params })
  });

  if (!response.ok) {
    throw new Error(`Помилка сервера: ${response.status}`);
  }
  return response.json();
}

/** Верифікація поточного користувача через основний сайт */
export async function verifySession() {
  try {
    const response = await fetch(CONFIG.VERIFY_URL, {
      credentials: 'include'
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.authenticated) return null;
    return data.user;
  } catch {
    return null;
  }
}

/** Отримання даних користувача (роль, склад) з Google Sheets */
export async function getUser(email) {
  return gasRequest('getUser', { email });
}

// ===== КАТАЛОГ =====

export async function getCatalog() {
  return gasRequest('getCatalog');
}

export async function addProduct(product) {
  return gasRequest('addProduct', { product }, 'POST');
}

export async function updateProduct(product) {
  return gasRequest('updateProduct', { product }, 'POST');
}

export async function archiveProduct(productId) {
  return gasRequest('archiveProduct', { productId }, 'POST');
}

// ===== СКЛАДИ =====

export async function getWarehouses() {
  return gasRequest('getWarehouses');
}

export async function addWarehouse(warehouse) {
  return gasRequest('addWarehouse', { warehouse }, 'POST');
}

export async function updateWarehouse(warehouse) {
  return gasRequest('updateWarehouse', { warehouse }, 'POST');
}

// ===== ОПЕРАЦІЇ =====

export async function getOperations(filters = {}) {
  return gasRequest('getOperations', filters);
}

export async function addOperation(operation) {
  return gasRequest('addOperation', { operation }, 'POST');
}

export async function updateOperation(operation) {
  return gasRequest('updateOperation', { operation }, 'POST');
}

export async function deleteOperation(operationId) {
  return gasRequest('deleteOperation', { operationId }, 'POST');
}

// ===== ЗАЛИШКИ =====

export async function getBalances(warehouseId) {
  return gasRequest('getBalances', { warehouseId });
}

export async function getBalancesAtDate(warehouseId, date) {
  return gasRequest('getBalancesAtDate', { warehouseId, date });
}

export async function getDailyBalanceData(warehouseId) {
  return gasRequest('getDailyBalanceData', { warehouseId });
}

export async function submitDailyBalance(data) {
  return gasRequest('submitDailyBalance', data, 'POST');
}

// ===== ЗВІТИ =====

export async function getStockReport(warehouseId, date) {
  return gasRequest('getStockReport', { warehouseId, date });
}

export async function getCompareReport() {
  return gasRequest('getCompareReport');
}

export async function getMovementReport(filters) {
  return gasRequest('getMovementReport', filters);
}

// ===== БЕКАПИ =====

export async function createBackup() {
  return gasRequest('createBackup', {}, 'POST');
}

// ===== КОРИСТУВАЧІ =====

export async function getUsers() {
  return gasRequest('getUsers');
}

export async function addUser(user) {
  return gasRequest('addUser', { user }, 'POST');
}

export async function updateUser(user) {
  return gasRequest('updateUser', { user }, 'POST');
}

// ===== КАТЕГОРІЇ =====

export async function getCategories() {
  return gasRequest('getCategories');
}

export async function addCategory(category) {
  return gasRequest('addCategory', { category }, 'POST');
}

export async function updateCategory(category) {
  return gasRequest('updateCategory', { category }, 'POST');
}

// ===== КОМЕРЦІЙНІ ПРОПОЗИЦІЇ =====

export async function getProposals() {
  return gasRequest('getProposals');
}

export async function saveProposal(proposal, user) {
  return gasRequest('saveProposal', { proposal, user }, 'POST');
}

export async function deleteProposal(proposalId) {
  return gasRequest('deleteProposal', { proposalId }, 'POST');
}
