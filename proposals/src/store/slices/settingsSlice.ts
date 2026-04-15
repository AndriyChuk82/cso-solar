import { StateCreator } from 'zustand';
import { Settings, Currency } from '../../types';
import { CONFIG } from '../../config';
import { fetchRates } from '../../services/api';

/**
 * Settings Slice - управління налаштуваннями, курсами валют
 */
export interface SettingsSlice {
  // State
  settings: Settings;
  activeCurrency: Currency;

  // Actions
  updateSettings: (settings: Partial<Settings>) => void;
  setActiveCurrency: (currency: Currency) => void;
  refreshRates: () => Promise<void>;
}

export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [],
  [],
  SettingsSlice
> = (set, get) => ({
  // Initial State
  settings: {
    defaultMarkup: CONFIG.DEFAULT_MARKUP,
    usdRate: CONFIG.DEFAULT_USD_UAH,
    eurRate: CONFIG.DEFAULT_EUR_UAH,
    defaultSeller: 'tov_cso',
    showPrices: true,
    autoSave: true,
  },
  activeCurrency: 'USD',

  // Actions
  updateSettings: (newSettings: Partial<Settings>) => {
    const { settings } = get();
    set({ settings: { ...settings, ...newSettings } });
  },

  setActiveCurrency: (currency: Currency) => {
    set({ activeCurrency: currency });
  },

  refreshRates: async () => {
    const rates = await fetchRates();
    if (rates) {
      set((state: any) => ({
        settings: {
          ...state.settings,
          usdRate: rates.usd,
          eurRate: rates.eur
        }
      }));
      
      // Оновлюємо курси в поточній пропозиції
      const state = get() as any;
      if (typeof state.updateProposalRates === 'function') {
        state.updateProposalRates(rates.usd, rates.eur);
      }
    }
  },
});
