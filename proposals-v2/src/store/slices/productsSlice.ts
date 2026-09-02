import { StateCreator } from 'zustand';
import { Product, Category, SupplierStatus } from '../../types';
import { fetchAllProducts, fetchRates, isSavedProposal } from '../../services/api';
import { CONFIG } from '../../config';

const DEFAULT_SUPPLIER_STATUSES: SupplierStatus[] = [
  {
    id: 'pe',
    name: 'Правильне Електроживлення',
    code: 'ПЕ',
    status: 'online',
    count: 0,
    lastUpdated: new Date().toISOString(),
    source: 'Google Apps Script (онлайн)',
    isStale: false
  },
  {
    id: 'biz',
    name: 'Biz Solar',
    code: 'БІЗ',
    status: 'online',
    count: 0,
    lastUpdated: new Date().toISOString(),
    source: 'Прямий API Biz Solar',
    isStale: false
  },
  {
    id: 'helius',
    name: 'Helius',
    code: 'ХЕЛ',
    status: 'online',
    count: 0,
    lastUpdated: new Date().toISOString(),
    source: 'Прямий API Helius',
    isStale: false
  },
  {
    id: 'solarverse',
    name: 'Solarverse',
    code: 'СВ',
    status: 'warning',
    count: 0,
    lastUpdated: '2026-08-28T00:00:00.000Z',
    source: 'Зафіксована база (28.08.2026)',
    isStale: true,
    message: 'Доступ до Proton Drive закрито постачальником. Використовується зафіксована копія.'
  },
  {
    id: 'custom',
    name: 'Власні матеріали (CSO)',
    code: 'CSO',
    status: 'online',
    count: 0,
    lastUpdated: new Date().toISOString(),
    source: 'База CSO Solar',
    isStale: false
  }
];

/**
 * Products Slice - управління продуктами та категоріями
 */
export interface ProductsSlice {
  // State
  products: Product[];
  categories: Category[];
  supplierStatuses: SupplierStatus[];
  isRefreshingSuppliers: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  loadProducts: () => Promise<void>;
  refreshRates: (isManual?: boolean) => Promise<void>;
  refreshSupplierPrices: () => Promise<void>;
}

export const createProductsSlice: StateCreator<
  ProductsSlice,
  [],
  [],
  ProductsSlice
