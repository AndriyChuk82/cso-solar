
// Кеш імен користувачів за email та логіном
export const usersMapCache = {
  'andros@cso': 'Андрій Чикайло',
  'andros': 'Андрій Чикайло',
  'misha@cso': 'Михайло Юркевич',
  'misha': 'Михайло Юркевич',
  'yura@cso': 'Юра Пастушок',
  'yura': 'Юра Пастушок',
  'oleg@cso': 'Олег Пастушок',
  'oleg': 'Олег Пастушок',
  'andriy@cso': 'Андрій Чикайло',
  'dev@test.com': 'Dev User'
};

let isFetchingUsersMap = false;
export async function fetchUsersMap() {
  if (isFetchingUsersMap) return usersMapCache;
  isFetchingUsersMap = true;
  try {
    const res = await getUsers();
    if (res && res.users) {
      res.users.forEach(u => {
        if (u.email && u.name) {
          const emailLower = String(u.email).trim().toLowerCase();
          const cleanName = String(u.name).trim();
          usersMapCache[emailLower] = cleanName;
          const prefix = emailLower.split('@')[0];
          if (prefix) {
            usersMapCache[prefix] = cleanName;
          }
        }
      });
    }
  } catch (e) {
    console.warn("Could not fetch users map", e);
  } finally {
    isFetchingUsersMap = false;
  }
  return usersMapCache;
}

// Запускаємо фонове підтягування користувачів при завантаженні модуля
fetchUsersMap();

const STATIC_USER_MAP = {
  'misha@cso': 'Михайло Юркевич',
  'misha@cso.solar': 'Михайло Юркевич',
  'misha': 'Михайло Юркевич',
  'andros@cso': 'Андрій Чикайло',
  'andros@cso.solar': 'Андрій Чикайло',
  'andros': 'Андрій Чикайло',
  'yura@cso': 'Юра Пастушок',
  'yura@cso.solar': 'Юра Пастушок',
  'yura': 'Юра Пастушок',
  'oleg@cso': 'Олег Пастушок',
  'oleg@cso.solar': 'Олег Пастушок',
  'oleg': 'Олег Пастушок'
};

export function formatUserName(nameOrEmail) {
  if (!nameOrEmail) return 'Оператор';
  const clean = String(nameOrEmail).trim();
  const lower = clean.toLowerCase();

  if (STATIC_USER_MAP[lower]) return STATIC_USER_MAP[lower];
  if (usersMapCache[lower]) return usersMapCache[lower];

  if (clean.includes('@')) {
    const prefix = clean.split('@')[0].toLowerCase();
    if (STATIC_USER_MAP[prefix]) return STATIC_USER_MAP[prefix];
    if (usersMapCache[prefix]) return usersMapCache[prefix];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  
  // Якщо це просто логін без @ (наприклад 'oleg' або 'Oleg')
  if (STATIC_USER_MAP[lower]) return STATIC_USER_MAP[lower];
  if (usersMapCache[lower]) return usersMapCache[lower];

  return clean;
}
import CONFIG from '../config';
import { supabase } from './supabaseClient';

/**
 * Гібридний API: Складська логіка та звіти на Supabase.
 */

async function gasRequest(action, params = {}, method = 'GET') {
  const url = new URL(CONFIG.GAS_URL);
  if (method === 'GET') {
    url.searchParams.set('action', action);
    url.searchParams.set('_t', Date.now().toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });
    const response = await fetch(url.toString(), { method: 'GET', headers: { 'Content-Type': 'text/plain' }, cache: 'no-store' });
    return await response.json();
  }
  const response = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...params })
  });
  return await response.json();
}

async function vercelAdminRequest(action, userData) {
  const response = await fetch('/api/admin-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, userData })
  });
  return response.json();
}

// --- АВТОРИЗАЦІЯ ---

export async function verifySession() {
  try {
    const response = await fetch(CONFIG.VERIFY_URL, { credentials: 'include' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.authenticated ? data.user : null;
  } catch { return null; }
}

export async function getUser(email) { return gasRequest('getUser', { email }); }

// --- КАТЕГОРІЇ ---

export async function getCategories() {
  if (!supabase) return { success: true, categories: [] };
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return { success: true, categories: data };
}

export async function addCategory(category) {
  if (!supabase) throw new Error('База даних не підключена');
  const { error } = await supabase.from('categories').insert([{ id: category.name, name: category.name, active: true }]);
  if (error) throw error;
  // Логування архівування
  try {
    logActivity({
      actionType: isArchived ? 'ARCHIVE' : 'UNARCHIVE',
      entityType: 'BUYER_TRANSACTION',
      entityId: transactionId,
      entityTitle: `${isArchived ? '🗄️ Закрито в архів' : '🔄 Відновлено з архіву'} ID ${transactionId.slice(0, 8)}`,
      details: {
        transactionId,
        isArchived
      }
    });
  } catch (err) {
    console.error("Logging archive error", err);
  }

  return { success: true };
}

export async function updateCategory(category) {
  if (!supabase) throw new Error('База даних не підключена');
  const { error } = await supabase.from('categories').update({
    name: category.name,
    active: category.active
  }).eq('id', category.oldName || category.name);
  if (error) throw error;
  return { success: true };
}

// --- КАТАЛОГ ---

export async function getCatalog() {
  if (!supabase) return { success: true, products: [] };
  const { data, error } = await supabase.from('products').select('*, categories(name)').order('name');
  if (error) throw error;
  return { success: true, products: data.map(p => ({ ...p, category: p.categories?.name || '' })) };
}

export async function addProduct(product) {
  if (!supabase) throw new Error('База даних не підключена');
  const { data, error } = await supabase.from('products').insert([{
    id: product.id || String(Date.now()), name: product.name, article: product.article,
    unit: product.unit, category_id: product.category, active: true
  }]).select();
  if (error) throw error;
  return { success: true, product: data[0] };
}

export async function updateProduct(product) {
  if (!supabase) throw new Error('База даних не підключена');
  const { error } = await supabase.from('products').update({
    name: product.name, article: product.article, unit: product.unit,
    category_id: product.category, active: product.active
  }).eq('id', product.id);
  if (error) throw error;
  return { success: true };
}

export async function archiveProduct(productId) {
  if (!supabase) throw new Error('База даних не підключена');
  const { error } = await supabase.from('products').update({ active: false }).eq('id', productId);
  if (error) throw error;
  return { success: true };
}

export async function restoreProduct(productId) {
  if (!supabase) throw new Error('База даних не підключена');
  const { error } = await supabase.from('products').update({ active: true }).eq('id', productId);
  if (error) throw error;
  return { success: true };
}

// --- СКЛАДИ ---

export async function getWarehouses() {
  if (!supabase) return { success: true, warehouses: [] };
  const { data, error } = await supabase.from('warehouses').select('*').order('name');
  if (error) throw error;
  return { success: true, warehouses: data };
}

export async function addWarehouse(warehouse) {
  if (!supabase) throw new Error('База даних не підключена');
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const { error } = await supabase.from('warehouses').insert([{ id, name: warehouse.name, address: warehouse.address, responsible: warehouse.responsible, active: true }]);
  if (error) throw error;
  return { success: true, id };
}

export async function updateWarehouse(warehouse) {
  if (!supabase) throw new Error('База даних не підключена');
  const { error } = await supabase.from('warehouses').update({
    name: warehouse.name, address: warehouse.address, responsible: warehouse.responsible, active: warehouse.active
  }).eq('id', warehouse.id);
  if (error) throw error;
  return { success: true };
}

// --- ОПЕРАЦІЇ (Журнал) ---

export async function getOperations(filters = {}) {
  if (!supabase) return { success: true, operations: [] };
  
  let ops = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      ops = ops.concat(data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  const { data: prods } = await supabase.from('products').select('*');
  const { data: whs } = await supabase.from('warehouses').select('*');

  const prodMap = {}; prods?.forEach(p => prodMap[String(p.id).trim()] = p);
  const whMap = {}; 
  const whNameMap = {};
  whs?.forEach(w => { 
    const cleanId = String(w.id).trim();
    whMap[cleanId] = w.name;
    whNameMap[w.name.toLowerCase().trim()] = cleanId;
  });

  const runningBalances = {};
  let operations = ops.map((op, idx) => {
    const qty = parseFloat(op.quantity) || 0;
    let finalWhId = String(op.warehouse_id || op.warehouseId || '').trim();
    let finalProdId = String(op.product_id || op.productId || '').trim();

    // ПРИМУСОВА ФІЛЬТРАЦІЯ: Ігноруємо записи без ID товару
    if (!finalProdId || finalProdId === 'null' || finalProdId === 'undefined') return null;

    // Розумний пошук складу якщо в ID лежить назва
    if (finalWhId && !whMap[finalWhId]) {
        const potentialId = whNameMap[finalWhId.toLowerCase()];
        if (potentialId) finalWhId = potentialId;
    }

    const key = finalWhId + '|' + finalProdId;
    
    if (op.type === 'income' || op.type === 'balance') {
      runningBalances[key] = (runningBalances[key] || 0) + qty;
    } else if (op.type === 'expense') {
      runningBalances[key] = (runningBalances[key] || 0) - qty;
    }

    const whName = whMap[finalWhId];

    return {
      ...op,
      warehouse_id: finalWhId,
      product_id: finalProdId,
      product_name: prodMap[finalProdId]?.name || '?',
      product_article: prodMap[finalProdId]?.article || '',
      unit: prodMap[finalProdId]?.unit || '',
      warehouse_name: whName || op.warehouse_id || '—',
      user_name: formatUserName(op.user_name || op.user_email || op.user),
      balance_after: runningBalances[key] || 0,
      category: prodMap[finalProdId]?.category_id || ''
    };
  }).filter(Boolean);

  if (filters.warehouseId) operations = operations.filter(op => String(op.warehouse_id).trim() === String(filters.warehouseId).trim());
  if (filters.productId) operations = operations.filter(op => String(op.product_id).trim() === String(filters.productId).trim());
  if (filters.type) {
    operations = operations.filter(op => {
      const typeInfo = getOperationTypeDetails(op);
      return typeInfo.key === filters.type || op.type === filters.type;
    });
  }
  if (filters.dateFrom) operations = operations.filter(op => op.date >= filters.dateFrom);
  if (filters.dateTo) operations = operations.filter(op => op.date <= filters.dateTo);

  // Сортуємо в зворотному порядку для відображення
  const displayOps = [...operations].reverse();

  return { success: true, operations: displayOps, rawOperations: operations };
}

export function getOperationTypeDetails(op) {
  if (!op) return { key: 'income', label: 'Прихід', badgeClass: 'badge-income' };
  
  const comment = String(op.comment || op.note || op.primitka || '').trim();
  const lowerComment = comment.toLowerCase();
  
  // 1. Переміщення між складами
  if (
    op.type === 'transfer' || 
    op.transfer_id || 
    lowerComment.startsWith('переміщення') || 
    lowerComment.includes('переміщення між') ||
    lowerComment.includes('звідусіль')
  ) {
    return {
      key: 'transfer',
      label: 'Переміщення',
      badgeClass: 'badge-transfer'
    };
  }

  // 2. Підсумок дня / Інвентаризація / Коригування
  if (
    op.type === 'balance' || 
    op.type === 'adjustment' || 
    lowerComment.includes('підсумок дня') || 
    lowerComment.includes('коригування')
  ) {
    return {
      key: 'balance',
      label: 'Підсумок дня',
      badgeClass: 'badge-balance'
    };
  }

  // 3. Розхід
  if (op.type === 'expense' || op.type === 'issue') {
    return {
      key: 'expense',
      label: 'Розхід',
      badgeClass: 'badge-expense'
    };
  }

  // 4. Прихід
  return {
    key: 'income',
    label: 'Прихід',
    badgeClass: 'badge-income'
  };
}

export async function addOperation(operation) {
  if (!supabase) throw new Error('База даних не підключена');
  const timestamp = new Date().toISOString();
  let items = [];

  const opItems = (operation.items && Array.isArray(operation.items)) ? operation.items : [{
    productId: operation.productId,
    quantity: operation.quantity,
    type: operation.type,
    comment: operation.comment
  }];

  if (operation.type === 'transfer') {
    const tid = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    opItems.forEach(item => {
      items.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()), date: operation.date, type: 'expense', product_id: item.productId, warehouse_id: operation.warehouseFrom, quantity: item.quantity, comment: item.comment || operation.comment, user_email: operation.userEmail || operation.user, transfer_id: tid, created_at: timestamp });
      items.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()), date: operation.date, type: 'income', product_id: item.productId, warehouse_id: operation.warehouseTo, quantity: item.quantity, comment: item.comment || operation.comment, user_email: operation.userEmail || operation.user, transfer_id: tid, created_at: timestamp });
    });
  } else {
    opItems.forEach(item => {
      const type = item.type || operation.type;
      const quantity = item.type === 'expense' ? Math.abs(item.quantity) : item.quantity;
      
      items.push({ 
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()), 
        date: operation.date, 
        type: type, 
        product_id: item.productId, 
        warehouse_id: operation.warehouseId, 
        quantity: quantity, 
        comment: item.comment || operation.comment, 
        user_email: operation.userEmail || operation.user, 
        created_at: timestamp 
      });
    });
  }

  const { data: insertedData, error } = await supabase.from('operations').insert(items).select();
  if (error) throw error;
  return { success: true, operation: insertedData?.[0] };
}

