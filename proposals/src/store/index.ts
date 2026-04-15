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
        activeCurrency: state.activeCurrency,
      }),
    }
  )
);

// Експортуємо утилітну функцію для очищення кешу
const CACHE_KEY = 'cso-products-cache';

export function clearProductsCache() {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Кеш продуктів очищено');
}
