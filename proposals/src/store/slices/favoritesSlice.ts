import { StateCreator } from 'zustand';
import { Product } from '../../types';

/**
 * Favorites Slice - управління обраними товарами та власними матеріалами
 */
export interface FavoritesSlice {
  // State
  favorites: string[];
  customMaterials: Product[];
  deletedProductIds: string[];

  // Actions
  toggleFavorite: (productId: string) => void;
  addCustomMaterial: (product: Product) => void;
  removeCustomMaterial: (productId: string) => void;
  deleteProduct: (productId: string) => void;
}

export const createFavoritesSlice: StateCreator<
  FavoritesSlice,
  [],
  [],
  FavoritesSlice
> = (set, get) => ({
  // Initial State
  favorites: [],
  customMaterials: [],
  deletedProductIds: [],

  // Actions
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
});