export async function updateOperation(operation) {
  if (!supabase) throw new Error('База даних не підключена');
  const { error } = await supabase.from('operations').update({
    date: operation.date,
    product_id: operation.product_id || operation.productId,
    warehouse_id: operation.warehouse_id || operation.warehouseId,
    quantity: operation.quantity,
    comment: operation.comment,
    user_email: operation.user_email || operation.user
  }).eq('id', operation.id);
  if (error) throw error;
  return { success: true };
}

export async function deleteOperation(operationId) {
  if (!supabase) throw new Error('База даних не підключена');
  const { error } = await supabase.from('operations').delete().eq('id', operationId);
  if (error) throw error;
  return { success: true };
}

export async function getBalances(warehouseId) {
  if (!supabase) return { success: true, balances: [] };
  const { rawOperations } = await getOperations({ warehouseId });
  
  const finalBalances = {};
  rawOperations.forEach(op => {
    if (!finalBalances[op.product_id]) {
      finalBalances[op.product_id] = { 
        product_id: op.product_id, 
        product_name: op.product_name, 
        product_article: op.product_article, 
        unit: op.unit, 
        category: op.category, // назва категорії
        quantity: 0,
        reserved: 0
      };
    }
    const qty = parseFloat(op.quantity) || 0;
    if (op.type === 'income' || op.type === 'balance') finalBalances[op.product_id].quantity += qty;
    if (op.type === 'expense') finalBalances[op.product_id].quantity -= qty;
  });

  // Отримуємо активні резерви з buyer_transaction_items для цього складу
  const { data: resItems } = await supabase
    .from('buyer_transaction_items')
    .select('product_id, quantity, buyer_transactions(status, is_archived)')
    .eq('warehouse_id', warehouseId);

  const reservedMap = {};
  if (resItems) {
    resItems.forEach(item => {
      const tx = item.buyer_transactions;
      if (tx && tx.status === 'reserved' && !tx.is_archived) {
        const qty = parseFloat(item.quantity) || 0;
        reservedMap[item.product_id] = (reservedMap[item.product_id] || 0) + qty;
      }
    });
  }

  // Отримуємо активні резерви з shipment_items для цього складу
  try {
    const { data: resShipments } = await supabase
      .from('shipments')
      .select('id')
      .eq('status', 'reserved');

    if (resShipments && resShipments.length > 0) {
      const resShipIds = resShipments.map(s => s.id);
      const { data: shipResItems } = await supabase
        .from('shipment_items')
        .select('product_id, quantity')
        .eq('warehouse_id', warehouseId)
        .in('shipment_id', resShipIds);

      if (shipResItems) {
        shipResItems.forEach(item => {
          if (item.product_id) {
            const qty = parseFloat(item.quantity) || 0;
            reservedMap[item.product_id] = (reservedMap[item.product_id] || 0) + qty;
          }
        });
      }
    }
  } catch (err) {
    console.warn("Could not fetch shipment_items reserves:", err);
  }

  // Отримуємо каталог товарів для наповнення відсутніх у фізичному залишку
  const { data: prods } = await supabase.from('products').select('*');
  const prodMap = {};
  prods?.forEach(p => prodMap[p.id] = p);

  // Накладаємо бронь на баланси
  Object.keys(reservedMap).forEach(prodId => {
    if (!finalBalances[prodId]) {
      const p = prodMap[prodId] || {};
      finalBalances[prodId] = {
        product_id: prodId,
        product_name: p.name || 'Невідомий товар',
        product_article: p.article || '',
        unit: p.unit || 'шт',
        category: '',
        quantity: 0,
        reserved: 0
      };
    }
    const reservedQty = reservedMap[prodId];
    finalBalances[prodId].reserved = reservedQty;
    finalBalances[prodId].quantity -= reservedQty; // зменшуємо вільний залишок
  });

  return { 
    success: true, 
    items: Object.values(finalBalances).filter(b => b.quantity !== 0 || b.reserved !== 0),
    balances: Object.values(finalBalances)
  };
}

export async function getBalancesAtDate(warehouseId, date) {
  if (!supabase) return { success: true, items: [] };
  const { data, error } = await supabase.rpc('get_balances_at_date', { p_warehouse_id: warehouseId, p_date: date });
  if (error) throw error;
  return { success: true, items: data };
}

export async function getStockReport(warehouseId, date) {
  const balRes = await getBalancesAtDate(warehouseId, date);
  const catalogRes = await getCatalog();
  const whRes = await getWarehouses();
  const catalogMap = {}; catalogRes.products.forEach(p => catalogMap[p.id] = p);
  const whMap = {}; whRes.warehouses.forEach(w => whMap[w.id] = w.name);
  const items = (balRes.items || []).map(b => ({
    'Товар': catalogMap[b.product_id]?.name || b.product_id,
    'Одиниця': catalogMap[b.product_id]?.unit || '',
    'Склад': whMap[b.warehouse_id] || b.warehouse_id,
    'Кількість': b.total_quantity,
    'category': catalogMap[b.product_id]?.category || ''
  }));
  return { success: true, columns: ['Товар', 'Одиниця', 'Склад', 'Кількість'], items };
}

export async function getCompareReport() {
  if (!supabase) return { success: true, columns: [], items: [] };
  const { data, error } = await supabase.rpc('get_compare_report_data');
  if (error) throw error;
  const firstItem = data?.[0] || {};
  const warehouseNames = Object.keys(firstItem.warehouse_balances || {});
  const columns = ['Товар', 'Од.', 'Всього', ...warehouseNames];
  const items = (data || []).map(row => ({
    'Товар': row.product_name, 'Од.': row.unit, 'Всього': row.total,
    'category': row.category, ...row.warehouse_balances
  }));
  return { success: true, columns, items };
}

export async function getMovementReport(filters) {
  const res = await getOperations(filters);
  const typeLabels = { income: 'Прихід', expense: 'Розхід', transfer: 'Переміщення', balance: 'Підсумок дня' };
  const items = res.operations.map(op => ({
    'Дата': op.date, 'Тип': typeLabels[op.type] || op.type, 'Товар': op.product_name,
    'Склад': op.warehouse_name, 'К-сть': op.quantity, 'Коментар': op.comment || '',
    'Автор': op.user_name, 'category': op.category
  }));
  return { success: true, columns: ['Дата', 'Тип', 'Товар', 'Склад', 'К-сть', 'Коментар', 'Автор'], items };
}

export async function getDailyBalanceData(warehouseId) { return getBalances(warehouseId); }
export async function submitDailyBalance(data) {
  return addOperation({
    date: data.date, 
    type: 'balance', 
    user: data.user, 
    warehouseId: data.warehouseId,
    comment: data.comment || `📦 Підсумок дня (${data.date})`,
    items: data.items.map(item => {
      const diff = item.diff ?? item.quantity;
      return { 
        productId: item.product_id || item.productId, 
        quantity: Math.abs(diff),
        type: diff >= 0 ? 'income' : 'expense'
      };
    })
  });
}

export async function createBackup() { return gasRequest('createBackup', {}, 'POST'); }
export async function getUsers() { return gasRequest('getUsers'); }
export async function getProjects(email) { return gasRequest('getProjects', { email }); }
export async function addUser(user) { return vercelAdminRequest('addUser', user); }
export async function updateUser(user) { return vercelAdminRequest('updateUser', user); }
export async function getProposals() { return gasRequest('getProposals', {}, 'POST'); }
export async function saveProposal(proposal, user) { return gasRequest('saveProposal', { proposal, user }, 'POST'); }
export async function deleteProposal(proposalId) { return gasRequest('deleteProposal', { proposalId }, 'POST'); }
export async function exportProposalsAsCSV() { return gasRequest('exportProposalsAsCSV', {}, 'POST'); }

// --- МОДУЛЬ «БАЛАНСИ КЛІЄНТІВ» ---

export async function getBuyers() {
  if (!supabase) return { success: true, buyers: [] };
  const { data, error } = await supabase.from('buyers').select('*').order('name');
  if (error) throw error;
  return { success: true, buyers: data };
}

