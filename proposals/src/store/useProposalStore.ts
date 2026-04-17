import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Product,
  Proposal,
  ProposalItem,
  Settings,
  Category,
  Currency,
  SellerId,
} from '../types';
import { CONFIG, SELLERS } from '../config';
import { fetchAllData, fetchRates, fetchProposalsHistory, saveProposalToSheet } from '../services/api';

// Константи для кешування
const CACHE_KEY = 'cso-products-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 хвилин

interface ProductsCache {
  timestamp: number;
  products: Product[];
  categories: Category[];
  rates: { usd: number; eur: number };
}

// Утилітна функція для очищення кешу (поза store)
export function clearProductsCache() {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Кеш продуктів очищено');
}

export interface ProposalStore {
  // State
  products: Product[];
  categories: Category[];
  proposal: Proposal;
  settings: Settings;
  history: Proposal[];
  activeCurrency: Currency;
  favorites: string[];
  customMaterials: Product[];
  deletedProductIds: string[];
  selectedSeller: SellerId;
  loading: boolean;
  error: string | null;

  // Actions
  loadProducts: () => Promise<void>;
  refreshRates: () => Promise<void>;
  syncHistory: () => Promise<void>;
  addToProposal: (product: Product, quantity: number) => void;
  removeFromProposal: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemCostPrice: (itemId: string, costPrice: number) => void;
  updateItemSalePrice: (itemId: string, salePrice: number) => void;
  updateItemField: (itemId: string, field: 'name' | 'description' | 'unit', value: string) => void;
  moveItemUp: (itemId: string) => void;
  moveItemDown: (itemId: string) => void;
  clearProposal: () => void;
  saveProposal: () => void;
  loadProposal: (id: string) => void;
  deleteProposal: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  toggleFavorite: (productId: string) => void;
  addCustomMaterial: (product: Product) => void;
  removeCustomMaterial: (productId: string) => void;
  deleteProduct: (productId: string) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  setActiveCurrency: (currency: Currency) => void;
  setSelectedSeller: (sellerId: SellerId) => void;
  applyProposalMarkupToItems: () => void;
  updateProposalField: (field: keyof Proposal, value: any) => void;
}

