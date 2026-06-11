import { StateCreator } from 'zustand';
import { Proposal, ProposalItem, Product, SellerId } from '../../types';
import { CONFIG, SELLERS } from '../../config';
import { saveProposalToSheet, fetchProposalsHistory, deleteProposalFromSheet } from '../../services/api';

/**
 * Proposal Slice - управління пропозиціями та товарами
 */
export interface ProposalSlice {
  // State
  proposal: Proposal;
  history: Proposal[];
  selectedSeller: SellerId;

  // Actions
  addToProposal: (product: Product, quantity: number) => void;
  removeFromProposal: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemCostPrice: (itemId: string, costPrice: number) => void;
  updateItemSalePrice: (itemId: string, salePrice: number) => void;
  updateItemField: (itemId: string, field: 'name' | 'description' | 'unit', value: string) => void;
  moveItemUp: (itemId: string) => void;
  moveItemDown: (itemId: string) => void;
  clearProposal: () => void;
  saveProposal: () => Promise<boolean>;
  loadProposal: (id: string) => void;
  deleteProposal: (id: string) => Promise<void>;
  setSelectedSeller: (sellerId: SellerId) => void;
  applyProposalMarkupToItems: () => void;
  updateProposalField: (field: keyof Proposal, value: any) => void;
  updateProposalRates: (usd: number, eur: number) => void;
  syncHistory: () => Promise<void>;
  addManualItem: () => void;
}

// Helper functions
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getNextProposalNumber(history: Proposal[] = []): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  const prefix = `КП-${datePrefix}`;

  // Шукаємо всі КП за сьогодні в історії
  const todaysProposals = history.filter(p => p.number && (p.number.startsWith(prefix) || p.number.includes(datePrefix)));

  if (todaysProposals.length === 0) {
    return `${prefix}-001`;
  }

  // Знаходимо максимальний порядковий номер
  const numbers = todaysProposals.map(p => {
    const parts = p.number.split('-');
    const lastPart = parts[parts.length - 1];
    return parseInt(lastPart, 10) || 0;
  });

  const nextNumber = Math.max(...numbers) + 1;
  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

function calculateProposalTotals(proposal: Proposal): Proposal {
  const items = proposal.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  let total = subtotal;
  let vatAmount = 0;

  if (proposal.vatMode === 'add') {
    vatAmount = subtotal * 0.2;
    total = subtotal + vatAmount;
  } else if (proposal.vatMode === 'extract') {
    vatAmount = subtotal - (subtotal / 1.2);
    total = subtotal;
  } else {
    vatAmount = 0;
    total = subtotal;
  }

  // Забезпечуємо наявність продавця
  // Спробуємо знайти ID продавця (може бути в самому об'єкті або як sellerId)
  const sellerId = proposal.seller?.id || (proposal as any).sellerId || 'tov_cso';
  const seller = SELLERS[sellerId as SellerId] || proposal.seller || SELLERS.tov_cso;

  return {
    ...proposal,
    items,
    seller,
    sellerId,
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    updatedAt: proposal.updatedAt || new Date().toISOString(),
  };
}

