import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createProductsSlice, ProductsSlice } from './slices/productsSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';
import { createFavoritesSlice, FavoritesSlice } from './slices/favoritesSlice';
import { createProposalSlice, ProposalSlice } from './slices/proposalSlice';

/**
 * Комбінований тип стору - об'єднання всіх слайсів
 */
export type ProposalStore = ProductsSlice & SettingsSlice & FavoritesSlice & ProposalSlice;

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
