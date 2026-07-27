import { StateCreator } from 'zustand';
import { Proposal, ProposalItem, Product, SellerId, SupplierOffer, ProposalTab } from '../../types';
import { CONFIG, SELLERS } from '../../config';
import { saveProposalToSheet, fetchProposalsHistory, deleteProposalFromSheet, normalizeProposal, isSavedProposal } from '../../services/api';
import { toast } from 'sonner';

/**
 * Proposal Slice - управління пропозиціями та товарами
 */
export interface ProposalSlice {
  // State
  proposal: Proposal;
  tabs: ProposalTab[];
  activeTabId: string;
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
  reorderItems: (startIndex: number, endIndex: number) => void;
  clearProposal: () => void;
  saveProposal: () => Promise<boolean>;
  loadProposal: (id: string) => void;
  deleteProposal: (id: string) => Promise<void>;
  setSelectedSeller: (sellerId: SellerId) => void;
  applyProposalMarkupToItems: () => void;
  updateProposalField: (field: keyof Proposal, value: any) => void;
  updateProposalRates: (usd: number, eur: number, isManual?: boolean) => void;
  syncHistory: () => Promise<void>;
  addManualItem: () => void;
  createTab: (proposal?: Proposal) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
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

function createEmptyProposal(history: Proposal[] = [], rates?: { usdToUah: number; eurToUah: number }): Proposal {
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
    rates: rates || {
      usdToUah: CONFIG.DEFAULT_USD_UAH,
      eurToUah: CONFIG.DEFAULT_EUR_UAH,
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

function updateActiveTabProposal(
  tabs: ProposalTab[],
  activeTabId: string,
  updatedProposal: Proposal,
  history: Proposal[]
): Partial<ProposalSlice> {
  const finalizedProposal = calculateProposalTotals(updatedProposal);

  let title = 'Нова КП';
  if (finalizedProposal.clientName.trim()) {
    title = `КП - ${finalizedProposal.clientName.trim()}`;
  } else if (finalizedProposal.number) {
    title = finalizedProposal.number;
  }

  const savedVersion = history.find(p => p.id === finalizedProposal.id);
  let isUnsaved = false;
  if (savedVersion) {
    const activeStr = JSON.stringify({
      clientName: finalizedProposal.clientName,
      clientPhone: finalizedProposal.clientPhone,
      clientEmail: finalizedProposal.clientEmail,
      clientAddress: finalizedProposal.clientAddress,
      notes: finalizedProposal.notes,
      vatMode: finalizedProposal.vatMode,
      markup: finalizedProposal.markup,
      adjustment: finalizedProposal.adjustment,
      currency: finalizedProposal.currency,
      rates: finalizedProposal.rates,
      useVatPrices: finalizedProposal.useVatPrices,
      sellerId: finalizedProposal.sellerId || finalizedProposal.seller?.id,
      items: finalizedProposal.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        costPrice: i.costPrice,
        price: i.price,
        name: i.name,
        description: i.description,
        unit: i.unit,
        supplierName: i.supplierName
      }))
    });
    const savedStr = JSON.stringify({
      clientName: savedVersion.clientName,
      clientPhone: savedVersion.clientPhone,
      clientEmail: savedVersion.clientEmail,
      clientAddress: savedVersion.clientAddress,
      notes: savedVersion.notes,
      vatMode: savedVersion.vatMode,
      markup: savedVersion.markup,
      adjustment: savedVersion.adjustment,
      currency: savedVersion.currency,
      rates: savedVersion.rates,
      useVatPrices: savedVersion.useVatPrices,
      sellerId: savedVersion.sellerId || savedVersion.seller?.id,
      items: savedVersion.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        costPrice: i.costPrice,
        price: i.price,
        name: i.name,
        description: i.description,
        unit: i.unit,
        supplierName: i.supplierName
      }))
    });
    isUnsaved = activeStr !== savedStr;
  } else {
    isUnsaved = finalizedProposal.items.length > 0 || !!finalizedProposal.clientName.trim();
  }

  const updatedTabs = tabs.map(tab => {
    if (tab.id === activeTabId) {
      return {
        ...tab,
        title,
        proposal: finalizedProposal,
        isUnsaved
      };
    }
    return tab;
  });

  return {
    proposal: finalizedProposal,
    tabs: updatedTabs
  };
}

