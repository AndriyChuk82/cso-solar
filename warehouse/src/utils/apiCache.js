/**
 * API Cache utility для кешування відповідей від Google Sheets API
 * Зменшує кількість запитів та пришвидшує роботу додатку
 */

class ApiCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Генерує ключ кешу на основі action та params
   */
  generateKey(action, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    return `${action}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Перевіряє чи є валідні дані в кеші
   */
  get(action, params = {}, ttl = 60000) {
    const key = this.generateKey(action, params);
    const timestamp = this.timestamps.get(key);

    if (!timestamp) return null;

    const age = Date.now() - timestamp;
    if (age > ttl) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Зберігає дані в кеш
   */
  set(action, params = {}, data) {
    const key = this.generateKey(action, params);
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Інвалідує кеш для певного action або всього кешу
   */
  invalidate(action = null, params = null) {
    if (!action) {
      this.cache.clear();
      this.timestamps.clear();
      return;
    }

    if (params) {
      const key = this.generateKey(action, params);
      this.cache.delete(key);
      this.timestamps.delete(key);
      return;
    }

    // Інвалідувати всі ключі що починаються з action
    const prefix = `${action}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }

  /**
   * Дедуплікація запитів - якщо той самий запит вже виконується, повертає той самий Promise
   */
  async deduplicate(action, params, requestFn) {
    const key = this.generateKey(action, params);

    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Очищає застарілі записи (старіші за 5 хвилин)
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 хвилин

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > maxAge) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }

  /**
   * Отримує статистику кешу
   */
  getStats() {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const apiCache = new ApiCache();

// Автоматичне очищення кешу кожні 2 хвилини
setInterval(() => apiCache.cleanup(), 2 * 60 * 1000);

/**
 * TTL конфігурація для різних типів запитів (в мілісекундах)
 */
export const CACHE_TTL = {
  // Довгий кеш (5 хвилин) - дані що рідко змінюються
  CATALOG: 5 * 60 * 1000,
  WAREHOUSES: 5 * 60 * 1000,
  CATEGORIES: 5 * 60 * 1000,
  USERS: 5 * 60 * 1000,

  // Середній кеш (2 хвилини) - дані що змінюються періодично
  OPERATIONS: 2 * 60 * 1000,
  BALANCES: 2 * 60 * 1000,

  // Короткий кеш (30 секунд) - дані що часто змінюються
  STOCK_REPORT: 30 * 1000,
  DAILY_BALANCE: 30 * 1000,

  // Без кешу - для мутацій
  NONE: 0
};

/**
 * Правила інвалідації кешу після мутацій
 */
export const INVALIDATION_RULES = {
  addProduct: ['getCatalog'],
  updateProduct: ['getCatalog'],
  archiveProduct: ['getCatalog'],

  addWarehouse: ['getWarehouses'],
  updateWarehouse: ['getWarehouses'],

  addOperation: ['getOperations', 'getBalances', 'getStockReport'],
  updateOperation: ['getOperations', 'getBalances', 'getStockReport'],
  deleteOperation: ['getOperations', 'getBalances', 'getStockReport'],

  submitDailyBalance: ['getDailyBalanceData', 'getBalances'],

  addCategory: ['getCategories'],
  updateCategory: ['getCategories'],

  addUser: ['getUsers'],
  updateUser: ['getUsers']
};
