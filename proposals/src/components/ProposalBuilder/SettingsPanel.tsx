import { TrendingUp, RefreshCcw, Zap } from 'lucide-react';
import type { Settings, Currency } from '../../types';

interface SettingsPanelProps {
  settings: Settings;
  activeCurrency: Currency;
  markup: number;
  isRefreshingRates: boolean;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onSetActiveCurrency: (currency: Currency) => void;
  onUpdateMarkup: (markup: number) => void;
  onRefreshRates: () => void;
  onApplyMarkup: () => void;
}

export function SettingsPanel({
  settings,
  activeCurrency,
  markup,
  isRefreshingRates,
  onUpdateSettings,
  onSetActiveCurrency,
  onUpdateMarkup,
  onRefreshRates,
  onApplyMarkup,
}: SettingsPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 flex flex-wrap items-center gap-4 no-print">
      <div className="flex items-center gap-2 border-r border-gray-100 pr-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Курс $:</label>
        <input
          type="number"
          value={settings.usdRate}
          onChange={(e) => onUpdateSettings({ usdRate: parseFloat(e.target.value) || 0 })}
          className="w-16 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary font-bold text-blue-600 bg-blue-50/30"
          step="0.1"
        />
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">€:</label>
        <input
          type="number"
          value={settings.eurRate}
          onChange={(e) => onUpdateSettings({ eurRate: parseFloat(e.target.value) || 0 })}
          className="w-16 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary font-bold text-purple-600 bg-purple-50/30"
          step="0.1"
        />
        <button
          onClick={onRefreshRates}
          disabled={isRefreshingRates}
          className={`p-1.5 rounded transition ${isRefreshingRates ? 'opacity-30' : 'hover:bg-gray-100 text-gray-400 hover:text-primary'}`}
          title="Оновити курси з Goverla"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshingRates ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-2 border-r border-gray-100 pr-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Націнка %:
        </label>
        <input
          type="number"
          value={markup}
          onChange={(e) => onUpdateMarkup(parseFloat(e.target.value) || 0)}
          className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary font-bold text-green-600 bg-green-50/30"
        />
        <button
          onClick={onApplyMarkup}
          className="px-2 py-1 text-[10px] font-bold bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center gap-1"
          title="Застосувати націнку до всіх товарів"
        >
          <Zap className="w-3 h-3" />
          Застосувати
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Валюта:</label>
        {(['UAH', 'USD', 'EUR'] as Currency[]).map((curr) => (
          <button
            key={curr}
            onClick={() => onSetActiveCurrency(curr)}
            className={`px-2 py-1 text-[10px] font-bold rounded transition ${
              activeCurrency === curr
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {curr}
          </button>
        ))}
      </div>
    </div>
  );
}
