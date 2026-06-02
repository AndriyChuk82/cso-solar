import { TrendingUp, RefreshCcw, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Settings, Currency } from '../../types';

interface SettingsPanelProps {
  rates: { usdToUah: number; eurToUah: number };
  activeCurrency: Currency;
  markup: number;
  adjustment: number;
  isRefreshingRates: boolean;
  onUpdateRates: (rates: { usdToUah: number; eurToUah: number }) => void;
  onSetActiveCurrency: (currency: Currency) => void;
  onUpdateMarkup: (markup: number) => void;
  onUpdateAdjustment: (adjustment: number) => void;
  onRefreshRates: () => void;
  onApplyMarkup: () => void;
}

export function SettingsPanel({
  rates,
  activeCurrency,
  markup,
  adjustment,
  isRefreshingRates,
  onUpdateRates,
  onSetActiveCurrency,
  onUpdateMarkup,
  onUpdateAdjustment,
  onRefreshRates,
  onApplyMarkup,
}: SettingsPanelProps) {
  const [localMarkup, setLocalMarkup] = useState(markup.toString());
  const [localAdjustment, setLocalAdjustment] = useState(adjustment.toString());

  // Синхронізуємо локальний стан з пропсами, коли вони змінюються зовні
  useEffect(() => {
    setLocalMarkup(markup.toString());
  }, [markup]);

  useEffect(() => {
    setLocalAdjustment(adjustment.toString());
  }, [adjustment]);

  const handleMarkupChange = (val: string) => {
    setLocalMarkup(val);
    if (val === '' || val === '-') return;
    const num = parseFloat(val);
    if (!isNaN(num)) onUpdateMarkup(num);
  };

  const handleAdjustmentChange = (val: string) => {
    setLocalAdjustment(val);
    if (val === '' || val === '-') return;
    const num = parseFloat(val);
    if (!isNaN(num)) onUpdateAdjustment(num);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-2 flex flex-wrap items-center gap-4 no-print transition-colors">
      <div className="flex items-center gap-2 border-r border-gray-100 dark:border-slate-800 pr-4">
        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Курс $:</label>
        <input
          type="number"
          value={rates.usdToUah}
          onChange={(e) => onUpdateRates({ ...rates, usdToUah: parseFloat(e.target.value) || 0 })}
          onFocus={(e) => e.target.select()}
          className="w-20 px-1.5 py-1 text-xs border border-gray-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10 transition-colors"
          step="0.1"
        />
        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1">€:</label>
        <input
          type="number"
          value={rates.eurToUah}
          onChange={(e) => onUpdateRates({ ...rates, eurToUah: parseFloat(e.target.value) || 0 })}
          onFocus={(e) => e.target.select()}
          className="w-20 px-1.5 py-1 text-xs border border-gray-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary font-bold text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-900/10 transition-colors"
          step="0.1"
        />
        <button
          onClick={onRefreshRates}
          disabled={isRefreshingRates}
          className={`p-1.5 rounded transition ${isRefreshingRates ? 'opacity-30' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-primary dark:hover:text-blue-400'}`}
          title="Оновити курси з Goverla"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshingRates ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-2 border-r border-gray-100 dark:border-slate-800 pr-4">
        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Націнка %:
        </label>
        <input
          type="text"
          value={localMarkup}
          onChange={(e) => handleMarkupChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="w-14 px-1.5 py-1 text-xs border border-gray-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary font-bold text-green-600 dark:text-green-400 bg-green-50/30 dark:bg-green-900/10 transition-colors"
        />
        
        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-2">
          Коригування %:
        </label>
        <input
          type="text"
          value={localAdjustment}
          onChange={(e) => handleAdjustmentChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className={`w-14 px-1.5 py-1 text-xs border border-gray-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary font-bold transition-colors ${
            adjustment < 0 
              ? 'text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-900/10' 
              : adjustment > 0 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10'
                : 'text-gray-600 dark:text-gray-400 bg-gray-50/30 dark:bg-slate-800'
          }`}
          placeholder="0"
        />

        <button
          onClick={onApplyMarkup}
          className="px-2 py-1 text-[10px] font-bold bg-green-500 dark:bg-green-600 text-white rounded hover:bg-green-600 dark:hover:bg-green-700 transition flex items-center gap-1 shadow-sm ml-2"
          title="Застосувати націнку та коригування до всіх товарів"
        >
          <Zap className="w-3 h-3" />
          Застосувати
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Валюта:</label>
        {(['UAH', 'USD', 'EUR'] as Currency[]).map((curr) => (
          <button
            key={curr}
            onClick={() => onSetActiveCurrency(curr)}
            className={`px-2 py-1 text-[10px] font-bold rounded transition ${
              activeCurrency === curr
                ? 'bg-primary dark:bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            {curr}
          </button>
        ))}
      </div>
    </div>
  );
}
