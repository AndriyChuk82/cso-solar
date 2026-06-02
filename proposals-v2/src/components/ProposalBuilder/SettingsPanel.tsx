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
    <div className="mx-auto my-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-full border border-[#e8e4d1]/80 dark:border-slate-800 p-1.5 px-6 flex flex-wrap sm:flex-nowrap items-center justify-center gap-5 no-print shadow-[0_6px_25px_rgba(138,124,86,0.06)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(138,124,86,0.1)]">
      {/* Курси валют */}
      <div className="flex items-center gap-2.5 select-none">
        <span className="text-[9px] font-bold text-[#a89a74] dark:text-slate-450 uppercase tracking-widest font-mono">Курси:</span>
        <div className="flex items-center gap-1 bg-[#f4f0df]/30 dark:bg-slate-950/40 px-2 py-0.5 rounded-full border border-[#e8e4d1]/60 dark:border-slate-800">
          <span className="text-[10px] font-black text-amber-600">$</span>
          <input
            type="number"
            value={rates.usdToUah}
            onChange={(e) => onUpdateRates({ ...rates, usdToUah: parseFloat(e.target.value) || 0 })}
            onFocus={(e) => e.target.select()}
            className="w-16 bg-transparent border-none text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none text-center"
            step="0.1"
          />
        </div>
        <div className="flex items-center gap-1 bg-[#f4f0df]/30 dark:bg-slate-950/40 px-2 py-0.5 rounded-full border border-[#e8e4d1]/60 dark:border-slate-800">
          <span className="text-[10px] font-black text-amber-600">€</span>
          <input
            type="number"
            value={rates.eurToUah}
            onChange={(e) => onUpdateRates({ ...rates, eurToUah: parseFloat(e.target.value) || 0 })}
            onFocus={(e) => e.target.select()}
            className="w-16 bg-transparent border-none text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none text-center"
            step="0.1"
          />
        </div>
        <button
          onClick={onRefreshRates}
          disabled={isRefreshingRates}
          className={`p-1 bg-[#f4f0df]/30 dark:bg-slate-950/40 rounded-full border border-[#e8e4d1]/60 dark:border-slate-800 text-[#a89a74] hover:text-amber-600 hover:border-amber-500 transition-all active:scale-95 cursor-pointer flex items-center justify-center ${isRefreshingRates ? 'opacity-30' : ''}`}
          title="Оновити курси з Goverla"
        >
          <RefreshCcw className={`w-3 h-3 ${isRefreshingRates ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="hidden sm:block w-px h-5 bg-[#e8e4d1]/80 dark:bg-slate-800/80"></div>

      {/* Націнка та коригування */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-[#a89a74] dark:text-slate-450 uppercase tracking-widest font-mono">Націнка %:</span>
          <div className="flex items-center bg-[#f4f0df]/30 dark:bg-slate-950/40 px-2 py-0.5 rounded-full border border-[#e8e4d1]/60 dark:border-slate-800">
            <input
              type="text"
              value={localMarkup}
              onChange={(e) => handleMarkupChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-8 bg-transparent border-none text-xs text-slate-800 dark:text-slate-100 font-black focus:outline-none text-center"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-[#a89a74] dark:text-slate-450 uppercase tracking-widest font-mono">Кориг. %:</span>
          <div className="flex items-center bg-[#f4f0df]/30 dark:bg-slate-950/40 px-2 py-0.5 rounded-full border border-[#e8e4d1]/60 dark:border-slate-800">
            <input
              type="text"
              value={localAdjustment}
              onChange={(e) => handleAdjustmentChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-8 bg-transparent border-none text-xs text-slate-800 dark:text-slate-100 font-black focus:outline-none text-center"
              placeholder="0"
            />
          </div>
        </div>
        <button
          onClick={onApplyMarkup}
          className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-[0_2px_8px_rgba(245,158,11,0.18)] hover:shadow-[0_4px_12px_rgba(245,158,11,0.25)] active:scale-95 transition-all flex items-center justify-center border-none cursor-pointer"
          title="Застосувати націнку та коригування до всіх товарів"
        >
          <Zap className="w-3.5 h-3.5 text-amber-100" />
        </button>
      </div>

      <div className="hidden sm:block w-px h-5 bg-[#e8e4d1]/80 dark:bg-slate-800/80"></div>

      {/* Перемикач валюти */}
      <div className="flex bg-[#f4f0df]/40 dark:bg-slate-950/60 p-0.5 rounded-full border border-[#d2caa4] dark:border-slate-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] gap-0.5 select-none">
        {(['UAH', 'USD', 'EUR'] as Currency[]).map((curr) => (
          <button
            key={curr}
            onClick={() => onSetActiveCurrency(curr)}
            className={`px-3 py-0.5 text-[9px] font-extrabold rounded-full transition-all duration-200 cursor-pointer ${
              activeCurrency === curr
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_2px_6px_rgba(245,158,11,0.18)] transform scale-100 active:scale-95'
                : 'text-slate-500 dark:text-slate-400 hover:text-[#b45309] dark:hover:text-[#fbbf24] hover:bg-white/60 dark:hover:bg-slate-900/40 active:scale-95'
            }`}
          >
            {curr}
          </button>
        ))}
      </div>
    </div>
  );
}