export async function getBuyersWithBalances() {
  if (!supabase) return { success: true, buyers: [] };
  const { data: buyers, error: bErr } = await supabase.from('buyers').select('*').order('name');
  if (bErr) throw bErr;

  const { data: txs, error: tErr } = await supabase.from('buyer_transactions').select('id, buyer_id, type, amount, currency, status, is_archived, conversion_rate');
  if (tErr) throw tErr;

  // Отримуємо список ID транзакцій, де є позиції без вказаної ціни
  const { data: pendingItems } = await supabase
    .from('buyer_transaction_items')
    .select('transaction_id')
    .is('price', null);

  const pendingTxIds = new Set(pendingItems ? pendingItems.map(item => item.transaction_id) : []);

  const balanceMap = {};
  buyers.forEach(b => {
    balanceMap[b.id] = { uah: 0, usd: 0, pendingCount: 0, reservedCount: 0 };
  });

  txs.forEach(t => {
    if (!balanceMap[t.buyer_id]) return;
    if (t.status === 'reserved') {
      balanceMap[t.buyer_id].reservedCount += 1;
      return; // Ігноруємо незавершені броні для фінансового балансу
    }
    if (t.status === 'pending_price' || pendingTxIds.has(t.id)) {
      balanceMap[t.buyer_id].pendingCount += 1;
    }
    const amt = parseFloat(t.amount) || 0;
    const cur = String(t.currency).toUpperCase();
    if (t.type === 'issue') {
      // Видача збільшує борг (зменшує баланс клієнта)
      if (cur === 'UAH') balanceMap[t.buyer_id].uah -= amt;
      if (cur === 'USD') balanceMap[t.buyer_id].usd -= amt;
    } else if (t.type === 'payment') {
      // Оплата зменшує борг (збільшує баланс клієнта)
      if (cur === 'UAH') balanceMap[t.buyer_id].uah += amt;
      if (cur === 'USD') balanceMap[t.buyer_id].usd += amt;
    } else if (t.type === 'adjustment') {
      // Коригування
      if (cur === 'UAH') balanceMap[t.buyer_id].uah += amt;
      if (cur === 'USD') balanceMap[t.buyer_id].usd += amt;
    }
  });

  return {
    success: true,
    buyers: buyers.map(b => ({
      ...b,
      balanceUah: balanceMap[b.id].uah,
      balanceUsd: balanceMap[b.id].usd,
      pendingCount: balanceMap[b.id].pendingCount,
      reservedCount: balanceMap[b.id].reservedCount
    })),
    transactions: txs
  };
}

export async function addBuyer(buyer) {
  if (!supabase) throw new Error('База даних не підключена');
  const { data, error } = await supabase.from('buyers').insert([{
    name: buyer.name,
    phone: buyer.phone || '',
    notes: buyer.notes || '',
    representatives: buyer.representatives || '',
    active: true
  }]).select();
  if (error) throw error;
  return { success: true, buyer: data[0] };
}

export async function updateBuyer(buyer) {
  if (!supabase) throw new Error('База даних не підключена');
  const { error } = await supabase.from('buyers').update({
    name: buyer.name,
    phone: buyer.phone || '',
    notes: buyer.notes || '',
    representatives: buyer.representatives || '',
    active: buyer.active !== undefined ? buyer.active : true
  }).eq('id', buyer.id);
  if (error) throw error;
  return { success: true };
}

export async function deleteBuyer(buyerId) {
  if (!supabase) throw new Error('База даних не підключена');

  // 1. Отримуємо актуальні баланси покупця
  const buyersRes = await getBuyersWithBalances();
  const buyer = buyersRes.buyers?.find(b => b.id === buyerId);
  if (!buyer) return { success: false, error: 'Клієнта не знайдено' };

  // 2. БОРГ — це коли баланс UAH або USD від'ємний (< -0.01)
  const isUahDebt = (buyer.balanceUah || 0) < -0.01;
  const isUsdDebt = (buyer.balanceUsd || 0) < -0.01;

  if (isUahDebt || isUsdDebt) {
    const debtParts = [];
    if (isUahDebt) debtParts.push(`${Math.abs(buyer.balanceUah).toLocaleString('uk-UA')} грн`);
    if (isUsdDebt) debtParts.push(`${Math.abs(buyer.balanceUsd).toLocaleString('uk-UA')} $`);

    return {
      success: false,
      error: `Неможливо видалити клієнта "${buyer.name}": наявна заборгованість (${debtParts.join(', ')}). Спочатку необхідно повністю погасити борг.`
    };
  }

  // 3. Видаляємо покупця з бази
  const { error } = await supabase.from('buyers').delete().eq('id', buyerId);
  if (error) {
    console.error('Error deleting buyer:', error);
    return { success: false, error: 'Помилка видалення клієнта з бази даних' };
  }

  // 4. Фіксуємо аудит-лог
  try {
    logActivity({
      actionType: 'DELETE',
      entityType: 'BUYER',
      entityId: buyerId,
      entityTitle: `Видалення клієнта (${buyer.name})`,
      details: {
        deletedBuyerName: buyer.name,
        buyerPhone: buyer.phone || '—'
      }
    });
  } catch (err) {}

  return { success: true };
}