const createEmptyProposal = (settings?: Settings): Proposal => ({
  id: generateId(),
  number: getNextProposalNumber(),
  date: new Date().toISOString().split('T')[0],
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  clientAddress: '',
  items: [],
  subtotal: 0,
  markup: settings?.defaultMarkup ?? CONFIG.DEFAULT_MARKUP,
  total: 0,
  currency: 'USD',
  notes: '',
  rates: {
    usdToUah: settings?.usdRate ?? 41.5,
    eurToUah: settings?.eurRate ?? 51.0,
  },
  seller: SELLERS.tov_cso,
  status: 'draft',
  vatMode: 'none',
  vatAmount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getNextProposalNumber(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `КП-${year}${month}${day}-001`;
}

function calculateProposalTotals(proposal: Proposal): Proposal {
  // Ensure items have correct individual totals
  const validatedItems = (proposal.items || []).map(item => ({
    ...item,
    total: Math.round((item.price || 0) * (item.quantity || 0) * 100) / 100
  }));

  const subtotal = validatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
  
  let total = subtotal;
  let vatAmount = 0;

  if (proposal.vatMode === 'add') {
    vatAmount = subtotal * 0.2;
    total = subtotal + vatAmount;
  } else if (proposal.vatMode === 'extract') {
    // Вже враховано в subtotal, вираховуємо частину ПДВ
    vatAmount = subtotal - (subtotal / 1.2);
    total = subtotal; // Сама сума не змінюється, кажемо що вона вже з ПДВ
  } else {
    vatAmount = 0;
    total = subtotal;
  }
  
  return {
    ...proposal,
    items: validatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    updatedAt: new Date().toISOString(),
  };
}

export const useProposalStore = create<ProposalStore>()(
  persist(
    (set, get) => ({
      // Initial State
      products: [],
      categories: [],
      proposal: createEmptyProposal(),
      settings: {
        defaultMarkup: CONFIG.DEFAULT_MARKUP,
        usdRate: CONFIG.DEFAULT_USD_UAH,
        eurRate: CONFIG.DEFAULT_EUR_UAH,
        defaultSeller: 'tov_cso',
        showPrices: true,
        autoSave: true,
      },
      history: [],
      activeCurrency: 'USD',
      favorites: [],
      customMaterials: [],
      deletedProductIds: [],
      selectedSeller: 'tov_cso',
      loading: false,
      error: null,

      // Actions
      loadProducts: async () => {
        set({ loading: true, error: null });

        try {
          // Спочатку перевіряємо кеш
          const cachedData = localStorage.getItem(CACHE_KEY);
          const now = Date.now();

          if (cachedData) {
            try {
              const cache: ProductsCache = JSON.parse(cachedData);
              const cacheAge = now - cache.timestamp;

              // Якщо кеш свіжий (менше 5 хвилин) - використовуємо його
              if (cacheAge < CACHE_DURATION) {
                console.log('✅ Завантажено з кешу (вік:', Math.round(cacheAge / 1000), 'сек)');
                set({
                  products: cache.products,
                  categories: cache.categories,
                  settings: {
                    ...get().settings,
                    usdRate: cache.rates.usd,
                    eurRate: cache.rates.eur
                  },
                  loading: false
                });

                // Оновлюємо в фоні якщо кеш старіший за 2 хвилини
                if (cacheAge > 2 * 60 * 1000) {
                  console.log('🔄 Оновлюємо дані в фоні...');
                  get().loadProducts(); // Рекурсивно викликаємо але кеш вже застарів
                }
                return;
              }
            } catch (e) {
              console.warn('Помилка читання кешу:', e);
            }
          }

          // Кешу немає або він застарів - завантажуємо з сервера
          console.log('📡 Завантаження з Google Sheets...');

          const allData = await fetchAllData();

          if (allData) {
            const { rates, products: rawProducts, customMaterials } = allData;

            // Об'єднуємо продукти
            const allProducts = [...rawProducts, ...customMaterials];

            // Створюємо категорії
            const categoryMap = new Map<string, number>();
            allProducts.forEach(p => {
              const cat = p.mainCategory || 'Інше';
              categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
            });

            const categories: Category[] = Array.from(categoryMap.entries()).map(([name, count]) => ({
              name,
              mainCategory: name,
              count
            }));

            // Зберігаємо в кеш
            const cache: ProductsCache = {
              timestamp: now,
              products: allProducts,
              categories,
              rates
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

            console.log('✅ Завантажено', allProducts.length, 'товарів');

            set({
              products: allProducts,
              categories,
              settings: {
                ...get().settings,
                usdRate: rates.usd,
                eurRate: rates.eur
              },
              loading: false
            });
          } else {
            throw new Error('Не вдалося завантажити дані');
          }

        } catch (error) {
          console.error('Failed to load products:', error);

          // Fallback: використовуємо mock дані
          const mockProducts = [
            {
              id: 'mock_1',
              name: 'Сонячна панель JA Solar 550W',
              category: 'Сонячні батареї',
              mainCategory: 'Сонячні батареї',
              price: 120,
              currency: 'USD' as const,
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
              currency: 'USD' as const,
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
              currency: 'USD' as const,
              unit: 'шт',
              description: 'Літій-іонний акумулятор 4.8кВт·год',
              manufacturer: 'Pylontech',
              power: '4.8kWh',
              warranty: '10 років',
              inStock: true,
            },
          ];

          const mockCategories = [
            { name: 'Сонячні батареї', mainCategory: 'Сонячні батареї', count: 1 },
            { name: 'Інвертори', mainCategory: 'Інвертори', count: 1 },
            { name: 'АКБ та BMS', mainCategory: 'АКБ та BMS', count: 1 },
          ];

          set({
            products: mockProducts,
            categories: mockCategories,
            loading: false,
            error: 'Не вдалося завантажити дані. Використовуються тестові дані.'
          });
        }
      },

      refreshRates: async () => {
        const rates = await fetchRates();
        if (rates) {
          set((state) => ({
            settings: { ...state.settings, usdRate: rates.usd, eurRate: rates.eur }
          }));
        }
      },

      syncHistory: async () => {
        try {
          const sheetProposals = await fetchProposalsHistory();
          if (sheetProposals.length > 0) {
            set((state) => {
              // Merge with local history (prefer sheet data)
              const localIds = state.history.map(h => h.id);
              const merged = [...sheetProposals];

              // Add local proposals that are not in sheet
              state.history.forEach(lh => {
                if (!merged.find(sh => sh.id === lh.id)) {
                  merged.push(lh);
                }
              });

              // Перераховуємо кожен елемент історії, щоб заповнити можливі нулі
              const validatedHistory = merged.map(p => calculateProposalTotals(p));

              return { history: validatedHistory };
            });
          }
        } catch (error) {
          console.error('Failed to sync history:', error);
        }
      },

      addToProposal: (product: Product, quantity: number) => {
        const { proposal, settings } = get();

        // Перевіряємо чи продукт вже є
        const existingItem = proposal.items.find(item => item.productId === product.id);

        if (existingItem) {
          // Оновлюємо кількість
          get().updateQuantity(existingItem.id, existingItem.quantity + quantity);
        } else {
          // Додаємо новий товар
          const costPrice = product.price; // Собівартість = ціна з каталогу
          const salePrice = costPrice * (1 + proposal.markup / 100); // Ціна продажу з наценкою пропозиції

          const newItem: ProposalItem = {
            id: generateId(),
            productId: product.id,
            product,
            quantity,
            costPrice: costPrice,
            price: salePrice,
            total: salePrice * quantity,
            name: product.name,
            description: product.description || '',
            unit: product.unit,
          };

          const updatedProposal = calculateProposalTotals({
            ...proposal,
            items: [...proposal.items, newItem],
          });

          set({ proposal: updatedProposal });
        }
      },

      removeFromProposal: (itemId: string) => {
        const { proposal } = get();
        const updatedProposal = calculateProposalTotals({
          ...proposal,
          items: proposal.items.filter(item => item.id !== itemId),
        });
        set({ proposal: updatedProposal });
      },

      updateQuantity: (itemId: string, quantity: number) => {
        const { proposal } = get();
        const updatedProposal = calculateProposalTotals({
          ...proposal,
          items: proposal.items.map(item =>
            item.id === itemId
              ? { ...item, quantity, total: item.price * quantity }
              : item
          ),
        });
        set({ proposal: updatedProposal });
      },

      updateItemCostPrice: (itemId: string, costPrice: number) => {
        const { proposal } = get();
        const roundedCost = Math.round(costPrice * 100) / 100;
        const updatedProposal = calculateProposalTotals({
          ...proposal,
          items: proposal.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                costPrice: roundedCost,
              };
            }
            return item;
          }),
        });
        set({ proposal: updatedProposal });
      },

      updateItemSalePrice: (itemId: string, salePrice: number) => {
        const { proposal } = get();
        const roundedPrice = Math.round(salePrice * 100) / 100;
        const updatedProposal = calculateProposalTotals({
          ...proposal,
          items: proposal.items.map(item =>
            item.id === itemId
              ? { ...item, price: roundedPrice, total: roundedPrice * item.quantity }
              : item
          ),
        });
        set({ proposal: updatedProposal });
      },

      updateItemField: (itemId: string, field: 'name' | 'description' | 'unit', value: string) => {
        const { proposal } = get();
        set({
          proposal: {
            ...proposal,
            items: proposal.items.map(item =>
              item.id === itemId ? { ...item, [field]: value } : item
            ),
          },
        });
      },

      moveItemUp: (itemId: string) => {
        const { proposal } = get();
        const index = proposal.items.findIndex(item => item.id === itemId);
        if (index > 0) {
          const newItems = [...proposal.items];
          [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
          set({ proposal: { ...proposal, items: newItems } });
        }
      },

      moveItemDown: (itemId: string) => {
        const { proposal } = get();
        const index = proposal.items.findIndex(item => item.id === itemId);
        if (index < proposal.items.length - 1) {
          const newItems = [...proposal.items];
          [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
          set({ proposal: { ...proposal, items: newItems } });
        }
      },

      clearProposal: () => {
        set({ proposal: createEmptyProposal(get().settings) });
      },

      saveProposal: async () => {
        const { proposal, history, settings } = get();
        
        // Перераховуємо перед збереженням
        const finalizedProposal = calculateProposalTotals({
          ...proposal,
          // Якщо рейтів немає (старі дані), беремо з налаштувань. Якщо є - зберігаємо як є.
          rates: {
            usdToUah: proposal.rates?.usdToUah || settings.usdRate,
            eurToUah: proposal.rates?.eurToUah || settings.eurRate,
          },
          updatedAt: new Date().toISOString(),
        });

        const updatedHistory = [finalizedProposal, ...history.filter(p => p.id !== proposal.id)];
        set({ history: updatedHistory, proposal: finalizedProposal });
        
        try {
          await saveProposalToSheet(finalizedProposal);
        } catch (error) {
          console.error('Failed to save to cloud:', error);
        }
      },

      loadProposal: (id: string) => {
        const { history } = get();
        const found = history.find(p => p.id === id);
        if (found) {
          // При завантаженні робимо перерахунок, щоб переконатися, що total не 0
          const revalidated = calculateProposalTotals(found);
          set({ proposal: { ...revalidated, updatedAt: new Date().toISOString() } });
        }
      },

      deleteProposal: (id: string) => {
        const { history } = get();
        set({ history: history.filter(p => p.id !== id) });
      },

      updateSettings: (newSettings: Partial<Settings>) => {
        const { settings } = get();
        set({ settings: { ...settings, ...newSettings } });
      },

      toggleFavorite: (productId: string) => {
        const { favorites } = get();
        const isFavorite = favorites.includes(productId);
        set({
          favorites: isFavorite
            ? favorites.filter(id => id !== productId)
            : [...favorites, productId],
        });
      },

      addCustomMaterial: (product: Product) => {
        const { customMaterials } = get();
        set({ customMaterials: [...customMaterials, product] });
      },

      removeCustomMaterial: (productId: string) => {
        const { customMaterials } = get();
        set({ customMaterials: customMaterials.filter(p => p.id !== productId) });
      },

      deleteProduct: (productId: string) => {
        const { customMaterials, deletedProductIds } = get();
        set({
          customMaterials: customMaterials.filter(p => p.id !== productId),
          deletedProductIds: [...deletedProductIds, productId]
        });
      },

      updateProduct: (productId: string, updates: Partial<Product>) => {
        set((state) => {
          // Оновлюємо в products (товари з Google Sheets)
          const updatedProducts = state.products.map(p =>
            p.id === productId ? { ...p, ...updates } : p
          );

          // Оновлюємо в customMaterials (локальні товари)
          const updatedCustomMaterials = state.customMaterials.map(p =>
            p.id === productId ? { ...p, ...updates } : p
          );

          return {
            products: updatedProducts,
            customMaterials: updatedCustomMaterials,
          };
        });
      },

      setActiveCurrency: (currency: Currency) => {
        set({ activeCurrency: currency });
      },

      setSelectedSeller: (sellerId: SellerId) => {
        const { proposal } = get();
        set({
          selectedSeller: sellerId,
          proposal: { ...proposal, seller: SELLERS[sellerId] },
        });
      },

      applyProposalMarkupToItems: () => {
        const { proposal } = get();
        const updatedProposal = calculateProposalTotals({
          ...proposal,
          items: proposal.items.map(item => {
            const salePrice = item.costPrice * (1 + proposal.markup / 100);
            const roundedPrice = Math.round(salePrice * 10) / 10;
            return {
              ...item,
              price: roundedPrice,
              total: roundedPrice * item.quantity
            };
          })
        });
        set({ proposal: updatedProposal });
      },

      updateProposalField: (field: keyof Proposal, value: any) => {
        const { proposal } = get();
        const updatedProposal = { ...proposal, [field]: value, updatedAt: new Date().toISOString() };
        set({ proposal: calculateProposalTotals(updatedProposal) });
      },
    }),
    {
      name: 'cso-proposals-storage',
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
        favorites: state.favorites,
        customMaterials: state.customMaterials,
        deletedProductIds: state.deletedProductIds,
        selectedSeller: state.selectedSeller,
        proposal: state.proposal, //Persist current proposal too
      }),
    }
  )
);
