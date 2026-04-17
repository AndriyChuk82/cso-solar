import { StateCreator } from 'zustand';
import { Proposal, ProposalItem, Product, SellerId } from '../../types';
import { CONFIG, SELLERS } from '../../config';
import { saveProposalToSheet, fetchProposalsHistory } from '../../services/api';

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
  deleteProposal: (id: string) => void;
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

function getNextProposalNumber(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `КП-${year}${month}${day}-001`;
}

function calculateProposalTotals(proposal: Proposal): Proposal {
  const subtotal = proposal.items.reduce((sum, item) => sum + item.total, 0);

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

  return {
    ...proposal,
    subtotal,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    updatedAt: new Date().toISOString(),
  };
}

function createEmptyProposal(): Proposal {
  return {
    id: generateId(),
    number: getNextProposalNumber(),
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    items: [],
    subtotal: 0,
    markup: CONFIG.DEFAULT_MARKUP,
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
      const costPrice = product.price;
      const salePrice = costPrice * (1 + proposal.markup / 100);

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
    // Використовуємо більшу точність (4 знаки), щоб мінімізувати помилки конвертації
    const roundedCost = Math.round(costPrice * 10000) / 10000;
    const updatedProposal = calculateProposalTotals({
      ...proposal,
      items: proposal.items.map(item => {
        if (item.id === itemId) {
          const salePrice = Math.round(roundedCost * (1 + proposal.markup / 100) * 10000) / 10000;
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
    set({ proposal: createEmptyProposal() });
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
    set({ history: updatedHistory, proposal: updatedProposal });

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
        } 
      });
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

          return { history: merged };
        });
      }
    } catch (error) {
      console.error('Failed to sync history:', error);
    }
  },

  deleteProposal: (id: string) => {
    const { history } = get();
    set({ history: history.filter(p => p.id !== id) });
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
    const updatedProposal = { ...proposal, [field]: value, updatedAt: new Date().toISOString() };
    set({ proposal: calculateProposalTotals(updatedProposal) });
  },

  updateProposalRates: (usd: number, eur: number) => {
    const { proposal } = get();
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