export async function getBuyerTransactions(buyerId) {
  if (!supabase) return { success: true, transactions: [] };
  const { data, error } = await supabase
    .from('buyer_transactions')
    .select(`
      *,
      items:buyer_transaction_items(
        *,
        product:products(name, article, unit)
      )
    `)
    .eq('buyer_id', buyerId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Форматуємо для відображення деталей товарів у кожній транзакції
  const formatted = data.map(tx => ({
    ...tx,
    items: (tx.items || []).map(item => ({
      ...item,
      product_name: item.product?.name || '?',
      product_article: item.product?.article || '',
      unit: item.product?.unit || ''
    }))
  }));

  return { success: true, transactions: formatted };
}

export async function getAllBuyerTransactions() {
  if (!supabase) return { success: true, transactions: [] };
  const { data, error } = await supabase
    .from('buyer_transactions')
    .select(`
      *,
      items:buyer_transaction_items(
        *,
        product:products(name, article, unit)
      )
    `)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  const formatted = data.map(tx => ({
    ...tx,
    items: (tx.items || []).map(item => ({
      ...item,
      product_name: item.product?.name || '?',
      product_article: item.product?.article || '',
      unit: item.product?.unit || ''
    }))
  }));

  return { success: true, transactions: formatted };
}

export async function addBuyerTransaction(transaction) {
  if (!supabase) throw new Error('База даних не підключена');
  const timestamp = new Date().toISOString();

  // 1. Створюємо основну фінансову транзакцію
  const { data: tx, error: txErr } = await supabase.from('buyer_transactions').insert([{
    buyer_id: transaction.buyerId,
    parent_id: transaction.parentId || null,
    date: transaction.date,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    converted_amount: transaction.convertedAmount || null,
    conversion_rate: transaction.conversionRate || null,
    status: transaction.status || 'completed',
    comment: transaction.comment,
    picked_up_by: transaction.pickedUpBy || null,
    user_email: transaction.user
  }]).select();

  if (txErr) throw txErr;
  const transactionId = tx[0].id;

  // 2. Якщо це видача, створюємо складські списання (operations) та прив'язуємо деталі
  if (transaction.type === 'issue' && transaction.items && transaction.items.length > 0) {
    const isReserved = transaction.status === 'reserved';
    const isDebtOnly = transaction.status === 'debt_only';
    const skipWarehouse = isReserved || isDebtOnly;

    let opItems = [];
    if (!skipWarehouse) {
      opItems = transaction.items.map(item => ({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        date: transaction.date,
        type: 'expense',
        product_id: item.productId,
        warehouse_id: item.warehouseId,
        quantity: item.quantity,
        comment: `Видача клієнту: ${transaction.buyerName || 'Клієнт'}.${transaction.pickedUpBy ? ` (Представник: ${transaction.pickedUpBy})` : ''} ${transaction.comment || ''}`,
        user_email: transaction.user,
        created_at: timestamp
      }));

      const { error: opErr } = await supabase.from('operations').insert(opItems);
      if (opErr) throw opErr;
    }

    const txItems = transaction.items.map((item, idx) => ({
      transaction_id: transactionId,
      product_id: item.productId,
      warehouse_id: item.warehouseId,
      quantity: item.quantity,
      price: item.price !== undefined ? item.price : null,
      currency: item.currency || null,
      operation_id: skipWarehouse ? null : opItems[idx].id
    }));

    const { error: itemErr } = await supabase.from('buyer_transaction_items').insert(txItems);
    if (itemErr) throw itemErr;
  }

  try {
    const itemsText = transaction.items?.map(i => `${i.productName || i.productId}: ${i.quantity} шт (${i.price !== null && i.price !== undefined ? `${i.price} ${transaction.currency}` : 'без ціни'})`).join(', ');

    const cleanComment = (transaction.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '').trim();

    const summaryParts = [];
    if (transaction.amount !== undefined && transaction.amount !== null) {
      summaryParts.push(`Сума: ${transaction.amount} ${transaction.currency || ''}`);
    }
    if (itemsText) {
      summaryParts.push(`Товари: ${itemsText}`);
    }
    if (cleanComment) {
      summaryParts.push(`Коментар: "${cleanComment}"`);
    }

    logActivity({
      userEmail: transaction.user || 'Система',
      userName: transaction.user || 'Оператор',
      actionType: 'CREATE',
      entityType: 'BUYER_TRANSACTION',
      entityId: transactionId,
      entityTitle: `${transaction.type === 'issue' ? (transaction.status === 'reserved' ? 'Бронь товарів' : 'Видача товарів') : transaction.type === 'payment' ? 'Оплата' : 'Коригування'} (${transaction.buyerName || 'Клієнт'})`,
      details: {
        changesSummary: summaryParts.join('\n') || 'Створено новий документ',
        buyerId: transaction.buyerId,
        buyerName: transaction.buyerName,
        date: transaction.date,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        comment: cleanComment,
        itemsCount: transaction.items?.length || 0,
        itemsSummary: itemsText,
        items: transaction.items || []
      }
    });
  } catch (err) {
    console.error("Logging creation error", err);
  }

  return { success: true, transactionId };
}

export async function updateBuyerTransaction(transaction) {
  if (!supabase) throw new Error('База даних не підключена');
  const timestamp = new Date().toISOString();

  // 0. Зчитуємо попередній стан для детального логування порівняння товару
  let oldTx = null;
  let oldItemsMap = {};
  try {
    const { data: oldTxData } = await supabase
      .from('buyer_transactions')
      .select('*, buyers(name)')
      .eq('id', transaction.id)
      .single();
    oldTx = oldTxData;

    const { data: oldItemsData } = await supabase
      .from('buyer_transaction_items')
      .select('*, products(name)')
      .eq('transaction_id', transaction.id);
    
    if (oldItemsData) {
      oldItemsData.forEach(item => {
        oldItemsMap[item.product_id] = {
          quantity: item.quantity,
          price: item.price,
          name: item.products?.name || item.product_id
        };
      });
    }
  } catch (err) {
    console.warn("Could not fetch old transaction details for diff logging", err);
  }

  // 1. Формуємо безпечний об'єкт оновлення транзакції
  const updatePayload = {};
  if (transaction.parentId !== undefined) updatePayload.parent_id = transaction.parentId;
  if (transaction.date !== undefined) updatePayload.date = transaction.date;
  if (transaction.amount !== undefined) updatePayload.amount = transaction.amount;
  if (transaction.currency !== undefined) updatePayload.currency = transaction.currency;
  if (transaction.convertedAmount !== undefined) updatePayload.converted_amount = transaction.convertedAmount;
  if (transaction.conversionRate !== undefined) updatePayload.conversion_rate = transaction.conversionRate;
  if (transaction.status !== undefined) updatePayload.status = transaction.status;
  if (transaction.comment !== undefined) updatePayload.comment = transaction.comment;
  if (transaction.pickedUpBy !== undefined) updatePayload.picked_up_by = transaction.pickedUpBy;
  if (transaction.user !== undefined) updatePayload.user_email = transaction.user;
  if (transaction.is_archived !== undefined) updatePayload.is_archived = transaction.is_archived;

  if (Object.keys(updatePayload).length > 0) {
    const { error: txErr } = await supabase
      .from('buyer_transactions')
      .update(updatePayload)
      .eq('id', transaction.id);
    if (txErr) throw txErr;
  }

  // 2. Якщо це видача, оновлюємо специфікацію та складські записи
  if (transaction.type === 'issue') {
    // Отримуємо старі деталі для видалення складських операцій
    const { data: oldItems, error: getErr } = await supabase
      .from('buyer_transaction_items')
      .select('operation_id')
      .eq('transaction_id', transaction.id);

    if (getErr) throw getErr;
    const oldOpIds = oldItems?.map(oi => oi.operation_id).filter(Boolean) || [];

    // Видаляємо деталі транзакції покупця
    const { error: delItemsErr } = await supabase.from('buyer_transaction_items').delete().eq('transaction_id', transaction.id);
    if (delItemsErr) throw delItemsErr;

    // Видаляємо зв'язані складські операції списання
    if (oldOpIds.length > 0) {
      const { error: delOpsErr } = await supabase.from('operations').delete().in('id', oldOpIds);
      if (delOpsErr) throw delOpsErr;
    }

    // Записуємо нові складські операції та нові деталі
    if (transaction.items && transaction.items.length > 0) {
      const isReserved = transaction.status === 'reserved';
      const isDebtOnly = transaction.status === 'debt_only';
      const skipWarehouse = isReserved || isDebtOnly;

      let opItems = [];
      if (!skipWarehouse) {
        opItems = transaction.items.map(item => ({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          date: transaction.date,
          type: 'expense',
          product_id: item.productId,
          warehouse_id: item.warehouseId,
          quantity: item.quantity,
          comment: `Видача клієнту: ${transaction.buyerName || 'Клієнт'}.${transaction.pickedUpBy ? ` (Представник: ${transaction.pickedUpBy})` : ''} ${transaction.comment || ''}`,
          user_email: transaction.user,
          created_at: timestamp
        }));

        const { error: opErr } = await supabase.from('operations').insert(opItems);
        if (opErr) throw opErr;
      }

      const txItems = transaction.items.map((item, idx) => ({
        transaction_id: transaction.id,
        product_id: item.productId,
        warehouse_id: item.warehouseId,
        quantity: item.quantity,
        price: item.price !== undefined ? item.price : null,
        currency: item.currency || null,
        operation_id: skipWarehouse ? null : opItems[idx].id
      }));

      const { error: itemErr } = await supabase.from('buyer_transaction_items').insert(txItems);
      if (itemErr) throw itemErr;
    }
  }

  try {
    const changes = [];

    // 1. Порівнюємо суму накладної (тільки якщо передана)
    if (transaction.amount !== undefined && oldTx && Number(oldTx.amount) !== Number(transaction.amount)) {
      changes.push(`Сума накладної: ${oldTx.amount} ${oldTx.currency || ''} ➔ ${transaction.amount} ${transaction.currency || ''}`);
    }

    // 2. Порівнюємо статус (тільки якщо переданий)
    if (transaction.status !== undefined && oldTx && oldTx.status !== transaction.status) {
      changes.push(`Статус: ${oldTx.status} ➔ ${transaction.status}`);
    }

    // 3. Порівнюємо коментар (тільки якщо переданий)
    if (transaction.comment !== undefined && oldTx && (oldTx.comment || '') !== (transaction.comment || '')) {
      changes.push(`Коментар: "${oldTx.comment || ''}" ➔ "${transaction.comment || ''}"`);
    }

    // 4. Порівнюємо товари (ціна, кількість, додавання/видалення)
    if (transaction.items !== undefined && Array.isArray(transaction.items)) {
      const newItemsProcessed = new Set();

      transaction.items.forEach(newItem => {
        const prodId = newItem.productId;
        const prodName = newItem.productName || newItem.name || (oldItemsMap[prodId]?.name) || prodId;
        const oldItem = oldItemsMap[prodId];
        newItemsProcessed.add(prodId);

        if (oldItem) {
          const itemChanges = [];
          if (newItem.price !== undefined && oldItem.price !== null && Number(oldItem.price) !== Number(newItem.price)) {
            const oldP = oldItem.price ?? 'без ціни';
            const newP = newItem.price ?? 'без ціни';
            itemChanges.push(`ціна ${oldP} ➔ ${newP} ${transaction.currency || ''}`);
          }
          if (Number(oldItem.quantity) !== Number(newItem.quantity)) {
            itemChanges.push(`к-сть ${oldItem.quantity} ➔ ${newItem.quantity}`);
          }

          if (itemChanges.length > 0) {
            changes.push(`Товар "${prodName}": ${itemChanges.join(', ')}`);
          }
        } else {
          changes.push(`Додано товар "${prodName}": ${newItem.quantity} шт (ціна: ${newItem.price ?? 'без ціни'} ${transaction.currency || ''})`);
        }
      });

      Object.keys(oldItemsMap).forEach(oldProdId => {
        if (!newItemsProcessed.has(oldProdId)) {
          const oldItem = oldItemsMap[oldProdId];
          changes.push(`Видалено товар "${oldItem.name}"`);
        }
      });
    }

    // Якщо це була автоматична архівація через повну оплату
    if (transaction.is_archived === true && transaction.amount === undefined) {
      changes.push(`Накладну автоматично закрито в архів (повна оплата)`);
    }

    const buyerDisplayName = transaction.buyerName || oldTx?.buyers?.name || oldTx?.buyer_name || 'Клієнт';

    logActivity({
      userEmail: transaction.user || oldTx?.user_email,
      userName: transaction.userName || transaction.user || oldTx?.user_email,
      actionType: 'UPDATE',
      entityType: 'BUYER_TRANSACTION',
      entityId: transaction.id,
      entityTitle: `Оновлено накладну/оплату (${buyerDisplayName})`,
      details: {
        changesSummary: changes.length > 0 ? '• ' + changes.join('\n• ') : 'Редагування деталей накладної',
        changesList: changes,
        oldAmount: oldTx?.amount,
        newAmount: transaction.amount !== undefined ? transaction.amount : oldTx?.amount,
        currency: transaction.currency || oldTx?.currency,
        status: transaction.status || oldTx?.status
      }
    });
  } catch (err) {
    console.error("Logging update error", err);
  }

  return { success: true };
}

export async function toggleArchiveTransaction(id, isArchived) {
  if (!supabase) throw new Error('База даних не підключена');

  let clientName = 'Клієнт';
  let txUserEmail = null;
  try {
    const { data: txData } = await supabase
      .from('buyer_transactions')
      .select('*, buyers(name)')
      .eq('id', id)
      .single();
    if (txData?.buyers?.name) clientName = txData.buyers.name;
    if (txData?.user_email) txUserEmail = txData.user_email;
  } catch (err) {}

  const { error } = await supabase
    .from('buyer_transactions')
    .update({ is_archived: isArchived })
    .eq('id', id);
  if (error) throw error;

  try {
    logActivity({
      userEmail: txUserEmail,
      userName: txUserEmail,
      actionType: isArchived ? 'ARCHIVE' : 'UNARCHIVE',
      entityType: 'BUYER_TRANSACTION',
      entityId: id,
      entityTitle: `${isArchived ? '🗄️ Закрито в архів' : '🔄 Відновлено з архіву'} (${clientName})`,
      details: {
        transactionId: id,
        isArchived,
        buyerName: clientName,
        changesSummary: isArchived 
          ? `Переміщено накладну/оплату клієнта ${clientName} в архів` 
          : `Відновлено накладну/оплату клієнта ${clientName} з архіву`
      }
    });
  } catch (err) {
    console.error("Logging archive error", err);
  }

  return { success: true };
}

export async function deleteBuyerTransaction(transactionId) {
  if (!supabase) throw new Error('База даних не підключена');

  // 0. Зчитуємо детальний знімок (snapshot) транзакції ТА товарів ПЕРЕД її видаленням
  let existingTx = null;
  let existingItems = [];
  try {
    const { data: txData } = await supabase
      .from('buyer_transactions')
      .select('*, buyers(name)')
      .eq('id', transactionId)
      .single();
    existingTx = txData;

    const { data: itemsData } = await supabase
      .from('buyer_transaction_items')
      .select('*, products(name, article, unit)')
      .eq('transaction_id', transactionId);
    
    if (itemsData) {
      existingItems = itemsData.map(item => ({
        productId: item.product_id,
        productName: item.products?.name || item.product_id,
        article: item.products?.article || '',
        quantity: item.quantity,
        price: item.price,
        unit: item.products?.unit || 'шт',
        currency: item.currency || existingTx?.currency
      }));
    }
  } catch (err) {
    console.warn("Could not fetch transaction details before delete", err);
  }

  // 1. Зчитуємо старі операції списання для їх видалення
  const { data: items, error: getErr } = await supabase
    .from('buyer_transaction_items')
    .select('operation_id')
    .eq('transaction_id', transactionId);

  if (getErr) throw getErr;
  const opIds = items?.map(i => i.operation_id).filter(Boolean) || [];

  // 2. Видаляємо основну транзакцію (це каскадно очистить buyer_transaction_items)
  const { error: txErr } = await supabase.from('buyer_transactions').delete().eq('id', transactionId);
  if (txErr) throw txErr;

  // 3. Видаляємо операції списання зі складу
  if (opIds.length > 0) {
    const { error: opErr } = await supabase.from('operations').delete().in('id', opIds);
    if (opErr) throw opErr;
  }

  try {
    const clientName = existingTx?.buyers?.name || 'Клієнт';
    const typeTitle = existingTx?.type === 'issue' ? 'Видачу товарів' : existingTx?.type === 'payment' ? 'Оплату' : 'Коригування';
    const amountStr = existingTx?.amount !== undefined ? ` на суму ${existingTx.amount} ${existingTx.currency || ''}` : '';
    const cleanComment = (existingTx?.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '').trim();

    const itemsSummaryText = existingItems.length > 0
      ? existingItems.map(i => `${i.productName}: ${i.quantity} ${i.unit} (${i.price !== null && i.price !== undefined ? `${i.price} ${i.currency || ''}` : 'без ціни'})`).join(', ')
      : null;

    logActivity({
      userEmail: existingTx?.user_email,
      userName: existingTx?.user_email,
      actionType: 'DELETE',
      entityType: 'BUYER_TRANSACTION',
      entityId: transactionId,
      entityTitle: `Видалено ${typeTitle} (${clientName})`,
      details: {
        transactionId,
        buyerName: clientName,
        amount: existingTx?.amount,
        currency: existingTx?.currency,
        changesSummary: `Видалено ${typeTitle.toLowerCase()} клієнта ${clientName}${amountStr} (від ${existingTx?.date || ''})`,
        deletedTransaction: {
          id: transactionId,
          date: existingTx?.date,
          type: existingTx?.type,
          amount: existingTx?.amount,
          currency: existingTx?.currency,
          buyerId: existingTx?.buyer_id,
          buyerName: clientName,
          comment: cleanComment,
          userEmail: existingTx?.user_email,
          itemsCount: existingItems.length,
          itemsSummary: itemsSummaryText,
          items: existingItems
        }
      }
    });
  } catch (err) {
    console.error("Logging delete error", err);
  }

  return { success: true };
}

export async function getBuyerTransactionById(txId) {
  if (!supabase) throw new Error('База даних не підключена');

  // 1. Отримуємо основні реквізити транзакції
  const { data: tx, error: txErr } = await supabase
    .from('buyer_transactions')
    .select('*')
    .eq('id', txId)
    .single();

  if (txErr) throw txErr;

  // 2. Отримуємо специфікацію товарів
  const { data: items, error: itemsErr } = await supabase
    .from('buyer_transaction_items')
    .select('*, product:products(*)')
    .eq('transaction_id', txId);

  if (itemsErr) throw itemsErr;

  return {
    success: true,
    transaction: {
      id: tx.id,
      buyerId: tx.buyer_id,
      date: tx.date,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      conversion_rate: tx.conversion_rate,
      comment: tx.comment,
      status: tx.status,
      pickedUpBy: tx.picked_up_by,
      user_email: tx.user_email,
      is_archived: tx.is_archived,
      items: items.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product?.name || '',
        productArticle: item.product?.article || '',
        unit: item.product?.unit || '',
        quantity: item.quantity,
        price: item.price !== null ? item.price : '',
        currency: item.currency || 'UAH',
        warehouseId: item.warehouse_id,
        operationId: item.operation_id
      }))
    }
  };
}



