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
  
  const { data: ops, error: opsErr } = await supabase.from('operations').select('*').order('date', { ascending: true }).order('created_at', { ascending: true });
  const { data: prods } = await supabase.from('products').select('*');
  const { data: whs } = await supabase.from('warehouses').select('*');

  if (opsErr) throw opsErr;

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
    
    let finalWhId = String(op.warehouse_id || '').trim();
    let finalProdId = String(op.product_id || '').trim();

    // Ігноруємо записи без ID товару для розрахунку залишків та відображення
    if (!finalProdId) return null;

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
      user_name: op.user_email || '—',
      balance_after: runningBalances[key] || 0,
      category: prodMap[finalProdId]?.category_id || ''
    };
  }).filter(Boolean);

  if (filters.warehouseId) operations = operations.filter(op => String(op.warehouse_id).trim() === String(filters.warehouseId).trim());
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
      items.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()), date: operation.date, type: operation.type, product_id: item.productId, warehouse_id: operation.warehouseId, quantity: item.quantity, comment: operation.comment, user_email: operation.user, created_at: timestamp });
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
        quantity: 0 
      };
    }
    const qty = parseFloat(op.quantity) || 0;
    if (op.type === 'income' || op.type === 'balance') finalBalances[op.product_id].quantity += qty;
    if (op.type === 'expense') finalBalances[op.product_id].quantity -= qty;
  });
  return { 
    success: true, 
    items: Object.values(finalBalances).filter(b => b.quantity !== 0),
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
    date: data.date, type: 'balance', user: data.user, warehouseId: data.warehouseId,
    comment: `📦 Коригування залишків (Підсумок дня ${data.date})`,
    items: data.items.map(item => ({ productId: item.product_id, quantity: item.diff }))
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
