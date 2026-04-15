import { formatCurrency } from '../../utils/currency';
import type { Currency } from '../../types';

interface ProposalSummaryProps {
  itemsCount: number;
  costSubtotal: number;
  saleSubtotal: number;
  profit: number;
  profitPercent: number;
  activeCurrency: Currency;
  usdRate: number;
  eurRate: number;
  notes: string;
  onUpdateNotes: (notes: string) => void;
  convert: (amount: number, from: Currency, to: Currency) => number;
}

export function ProposalSummary({
  itemsCount,
  costSubtotal,
  saleSubtotal,
  profit,
  profitPercent,
  activeCurrency,
  usdRate,
  eurRate,
  notes,
  onUpdateNotes,
  convert,
}: ProposalSummaryProps) {
  if (itemsCount === 0) return null;

  return (
    <>
      {/* Summary Footer */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-[11px]">
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr className="font-bold bg-gray-100/50">
              <td colSpan={4} className="px-2 py-3 text-right uppercase tracking-wider text-[10px] text-gray-500">
                Загальний підсумок:
              </td>
              <td className="px-1 py-3 text-center bg-blue-50/50 cost-column text-gray-600"></td>
              <td className="px-1 py-3 text-center bg-blue-50/50 cost-column text-gray-700">
                {formatCurrency(convert(costSubtotal, 'USD', activeCurrency), activeCurrency)}
              </td>
              <td className="px-1 py-3 text-center bg-green-50/50 no-print"></td>
              <td className="px-1 py-3 text-center bg-green-50/50 text-primary text-[14px]">
                {formatCurrency(convert(saleSubtotal, 'USD', activeCurrency), activeCurrency)}
              </td>
              <td className="no-print"></td>
            </tr>
            <tr className="text-[10px] bg-white no-print">
              <td colSpan={3} className="px-2 py-1.5 text-right text-gray-400 font-medium">
                Маржинальність пропозиції:
              </td>
              <td colSpan={5} className="px-2 py-1.5 text-right font-bold">
                <span className="text-green-600 px-2 py-0.5 bg-green-50 rounded">
                  Прибуток: {formatCurrency(convert(profit, 'USD', activeCurrency), activeCurrency)} ({profitPercent.toFixed(1)}%)
                </span>
              </td>
              <td className="no-print"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Currency Note */}
      <div className="text-[10px] text-gray-400 mt-2 font-medium italic border-t border-gray-100 pt-1">
        * Розрахунок проведено за курсом:
        <span className="ml-2 font-bold">1 USD = {usdRate} грн</span>
        <span className="ml-4 font-bold">1 EUR = {eurRate} грн</span>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Примітки
        </label>
        <textarea
          value={notes || ''}
          onChange={(e) => onUpdateNotes(e.target.value)}
          rows={2}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
          placeholder="Додаткова інформація..."
        />
      </div>
    </>
  );
}