function createEmptyProposal(history: Proposal[] = []): Proposal {
  return {
    id: generateId(),
    number: getNextProposalNumber(history),
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    items: [],
    subtotal: 0,
    markup: CONFIG.DEFAULT_MARKUP,
    adjustment: 0,
    total: 0,
    currency: 'USD',
    notes: '',
    rates: {
      usdToUah: 41.5,
      eurToUah: 51.0,
    },
    seller: SELLERS.tov_cso,
    status: 'draft',
    vatMode: 'none',
    vatAmount: 0,
    useVatPrices: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const createProposalSlice: StateCreator<
  ProposalSlice,
  [],
  [],
  ProposalSlice
> = (set, get) => ({
  // Initial State
  proposal: createEmptyProposal(),
  history: [],
  selectedSeller: 'tov_cso',

  // Actions
  addToProposal: (product: Product, quantity: number) => {
    const { proposal } = get();

    // Перевіряємо чи продукт вже є
    const existingItem = proposal.items.find(item => item.productId === product.id);

    if (existingItem) {
      // Оновлюємо кількість
      get().updateQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      // Додаємо новий товар
      const useVat = !!proposal.useVatPrices;
      const costPrice = useVat && product.priceVat !== undefined ? product.priceVat : product.price;
      const salePrice = costPrice * (1 + proposal.markup / 100) * (1 + (proposal.adjustment || 0) / 100);
      const roundedPrice = Math.round(salePrice * 10000) / 10000;

      const newItem: ProposalItem = {
        id: generateId(),
        productId: product.id,
        product,
        quantity,
        costPrice: costPrice,
        price: roundedPrice,
        total: roundedPrice * quantity,
        name: product.name,
        description: product.description || '',
        unit: product.unit,
        supplierName: product.selectedSupplier,
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
    // Використовуємо більшу точність (4 знаки), щоб мінімізувати помилки конвертації
    const roundedCost = Math.round(costPrice * 10000) / 10000;
    const updatedProposal = calculateProposalTotals({
      ...proposal,
      items: proposal.items.map(item => {
        if (item.id === itemId) {
          const salePrice = Math.round(roundedCost * (1 + proposal.markup / 100) * (1 + (proposal.adjustment || 0) / 100) * 10000) / 10000;
          return {
            ...item,
            costPrice: roundedCost,
            price: salePrice,
            total: salePrice * item.quantity
          };
        }
        return item;
      }),
    });
    set({ proposal: updatedProposal });
  },

  updateItemSalePrice: (itemId: string, salePrice: number) => {
    const { proposal } = get();
    const roundedPrice = Math.round(salePrice * 10000) / 10000;
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
    const { history, selectedSeller, settings } = get() as any;
    const newProposal = createEmptyProposal(history);
    // Зберігаємо обраного продавця при очищенні, якщо він був змінений
    newProposal.seller = SELLERS[selectedSeller as keyof typeof SELLERS] || SELLERS.tov_cso;
    
    // Зберігаємо актуальні курси з налаштувань (наприклад, з Говерли)
    if (settings && settings.usdRate && settings.eurRate) {
      newProposal.rates = {
        usdToUah: settings.usdRate,
        eurToUah: settings.eurRate,
      };
    }
    
    set({ proposal: newProposal });
  },

  saveProposal: async () => {
    const { proposal, history } = get();
    const updatedProposal = {
      ...proposal,
      status: 'sent' as const,
      updatedAt: new Date().toISOString(),
    };

    // Зберігаємо локально
    const updatedHistory = [updatedProposal, ...history.filter(p => p.id !== proposal.id)];
    set({ 
      history: updatedHistory, 
      proposal: updatedProposal,
      selectedSeller: (updatedProposal.seller?.id as SellerId) || get().selectedSeller 
    });

    // Зберігаємо на Google Sheets
    try {
      const success = await saveProposalToSheet(updatedProposal);
      return success;
    } catch (error) {
      console.error('❌ Помилка збереження на Google Sheets:', error);
      return false;
    }
  },

  loadProposal: (id: string) => {
    const { history } = get();
    const found = history.find(p => p.id === id);
    if (found) {
      // Глибоке копіювання, щоб гарантувати оновлення стану та відсутність мутацій
      const proposalCopy = JSON.parse(JSON.stringify(found));
      set({ 
        proposal: { 
          ...proposalCopy, 
          updatedAt: new Date().toISOString() 
        },
        selectedSeller: (proposalCopy.seller?.id as SellerId) || 'tov_cso'
      });
    }
  },

  syncHistory: async () => {
    // 1. Отримуємо список пропозицій з хмари (Google Sheets)
    const sheetProposals = (await fetchProposalsHistory()) as Proposal[];
    const { history: localHistory } = get();

    // 2. Визначаємо локальні пропозиції, які потрібно завантажити у хмару:
    // - вони повинні мати статус 'sent' (збережені КП)
    // - їх або взагалі немає в таблиці
    // - або локальна версія оновлена пізніше, ніж хмарна версія
    const toUpload = localHistory.filter(lp => {
      if (lp.status !== 'sent') return false;

      const sp = sheetProposals.find(s => s.id === lp.id);
      if (!sp) return true; // немає в таблиці

      const localTime = new Date(lp.updatedAt || lp.createdAt || 0).getTime();
      const sheetTime = new Date(sp.updatedAt || sp.createdAt || 0).getTime();
      return localTime > sheetTime; // локальна версія є новішою
    });

    // 3. Завантажуємо несинхронізовані КП до Google Sheets
    if (toUpload.length > 0) {
      console.log(`📤 Завантаження ${toUpload.length} несинхронізованих КП до Google Sheets...`);
      await Promise.all(toUpload.map(prop => saveProposalToSheet(prop)));
    }

    // 4. Якщо були вивантаження, повторно завантажуємо актуальний список з хмари
    let finalSheetProposals = sheetProposals;
    if (toUpload.length > 0) {
      finalSheetProposals = (await fetchProposalsHistory()) as Proposal[];
    }

    // 5. Об'єднуємо хмарні та локальні пропозиції в Map для уникнення дублікатів
    const mergedMap = new Map<string, Proposal>();
    
    // Спочатку додаємо хмарні пропозиції
    finalSheetProposals.forEach(sp => {
      mergedMap.set(sp.id, sp);
    });

    // Потім об'єднуємо з локальними пропозиціями (залишаємо новішу за часом оновлення)
    localHistory.forEach(lp => {
      const existing = mergedMap.get(lp.id);
      if (!existing) {
        mergedMap.set(lp.id, lp);
      } else {
        const localTime = new Date(lp.updatedAt || lp.createdAt || 0).getTime();
        const sheetTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        if (localTime > sheetTime) {
          mergedMap.set(lp.id, lp);
        }
      }
    });

    // 6. Перераховуємо суми для гарантії цілісності даних
    const validatedHistory = Array.from(mergedMap.values()).map(p => calculateProposalTotals(p));

    // Сортуємо від найновіших до найстаріших
    validatedHistory.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // 7. Оновлюємо стан історії
    set((state) => {
      const newState: any = { history: validatedHistory };

      // Якщо поточна пропозиція пуста (чернетка без товарів і імені клієнта),
      // оновлюємо її номер на основі отриманої історії
      if (state.proposal.items.length === 0 && !state.proposal.clientName) {
        newState.proposal = {
          ...state.proposal,
          number: getNextProposalNumber(validatedHistory)
        };
      }

      return newState;
    });
  },

  deleteProposal: async (id: string) => {
    const { history } = get();
    // 1. Оновлюємо локальний стан відразу для швидкості інтерфейсу
    set({ history: history.filter(p => p.id !== id) });
    
    // 2. Видаляємо з Google Sheets у фоні
    try {
      await deleteProposalFromSheet(id);
    } catch (error) {
      console.error('Failed to delete proposal from sheet:', error);
    }
  },

  setSelectedSeller: (sellerId: SellerId) => {
    const { proposal } = get();
    const updatedProposal = calculateProposalTotals({
      ...proposal,
      sellerId: sellerId,
      seller: SELLERS[sellerId]
    });
    set({
      selectedSeller: sellerId,
      proposal: updatedProposal,
    });
  },

  applyProposalMarkupToItems: () => {
    const { proposal } = get();
    const updatedProposal = calculateProposalTotals({
      ...proposal,
      items: proposal.items.map(item => {
        const salePrice = item.costPrice * (1 + proposal.markup / 100) * (1 + (proposal.adjustment || 0) / 100);
        const roundedPrice = Math.round(salePrice * 10000) / 10000;
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
    let updatedItems = proposal.items;
    
    if (field === 'useVatPrices') {
      const useVat = !!value;
      updatedItems = proposal.items.map(item => {
        // Fallback to product.price if priceVat is not defined
        const basePrice = useVat 
          ? (item.product.priceVat !== undefined ? item.product.priceVat : item.product.price)
          : item.product.price;
          
        const newCost = basePrice;
        const newSale = newCost * (1 + proposal.markup / 100) * (1 + (proposal.adjustment || 0) / 100);
        const roundedPrice = Math.round(newSale * 10000) / 10000;
        
        return {
          ...item,
          costPrice: newCost,
          price: roundedPrice,
          total: roundedPrice * item.quantity
        };
      });
    }

    const updatedProposal = { 
      ...proposal, 
      [field]: value, 
      items: updatedItems, 
      updatedAt: new Date().toISOString() 
    };
    set({ proposal: calculateProposalTotals(updatedProposal) });
  },

  updateProposalRates: (usd: number, eur: number) => {
    const { proposal } = get();
    // Якщо пропозиція збережена (статус 'sent'), ми не оновлюємо її курси автоматично
    if (proposal.status === 'sent') return;
    set({
      proposal: {
        ...proposal,
        rates: { usdToUah: usd, eurToUah: eur },
        updatedAt: new Date().toISOString()
      }
    });
  },
  
  addManualItem: () => {
    const { proposal } = get();
    const newItem: ProposalItem = {
      id: generateId(),
      productId: `manual_${Date.now()}`,
      product: {
        id: `manual_${Date.now()}`,
        name: 'Довільний товар',
        category: 'Інше',
        mainCategory: 'Інше',
        price: 0,
        currency: 'USD',
        unit: 'шт.',
        description: '',
      } as Product,
      quantity: 1,
      costPrice: 0,
      price: 0,
      total: 0,
      name: 'Новий товар',
      description: '',
      unit: 'шт.',
    };

    const updatedProposal = calculateProposalTotals({
      ...proposal,
      items: [...proposal.items, newItem],
    });
    set({ proposal: updatedProposal });
  },
});