/**
 * Запис дії користувача (Аудит-лог)
 */
export async function logActivity({ userEmail, userName, actionType, entityType, entityId, entityTitle, details }) {
  let cleanEmail = userEmail;
  let cleanName = userName;

  const isPlaceholder = (val) => !val || val === 'Оператор' || val === 'Система / Невідомо';

  if (isPlaceholder(cleanEmail) || isPlaceholder(cleanName)) {
    try {
      const cached = localStorage.getItem('cso_user');
      if (cached) {
        const u = JSON.parse(cached);
        if (u.email) cleanEmail = u.email;
        if (u.name || u.email) cleanName = u.name || u.email;
      }
    } catch (e) {}
  }

  const displayName = formatUserName(cleanName || cleanEmail);

  const logEntry = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    created_at: new Date().toISOString(),
    user_email: cleanEmail || 'Система / Невідомо',
    user_name: displayName,
    action_type: actionType, // 'CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'UNARCHIVE'
    entity_type: entityType, // 'BUYER_TRANSACTION', 'PRODUCT', 'WAREHOUSE', 'BUYER'
    entity_id: entityId ? String(entityId) : null,
    entity_title: entityTitle || '',
    details: details || {}
  };

  // 1. Запис у LocalStorage для гарантії негайного збереження
  try {
    const existingStr = localStorage.getItem('cso_activity_logs');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    existing.unshift(logEntry);
    localStorage.setItem('cso_activity_logs', JSON.stringify(existing.slice(0, 1000)));
  } catch (err) {
    console.error("Failed to write log to localStorage", err);
  }

  // 2. Відправка в Supabase activity_logs
  try {
    const { error } = await supabase.from('activity_logs').insert([logEntry]);
    if (error) {
      console.warn("Supabase activity_logs insert warning:", error.message);
    }
  } catch (err) {
    console.warn("Supabase activity_logs network warning:", err);
  }

  return logEntry;
}

/**
 * Отримання списку логів дій
 */
