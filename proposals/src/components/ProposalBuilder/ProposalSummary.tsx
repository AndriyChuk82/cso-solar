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
      {/* VAT Selector - Tabs Style */}
      <div className="flex items-center gap-2 mb-2 no-print">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ПДВ:</span>
        <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={() => onUpdateVatMode('none')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${
              vatMode === 'none' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Без ПДВ
          </button>
          <button
            onClick={() => onUpdateVatMode('add')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${
              vatMode === 'add' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Нарахувати (+20%)
          </button>
          <button
            onClick={() => onUpdateVatMode('extract')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition ${
              vatMode === 'extract' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Вилучити (в т.ч. 20%)
          </button>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-[11px]">
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            {/* Subtotal row */}
            <tr className="bg-gray-50/30">
              <td colSpan={4} className="px-2 py-1.5 text-right text-[10px] text-gray-500">
                Разом (без ПДВ):
              </td>
              <td className="px-1 py-1.5 text-center bg-blue-50/30 cost-column text-gray-600"></td>
              <td className="px-1 py-1.5 text-center bg-blue-50/30 cost-column text-gray-500 underline decoration-gray-300">
                {formatCurrency(convert(costSubtotal, 'USD', activeCurrency), activeCurrency)}
              </td>
              <td className="px-1 py-1.5 text-center bg-green-50/30 no-print"></td>
              <td className="px-1 py-1.5 text-center bg-green-50/30 text-gray-600">
                {formatCurrency(convert(saleSubtotal, 'USD', activeCurrency), activeCurrency)}
              </td>
              <td className="no-print"></td>
            </tr>

            {/* VAT row */}
            {vatMode !== 'none' && (
              <tr className="bg-gray-50/30">
                <td colSpan={4} className="px-2 py-1.5 text-right text-[10px] text-gray-500 italic">
                  {vatMode === 'add' ? 'ПДВ (20%):' : 'в т.ч. ПДВ (20%):'}
                </td>
                <td className="px-1 py-1.5 text-center bg-blue-50/30 cost-column"></td>
                <td className="px-1 py-1.5 text-center bg-blue-50/30 cost-column"></td>
                <td className="px-1 py-1.5 text-center bg-green-50/30 no-print"></td>
                <td className="px-1 py-1.5 text-center bg-green-50/30 text-gray-500 font-medium">
                  {formatCurrency(convert(vatAmount, 'USD', activeCurrency), activeCurrency)}
                </td>
                <td className="no-print"></td>
              </tr>
            )}

            {/* GRAND TOTAL ROW */}
            <tr className="font-bold bg-gray-100/50">
              <td colSpan={4} className="px-2 py-3 text-right uppercase tracking-wider text-[10px] text-gray-700">
                {vatMode === 'none' ? 'Загальний підсумок:' : 'Всього до сплати (з ПДВ):'}
              </td>
              <td className="px-1 py-3 text-center bg-blue-50/50 cost-column"></td>
              <td className="px-1 py-3 text-center bg-blue-50/50 cost-column text-gray-700 font-black">
                {formatCurrency(convert(costSubtotal, 'USD', activeCurrency), activeCurrency)}
              </td>
              <td className="px-1 py-3 text-center bg-green-50/50 no-print"></td>
              <td className="px-1 py-3 text-center bg-green-50/50 text-primary text-[16px] font-black">
                {formatCurrency(convert(total, 'USD', activeCurrency), activeCurrency)}
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
