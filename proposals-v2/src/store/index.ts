import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createProductsSlice, ProductsSlice } from './slices/productsSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';
import { createFavoritesSlice, FavoritesSlice } from './slices/favoritesSlice';
import { createProposalSlice, ProposalSlice } from './slices/proposalSlice';
import { createClientsSlice, ClientsSlice } from './slices/clientsSlice';
import { normalizeProposal, isSavedProposal } from '../services/api';

/**
 * Комбінований тип стору - об'єднання всіх слайсів
 */
export type ProposalStore = ProductsSlice & SettingsSlice & FavoritesSlice & ProposalSlice & ClientsSlice;

/**
 * Головний Zustand store - комбінує всі слайси
 */
export const useProposalStore = create<ProposalStore>()(
  persist(
    (...args) => ({
      ...createProductsSlice(...args),
      ...createSettingsSlice(...args),
      ...createFavoritesSlice(...args),
      ...createProposalSlice(...args),
      ...createClientsSlice(...args),
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
        proposal: state.proposal,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        activeCurrency: state.activeCurrency,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('❌ Помилка регідрації сховища:', error);
          return;
        }
        if (state) {
          const stateAny = state as any;
          
          // Очищення застарілих 44 / 51.43 курсів з settings
          if (stateAny.settings) {
            if (!stateAny.settings.usdRate || stateAny.settings.usdRate <= 44.5) {
              stateAny.settings.usdRate = CONFIG.DEFAULT_USD_UAH;
              stateAny.settings.eurRate = CONFIG.DEFAULT_EUR_UAH;
            }
          }

          const sanitizeRates = (prop: any) => {
            if (!prop) return prop;
            const norm = normalizeProposal(prop);
            // Якщо КП є збереженою (status !== 'draft' або є в історії) - НЕ ЗМІНЮЄМО її створений/збережений курс!
            if (isSavedProposal(norm, stateAny.history)) {
              return norm;
            }
            if (!norm.rates || !norm.rates.usdToUah || norm.rates.usdToUah <= 44.5) {
              norm.rates = {
                usdToUah: stateAny.settings?.usdRate || CONFIG.DEFAULT_USD_UAH,
                eurToUah: stateAny.settings?.eurRate || CONFIG.DEFAULT_EUR_UAH,
              };
            }
            return norm;
          };

          // Міграція: нормалізація та санітизація курсів у локальній історії та активному стані
          if (stateAny.history && Array.isArray(stateAny.history)) {
            stateAny.history = stateAny.history.map(normalizeProposal);
          }
          if (stateAny.proposal) {
            stateAny.proposal = sanitizeRates(stateAny.proposal);
          }
          if (stateAny.tabs && Array.isArray(stateAny.tabs)) {
            stateAny.tabs = stateAny.tabs.map((tab: any) => ({
              ...tab,
              proposal: sanitizeRates(tab.proposal)
            }));
          }

          // Міграція: якщо табів немає, але є активна КП, створюємо перший таб
          if ((!stateAny.tabs || stateAny.tabs.length === 0) && stateAny.proposal) {
            console.log('🔄 Міграція: перенесення активної чернетки КП у вкладку...');
            const legacyProposal = stateAny.proposal;
            const title = legacyProposal.clientName 
              ? `КП - ${legacyProposal.clientName}` 
              : (legacyProposal.number || 'Нова КП');
            
            stateAny.tabs = [{
              id: legacyProposal.id || 'draft',
              title,
              proposal: legacyProposal,
              isUnsaved: false
            }];
            stateAny.activeTabId = legacyProposal.id || 'draft';
          }
        }
      }
    }
  )
);

import { CONFIG } from '../config';

// Експортуємо утилітну функцію для очищення кешу
const CACHE_KEY = `cso-products-cache-${CONFIG.CACHE_VERSION}`;

export function clearProductsCache() {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Кеш продуктів очищено');
}
