import { formatCurrency } from '../../utils/currency';
import type { Currency } from '../../types';

interface ProposalSummaryProps {
  itemsCount: number;
  costSubtotal: number;
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
  showCostPrices?: boolean;
}

export function ProposalSummary({
  itemsCount,
  costSubtotal,
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
  showCostPrices = true,
}: ProposalSummaryProps) {
  if (itemsCount === 0) return null;

  return (
    <>

      {/* Summary Footer */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <tfoot className="dark:bg-slate-900/50 border-t-2 border-[#f59e0b]" style={{ backgroundColor: '#faf5ec' }}>
            {/* Subtotal row - hide on print if no VAT */}
            <tr className={`bg-gray-50/30 dark:bg-slate-800/10 print:bg-transparent ${vatMode === 'none' ? 'print:hidden' : ''}`}>
              <td colSpan={3} className="px-3 py-2 text-right text-xs text-gray-500 dark:text-slate-400">
                Разом (без ПДВ):
              </td>
              {showCostPrices && (
                <>
                  <td className="px-1 py-2 text-center bg-blue-50/30 dark:bg-blue-900/10 cost-column text-gray-600 dark:text-slate-400 print:bg-transparent"></td>
                  <td className="px-1 py-2 text-center bg-blue-50/30 dark:bg-blue-900/10 cost-column text-gray-500 dark:text-slate-400 underline decoration-gray-300 dark:decoration-slate-700 print:bg-transparent">
                    {formatCurrency(costSubtotal, activeCurrency)}
                  </td>
                </>
              )}
              <td className="px-1 py-2 text-center bg-green-50/30 dark:bg-green-900/10 no-print"></td>
              <td className="px-1 py-2 text-center bg-green-50/30 dark:bg-green-900/10 text-gray-600 dark:text-slate-400 print:bg-transparent">
                {formatCurrency(total - vatAmount, activeCurrency)}
              </td>
              <td className="no-print"></td>
            </tr>

            {/* VAT row */}
            {vatMode !== 'none' && (
              <tr className="bg-gray-50/30 dark:bg-slate-800/10 print:bg-transparent">
                <td colSpan={3} className="px-3 py-2 text-right text-xs text-gray-500 dark:text-slate-400 italic">
                  {vatMode === 'add' ? 'ПДВ (20%):' : 'в т.ч. ПДВ (20%):'}
                </td>
                {showCostPrices && (
                  <>
                    <td className="px-1 py-2 text-center bg-blue-50/30 dark:bg-blue-900/10 cost-column"></td>
                    <td className="px-1 py-2 text-center bg-blue-50/30 dark:bg-blue-900/10 cost-column"></td>
                  </>
                )}
                <td className="px-1 py-2 text-center bg-green-50/30 dark:bg-green-900/10 no-print"></td>
                <td className="px-1 py-2 text-center bg-green-50/30 dark:bg-green-900/10 text-gray-500 dark:text-slate-400 font-medium">
                  {formatCurrency(vatAmount, activeCurrency)}
                </td>
                <td className="no-print"></td>
              </tr>
            )}

            {/* GRAND TOTAL ROW */}
            <tr className="font-bold dark:bg-slate-800/30" style={{ backgroundColor: '#faf5ec', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
              <td colSpan={3} className="px-3 py-2 print:py-1.5 text-right uppercase tracking-wider text-xs text-gray-700 dark:text-slate-300" style={{ backgroundColor: '#faf5ec' }}>
                {vatMode === 'none' ? 'Загальний підсумок:' : 'Всього до сплати (з ПДВ):'}
              </td>
              {showCostPrices && (
                <>
                  <td className="px-1 py-4 text-center cost-column" style={{ backgroundColor: '#faf5ec' }}></td>
                  <td className="px-1 py-4 text-center cost-column text-gray-700 dark:text-slate-300 font-black" style={{ backgroundColor: '#faf5ec' }}>
                    {formatCurrency(costSubtotal, activeCurrency)}
                  </td>
                </>
              )}
              <td className="px-1 py-4 text-center no-print" style={{ backgroundColor: '#faf5ec' }}></td>
              <td className="px-1 py-4 text-center text-primary dark:text-blue-400 text-lg print:text-base font-black" style={{ backgroundColor: '#faf5ec' }}>
                {formatCurrency(total, activeCurrency)}
              </td>
              <td className="no-print"></td>
            </tr>
            {showCostPrices && (
              <tr className="text-xs bg-white dark:bg-slate-900 no-print profit-row">
                <td colSpan={3} className="px-3 py-2 text-right text-gray-400 dark:text-slate-500 font-medium">
                  Маржинальність пропозиції:
                </td>
                <td colSpan={5} className="px-3 py-2 text-right font-bold">
                  <span className="text-green-600 dark:text-green-400 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded">
                    Прибуток: {formatCurrency(profit, activeCurrency)} ({profitPercent.toFixed(1)}%)
                  </span>
                </td>
                <td className="no-print"></td>
              </tr>
            )}
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
      <div className="dark:bg-slate-900 rounded-lg border border-[#f59e0b]/20 p-2" style={{ backgroundColor: '#faf5ec', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
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
