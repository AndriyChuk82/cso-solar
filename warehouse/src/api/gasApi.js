
// Кеш імен користувачів за email
export const usersMapCache = {
  'andros@cso': 'Андрій Чикайло',
  'misha@cso': 'Михайло Юркевич',
  'yura@cso': 'Юра Пастушок',
  'andriy@cso': 'Андрій Чикайло',
  'dev@test.com': 'Dev User'
};

export async function fetchUsersMap() {
  try {
    const res = await getUsers();
    if (res && res.users) {
      res.users.forEach(u => {
        if (u.email && u.name) {
          usersMapCache[u.email.toLowerCase()] = u.name;
        }
      });
    }
  } catch (e) {
    console.warn("Could not fetch users map", e);
  }
  return usersMapCache;
}

const STATIC_USER_MAP = {
  'misha@cso': 'Михайло Юркевич',
  'misha@cso.solar': 'Михайло Юркевич',
  'andros@cso': 'Андрій Чикайло',
  'andros@cso.solar': 'Андрій Чикайло',
  'yura@cso': 'Юра Пастушок',
  'yura@cso.solar': 'Юра Пастушок',
  'misha': 'Михайло Юркевич',
  'andros': 'Андрій Чикайло',
  'yura': 'Юра Пастушок'
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
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
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
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });
    const response = await fetch(url.toString(), { method: 'GET', headers: { 'Content-Type': 'text/plain' } });
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
      userEmail: 'Оператор',
      userName: 'Оператор',
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
  if (filters.type) operations = operations.filter(op => op.type === filters.type);
  if (filters.dateFrom) operations = operations.filter(op => op.date >= filters.dateFrom);
  if (filters.dateTo) operations = operations.filter(op => op.date <= filters.dateTo);

  // Сортуємо в зворотному порядку для відображення
  const displayOps = [...operations].reverse();

  return { success: true, operations: displayOps, rawOperations: operations };
}

export async function addOperation(operation) {
  if (!supabase) throw new Error('База даних не підключена');
  const timestamp = new Date().toISOString();
  let items = [];
  if (operation.type === 'transfer') {
    const tid = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    operation.items.forEach(item => {
      items.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()), date: operation.date, type: 'expense', product_id: item.productId, warehouse_id: operation.warehouseFrom, quantity: item.quantity, comment: operation.comment, user_email: operation.user, transfer_id: tid, created_at: timestamp });
      items.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()), date: operation.date, type: 'income', product_id: item.productId, warehouse_id: operation.warehouseTo, quantity: item.quantity, comment: operation.comment, user_email: operation.user, transfer_id: tid, created_at: timestamp });
    });
  } else {
    operation.items.forEach(item => {
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
        user_email: operation.user, 
        created_at: timestamp 
      });
    });
  }
  const { error } = await supabase.from('operations').insert(items);
  if (error) throw error;
  return { success: true };
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

  const { data: txs, error: tErr } = await supabase.from('buyer_transactions').select('buyer_id, type, amount, currency, status, is_archived');
  if (tErr) throw tErr;

  const balanceMap = {};
  buyers.forEach(b => {
    balanceMap[b.id] = { uah: 0, usd: 0, pendingCount: 0, reservedCount: 0 };
  });

  txs.forEach(t => {
    if (!balanceMap[t.buyer_id]) return;
    if (t.is_archived === true) return; // Ігноруємо архівні транзакції для активного балансу
    if (t.status === 'reserved') {
      balanceMap[t.buyer_id].reservedCount += 1;
      return; // Ігноруємо резерви для активного балансу
    }
    if (t.status === 'pending_price') {
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
    }))
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
      userEmail: 'Оператор',
      userName: 'Оператор',
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
    let opItems = [];
    if (!isReserved) {
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
      operation_id: isReserved ? null : opItems[idx].id
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
      let opItems = [];
      if (!isReserved) {
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
        operation_id: isReserved ? null : opItems[idx].id
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

  if (!cleanEmail) {
    try {
      const cached = localStorage.getItem('cso_user');
      if (cached) {
        const u = JSON.parse(cached);
        cleanEmail = u.email;
        cleanName = u.name;
      }
    } catch (e) {}
  }

  const displayName = formatUserName(cleanName || cleanEmail);

  const logEntry = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    created_at: new Date().toISOString(),
    user_email: userEmail || 'Система / Невідомо',
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
