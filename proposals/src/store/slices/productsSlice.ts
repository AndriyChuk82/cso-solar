import { StateCreator } from 'zustand';
import { Product, Category } from '../../types';
import { fetchAllProducts, fetchRates } from '../../services/api';

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
  refreshRates: () => Promise<void>;
}

export const createProductsSlice: StateCreator<
  ProductsSlice,
  [],
  [],
  ProductsSlice
> = (set) => ({
  // Initial State
  products: [],
  categories: [],
  loading: false,
  error: null,

  // Actions
  loadProducts: async () => {
    set({ loading: true, error: null });
    try {
      const CACHE_KEY = 'cso-products-cache';
      const CACHE_DURATION = 5 * 60 * 1000; // 5 хвилин
      const now = Date.now();
      const cachedData = localStorage.getItem(CACHE_KEY);

      if (cachedData) {
        try {
          const cache = JSON.parse(cachedData);
          const cacheAge = now - cache.timestamp;

          if (cacheAge < CACHE_DURATION) {
            console.log('✅ Завантажено з кешу (вік:', Math.round(cacheAge / 1000), 'сек)');
            set((state: any) => {
              const newState = {
                ...state,
                products: cache.products,
                categories: cache.categories,
                loading: false,
              };
              if (cache.rates) {
                newState.settings = { ...state.settings, usdRate: cache.rates.usd, eurRate: cache.rates.eur };
                if (state.proposal) {
                  newState.proposal = { ...state.proposal, rates: { usdToUah: cache.rates.usd, eurToUah: cache.rates.eur } };
                }
              }
              return newState;
            });
            return;
          }
        } catch (e) {
          console.warn('Помилка читання кешу:', e);
        }
      }

      console.log('📡 Оновлення каталогу. Завантажуємо курси та товари ПАРАЛЕЛЬНО...');
      
      const [rates, data] = await Promise.all([
        fetchRates(),
        fetchAllProducts(undefined) // Не передаємо курс, конвертуємо тут
      ]);

      const eurToUsdRate = rates ? rates.eur / rates.usd : 1.23;
      
      // Ручна конвертація EUR -> USD
      const products = data.products.map(p => {
        if (p.currency === 'EUR') {
          return { ...p, price: p.price * eurToUsdRate, currency: 'USD' };
        }
        return p;
      });
      const categories = data.categories;

      if (eurToUsdRate !== 1.23) {
        console.log(`✅ Конвертовано EUR → USD за курсом ${eurToUsdRate}`);
      }

      if (products.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, products, categories, rates }));
        console.log('✅ Дані кешовано!');
      }

      set((state: any) => {
        const newState = {
          ...state,
          products,
          categories,
          loading: false,
        };
        
        if (rates) {
          newState.settings = {
            ...state.settings,
            usdRate: rates.usd,
            eurRate: rates.eur
          };
          if (state.proposal) {
            newState.proposal = {
              ...state.proposal,
              rates: { usdToUah: rates.usd, eurToUah: rates.eur }
            };
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
