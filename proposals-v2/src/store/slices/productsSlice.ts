import { StateCreator } from 'zustand';
import { Product, Category } from '../../types';
import { fetchAllProducts, fetchRates } from '../../services/api';
import { CONFIG } from '../../config';

/**
 * Products Slice - управління продуктами та категоріями
 */
export interface ProductsSlice {
  // State
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;

  // Actions
  loadProducts: () => Promise<void>;
  refreshRates: (isManual?: boolean) => Promise<void>;
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
              try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), products, categories, rates, customMaterials }));
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
                };
                if (rates && rates.usd && rates.eur) {
                  newState.settings = { ...state.settings, usdRate: rates.usd, eurRate: rates.eur };
                  if (state.proposal) {
                    newState.proposal = { ...state.proposal, rates: { usdToUah: rates.usd, eurToUah: rates.eur } };
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
                loading: false,
                error: null
              };
            if (cache.rates) {
              newState.settings = { ...state.settings, usdRate: cache.rates.usd, eurRate: cache.rates.eur };
              if (state.proposal) {
                newState.proposal = { ...state.proposal, rates: { usdToUah: cache.rates.usd, eurToUah: cache.rates.eur } };
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
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, products, categories, rates, customMaterials }));
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
      console.error('Failed to load products, using mock data:', error);
      
      // Mock дані для тестування
      const mockProducts: Product[] = [
        {
          id: 'mock_1',
          name: 'Сонячна панель JA Solar 550W',
          category: 'Сонячні батареї',
          mainCategory: 'Сонячні батареї',
          price: 120,
          currency: 'USD',
          unit: 'шт',
          description: 'Монокристалічна панель 550Вт',
          manufacturer: 'JA Solar',
          power: '550W',
          warranty: '25 років',
          inStock: true,
        },
        {
          id: 'mock_2',
          name: 'Інвертор Growatt 10kW',
          category: 'Гібридні інвертори',
          mainCategory: 'Інвертори',
          price: 850,
          currency: 'USD',
          unit: 'шт',
          description: 'Гібридний інвертор 10кВт',
          manufacturer: 'Growatt',
          power: '10kW',
          warranty: '10 років',
          inStock: true,
        },
        {
          id: 'mock_3',
          name: 'Акумулятор Pylontech US5000',
          category: 'АКБ',
          mainCategory: 'АКБ та BMS',
          price: 1200,
          currency: 'USD',
          unit: 'шт',
          description: 'Літій-іонний акумулятор 4.8кВт·год',
          manufacturer: 'Pylontech',
          power: '4.8kWh',
          warranty: '10 років',
          inStock: true,
        },
      ];

      const mockCategories: Category[] = [
        { name: 'Сонячні батареї', mainCategory: 'Сонячні батареї', count: 1 },
        { name: 'Інвертори', mainCategory: 'Інвертори', count: 1 },
        { name: 'АКБ та BMS', mainCategory: 'АКБ та BMS', count: 1 },
      ];

      set({
        products: mockProducts,
        categories: mockCategories,
        loading: false,
        error: null
      });
    }
  },

  refreshRates: async () => {
    const rates = await fetchRates();
    // Rates будуть оновлені в settingsSlice
    // Тут просто тригеримо оновлення
  },
});