> = (set, get) => ({
  // Initial State
  products: [],
  categories: [],
  supplierStatuses: DEFAULT_SUPPLIER_STATUSES,
  isRefreshingSuppliers: false,
  loading: false,
  error: null,

  // Actions
  loadProducts: async () => {
    // Автоматично запускаємо оновлення курсів з Hoverla у фоновому режимі при кожному запуску додатка
    setTimeout(() => {
      const state = get() as any;
      if (typeof state.refreshRates === 'function') {
        console.log('🔄 Автоматичне фонове оновлення курсів з Hoverla на старті...');
        state.refreshRates();
      }
    }, 500);

    try {
      const CACHE_KEY = `cso-products-cache-${CONFIG.CACHE_VERSION}`;
      
      // Clear all old cache keys to free up LocalStorage space
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cso-products-cache-') && key !== CACHE_KEY) {
            localStorage.removeItem(key);
            i--;
          }
        }
      } catch (e) {
        console.warn('Error clearing old cache keys:', e);
      }

      const now = Date.now();
      const cachedData = localStorage.getItem(CACHE_KEY);

      // Допоміжний метод для тихого фонового оновлення
      const triggerBackgroundRevalidation = (cacheAge: number) => {
        // Якщо кеш свіжий (< 10 хвилин), оновлювати у фоні не потрібно
        const FRESH_CACHE_THRESHOLD = 10 * 60 * 1000; 
        if (cacheAge < FRESH_CACHE_THRESHOLD) {
          console.log('⚡ Кеш каталогу свіжий, фонове оновлення пропущено');
          return;
        }

        console.log('🔄 Кеш застарів, запускаємо фонове оновлення з GAS шлюзу...');
        setTimeout(async () => {
          try {
            const { fetchAllData } = await import('../../services/api');
            const data = await fetchAllData();
            if (data && data.products && data.products.length > 0) {
              const allProducts = [...(data.products || []), ...(data.customMaterials || [])];
              const rates = data.rates;
              const products = allProducts;
              
              const categoryOrder = ['Сонячні батареї', 'Інвертори', 'АКБ та BMS'];
              const categories = Array.from(new Set(products.map(p => p.mainCategory || 'Інше')))
                .filter(name => name.length > 0)
                .map(name => ({
                  name,
                  mainCategory: name,
                  count: products.filter(p => p.mainCategory === name).length
                }))
                .sort((a, b) => {
                  const idxA = categoryOrder.indexOf(a.name);
                  const idxB = categoryOrder.indexOf(b.name);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return a.name.localeCompare(b.name);
                });

              const customMaterials = data.customMaterials || [];
              const supplierStatuses = data.supplierStatuses || DEFAULT_SUPPLIER_STATUSES;
              try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), products, categories, rates, customMaterials, supplierStatuses }));
              } catch (storageError) {
                console.warn('⚠️ Не вдалося зберегти кеш у localStorage (переповнено):', storageError);
              }
              console.log('✅ Кеш успішно оновлено у фоновому режимі!');

              set((state: any) => {
                const newState = {
                  ...state,
                  products,
                  categories,
                  customMaterials,
                  supplierStatuses,
                };
                if (rates && rates.usd && rates.eur) {
                  newState.settings = { ...state.settings, usdRate: rates.usd, eurRate: rates.eur };
                  const historyList = state.history || [];
                  if (state.proposal && !isSavedProposal(state.proposal, historyList)) {
                    newState.proposal = { ...state.proposal, rates: { usdToUah: rates.usd, eurToUah: rates.eur } };
                  }
                  if (state.tabs && Array.isArray(state.tabs)) {
                    newState.tabs = state.tabs.map((tab: any) => {
                      if (tab.proposal && !isSavedProposal(tab.proposal, historyList)) {
                        return {
                          ...tab,
                          proposal: { ...tab.proposal, rates: { usdToUah: rates.usd, eurToUah: rates.eur } }
                        };
                      }
                      return tab;
                    });
                  }
                }
                return newState;
              });
            }
          } catch (err) {
            console.warn('⚠️ Не вдалося оновити кеш у фоновому режимі:', err);
          }
        }, 1500); // Невелика затримка, щоб не перевантажувати старт додатка
      };

      if (cachedData) {
        try {
          const cache = JSON.parse(cachedData);
          const cacheAge = now - cache.timestamp;
          
          // Ігноруємо старий кеш без поля offers
          const hasOffers = cache.products && cache.products.length > 0 && cache.products[0].offers !== undefined;
          if (!hasOffers) {
            console.log('🔄 Виявлено старий формат кешу, запускаємо повне завантаження...');
            localStorage.removeItem(CACHE_KEY);
          } else {
            // КРОК 1: Миттєво показуємо інтерфейс з кешу (0 мс завантаження!)
            console.log('✅ Миттєвий старт з кешу (вік:', Math.round(cacheAge / 1000), 'сек)');
            set((state: any) => {
              const newState = {
                ...state,
                products: cache.products,
                categories: cache.categories,
                customMaterials: cache.customMaterials || [],
                supplierStatuses: cache.supplierStatuses || DEFAULT_SUPPLIER_STATUSES,
                loading: false,
                error: null
              };
            if (cache.rates) {
              const isUsdValid = cache.rates.usd && cache.rates.usd >= 44.5;
              const isEurValid = cache.rates.eur && cache.rates.eur >= 50.0;
              const usdRate = isUsdValid ? cache.rates.usd : CONFIG.DEFAULT_USD_UAH;
              const eurRate = isEurValid ? cache.rates.eur : CONFIG.DEFAULT_EUR_UAH;

              newState.settings = { ...state.settings, usdRate, eurRate };
              const historyList = state.history || [];
              if (state.proposal && !isSavedProposal(state.proposal, historyList)) {
                newState.proposal = {
                  ...state.proposal,
                  rates: {
                    usdToUah: usdRate,
                    eurToUah: eurRate
                  }
                };
              }
              if (state.tabs && Array.isArray(state.tabs)) {
                newState.tabs = state.tabs.map((tab: any) => {
                  if (tab.proposal && !isSavedProposal(tab.proposal, historyList)) {
                    return {
                      ...tab,
                      proposal: {
                        ...tab.proposal,
                        rates: {
                          usdToUah: usdRate,
                          eurToUah: eurRate
                        }
                      }
                    };
                  }
                  return tab;
                });
              }
            }
            return newState;
          });

          // КРОК 2: Запускаємо фонове оновлення
          triggerBackgroundRevalidation(cacheAge);
          return;
          }
        } catch (e) {
          console.warn('⚠️ Помилка розбору кешу, переходимо до повного завантаження:', e);
        }
      }

      // Якщо кешу взагалі немає (найперший запуск)
      console.log('📡 Найперший запуск: повне завантаження через GAS...');
      set({ loading: true, error: null });
      
      const { fetchAllData } = await import('../../services/api');
      const data = await fetchAllData();

      if (!data) throw new Error('Дані не отримано');

      const allProducts = [...(data.products || []), ...(data.customMaterials || [])];
      if (allProducts.length === 0) {
        throw new Error('Каталог порожній');
      }

      const rates = data.rates;
      const products = allProducts;
      
      const categoryOrder = ['Сонячні батареї', 'Інвертори', 'АКБ та BMS'];
      const categories = Array.from(new Set(products.map(p => p.mainCategory || 'Інше')))
        .filter(name => name.length > 0)
        .map(name => ({
          name,
          mainCategory: name,
          count: products.filter(p => p.mainCategory === name).length
        }))
        .sort((a, b) => {
          const idxA = categoryOrder.indexOf(a.name);
          const idxB = categoryOrder.indexOf(b.name);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

      const customMaterials = data.customMaterials || [];
      const supplierStatuses = data.supplierStatuses || DEFAULT_SUPPLIER_STATUSES;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, products, categories, rates, customMaterials, supplierStatuses }));
      } catch (storageError) {
        console.warn('⚠️ Не вдалося зберегти кеш у localStorage (переповнено):', storageError);
      }
      console.log('✅ Перший запуск успішний: каталог збережено в кеш!');

      set((state: any) => {
        const newState = {
          ...state,
          products,
          categories,
          customMaterials,
          supplierStatuses,
          loading: false,
        };
        
        if (rates) {
          newState.settings = { ...state.settings, usdRate: rates.usd, eurRate: rates.eur };
          if (state.proposal) {
            newState.proposal = { ...state.proposal, rates: { usdToUah: rates.usd, eurToUah: rates.eur } };
          }
        }
        
        return newState;
      });
    } catch (error) {
      console.error('Failed to load products:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Помилка завантаження продуктів'
      });
    }
  },

  refreshRates: async () => {
    await fetchRates();
  },

  refreshSupplierPrices: async () => {
    set({ isRefreshingSuppliers: true });
    try {
      const CACHE_KEY = `cso-products-cache-${CONFIG.CACHE_VERSION}`;
      const { fetchAllData } = await import('../../services/api');
      const data = await fetchAllData();
      if (data && data.products && data.products.length > 0) {
        const allProducts = [...(data.products || []), ...(data.customMaterials || [])];
        const rates = data.rates;
        const products = allProducts;
        const customMaterials = data.customMaterials || [];
        const supplierStatuses = data.supplierStatuses || DEFAULT_SUPPLIER_STATUSES;

        const categoryOrder = ['Сонячні батареї', 'Інвертори', 'АКБ та BMS'];
        const categories = Array.from(new Set(products.map(p => p.mainCategory || 'Інше')))
          .filter(name => name.length > 0)
          .map(name => ({
            name,
            mainCategory: name,
            count: products.filter(p => p.mainCategory === name).length
          }))
          .sort((a, b) => {
            const idxA = categoryOrder.indexOf(a.name);
            const idxB = categoryOrder.indexOf(b.name);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.name.localeCompare(b.name);
          });

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            products,
            categories,
            rates,
            customMaterials,
            supplierStatuses
          }));
        } catch (storageError) {
          console.warn('Storage full', storageError);
        }

        set((state: any) => ({
          ...state,
          products,
          categories,
          customMaterials,
          supplierStatuses,
          isRefreshingSuppliers: false
        }));
      } else {
        set({ isRefreshingSuppliers: false });
      }
    } catch (e) {
      console.error('Failed to refresh supplier prices:', e);
      set({ isRefreshingSuppliers: false });
    }
  },
});
