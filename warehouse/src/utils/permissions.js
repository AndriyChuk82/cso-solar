import CONFIG from '../config';

/**
 * Парсить рядок або масив дозволів складського обліку
 * @param {Object} user - Об'єкт користувача
 * @returns {string[]} Масив дозволів
 */
export function getWarehousePermissions(user) {
  if (!user) return [];
  if (user.isAdmin) {
    return CONFIG.WAREHOUSE_PERMISSIONS.map(p => p.id).filter(id => id !== 'hide_finances');
  }

  // Якщо передано поле warehouse_access (наприклад "objects,price_list,hide_finances")
  if (user.warehouse_access !== undefined && user.warehouse_access !== null) {
    const raw = String(user.warehouse_access).trim();
    if (raw) {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  // Якщо в module_access збережено під-теги типу "wh_perm:objects" або "warehouse:objects"
  if (user.module_access) {
    const modules = String(user.module_access).split(',').map(s => s.trim());
    const subPerms = modules
      .filter(m => m.startsWith('wh_perm:') || m.startsWith('warehouse:'))
      .map(m => m.replace(/^(wh_perm:|warehouse:)/, ''));
    if (subPerms.length > 0) {
      return subPerms;
    }
  }

  // Якщо роль installer/монтажник без явних налаштувань
  const role = (user.role || '').toLowerCase();
  if (role === 'installer' || role === 'монтажник') {
    return CONFIG.PERMISSION_PRESETS.installer.permissions;
  }

  // ЗВОРОТНА СУМІСНІСТЬ: якщо це старий акаунт із доступом до складу без заданих підправ — повний доступ
  return CONFIG.PERMISSION_PRESETS.full.permissions;
}

/**
 * Перевірка, чи має користувач конкретне право у модулі Склад
 * @param {Object} user - Об'єкт користувача
 * @param {string} permissionKey - Ключ права (наприклад 'objects', 'price_list', 'journal', etc.)
 * @returns {boolean}
 */
export function canAccess(user, permissionKey) {
  if (!user) return false;
  if (user.isAdmin) return true;

  const perms = getWarehousePermissions(user);
  return perms.includes(permissionKey);
}

/**
 * Перевіряє, чи увімкнена опція приховування фінансів в об'єктах для цього користувача
 * @param {Object} user
 * @returns {boolean}
 */
export function isFinanceHidden(user) {
  if (!user) return true;
  if (user.isAdmin) return false;

  const perms = getWarehousePermissions(user);
  return perms.includes('hide_finances');
}

/**
 * Визначає стартову сторінку для користувача при заході в /warehouse/
 * @param {Object} user
 * @returns {string} Шлях для редиректу
 */
export function getDefaultWarehouseRoute(user) {
  if (!user) return '/';
  if (user.isAdmin) return '/';

  const perms = getWarehousePermissions(user);

  // Якщо доступний Журнал і це повний користувач — залишаємо / (Журнал)
  if (perms.includes('journal') && perms.includes('operations')) {
    return '/';
  }

  // Якщо доступні Об'єкти будівництва — це пріоритет №1 для монтажників / обмежених користувачів
  if (perms.includes('objects')) {
    return '/construction-objects';
  }

  // Якщо доступний Прайс-лист
  if (perms.includes('price_list')) {
    return '/price-list';
  }

  // Якщо доступні Баланси
  if (perms.includes('buyers')) {
    return '/buyers';
  }

  // Якщо доступні Відправлення
  if (perms.includes('shipments')) {
    return '/shipments';
  }

  // Якщо доступні Звіти
  if (perms.includes('reports')) {
    return '/reports';
  }

  return '/construction-objects';
}

/**
 * Перевіряє, чи увімкнена опція приховування залишків для цього користувача
 * @param {Object} user
 * @returns {boolean}
 */
export function isStocksHidden(user) {
  if (!user) return false;
  if (user.isAdmin) return false;

  const perms = getWarehousePermissions(user);
  return perms.includes('hide_stocks');
}

/**
 * Отримує ID закріпленого складу користувача (якщо є)
 * @param {Object} user
 * @returns {string|null}
 */
export function getUserWarehouseId(user) {
  if (!user) return null;
  return user.warehouse_id || user.warehouseId || null;
}

/**
 * Розраховує залишок товару з урахуванням прав та закріпленого складу користувача
 * @param {Object} item - Об'єкт товару з прайс-листа
 * @param {Object} user - Об'єкт користувача
 * @returns {{ isHidden: boolean, stock: number, warehouseName?: string, isAssignedWarehouse: boolean }}
 */
export function getItemStockForUser(item, user) {
  if (!item) return { isHidden: false, stock: 0, isAssignedWarehouse: false };

  // 1. Якщо залишки приховані
  if (isStocksHidden(user)) {
    return { isHidden: true, stock: 0, isAssignedWarehouse: false };
  }

  // 2. Якщо користувач закріплений за конкретним складом (і це не адмін)
  const userWhId = (!user?.isAdmin) ? getUserWarehouseId(user) : null;
  if (userWhId && String(userWhId).trim() !== '' && String(userWhId).trim().toLowerCase() !== 'all') {
    const cleanUserWh = String(userWhId).toLowerCase().replace(/^(м\.|м\s+|склад\s+)/g, '').trim();

    let whStock = null;
    if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
      whStock = item.warehouseStocks.find(w => {
        const wId = String(w.warehouseId || '').toLowerCase().trim();
        const wName = String(w.warehouseName || '').toLowerCase().trim();
        const cleanWName = wName.replace(/^(м\.|м\s+|склад\s+)/g, '').trim();

        return (
          wId === String(userWhId).toLowerCase().trim() ||
          wName === String(userWhId).toLowerCase().trim() ||
          (cleanUserWh && cleanWName === cleanUserWh) ||
          (cleanUserWh && wName.includes(cleanUserWh)) ||
          (cleanUserWh && cleanUserWh.includes(cleanWName))
        );
      });
    }

    const qty = whStock ? (parseFloat(whStock.quantity) || 0) : 0;
    return {
      isHidden: false,
      stock: qty,
      warehouseName: whStock?.warehouseName || userWhId,
      isAssignedWarehouse: true
    };
  }

  // 3. За замовчуванням (повний доступ до залишків усіх складів)
  return {
    isHidden: false,
    stock: parseFloat(item.totalStock) || 0,
    isAssignedWarehouse: false
  };
}

/**
 * Перевіряє, чи може користувач створювати оперативні складські транзакції (FAB кнопка)
 * @param {Object} user
 * @returns {boolean}
 */
export function canCreateWarehouseOperations(user) {
  if (!user) return false;
  if (user.isAdmin) return true;

  return canAccess(user, 'operations') || canAccess(user, 'buyers') || canAccess(user, 'shipments');
}
