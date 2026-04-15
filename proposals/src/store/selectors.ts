import { ProposalStore } from './index';
import { Product } from '../types';

/**
 * Селектори для оптимізації ререндерів компонентів.
 * Компоненти будуть ререндеритись тільки при зміні конкретних даних.
 *
 * Використання:
 * const products = useProposalStore(selectProducts);
 * const loading = useProposalStore(selectLoading);
 */

// ===== Products & Categories =====
export const selectProducts = (state: ProposalStore) => state.products;
export const selectCategories = (state: ProposalStore) => state.categories;
export const selectLoading = (state: ProposalStore) => state.loading;
export const selectError = (state: ProposalStore) => state.error;

// ===== Proposal =====
export const selectProposal = (state: ProposalStore) => state.proposal;
export const selectProposalItems = (state: ProposalStore) => state.proposal.items;
export const selectProposalTotal = (state: ProposalStore) => state.proposal.total;
export const selectProposalSubtotal = (state: ProposalStore) => state.proposal.subtotal;
export const selectProposalMarkup = (state: ProposalStore) => state.proposal.markup;
export const selectProposalClient = (state: ProposalStore) => ({
  clientName: state.proposal.clientName,
  clientPhone: state.proposal.clientPhone,
  clientEmail: state.proposal.clientEmail,
  clientAddress: state.proposal.clientAddress,
});

// ===== Settings =====
export const selectSettings = (state: ProposalStore) => state.settings;
export const selectUsdRate = (state: ProposalStore) => state.settings.usdRate;
export const selectEurRate = (state: ProposalStore) => state.settings.eurRate;
export const selectDefaultMarkup = (state: ProposalStore) => state.settings.defaultMarkup;
export const selectShowPrices = (state: ProposalStore) => state.settings.showPrices;

// ===== Currency =====
export const selectActiveCurrency = (state: ProposalStore) => state.activeCurrency;

// ===== Favorites & Custom Materials =====
export const selectFavorites = (state: ProposalStore) => state.favorites;
export const selectCustomMaterials = (state: ProposalStore) => state.customMaterials;
export const selectDeletedProductIds = (state: ProposalStore) => state.deletedProductIds;

// ===== Seller =====
export const selectSelectedSeller = (state: ProposalStore) => state.selectedSeller;
export const selectProposalSeller = (state: ProposalStore) => state.proposal.seller;

// ===== History =====
export const selectHistory = (state: ProposalStore) => state.history;

// ===== Actions (не потребують селекторів, але для повноти) =====
export const selectActions = (state: ProposalStore) => ({
  loadProducts: state.loadProducts,
  refreshRates: state.refreshRates,
  addToProposal: state.addToProposal,
  removeFromProposal: state.removeFromProposal,
  updateQuantity: state.updateQuantity,
  updateItemCostPrice: state.updateItemCostPrice,
  updateItemSalePrice: state.updateItemSalePrice,
  updateItemField: state.updateItemField,
  moveItemUp: state.moveItemUp,
  moveItemDown: state.moveItemDown,
  clearProposal: state.clearProposal,
  saveProposal: state.saveProposal,
  updateSettings: state.updateSettings,
  toggleFavorite: state.toggleFavorite,
  addCustomMaterial: state.addCustomMaterial,
  removeCustomMaterial: state.removeCustomMaterial,
  deleteProduct: state.deleteProduct,
  setActiveCurrency: state.setActiveCurrency,
  setSelectedSeller: state.setSelectedSeller,
  applyProposalMarkupToItems: state.applyProposalMarkupToItems,
  updateProposalField: state.updateProposalField,
});

// ===== Комбіновані селектори для складних випадків =====

/**
 * Повертає всі продукти включаючи власні матеріали (без видалених)
 */
export const selectAllAvailableProducts = (state: ProposalStore) => {
  const map = new Map<string, Product>();
  state.products.forEach((p: Product) => {
    if (!state.deletedProductIds.includes(p.id)) {
      map.set(p.id, p);
    }
  });
  state.customMaterials.forEach((p: Product) => {
    if (!state.deletedProductIds.includes(p.id)) {
      map.set(p.id, p);
    }
  });
  return Array.from(map.values());
};

/**
 * Повертає тільки обрані продукти
 */
export const selectFavoriteProducts = (state: ProposalStore) => {
  const allProducts = selectAllAvailableProducts(state);
  return allProducts.filter((p: Product) => state.favorites.includes(p.id));
};

/**
 * Повертає курси валют для конвертації
 */
export const selectCurrencyRates = (state: ProposalStore) => ({
  USD: state.settings.usdRate,
  EUR: state.settings.eurRate,
  UAH: 1,
});
