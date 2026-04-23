import { formatCurrency } from '../../utils/currency';
import type { Currency } from '../../types';

interface ProposalSummaryProps {
  itemsCount: number;
  costSubtotal: number;
  saleSubtotal: number;
  vatMode: 'none' | 'add' | 'extract';
  vatAmount: number;
  total: number;
  profit: number;
  profitPercent: number;
  activeCurrency: Currency;
  usdRate: number;
  eurRate: number;
  notes: string;
  onUpdateNotes: (notes: string) => void;
  onUpdateVatMode: (mode: 'none' | 'add' | 'extract') => void;
  convert: (amount: number, from: Currency, to: Currency) => number;
}

export function ProposalSummary({
  itemsCount,
  costSubtotal,
  saleSubtotal,
  vatMode,
  vatAmount,
  total,
  profit,
  profitPercent,
  activeCurrency,
  usdRate,
  eurRate,
  notes,
  onUpdateNotes,
  onUpdateVatMode,
  convert,
}: ProposalSummaryProps) {
  if (itemsCount === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 mb-3 no-print">
        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">ПДВ:</span>
        <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => onUpdateVatMode('none')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${
              vatMode === 'none' 
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400' 
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Без ПДВ
          </button>
          <button
            onClick={() => onUpdateVatMode('add')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${
              vatMode === 'add' 
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400' 
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Нарахувати (+20%)
          </button>
          <button
            onClick={() => onUpdateVatMode('extract')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${
              vatMode === 'extract' 
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400' 
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Вилучити (в т.ч. 20%)
          </button>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <tfoot className="bg-gray-50 dark:bg-slate-900/50 border-t-2 border-gray-300 dark:border-slate-700">
            {/* Subtotal row - hide on print if no VAT */}
            <tr className={`bg-gray-50/30 dark:bg-slate-800/10 ${vatMode === 'none' ? 'print:hidden' : ''}`}>
              <td colSpan={3} className="px-3 py-2 text-right text-xs text-gray-500 dark:text-slate-400">
                Разом (без ПДВ):
              </td>
              <td className="px-1 py-2 text-center bg-blue-50/30 dark:bg-blue-900/10 cost-column text-gray-600 dark:text-slate-400"></td>
              <td className="px-1 py-2 text-center bg-blue-50/30 dark:bg-blue-900/10 cost-column text-gray-500 dark:text-slate-400 underline decoration-gray-300 dark:decoration-slate-700">
                {formatCurrency(convert(costSubtotal, 'USD', activeCurrency), activeCurrency)}
              </td>
              <td className="px-1 py-2 text-center bg-green-50/30 dark:bg-green-900/10 no-print"></td>
              <td className="px-1 py-2 text-center bg-green-50/30 dark:bg-green-900/10 text-gray-600 dark:text-slate-400">
                {formatCurrency(convert(saleSubtotal, 'USD', activeCurrency), activeCurrency)}
              </td>
              <td className="no-print"></td>
            </tr>

            {/* VAT row */}
            {vatMode !== 'none' && (
              <tr className="bg-gray-50/30 dark:bg-slate-800/10">
                <td colSpan={3} className="px-3 py-2 text-right text-xs text-gray-500 dark:text-slate-400 italic">
                  {vatMode === 'add' ? 'ПДВ (20%):' : 'в т.ч. ПДВ (20%):'}
                </td>
                <td className="px-1 py-2 text-center bg-blue-50/30 dark:bg-blue-900/10 cost-column"></td>
                <td className="px-1 py-2 text-center bg-blue-50/30 dark:bg-blue-900/10 cost-column"></td>
                <td className="px-1 py-2 text-center bg-green-50/30 dark:bg-green-900/10 no-print"></td>
                <td className="px-1 py-2 text-center bg-green-50/30 dark:bg-green-900/10 text-gray-500 dark:text-slate-400 font-medium">
                  {formatCurrency(convert(vatAmount, 'USD', activeCurrency), activeCurrency)}
                </td>
                <td className="no-print"></td>
              </tr>
            )}

            {/* GRAND TOTAL ROW */}
            <tr className="font-bold bg-gray-100/50 dark:bg-slate-800/30">
              <td colSpan={3} className="px-3 py-2 print:py-1.5 text-right uppercase tracking-wider text-xs text-gray-700 dark:text-slate-300">
                {vatMode === 'none' ? 'Загальний підсумок:' : 'Всього до сплати (з ПДВ):'}
              </td>
              <td className="px-1 py-4 text-center bg-blue-50/50 dark:bg-blue-900/20 cost-column"></td>
              <td className="px-1 py-4 text-center bg-blue-50/50 dark:bg-blue-900/20 cost-column text-gray-700 dark:text-slate-300 font-black">
                {formatCurrency(convert(costSubtotal, 'USD', activeCurrency), activeCurrency)}
              </td>
              <td className="px-1 py-4 text-center bg-green-50/50 dark:bg-green-900/20 no-print"></td>
              <td className="px-1 py-4 text-center bg-green-50/50 dark:bg-green-900/20 text-primary dark:text-blue-400 text-lg print:text-base font-black">
                {formatCurrency(convert(total, 'USD', activeCurrency), activeCurrency)}
              </td>
              <td className="no-print"></td>
            </tr>
            <tr className="text-xs bg-white dark:bg-slate-900 no-print profit-row">
              <td colSpan={3} className="px-3 py-2 text-right text-gray-400 dark:text-slate-500 font-medium">
                Маржинальність пропозиції:
              </td>
              <td colSpan={5} className="px-3 py-2 text-right font-bold">
                <span className="text-green-600 dark:text-green-400 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded">
                  Прибуток: {formatCurrency(convert(profit, 'USD', activeCurrency), activeCurrency)} ({profitPercent.toFixed(1)}%)
                </span>
              </td>
              <td className="no-print"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Currency Note */}
      <div className="text-xs text-gray-400 mt-3 font-medium italic border-t border-gray-100 pt-2">
        * Розрахунок проведено за курсом:
        <span className="ml-2 font-bold text-gray-500">1 USD = {usdRate} грн</span>
        <span className="ml-4 font-bold text-gray-500">1 EUR = {eurRate} грн</span>
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
          Примітки
        </label>
        <textarea
          value={notes || ''}
          onChange={(e) => onUpdateNotes(e.target.value)}
          rows={2}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary focus:border-transparent transition-colors"
          placeholder="Додаткова інформація..."
        />
      </div>
    </>
  );
}
