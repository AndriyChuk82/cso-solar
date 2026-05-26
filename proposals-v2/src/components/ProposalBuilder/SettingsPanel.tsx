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
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-900 p-3 flex flex-wrap items-center justify-between gap-4 no-print transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
      {/* Курси валют */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Курси:</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">$</span>
          <input
            type="number"
            value={rates.usdToUah}
            onChange={(e) => onUpdateRates({ ...rates, usdToUah: parseFloat(e.target.value) || 0 })}
            onFocus={(e) => e.target.select()}
            className="w-16 px-2 py-1 text-xs border border-slate-200 dark:border-slate-900 rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 transition-all font-semibold text-center"
            step="0.1"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">€</span>
          <input
            type="number"
            value={rates.eurToUah}
            onChange={(e) => onUpdateRates({ ...rates, eurToUah: parseFloat(e.target.value) || 0 })}
            onFocus={(e) => e.target.select()}
            className="w-16 px-2 py-1 text-xs border border-slate-200 dark:border-slate-900 rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 transition-all font-semibold text-center"
            step="0.1"
          />
        </div>
        <button
          onClick={onRefreshRates}
          disabled={isRefreshingRates}
          className={`p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-900 transition-all ${isRefreshingRates ? 'opacity-30' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          title="Оновити курси з Goverla"
        >
          <RefreshCcw className={`w-3 h-3 ${isRefreshingRates ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Націнка та коригування */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1">
            Націнка %:
          </span>
          <input
            type="text"
            value={localMarkup}
            onChange={(e) => handleMarkupChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-12 px-2 py-1 text-xs border border-slate-200 dark:border-slate-900 rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 transition-all font-bold text-center"
          />
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
            Кориг. %:
          </span>
          <input
            type="text"
            value={localAdjustment}
            onChange={(e) => handleAdjustmentChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-12 px-2 py-1 text-xs border border-slate-200 dark:border-slate-900 rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 transition-all font-bold text-center"
            placeholder="0"
          />
        </div>

        <button
          onClick={onApplyMarkup}
          className="px-2.5 py-1 text-[10px] font-semibold border border-slate-800 dark:border-slate-200 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          title="Застосувати націнку та коригування до всіх товарів"
        >
          <Zap className="w-2.5 h-2.5" />
          Застосувати
        </button>
      </div>

      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-900/60">
        {(['UAH', 'USD', 'EUR'] as Currency[]).map((curr) => (
          <button
            key={curr}
            onClick={() => onSetActiveCurrency(curr)}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              activeCurrency === curr
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-slate-200/40 dark:border-slate-700/30'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            {curr}
          </button>
        ))}
      </div>
    </div>
  );
}