export async function getActivityLogs(filters = {}) {
  let logs = [];

  // 1. Отримуємо з Supabase
  try {
    let query = supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
    if (filters.actionType && filters.actionType !== 'ALL') {
      query = query.eq('action_type', filters.actionType);
    }
    if (filters.entityType && filters.entityType !== 'ALL') {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters.entityId) {
      query = query.eq('entity_id', String(filters.entityId));
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', `${filters.dateFrom}T00:00:00.000Z`);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', `${filters.dateTo}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      logs = data;
    }
  } catch (err) {
    console.warn("Supabase activity_logs fetch failed, using local storage fallback", err);
  }

  // 2. Отримуємо з LocalStorage (якщо Supabase порожня або недоступна)
  if (logs.length === 0) {
    try {
      const localStr = localStorage.getItem('cso_activity_logs');
      if (localStr) {
        let localLogs = JSON.parse(localStr);
        if (filters.actionType && filters.actionType !== 'ALL') {
          localLogs = localLogs.filter(l => l.action_type === filters.actionType);
        }
        if (filters.entityType && filters.entityType !== 'ALL') {
          localLogs = localLogs.filter(l => l.entity_type === filters.entityType);
        }
        if (filters.entityId) {
          localLogs = localLogs.filter(l => String(l.entity_id) === String(filters.entityId));
        }
        if (filters.dateFrom) {
          localLogs = localLogs.filter(l => l.created_at >= `${filters.dateFrom}T00:00:00.000Z`);
        }
        if (filters.dateTo) {
          localLogs = localLogs.filter(l => l.created_at <= `${filters.dateTo}T23:59:59.999Z`);
        }
        logs = localLogs;
      }
    } catch (err) {
      console.error("Failed to parse local activity_logs", err);
    }
  }

  // 3. Фільтрація за пошуковим словом або користувачем
  if (filters.search) {
    const s = filters.search.toLowerCase();
    logs = logs.filter(l => 
      (l.user_name || '').toLowerCase().includes(s) ||
      (l.user_email || '').toLowerCase().includes(s) ||
      (l.entity_title || '').toLowerCase().includes(s) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(s)
    );
  }

  if (filters.user && filters.user !== 'ALL') {
    logs = logs.filter(l => l.user_email === filters.user || l.user_name === filters.user);
  }

  return { success: true, data: logs };
}

/* ==========================================================================
   МОДУЛЬ «ВІДПРАВЛЕННЯ» (SHIPMENTS)
   ========================================================================== */

/**
 * Отримання списку відправників ("Від кого відправлено")
 */
export async function getShipmentSenders() {
  const defaultSenders = [
    { id: 'def-1', name: 'Пастушок Петро', active: true },
    { id: 'def-2', name: 'Пастушок Марія', active: true },
    { id: 'def-3', name: 'Пастушок Юра', active: true }
  ];

  if (!supabase) return { success: true, senders: defaultSenders };

  try {
    // Авто-корекція друкарських помилок та регістру в базі даних Supabase
    supabase.from('shipment_senders').update({ name: 'Пастушок Марія' }).eq('name', 'Мастушок Марія').then(() => {}).catch(() => {});
    supabase.from('shipments').update({ sender_name: 'Пастушок Марія' }).eq('sender_name', 'Мастушок Марія').then(() => {}).catch(() => {});
    supabase.from('shipment_senders').update({ name: 'Пастушок Олег' }).ilike('name', 'пастушок олег').then(() => {}).catch(() => {});
    supabase.from('shipments').update({ sender_name: 'Пастушок Олег' }).ilike('sender_name', 'пастушок олег').then(() => {}).catch(() => {});

    const { data, error } = await supabase
      .from('shipment_senders')
      .select('*')
      .order('name');

    if (error || !data || data.length === 0) {
      return { success: true, senders: defaultSenders };
    }
    
    // Нормалізація імен відправників (наприклад, "пастушок олег" -> "Пастушок Олег")
    const sanitizedSenders = data.map(s => {
      let name = s.name ? s.name.trim() : '';
      if (name === 'Мастушок Марія') name = 'Пастушок Марія';
      if (name.toLowerCase() === 'пастушок олег') name = 'Пастушок Олег';
      return { ...s, name };
    });

    return { success: true, senders: sanitizedSenders };
  } catch (err) {
    console.warn("Could not fetch shipment_senders from DB:", err);
    return { success: true, senders: defaultSenders };
  }
}

/**
 * Додавання нового відправника
 */
export async function addShipmentSender(name, user = {}) {
  if (!name || !name.trim()) throw new Error("Вкажіть ПІБ відправника");
  
  // Капіталізуємо кожне слово (напр. "пастушок олег" -> "Пастушок Олег")
  const cleanName = name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  if (!supabase) throw new Error("База даних не підключена");

  const { data, error } = await supabase
    .from('shipment_senders')
    .insert([{ name: cleanName, active: true }])
    .select();

  if (error) throw error;

  // Логування в аудит
  logActivity({
    userEmail: user.email || 'Оператор',
    userName: user.name || 'Оператор',
    actionType: 'CREATE',
    entityType: 'SHIPMENT_SENDER',
    entityId: data?.[0]?.id || cleanName,
    entityTitle: cleanName,
    details: { name: cleanName }
  });

  return { success: true, sender: data?.[0] };
}

/**
 * Отримання списку клієнтів відправлень
 */
export async function getShipmentClients() {
  if (!supabase) return { success: true, clients: [] };
  try {
    const { data, error } = await supabase
      .from('shipment_clients')
      .select('*')
      .order('name');
    if (error) throw error;
    return { success: true, clients: data || [] };
  } catch (err) {
    console.warn("Could not fetch shipment_clients:", err);
    return { success: true, clients: [] };
  }
}

/**
 * Створення / пошук клієнта відправлення
 */
export async function findOrCreateShipmentClient({ name, phone, address, notes }) {
  if (!name || !name.trim()) throw new Error("ПІБ клієнта обов'язкове");
  const cleanName = name.trim();
  const cleanPhone = (phone || '').trim();
  const cleanAddress = (address || '').trim();

  if (!supabase) return { id: null, name: cleanName };

  // Шукаємо за телефоном або ім'ям
  let existing = null;
  if (cleanPhone) {
    const { data } = await supabase
      .from('shipment_clients')
      .select('*')
      .eq('phone', cleanPhone)
      .limit(1);
    if (data && data.length > 0) existing = data[0];
  }

  if (!existing) {
    const { data } = await supabase
      .from('shipment_clients')
      .select('*')
      .ilike('name', cleanName)
      .limit(1);
    if (data && data.length > 0) existing = data[0];
  }

  if (existing) {
    // Оновлюємо адресу/телефон якщо з'явилися нові дані
    if ((cleanAddress && !existing.address) || (cleanPhone && !existing.phone)) {
      await supabase
        .from('shipment_clients')
        .update({
          address: cleanAddress || existing.address,
          phone: cleanPhone || existing.phone
        })
        .eq('id', existing.id);
    }
    return existing;
  }

  const { data, error } = await supabase
    .from('shipment_clients')
    .insert([{
      name: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      notes: notes || ''
    }])
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Автоматичний перенос всіх повністю оплачених відправлень у статус архіву
 */
export async function syncPaidShipmentsToArchive() {
  if (!supabase) return { success: true, count: 0 };
  try {
    const { data: unarchivedPaid, error } = await supabase
      .from('shipments')
      .select('id, debt_amount, status')
      .or('is_archived.is.null,is_archived.eq.false')
      .or('status.eq.paid,debt_amount.lte.0');

    if (error || !unarchivedPaid || unarchivedPaid.length === 0) {
      return { success: true, count: 0 };
    }

    const idsToArchive = unarchivedPaid
      .filter(s => s.status === 'paid' || (s.debt_amount !== undefined && parseFloat(s.debt_amount) <= 0))
      .map(s => s.id);

    if (idsToArchive.length === 0) return { success: true, count: 0 };

    const { error: updateErr } = await supabase
      .from('shipments')
      .update({ is_archived: true })
      .in('id', idsToArchive);

    if (updateErr) {
      console.warn("Failed to auto-archive paid shipments:", updateErr);
      return { success: false, count: 0 };
    }

    return { success: true, count: idsToArchive.length };
  } catch (err) {
    console.warn("syncPaidShipmentsToArchive failed:", err);
    return { success: false, count: 0 };
  }
}

/**
 * Отримання реєстру відправлень
 */
export async function getShipments(filters = {}) {
  if (!supabase) return { success: true, shipments: [], stats: {} };

  try {
    // Автоматично синонімізуємо / відправляємо в архів всі повністю оплачені відправлення
    await syncPaidShipmentsToArchive();

    let query = supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'ALL' && filters.status !== 'ARCHIVED') {
      query = query.eq('status', filters.status);
    }
    if (filters.senderId && filters.senderId !== 'ALL') {
      query = query.eq('sender_id', filters.senderId);
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
      query = query.eq('payment_method', filters.paymentMethod);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', `${filters.dateFrom}T00:00:00.000Z`);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', `${filters.dateTo}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === '42P01' || (error.message || '').includes('does not exist')) {
        return {
          success: false,
          shipments: [],
          stats: {},
          error: 'Таблиці відправлень ще не створено у Supabase. Будь ласка, виконайте SQL-скрипт з файлу supabase_setup.sql у вашому Supabase SQL Editor.'
        };
      }
      throw error;
    }

    let shipments = data || [];

    // Приєднуємо товари (shipment_items) та назви з каталогу товарів
    if (shipments.length > 0) {
      const shipIds = shipments.map(s => s.id);
      
      const [{ data: allItems }, { data: catalog }, { data: whCatalog }] = await Promise.all([
        supabase.from('shipment_items').select('*').in('shipment_id', shipIds),
        supabase.from('products').select('id, name, article, unit'),
        supabase.from('warehouses').select('id, name')
      ]);

      const prodMap = {};
      if (catalog) {
        catalog.forEach(p => { prodMap[p.id] = p; });
      }

      const whMap = {};
      if (whCatalog) {
        whCatalog.forEach(w => { whMap[w.id] = w.name; });
      }

      const itemsByShipment = {};
      if (allItems) {
        allItems.forEach(item => {
          if (!itemsByShipment[item.shipment_id]) {
            itemsByShipment[item.shipment_id] = [];
          }
          const prod = prodMap[item.product_id];
          const whName = whMap[item.warehouse_id] || item.warehouse_id || 'Основний склад';
          itemsByShipment[item.shipment_id].push({
            ...item,
            product_name: prod ? prod.name : (item.product_name || item.product_id),
            product_article: prod ? prod.article : (item.product_article || ''),
            warehouse_name: whName
          });
        });
      }

      shipments = shipments.map(s => {
        const items = itemsByShipment[s.id] || [];
        const whNames = [...new Set(items.map(it => it.warehouse_name).filter(Boolean))];
        return {
          ...s,
          shipment_items: items,
          warehouse_names: whNames,
          primary_warehouse_name: whNames.join(', ') || 'Основний склад'
        };
      });
    }

    const rawShipments = [...shipments];

    // Фільтрація за текстом (пошук за ПІБ, телефоном, ТТН, номером накладної, адресою)
    if (filters.search && filters.search.trim()) {
      const s = filters.search.trim().toLowerCase();
      
      // Якщо введено пошуковий запит
      if (filters.status === 'ARCHIVED') {
        // У вкладці Архів шукаємо серед архівних
        shipments = rawShipments.filter(ship => 
          ship.is_archived === true && (
            (ship.client_name || '').toLowerCase().includes(s) ||
            (ship.client_phone || '').toLowerCase().includes(s) ||
            (ship.shipping_address || '').toLowerCase().includes(s) ||
            (ship.ttn || '').toLowerCase().includes(s) ||
            (ship.sender_name || '').toLowerCase().includes(s) ||
            (ship.shipment_number || '').toLowerCase().includes(s)
          )
        );
      } else {
        // У звичайних вкладках пошук здійснюється по ВСІХ відправленнях (включаючи архівні)
        shipments = rawShipments.filter(ship => 
          (ship.client_name || '').toLowerCase().includes(s) ||
          (ship.client_phone || '').toLowerCase().includes(s) ||
          (ship.shipping_address || '').toLowerCase().includes(s) ||
          (ship.ttn || '').toLowerCase().includes(s) ||
          (ship.sender_name || '').toLowerCase().includes(s) ||
          (ship.shipment_number || '').toLowerCase().includes(s)
        );

        if (filters.status && filters.status !== 'ALL') {
          shipments = shipments.filter(s => s.status === filters.status);
        }
      }
    } else {
      // Без фільтру пошуку — показуємо відповідно до обраної вкладки
      if (filters.status === 'ARCHIVED') {
        shipments = rawShipments.filter(s => s.is_archived === true);
      } else {
        shipments = rawShipments.filter(s => !s.is_archived);
        if (filters.status && filters.status !== 'ALL') {
          shipments = shipments.filter(s => s.status === filters.status);
        }
      }
    }

    // Підрахунок статистики
    const stats = {
      totalCount: rawShipments.filter(s => !s.is_archived).length,
      reservedCount: rawShipments.filter(s => !s.is_archived && s.status === 'reserved').length,
      shippedCount: rawShipments.filter(s => !s.is_archived && s.status === 'shipped').length,
      paidCount: rawShipments.filter(s => !s.is_archived && s.status === 'paid').length,
      cancelledCount: rawShipments.filter(s => !s.is_archived && s.status === 'cancelled').length,
      archivedCount: rawShipments.filter(s => s.is_archived === true).length,
      totalDebtUah: rawShipments.reduce((sum, s) => !s.is_archived && s.currency === 'UAH' && (s.status === 'shipped' || s.status === 'reserved') ? sum + (parseFloat(s.debt_amount) || 0) : sum, 0),
      totalDebtUsd: rawShipments.reduce((sum, s) => !s.is_archived && s.currency === 'USD' && (s.status === 'shipped' || s.status === 'reserved') ? sum + (parseFloat(s.debt_amount) || 0) : sum, 0)
    };

    return { success: true, shipments, stats };
  } catch (err) {
    console.error("Failed to fetch shipments:", err);
    return { success: false, shipments: [], stats: {}, error: err.message };
  }
}

/**
 * Отримання деталей 1 відправлення
 */
export async function getShipmentById(id) {
  if (!supabase) throw new Error("База даних не підключена");

  const { data: shipment, error: shipErr } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', id)
    .single();

  if (shipErr || !shipment) throw new Error("Відправлення не знайдено");

  const { data: items } = await supabase
    .from('shipment_items')
    .select('*')
    .eq('shipment_id', id);

  const { data: whCatalog } = await supabase
    .from('warehouses')
    .select('id, name');

  const whMap = {};
  if (whCatalog) {
    whCatalog.forEach(w => { whMap[w.id] = w.name; });
  }

  const { data: catalog } = await supabase
    .from('products')
    .select('id, name, article, unit');

  const prodMap = {};
  if (catalog) {
    catalog.forEach(p => { prodMap[p.id] = p; });
  }

  const enrichedItems = (items || []).map(it => {
    const prod = prodMap[it.product_id];
    const realProdName = (it.product_name && it.product_name !== it.product_id) ? it.product_name : (prod ? prod.name : it.product_name || it.product_id);
    const realWhName = whMap[it.warehouse_id] || it.warehouse_id || 'Основний склад';
    return {
      ...it,
      product_name: realProdName,
      product_article: prod ? prod.article : (it.product_article || ''),
      warehouse_name: realWhName
    };
  });

  const { data: payments } = await supabase
    .from('shipment_payments')
    .select('*')
    .eq('shipment_id', id)
    .order('created_at', { ascending: true });

  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_id', id)
    .order('created_at', { ascending: true });

  return {
    success: true,
    shipment,
    items: enrichedItems,
    payments: payments || [],
    auditLogs: auditLogs || []
  };
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Автоматичне збереження товарів з динамічним вилученням відсутніх колонок та обробкою обмежень у Supabase
 */
async function insertShipmentItemsWithAutoRecovery(itemsToInsert) {
  if (!itemsToInsert || itemsToInsert.length === 0) return;

  const OPTIONAL_STRIP_COLUMNS = ['product_name', 'product_article', 'currency', 'operation_id', 'notes'];
  let currentPayload = [...itemsToInsert];
  let { error } = await supabase.from('shipment_items').insert(currentPayload);

  if (error) {
    const msg = error.message || '';

    // 1. Missing column in schema cache (e.g. Could not find the 'product_name' column of 'shipment_items')
    const missingMatch = msg.match(/Could not find the '([^']+)' column of 'shipment_items'/i);
    if (missingMatch && missingMatch[1]) {
      const missingCol = missingMatch[1];
      if (OPTIONAL_STRIP_COLUMNS.includes(missingCol)) {
        console.warn(`Optional column '${missingCol}' missing in shipment_items. Retrying insert without it.`);
        const strippedPayload = currentPayload.map(item => {
          const copy = { ...item };
          delete copy[missingCol];
          return copy;
        });
        return insertShipmentItemsWithAutoRecovery(strippedPayload);
      }
    }

    // 2. Not-null constraint violation for secondary columns
    const notNullMatch = msg.match(/null value in column "([^"]+)" of relation "shipment_items" violates not-null constraint/i);
    if (notNullMatch && notNullMatch[1]) {
      const notNullCol = notNullMatch[1];
      if (notNullCol !== 'shipment_id' && notNullCol !== 'product_id' && notNullCol !== 'warehouse_id') {
        console.warn(`Column '${notNullCol}' has NOT NULL constraint in shipment_items. Supplying fallback.`);
        const filledPayload = currentPayload.map(item => {
          const copy = { ...item };
          copy[notNullCol] = item[notNullCol] || item.product_id || item.shipment_id || 'DEFAULT';
          return copy;
        });
        return insertShipmentItemsWithAutoRecovery(filledPayload);
      }
    }

    console.error("Error inserting shipment items:", error);
    throw new Error(`Помилка збереження товарів відправлення: ${error.message}`);
  }
}

