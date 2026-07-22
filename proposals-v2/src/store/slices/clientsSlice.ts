import { StateCreator } from 'zustand';
import { RegularClient, ClientPriceEntry, Proposal } from '../../types';
import {
  fetchKpClients,
  fetchAllBuyers,
  fetchClientPrices,
  upsertClientPrice,
  deleteClientPrice,
  updateBuyerKpFlag,
  syncPricesFromProposal,
  createBuyer,
} from '../../services/clientsApi';

/**
 * Clients Slice — управління постійними клієнтами та їх персональними цінами
 */
export interface ClientsSlice {
  // State
  regularClients: RegularClient[];       // КП-клієнти
  allBuyers: RegularClient[];            // Всі buyers (для вибору в менеджері)
  clientPricesMap: Record<string, ClientPriceEntry[]>; // Кеш цін по buyerId
  clientsLoading: boolean;

  // Actions
  loadKpClients: () => Promise<void>;
  loadAllBuyers: () => Promise<void>;
  loadClientPrices: (buyerId: string) => Promise<void>;
  addNewClient: (name: string, phone?: string, notes?: string) => Promise<RegularClient | null>;
  setClientKpFlag: (buyerId: string, isKpClient: boolean) => Promise<void>;
  saveClientPrice: (
    buyerId: string,
    productId: string,
    productName: string,
    price: number,
    costPrice?: number,
    source?: 'manual' | 'kp',
    sourceKpId?: string,
    sourceKpNumber?: string
  ) => Promise<ClientPriceEntry | null>;
  removeClientPrice: (entryId: string, buyerId: string) => Promise<void>;
  syncFromProposal: (buyerId: string, proposal: Proposal) => Promise<void>;
  syncAllHistory: () => Promise<{ proposalsProcessed: number; clientsMatched: number; pricesSaved: number }>;
  getClientByName: (name: string) => RegularClient | undefined;
  getClientPriceForProduct: (buyerId: string, productId: string) => ClientPriceEntry | undefined;
}

export const createClientsSlice: StateCreator<
  ClientsSlice,
  [],
  [],
  ClientsSlice