function convertPriceToUsd(
  amount: number,
  currency: 'USD' | 'EUR' | 'UAH',
  rates?: { usdToUah: number; eurToUah: number }
): number {
  if (!amount || currency === 'USD') return amount;
  
  const usdToUah = rates?.usdToUah || 41.5;
  const eurToUah = rates?.eurToUah || 51.0;
  
  if (currency === 'UAH') {
    return amount / usdToUah;
  }
  if (currency === 'EUR') {
    return (amount * eurToUah) / usdToUah;
  }
  
  return amount;
}

function formatCurrencySymbol(amount: number, currency: 'USD' | 'EUR' | 'UAH'): string {
  const rounded = Math.round(amount * 100) / 100;
  const formatted = rounded.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (currency === 'USD') return `$${formatted}`;
  if (currency === 'EUR') return `€${formatted}`;
  if (currency === 'UAH') return `${formatted} грн`;
  return `${formatted} ${currency}`;
}

export const createProposalSlice: StateCreator<
  ProposalSlice,
  [],
  [],
  ProposalSlice
> = (set, get) => {
  const initialProposal = createEmptyProposal();
  return {
    // Initial State
    proposal: initialProposal,
    tabs: [{ id: initialProposal.id, title: 'Нова КП', proposal: initialProposal, isUnsaved: false }],
    activeTabId: initialProposal.id,
    history: [],
    selectedSeller: 'tov_cso',

    // Actions
    addToProposal: (product: Product, quantity: number) => {
      const state = get() as any;
      const { proposal } = state;

      // Перевіряємо чи продукт вже є
      const existingItem = proposal.items.find((item: ProposalItem) => item.productId === product.id);

      if (existingItem) {
        // Оновлюємо кількість
        get().updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        // Додаємо новий товар
        const useVat = !!proposal.useVatPrices;
        
        let activePrice = product.price;
        let activePriceVat = product.priceVat;
        let activeSupplier = product.selectedSupplier;

        if (!product.isManualSupplier && product.offers && product.offers.length > 0) {
          const inStockOffers = product.offers.filter((o: SupplierOffer) => o.inStock !== false);
          const baseOffers = inStockOffers.length > 0 ? inStockOffers : product.offers;
          let bestOffer = baseOffers[0];
          
          if (useVat) {
            const vatOffers = baseOffers.filter((o: SupplierOffer) => o.priceVat !== undefined && o.priceVat !== null);
            if (vatOffers.length > 0) {
              bestOffer = vatOffers.reduce((min: SupplierOffer, o: SupplierOffer) => o.priceVat! < min.priceVat! ? o : min, vatOffers[0]);
            } else {
              bestOffer = baseOffers.reduce((min: SupplierOffer, o: SupplierOffer) => o.price < min.price ? o : min, baseOffers[0]);
            }
          } else {
            bestOffer = baseOffers.reduce((min: SupplierOffer, o: SupplierOffer) => o.price < min.price ? o : min, baseOffers[0]);
          }
          
          activePrice = bestOffer.price;
          activePriceVat = bestOffer.priceVat;
          activeSupplier = bestOffer.supplierName;
        }

        const costPrice = useVat && activePriceVat !== undefined && activePriceVat !== null ? activePriceVat : activePrice;
        const usdCostPrice = convertPriceToUsd(costPrice, product.currency || 'USD', proposal.rates);
        const usdPrice = convertPriceToUsd(activePrice, product.currency || 'USD', proposal.rates);
        const usdPriceVat = activePriceVat !== undefined && activePriceVat !== null 
          ? convertPriceToUsd(activePriceVat, product.currency || 'USD', proposal.rates) 
          : undefined;

        const salePrice = usdCostPrice * (1 + proposal.markup / 100) * (1 + (proposal.adjustment || 0) / 100);
        let roundedPrice = Math.round(salePrice * 10000) / 10000;

        // ===== Підстановка ціни клієнта =====
        const clientEntry = (() => {
          if (!proposal.clientName || !state.getClientByName || !state.getClientPriceForProduct) return null;
          const client = state.getClientByName(proposal.clientName);
          if (!client) return null;
          return state.getClientPriceForProduct(client.id, product.id);
        })();

        if (clientEntry) {
          roundedPrice = clientEntry.price;
          toast.info(`🔖 Ціна клієнта підставлена: $${clientEntry.price.toFixed(2)}`, {
            description: `${product.name.substring(0, 50)} · джерело: ${clientEntry.source === 'kp' ? `КП ${clientEntry.sourceKpNumber}` : 'вручну'}`,
            duration: 4000,
          });
        }
        // ====================================

        const finalDescription = product.description || '';

        const newItem: ProposalItem = {
          id: generateId(),
          productId: product.id,
          product: {
            ...product,
            price: activePrice,
            priceVat: activePriceVat,
            selectedSupplier: activeSupplier
          },
          quantity,
          costPrice: usdCostPrice,
          price: roundedPrice,
          total: roundedPrice * quantity,
          name: product.name,
          description: finalDescription,
          unit: product.unit,
          supplierName: activeSupplier,
        };

        const updatedProposal = {
          ...proposal,
          items: [...proposal.items, newItem],
        };

        set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
      }
    },

    removeFromProposal: (itemId: string) => {
      const { proposal } = get();
      const updatedProposal = {
        ...proposal,
        items: proposal.items.filter(item => item.id !== itemId),
      };
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
    },

    updateQuantity: (itemId: string, quantity: number) => {
      const { proposal } = get();
      const updatedProposal = {
        ...proposal,
        items: proposal.items.map(item =>
          item.id === itemId
            ? { ...item, quantity, total: item.price * quantity }
            : item
        ),
      };
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
    },

    updateItemCostPrice: (itemId: string, costPrice: number) => {
      const { proposal } = get();
      const roundedCost = Math.round(costPrice * 10000) / 10000;
      const updatedProposal = {
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
      };
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
    },

    updateItemSalePrice: (itemId: string, salePrice: number) => {
      const { proposal } = get();
      const roundedPrice = Math.round(salePrice * 10000) / 10000;
      const updatedProposal = {
        ...proposal,
        items: proposal.items.map(item =>
          item.id === itemId
            ? { ...item, price: roundedPrice, total: roundedPrice * item.quantity }
            : item
        ),
      };
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
    },

    updateItemField: (itemId: string, field: 'name' | 'description' | 'unit', value: string) => {
      const { proposal } = get();
      const updatedProposal = {
        ...proposal,
        items: proposal.items.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      };
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
    },

    moveItemUp: (itemId: string) => {
      const { proposal } = get();
      const index = proposal.items.findIndex(item => item.id === itemId);
      if (index > 0) {
        const newItems = [...proposal.items];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        const updatedProposal = { ...proposal, items: newItems };
        set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
      }
    },

    moveItemDown: (itemId: string) => {
      const { proposal } = get();
      const index = proposal.items.findIndex(item => item.id === itemId);
      if (index < proposal.items.length - 1) {
        const newItems = [...proposal.items];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        const updatedProposal = { ...proposal, items: newItems };
        set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
      }
    },

    reorderItems: (startIndex: number, endIndex: number) => {
      const { proposal } = get();
      const newItems = [...proposal.items];
      const [removed] = newItems.splice(startIndex, 1);
      newItems.splice(endIndex, 0, removed);
      const updatedProposal = { ...proposal, items: newItems };
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
    },

    clearProposal: () => {
      const { history, selectedSeller, settings, proposal } = get() as any;
      const rates = settings && settings.usdRate && settings.eurRate 
        ? { usdToUah: settings.usdRate, eurToUah: settings.eurRate } 
        : undefined;
      const newProposal = createEmptyProposal(history, rates);
      newProposal.id = proposal.id;
      newProposal.seller = SELLERS[selectedSeller as keyof typeof SELLERS] || SELLERS.tov_cso;
      
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, newProposal, state.history));
    },

    saveProposal: async () => {
      const { proposal, history, tabs, activeTabId } = get();
      const updatedProposal = {
        ...proposal,
        status: 'sent' as const,
        updatedAt: new Date().toISOString(),
      };

      const finalizedProposal = calculateProposalTotals(updatedProposal);
      const updatedHistory = [finalizedProposal, ...history.filter(p => p.id !== proposal.id)];
      
      const updatedTabs = tabs.map(tab => {
        if (tab.id === activeTabId) {
          let title = tab.title;
          if (finalizedProposal.clientName.trim()) {
            title = `КП - ${finalizedProposal.clientName.trim()}`;
          } else if (finalizedProposal.number) {
            title = finalizedProposal.number;
          }
          return {
            ...tab,
            title,
            proposal: finalizedProposal,
            isUnsaved: false
          };
        }
        return tab;
      });

      set({ 
        history: updatedHistory, 
        proposal: finalizedProposal,
        tabs: updatedTabs,
        selectedSeller: (finalizedProposal.seller?.id as SellerId) || get().selectedSeller 
      });

      try {
        const success = await saveProposalToSheet(finalizedProposal);

        // ===== Автосинхронізація прайсу клієнта =====
        if (success) {
          const storeState = get() as any;
          if (storeState.getClientByName && finalizedProposal.clientName) {
            const client = storeState.getClientByName(finalizedProposal.clientName);
            if (client && storeState.syncFromProposal) {
              storeState.syncFromProposal(client.id, finalizedProposal);
            }
          }
        }
        // ============================================

        return success;
      } catch (error) {
        console.error('❌ Помилка збереження на Google Sheets:', error);
        return false;
      }
    },

    loadProposal: (id: string) => {
      const { history, tabs } = get();
      const found = history.find(p => p.id === id);
      if (found) {
        const proposalCopy = normalizeProposal(JSON.parse(JSON.stringify(found)));
        const existingTab = tabs.find(t => t.proposal.id === id);
        
        if (existingTab) {
          set({
            activeTabId: existingTab.id,
            proposal: existingTab.proposal,
            selectedSeller: (existingTab.proposal.seller?.id as SellerId) || 'tov_cso'
          });
        } else {
          const newTabId = found.id;
          const title = found.clientName ? `КП - ${found.clientName}` : found.number;
          const newTab: ProposalTab = {
            id: newTabId,
            title,
            proposal: proposalCopy,
            isUnsaved: false
          };
          
          set({
            tabs: [...tabs, newTab],
            activeTabId: newTabId,
            proposal: proposalCopy,
            selectedSeller: (proposalCopy.seller?.id as SellerId) || 'tov_cso'
          });
        }
      }
    },

    syncHistory: async () => {
      const sheetProposals = (await fetchProposalsHistory()) as Proposal[];
      const { history: localHistory } = get();

      const toUpload = localHistory.filter(lp => {
        if (lp.status !== 'sent') return false;

        const sp = sheetProposals.find(s => s.id === lp.id);
        if (!sp) return true;

        const localTime = new Date(lp.updatedAt || lp.createdAt || 0).getTime();
        const sheetTime = new Date(sp.updatedAt || sp.createdAt || 0).getTime();
        return localTime > sheetTime;
      });

      if (toUpload.length > 0) {
        console.log(`📤 Завантаження ${toUpload.length} несинхронізованих КП до Google Sheets...`);
        await Promise.all(toUpload.map(prop => saveProposalToSheet(prop)));
      }

      let finalSheetProposals = sheetProposals;
      if (toUpload.length > 0) {
        finalSheetProposals = (await fetchProposalsHistory()) as Proposal[];
      }

      const mergedMap = new Map<string, Proposal>();
      
      finalSheetProposals.forEach(sp => {
        mergedMap.set(sp.id, sp);
      });

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

      const validatedHistory = Array.from(mergedMap.values()).map(p => calculateProposalTotals(normalizeProposal(p)));

      validatedHistory.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      set((state) => {
        const newState: any = { history: validatedHistory };

        if (state.proposal.items.length === 0 && !state.proposal.clientName) {
          const nextNum = getNextProposalNumber(validatedHistory);
          const updatedProposal = {
            ...state.proposal,
            number: nextNum
          };
          newState.proposal = updatedProposal;
          
          newState.tabs = state.tabs.map(t => {
            if (t.id === state.activeTabId) {
              return {
                ...t,
                title: nextNum,
                proposal: updatedProposal
              };
            }
            return t;
          });
        }

        return newState;
      });
    },

    deleteProposal: async (id: string) => {
      const { history, tabs, activeTabId } = get();
      const updatedHistory = history.filter(p => p.id !== id);
      const updatedTabs = tabs.filter(t => t.proposal.id !== id);
      
      let nextActiveTabId = activeTabId;
      let nextProposal = get().proposal;
      
      if (activeTabId === id || !updatedTabs.some(t => t.id === activeTabId)) {
        if (updatedTabs.length > 0) {
          const lastTab = updatedTabs[updatedTabs.length - 1];
          nextActiveTabId = lastTab.id;
          nextProposal = lastTab.proposal;
        } else {
          const settings = (get() as any).settings;
          const rates = settings && settings.usdRate && settings.eurRate 
            ? { usdToUah: settings.usdRate, eurToUah: settings.eurRate } 
            : undefined;
          const newProposal = createEmptyProposal(updatedHistory, rates);
          nextActiveTabId = newProposal.id;
          nextProposal = newProposal;
          updatedTabs.push({
            id: newProposal.id,
            title: 'Нова КП',
            proposal: newProposal,
            isUnsaved: false
          });
        }
      }
      
      set({ 
        history: updatedHistory,
        tabs: updatedTabs,
        activeTabId: nextActiveTabId,
        proposal: nextProposal
      });
      
      try {
        await deleteProposalFromSheet(id);
      } catch (error) {
        console.error('Failed to delete proposal from sheet:', error);
      }
    },

    setSelectedSeller: (sellerId: SellerId) => {
      const { proposal } = get();
      const updatedProposal = {
        ...proposal,
        sellerId: sellerId,
        seller: SELLERS[sellerId]
      };
      set(state => {
        const updateResult = updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history);
        return {
          ...updateResult,
          selectedSeller: sellerId
        };
      });
    },

    applyProposalMarkupToItems: () => {
      const { proposal } = get();
      const updatedProposal = {
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
      };
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
    },

    updateProposalField: (field: keyof Proposal, value: any) => {
      const { proposal } = get();
      
      let updatedItems = proposal.items || [];
      
      if (field === 'adjustment') {
        const oldAdj = proposal.adjustment || 0;
        const newAdj = parseFloat(value);
        if (!isNaN(newAdj) && newAdj !== oldAdj) {
          const ratio = (1 + newAdj / 100) / (1 + oldAdj / 100);
          updatedItems = updatedItems.map(item => {
            const newPrice = item.price * ratio;
            const roundedPrice = Math.round(newPrice * 10000) / 10000;
            return {
              ...item,
              price: roundedPrice,
              total: roundedPrice * item.quantity
            };
          });
        }
      } else if (field === 'markup') {
        const oldMarkup = proposal.markup || 0;
        const newMarkup = parseFloat(value);
        if (!isNaN(newMarkup) && newMarkup !== oldMarkup) {
          const ratio = (1 + newMarkup / 100) / (1 + oldMarkup / 100);
          updatedItems = updatedItems.map(item => {
            const newPrice = item.price * ratio;
            const roundedPrice = Math.round(newPrice * 10000) / 10000;
            return {
              ...item,
              price: roundedPrice,
              total: roundedPrice * item.quantity
            };
          });
        }
      }
      
      const updatedProposal = { 
        ...proposal, 
        [field]: value, 
        items: updatedItems,
        updatedAt: new Date().toISOString() 
      };
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
    },

    updateProposalRates: (usd: number, eur: number, isManual?: boolean) => {
      const { proposal, history } = get();
      if (isSavedProposal(proposal, history) && !isManual) return;
      const updatedProposal = {
        ...proposal,
        rates: { usdToUah: usd, eurToUah: eur },
        updatedAt: new Date().toISOString()
      };
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
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

      const updatedProposal = {
        ...proposal,
        items: [...proposal.items, newItem],
      };
      set(state => updateActiveTabProposal(state.tabs, state.activeTabId, updatedProposal, state.history));
    },

    createTab: (proposal?: Proposal) => {
      const { tabs, history } = get();
      const settings = (get() as any).settings;
      const rates = settings && settings.usdRate && settings.eurRate 
        ? { usdToUah: settings.usdRate, eurToUah: settings.eurRate } 
        : undefined;

      const newProposal = proposal 
        ? JSON.parse(JSON.stringify(proposal))
        : createEmptyProposal(history, rates);
        
      if (!proposal) {
        newProposal.id = generateId();
        newProposal.number = getNextProposalNumber(history);
      }
      
      const title = newProposal.clientName ? `КП - ${newProposal.clientName}` : newProposal.number;
      const newTab: ProposalTab = {
        id: newProposal.id,
        title,
        proposal: newProposal,
        isUnsaved: false
      };
      
      set({
        tabs: [...tabs, newTab],
        activeTabId: newProposal.id,
        proposal: newProposal,
        selectedSeller: (newProposal.seller?.id as SellerId) || 'tov_cso'
      });
    },

    closeTab: (tabId: string) => {
      const { tabs, activeTabId, history } = get();
      const settings = (get() as any).settings;
      const rates = settings && settings.usdRate && settings.eurRate 
        ? { usdToUah: settings.usdRate, eurToUah: settings.eurRate } 
        : undefined;

      const tabToClose = tabs.find(t => t.id === tabId);
      if (!tabToClose) return;
      
      if (tabToClose.isUnsaved) {
        const confirmClose = window.confirm(`Вкладка "${tabToClose.title}" має незбережені зміни. Ви впевнені, що хочете закрити її?`);
        if (!confirmClose) return;
      }
      
      const updatedTabs = tabs.filter(t => t.id !== tabId);
      let nextActiveTabId = activeTabId;
      let nextProposal = get().proposal;
      
      if (activeTabId === tabId) {
        if (updatedTabs.length > 0) {
          const lastTab = updatedTabs[updatedTabs.length - 1];
          nextActiveTabId = lastTab.id;
          nextProposal = lastTab.proposal;
        } else {
          const newProposal = createEmptyProposal(history, rates);
          const newTab: ProposalTab = {
            id: newProposal.id,
            title: 'Нова КП',
            proposal: newProposal,
            isUnsaved: false
          };
          updatedTabs.push(newTab);
          nextActiveTabId = newProposal.id;
          nextProposal = newProposal;
        }
      }
      
      set({
        tabs: updatedTabs,
        activeTabId: nextActiveTabId,
        proposal: nextProposal,
        selectedSeller: (nextProposal.seller?.id as SellerId) || 'tov_cso'
      });
    },

    setActiveTab: (tabId: string) => {
      const { tabs } = get();
      const targetTab = tabs.find(t => t.id === tabId);
      if (targetTab) {
        set({
          activeTabId: tabId,
          proposal: targetTab.proposal,
          selectedSeller: (targetTab.proposal.seller?.id as SellerId) || 'tov_cso'
        });
      }
    },
  };
};