/**
 * Створення нового відправлення (з можливістю авансу)
 */
export async function createShipment(data, user = {}) {
  if (!supabase) throw new Error("База даних не підключена");
  if (!data.clientName || !data.clientName.trim()) throw new Error("Вкажіть ПІБ клієнта");
  if (!data.items || data.items.length === 0) throw new Error("Додайте хоча б один товар");

  // 1. Створюємо/знаходимо клієнта
  const client = await findOrCreateShipmentClient({
    name: data.clientName,
    phone: data.clientPhone,
    address: data.shippingAddress,
    notes: data.notes
  });

  // 2. Обчислюємо суми
  const currency = data.currency || 'UAH';
  const totalAmount = data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.price || 0)), 0);
  const advanceAmount = parseFloat(data.advanceAmount) || 0;
  const initialPaid = advanceAmount;
  const initialDebt = Math.max(0, totalAmount - initialPaid);

  const initialStatus = data.immediatelyShipped ? 'shipped' : 'reserved';

  // 2b. Генерація номера відправлення: № [порядок за сьогодні] від [ДД.ММ.РРРР]
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('uk-UA');
  let seqNum = 1;

  try {
    const { count } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${todayStr}T00:00:00.000Z`);

    seqNum = (count || 0) + 1;
  } catch (err) {
    console.warn("Could not count today shipments:", err);
  }

  const shipmentNumber = `№ ${seqNum} від ${todayFormatted}`;
  const shipmentId = generateUUID();

  // 3. Вставляємо в shipments
  const insertPayload = {
    id: shipmentId,
    client_id: client?.id || null,
    client_name: data.clientName.trim(),
    client_phone: (data.clientPhone || '').trim(),
    shipping_address: (data.shippingAddress || '').trim(),
    sender_id: data.senderId || null,
    sender_name: data.senderName || '',
    carrier: data.carrier || 'Нова Пошта',
    ttn: (data.ttn || '').trim(),
    shipment_number: shipmentNumber,
    status: initialStatus,
    payment_method: data.paymentMethod || 'cod',
    total_amount: totalAmount,
    currency: currency,
    advance_amount: advanceAmount,
    paid_amount: initialPaid,
    debt_amount: initialDebt,
    comment: data.comment || '',
    user_email: user.email || 'Оператор',
    user_name: user.name || 'Оператор',
    shipped_at: initialStatus === 'shipped' ? new Date().toISOString() : null
  };

  let { data: shipData, error: shipErr } = await supabase
    .from('shipments')
    .insert([insertPayload])
    .select();

  // Якщо колонка shipment_number ще не додана в базу Supabase, повторюємо без неї
  if (shipErr && (shipErr.message || '').includes('shipment_number')) {
    delete insertPayload.shipment_number;
    const retryRes = await supabase.from('shipments').insert([insertPayload]).select();
    shipErr = retryRes.error;
    if (retryRes.data && retryRes.data[0]) shipData = retryRes.data;
  }

  if (shipErr) throw shipErr;

  // 4. Вставляємо специфікацію товарів
  const itemsToInsert = [];
  for (const item of data.items) {
    let operationId = null;

    // Якщо одразу відправлено, створюємо видаткову операцію видатку
    if (initialStatus === 'shipped') {
      const opRes = await addOperation({
        date: new Date().toISOString().split('T')[0],
        warehouseId: item.warehouseId,
        type: 'expense',
        productId: item.productId,
        quantity: parseFloat(item.quantity),
        comment: `Відправлення для ${data.clientName.trim()} (ТТН: ${data.ttn || '—'})`,
        userEmail: user.email || 'Оператор'
      });
      if (opRes && opRes.operation) operationId = opRes.operation.id;
    }

    const whId = item.warehouseId || data.selectedWarehouseId || data.warehouseId;
    const pName = (item.productName || item.productId || '').trim();
    if (!pName) continue;
    if (!whId) throw new Error(`Оберіть склад для товару ${pName}`);

    itemsToInsert.push({
      shipment_id: shipmentId,
      product_id: item.productId || generateUUID(),
      product_name: pName,
      product_article: item.productArticle || '',
      warehouse_id: whId,
      quantity: parseFloat(item.quantity) || 1,
      price: parseFloat(item.price || 0),
      currency: currency,
      operation_id: operationId
    });
  }

  if (itemsToInsert.length > 0) {
    await insertShipmentItemsWithAutoRecovery(itemsToInsert);
  }

  // 5. Якщо був аванс, реєструємо платіж
  if (advanceAmount > 0) {
    await supabase.from('shipment_payments').insert([{
      shipment_id: shipmentId,
      type: 'advance',
      amount: advanceAmount,
      currency: currency,
      payment_method: data.paymentMethod || 'cod',
      comment: 'Аванс при оформленні',
      user_email: user.email || 'Оператор',
      user_name: user.name || 'Оператор'
    }]);
  }

  // 6. Запис в Аудит
  logActivity({
    userEmail: user.email || 'Оператор',
    userName: user.name || 'Оператор',
    actionType: 'CREATE',
    entityType: 'SHIPMENT',
    entityId: shipmentId,
    entityTitle: `Відправлення: ${data.clientName.trim()}`,
    details: {
      clientName: data.clientName.trim(),
      totalAmount,
      currency,
      advanceAmount,
      status: initialStatus,
      itemsCount: data.items.length
    }
  });

  return { success: true, shipment: shipData[0] };
}

/**
 * Редагування існуючого відправлення
 */
export async function updateShipment(shipmentId, data, user = {}) {
  if (!supabase) throw new Error("База даних не підключена");
  if (!data.clientName || !data.clientName.trim()) throw new Error("Вкажіть ПІБ клієнта");
  if (!data.items || data.items.length === 0) throw new Error("Додайте хоча б один товар");

  const { shipment } = await getShipmentById(shipmentId);
  if (!shipment) throw new Error("Відправлення не знайдено");

  const client = await findOrCreateShipmentClient({
    name: data.clientName,
    phone: data.clientPhone,
    address: data.shippingAddress,
    notes: data.notes
  });

  const currency = data.currency || shipment.currency || 'UAH';
  const totalAmount = data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.price || 0)), 0);
  const advanceAmount = data.advanceAmount !== undefined ? parseFloat(data.advanceAmount) : (parseFloat(shipment.advance_amount) || 0);
  const paidAmount = parseFloat(shipment.paid_amount) || advanceAmount;
  const debtAmount = Math.max(0, totalAmount - paidAmount);

  // Оновлюємо основний запис
  const { data: updated, error: shipErr } = await supabase
    .from('shipments')
    .update({
      client_id: client?.id || null,
      client_name: data.clientName.trim(),
      client_phone: (data.clientPhone || '').trim(),
      shipping_address: (data.shippingAddress || '').trim(),
      sender_id: data.senderId || shipment.sender_id,
      sender_name: data.senderName || shipment.sender_name,
      carrier: data.carrier || shipment.carrier,
      ttn: (data.ttn !== undefined ? data.ttn : shipment.ttn || '').trim(),
      payment_method: data.paymentMethod || shipment.payment_method,
      total_amount: totalAmount,
      currency: currency,
      advance_amount: advanceAmount,
      debt_amount: debtAmount,
      comment: data.comment !== undefined ? data.comment : shipment.comment
    })
    .eq('id', shipmentId)
    .select();

  if (shipErr) throw shipErr;

  // Оновлюємо позиції товарів
  await supabase.from('shipment_items').delete().eq('shipment_id', shipmentId);

  const itemsToInsert = [];
  for (const item of data.items) {
    const whId = item.warehouseId || data.selectedWarehouseId || data.warehouseId;
    const pName = (item.productName || item.productId || '').trim();
    if (!pName) continue;
    if (!whId) throw new Error(`Оберіть склад для товару ${pName}`);

    itemsToInsert.push({
      shipment_id: shipmentId,
      product_id: item.productId || generateUUID(),
      product_name: pName,
      product_article: item.productArticle || '',
      warehouse_id: whId,
      quantity: parseFloat(item.quantity) || 1,
      price: parseFloat(item.price || 0),
      currency: currency
    });
  }

  if (itemsToInsert.length > 0) {
    await insertShipmentItemsWithAutoRecovery(itemsToInsert);
  }

  // Запис в аудит
  logActivity({
    userEmail: user.email || 'Оператор',
    userName: user.name || 'Оператор',
    actionType: 'UPDATE',
    entityType: 'SHIPMENT',
    entityId: shipmentId,
    entityTitle: `Редагування відправлення: ${data.clientName.trim()}`,
    details: {
      action: 'UPDATE_SHIPMENT',
      totalAmount,
      currency,
      changesSummary: `Оновлено відправлення: Сума ${totalAmount.toLocaleString('uk-UA')} ${currency}`
    }
  });

  return { success: true, shipment: updated?.[0] };
}

/**
 * Підтвердження відправки (внесення ТТН та остаточне списання зі складу)
 */
export async function confirmShipmentDispatch(shipmentId, { ttn, carrier }, user = {}) {
  if (!supabase) throw new Error("База даних не підключена");

  const { shipment, items } = await getShipmentById(shipmentId);
  if (!shipment) throw new Error("Відправлення не знайдено");
  if (shipment.status === 'shipped' || shipment.status === 'paid') {
    throw new Error("Відправлення вже підтверджено");
  }

  const cleanTtn = (ttn !== undefined ? ttn : (shipment.ttn || '')).trim();
  const cleanCarrier = carrier || shipment.carrier || 'Нова Пошта';

  // 1. Проводимо складські списання для кожного товару
  for (const item of items) {
    if (!item.operation_id) {
      const opRes = await addOperation({
        date: new Date().toISOString().split('T')[0],
        warehouseId: item.warehouse_id,
        type: 'expense',
        productId: item.product_id,
        quantity: parseFloat(item.quantity),
        comment: `Відправлення ТТН: ${cleanTtn || 'без ТТН'} (${shipment.client_name})`,
        userEmail: user.email || 'Оператор'
      });
      if (opRes && opRes.operation) {
        await supabase
          .from('shipment_items')
          .update({ operation_id: opRes.operation.id })
          .eq('id', item.id);
      }
    }
  }

  // 2. Оновлюємо статус відправлення
  const isPaid = (parseFloat(shipment.debt_amount) || 0) <= 0;
  const newStatus = isPaid ? 'paid' : 'shipped';
  const { data: updated, error } = await supabase
    .from('shipments')
    .update({
      status: newStatus,
      ttn: cleanTtn,
      carrier: cleanCarrier,
      shipped_at: new Date().toISOString(),
      ...(isPaid ? { is_archived: true } : {})
    })
    .eq('id', shipmentId)
    .select();

  if (error) throw error;

  // 3. Запис в аудит
  logActivity({
    userEmail: user.email || 'Оператор',
    userName: user.name || 'Оператор',
    actionType: 'UPDATE',
    entityType: 'SHIPMENT',
    entityId: shipmentId,
    entityTitle: `Відправлення: ${shipment.client_name}`,
    details: {
      action: 'CONFIRM_DISPATCH',
      ttn: cleanTtn,
      carrier: cleanCarrier,
      status: newStatus
    }
  });

  return { success: true, shipment: updated?.[0] };
}

/**
 * Масове підтвердження відправки кількох накладних одночасно (мультивибір)
 */
export async function batchConfirmShipments(shipments = [], { carrier }, user = {}) {
  if (!shipments || shipments.length === 0) return { success: true, count: 0 };
  let confirmedCount = 0;
  const errors = [];

  for (const item of shipments) {
    const id = typeof item === 'object' ? item.id : item;
    const ttn = typeof item === 'object' ? item.ttn : undefined;
    const itemCarrier = typeof item === 'object' && item.carrier ? item.carrier : carrier;

    try {
      await confirmShipmentDispatch(id, { ttn, carrier: itemCarrier }, user);
      confirmedCount++;
    } catch (err) {
      console.error(`Failed to confirm shipment ${id}:`, err);
      errors.push({ id, message: err.message });
    }
  }

  return { success: true, count: confirmedCount, errors };
}

/**
 * Підтвердження оплати відправлення (внесення фактично отриманої суми)
 */
export async function addShipmentPayment(shipmentId, { amount, paymentMethod, comment }, user = {}) {
  if (!supabase) throw new Error("База даних не підключена");

  const { shipment } = await getShipmentById(shipmentId);
  if (!shipment) throw new Error("Відправлення не знайдено");

  const payAmount = parseFloat(amount) || 0;
  if (payAmount <= 0) throw new Error("Сума оплати повинна бути більше 0");

  const newPaidAmount = (parseFloat(shipment.paid_amount) || 0) + payAmount;
  const newDebtAmount = Math.max(0, (parseFloat(shipment.total_amount) || 0) - (parseFloat(shipment.advance_amount) || 0) - newPaidAmount);

  const isFullyPaid = newDebtAmount <= 0;
  const newStatus = isFullyPaid ? 'paid' : shipment.status;

  // 1. Вставляємо запис про платіж
  const { error: payErr } = await supabase
    .from('shipment_payments')
    .insert([{
      shipment_id: shipmentId,
      type: 'final_payment',
      amount: payAmount,
      currency: shipment.currency || 'UAH',
      payment_method: paymentMethod || shipment.payment_method || 'cod',
      comment: comment || 'Оплата відправлення',
      user_email: user.email || 'Оператор',
      user_name: user.name || 'Оператор'
    }]);

  if (payErr) throw payErr;

  // 2. Оновлюємо відправлення (з авто-відновленням якщо колонка is_archived ще не створена)
  const updatePayload = {
    paid_amount: newPaidAmount,
    debt_amount: newDebtAmount,
    status: newStatus,
    paid_at: isFullyPaid ? new Date().toISOString() : shipment.paid_at
  };
  if (isFullyPaid) {
    updatePayload.is_archived = true;
  }

  let { data: updated, error: shipErr } = await supabase
    .from('shipments')
    .update(updatePayload)
    .eq('id', shipmentId)
    .select();

  if (shipErr && (shipErr.message || '').includes('is_archived')) {
    console.warn("Column 'is_archived' missing in shipments table. Retrying update without it.");
    delete updatePayload.is_archived;
    const retryRes = await supabase
      .from('shipments')
      .update(updatePayload)
      .eq('id', shipmentId)
      .select();
    updated = retryRes.data;
    shipErr = retryRes.error;
  }

  if (shipErr) throw shipErr;

  // 3. Запис в аудит
  logActivity({
    userEmail: user.email || 'Оператор',
    userName: user.name || 'Оператор',
    actionType: 'UPDATE',
    entityType: 'SHIPMENT',
    entityId: shipmentId,
    entityTitle: `Оплата відправлення: ${shipment.client_name}`,
    details: {
      action: 'ADD_PAYMENT',
      paymentAmount: payAmount,
      newDebtAmount,
      isFullyPaid,
      status: newStatus
    }
  });

  return { success: true, shipment: updated?.[0] };
}

/**
 * Ручне архівування / розархівування відправлення
 */
export async function toggleShipmentArchive(shipmentId, isArchived, user = {}) {
  if (!supabase) throw new Error("База даних не підключена");

  let { data: updated, error } = await supabase
    .from('shipments')
    .update({ is_archived: isArchived })
    .eq('id', shipmentId)
    .select();

  if (error) {
    if ((error.message || '').includes('is_archived') || error.code === 'PGRST204') {
      throw new Error("Необхідно додати колонку 'is_archived' у Supabase. Виконайте наданий SQL-скрипт у SQL Editor.");
    }
    throw error;
  }

  logActivity({
    userEmail: user.email || 'Оператор',
    userName: user.name || 'Оператор',
    actionType: 'UPDATE',
    entityType: 'SHIPMENT',
    entityId: shipmentId,
    entityTitle: `${isArchived ? 'Перенесення в архів' : 'Повернення з архіву'} відправлення`,
    details: { action: isArchived ? 'ARCHIVE' : 'UNARCHIVE' }
  });

  return { success: true, shipment: updated?.[0] };
}

/**
 * Масове підтвердження повної оплати вибраних відправлень
 */
export async function batchAddShipmentPayments(shipmentIds = [], { paymentMethod, comment }, user = {}) {
  if (!shipmentIds || shipmentIds.length === 0) return { success: true, count: 0 };
  let count = 0;
  const errors = [];

  for (const id of shipmentIds) {
    try {
      const { shipment } = await getShipmentById(id);
      if (shipment && shipment.debt_amount > 0) {
        await addShipmentPayment(id, {
          amount: shipment.debt_amount,
          paymentMethod: paymentMethod || shipment.payment_method,
          comment: comment || 'Масове підтвердження оплати'
        }, user);
        count++;
      }
    } catch (err) {
      console.error(`Failed to pay shipment ${id}:`, err);
      errors.push({ id, message: err.message });
    }
  }

  return { success: true, count, errors };
}

/**
 * Скасування / Повернення відправлення
 */
export async function cancelShipment(shipmentId, comment = '', user = {}) {
  if (!supabase) throw new Error("База даних не підключена");

  const { shipment, items } = await getShipmentById(shipmentId);
  if (!shipment) throw new Error("Відправлення не знайдено");

  // Якщо були складські списання, створюємо прихід або видаляємо списання
  for (const item of items) {
    if (item.operation_id) {
      try {
        await supabase
          .from('operations')
          .delete()
          .eq('id', item.operation_id);
      } catch (err) {
        console.warn(`Could not delete operation ${item.operation_id}:`, err);
      }
    }
  }

  // Оновлюємо статус на cancelled
  const { data: updated, error } = await supabase
    .from('shipments')
    .update({
      status: 'cancelled',
      comment: (shipment.comment || '') + (comment ? ` [Повернення: ${comment}]` : ' [Повернено]')
    })
    .eq('id', shipmentId)
    .select();

  if (error) throw error;

  // Логування в аудит
  logActivity({
    userEmail: user.email || 'Оператор',
    userName: user.name || 'Оператор',
    actionType: 'DELETE',
    entityType: 'SHIPMENT',
    entityId: shipmentId,
    entityTitle: `Скасування відправлення: ${shipment.client_name}`,
    details: {
      action: 'CANCEL_SHIPMENT',
      comment
    }
  });

  return { success: true, shipment: updated?.[0] };
}

/**
 * Повне видалення відправлення (з очищенням товарів, платежів та складських списань)
 */
export async function deleteShipment(shipmentId, user = {}) {
  if (!supabase) throw new Error("База даних не підключена");

  const { shipment, items } = await getShipmentById(shipmentId);
  if (!shipment) throw new Error("Відправлення не знайдено");

  // 1. Видаляємо складські списання, якщо вони були створені
  for (const item of (items || [])) {
    if (item.operation_id) {
      try {
        await supabase.from('operations').delete().eq('id', item.operation_id);
      } catch (err) {
        console.warn(`Could not delete associated operation ${item.operation_id}:`, err);
      }
    }
  }

  // 2. Видаляємо товари відправлення
  await supabase.from('shipment_items').delete().eq('shipment_id', shipmentId);

  // 3. Видаляємо платежі відправлення
  await supabase.from('shipment_payments').delete().eq('shipment_id', shipmentId);

  // 4. Видаляємо саме відправлення
  const { error } = await supabase.from('shipments').delete().eq('id', shipmentId);
  if (error) throw error;

  // 5. Логування в аудит
  logActivity({
    userEmail: user.email || 'Оператор',
    userName: user.name || 'Оператор',
    actionType: 'DELETE',
    entityType: 'SHIPMENT',
    entityId: shipmentId,
    entityTitle: `Видалення відправлення: ${shipment.client_name}`,
    details: { action: 'DELETE_SHIPMENT', shipmentNumber: shipment.shipment_number }
  });

  return { success: true };
}

/**
 * Масове видалення вибраних відправлень
 */
export async function batchDeleteShipments(shipmentIds = [], user = {}) {
  if (!shipmentIds || shipmentIds.length === 0) return { success: true, count: 0 };
  let count = 0;
  const errors = [];

  for (const id of shipmentIds) {
    try {
      await deleteShipment(id, user);
      count++;
    } catch (err) {
      console.error(`Failed to delete shipment ${id}:`, err);
      errors.push({ id, message: err.message });
    }
  }

  return { success: true, count, errors };
}