> = (set, get) => ({
  // Initial State
  regularClients: [],
  allBuyers: [],
  clientPricesMap: {},
  clientsLoading: false,

  loadKpClients: async () => {
    set({ clientsLoading: true });
    const clients = await fetchKpClients();
    set({ regularClients: clients, clientsLoading: false });
  },

  loadAllBuyers: async () => {
    const buyers = await fetchAllBuyers();
    set({ allBuyers: buyers });
  },

  loadClientPrices: async (buyerId: string) => {
    const prices = await fetchClientPrices(buyerId);
    set((state) => ({
      clientPricesMap: {
        ...state.clientPricesMap,
        [buyerId]: prices,
      },
    }));
  },

  addNewClient: async (name: string, phone?: string, notes?: string) => {
    const newClient = await createBuyer(name, phone, notes);
    if (!newClient) return null;

    set((state) => ({
      regularClients: [...state.regularClients, newClient].sort((a, b) =>
        a.name.localeCompare(b.name, 'uk')
      ),
      allBuyers: [...state.allBuyers, newClient].sort((a, b) =>
        a.name.localeCompare(b.name, 'uk')
      ),
    }));

    return newClient;
  },

  setClientKpFlag: async (buyerId: string, isKpClient: boolean) => {
    const success = await updateBuyerKpFlag(buyerId, isKpClient);
    if (!success) return;

    // Оновлюємо allBuyers
    set((state) => ({
      allBuyers: state.allBuyers.map((b) =>
        b.id === buyerId ? { ...b, isKpClient } : b
      ),
    }));

    // Якщо вмикаємо — додаємо до regularClients, якщо вимикаємо — видаляємо
    if (isKpClient) {
      const buyer = get().allBuyers.find((b) => b.id === buyerId);
      if (buyer) {
        set((state) => ({
          regularClients: [...state.regularClients, { ...buyer, isKpClient: true }]
            .sort((a, b) => a.name.localeCompare(b.name, 'uk')),
        }));
      }
    } else {
      set((state) => ({
        regularClients: state.regularClients.filter((c) => c.id !== buyerId),
      }));
    }
  },

  saveClientPrice: async (buyerId, productId, productName, price, costPrice, source, sourceKpId, sourceKpNumber) => {
    const entry = await upsertClientPrice(
      buyerId, productId, productName, price, costPrice, source, sourceKpId, sourceKpNumber
    );
    if (!entry) return null;

    // Оновлюємо кеш
    set((state) => {
      const existing = state.clientPricesMap[buyerId] || [];
      const updated = existing.some((e) => e.productId === productId)
        ? existing.map((e) => (e.productId === productId ? entry : e))
        : [...existing, entry];
      return {
        clientPricesMap: {
          ...state.clientPricesMap,
          [buyerId]: updated,
        },
      };
    });

    return entry;
  },

  removeClientPrice: async (entryId: string, buyerId: string) => {
    const success = await deleteClientPrice(entryId);
    if (!success) return;

    set((state) => ({
      clientPricesMap: {
        ...state.clientPricesMap,
        [buyerId]: (state.clientPricesMap[buyerId] || []).filter((e) => e.id !== entryId),
      },
    }));
  },

  syncFromProposal: async (buyerId: string, proposal: Proposal) => {
    const updated = await syncPricesFromProposal(buyerId, proposal);
    if (updated.length === 0) return;

    // Оновлюємо кеш — об'єднуємо нові ціни з існуючими
    set((state) => {
      const existing = state.clientPricesMap[buyerId] || [];
      const updatedMap = new Map(existing.map((e) => [e.productId, e]));
      updated.forEach((e) => updatedMap.set(e.productId, e));
      return {
        clientPricesMap: {
          ...state.clientPricesMap,
          [buyerId]: Array.from(updatedMap.values()),
        },
      };
    });
  },

  syncAllHistory: async () => {
    const initialStore = get() as any;

    // 1. Спочатку завантажуємо найновішу історію КП з Google Sheets
    if (initialStore.syncHistory) {
      await initialStore.syncHistory();
    }

    // 2. Завантажуємо всіх покупців
    await get().loadAllBuyers();

    // 3. БЕРЕМО СВІЖИЙ СТАН ПІСЛЯ ASYNC ОПЕРАЦІЙ!
    const store = get() as any;
    const buyers: RegularClient[] = store.allBuyers || [];
    const freshHistory: Proposal[] = store.history || [];

    if (buyers.length === 0 || freshHistory.length === 0) {
      return { proposalsProcessed: 0, clientsMatched: 0, pricesSaved: 0 };
    }

    // Очищення та нормалізація імені клієнта (прибираємо ТОВ, ФОП, ПП та розділові знаки)
    const norm = (s: string) => {
      if (!s) return '';
      let cleaned = s.toLowerCase().replace(/тов|фоп|пп|тдв|ват|пат|прат|ао|фг|дп|пбк/gi, '');
      return cleaned.replace(/[^\w\u0400-\u04FF]/g, '').trim();
    };

    const isMatch = (bName: string, pName: string) => {
      const bNorm = norm(bName);
      const pNorm = norm(pName);
      if (!bNorm || !pNorm) return false;
      if (bNorm === pNorm) return true;
      const minLen = Math.min(bNorm.length, pNorm.length);
      const maxLen = Math.max(bNorm.length, pNorm.length);
      // Запобігаємо збігу коротких/загальних слів (напр. "Володя" з "Енергетик UA_Володя")
      if (maxLen / minLen > 1.5) return false;
      return bNorm.includes(pNorm) || pNorm.includes(bNorm);
    };

    // Сортуємо КП від найстаріших до найновіших
    const sorted = [...freshHistory].sort((a, b) => {
      const tA = new Date(a.updatedAt || a.createdAt || a.date || 0).getTime();
      const tB = new Date(b.updatedAt || b.createdAt || b.date || 0).getTime();
      return tA - tB;
    });

    const matchedBuyerIds = new Set<string>();
    let proposalsProcessed = 0;
    let pricesSaved = 0;

    for (const proposal of sorted) {
      if (!proposal.clientName || !proposal.items || proposal.items.length === 0) continue;

      // Шукаємо клієнта в buyers за гнучким, але точним порівнянням
      const matchedBuyer = buyers.find((b) => isMatch(b.name, proposal.clientName));

      if (matchedBuyer) {
        proposalsProcessed++;
        matchedBuyerIds.add(matchedBuyer.id);

        // Переконуємось що клієнт позначений як КП-клієнт
        if (!matchedBuyer.isKpClient) {
          await get().setClientKpFlag(matchedBuyer.id, true);
        }

        const entries = await syncPricesFromProposal(matchedBuyer.id, proposal);
        pricesSaved += entries.length;
      }
    }

    // Оновлюємо кеш прайсів та список КП-клієнтів
    await get().loadKpClients();
    for (const buyerId of matchedBuyerIds) {
      await get().loadClientPrices(buyerId);
    }

    return {
      proposalsProcessed,
      clientsMatched: matchedBuyerIds.size,
      pricesSaved,
    };
  },

  getClientByName: (name: string) => {
    const norm = (s: string) => {
      if (!s) return '';
      let cleaned = s.toLowerCase().replace(/тов|фоп|пп|тдв|ват|пат|прат|ао|фг|дп|пбк/gi, '');
      return cleaned.replace(/[^\w\u0400-\u04FF]/g, '').trim();
    };

    const targetNorm = norm(name);
    if (!targetNorm) return undefined;

    return get().regularClients.find((c) => {
      const cNorm = norm(c.name);
      if (cNorm === targetNorm) return true;
      const minLen = Math.min(cNorm.length, targetNorm.length);
      const maxLen = Math.max(cNorm.length, targetNorm.length);
      if (maxLen / minLen > 1.5) return false;
      return cNorm.includes(targetNorm) || targetNorm.includes(cNorm);
    });
  },

  getClientPriceForProduct: (buyerId: string, productId: string) => {
    const prices = get().clientPricesMap[buyerId] || [];
    return prices.find((p) => p.productId === productId);
  },
});
