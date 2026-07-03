import { Plus } from 'lucide-react';
import { ProposalItemRow } from './ProposalItemRow';
import type { Currency } from '../../types';

interface ProposalItemsTableProps {
  items: any[];
  activeCurrency: Currency;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateCostPrice: (itemId: string, price: number) => void;
  onUpdateSalePrice: (itemId: string, price: number) => void;
  onUpdateField: (itemId: string, field: string, value: string) => void;
  onMoveUp: (itemId: string) => void;
  onMoveDown: (itemId: string) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onRemove: (itemId: string) => void;
  onAddManualItem: () => void;
  showCostPrices?: boolean;
}

export function ProposalItemsTable({
  items,
  activeCurrency,
  onUpdateQuantity,
  onUpdateCostPrice,
  onUpdateSalePrice,
  onUpdateField,
  onMoveUp,
  onMoveDown,
  onReorder,
  onRemove,
  onAddManualItem,
  showCostPrices = true,
}: ProposalItemsTableProps) {
  return (
    <div className="bg-[#fbfaf5]/85 dark:bg-slate-900/55 backdrop-blur-lg rounded-xl border border-[#e8e4d1]/65 dark:border-slate-800/40 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-[#faf5ec]/90 dark:bg-slate-900/80 border-b border-[#e8e4d1]/65 dark:border-slate-800/50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
            <tr>
              <th className="px-3 py-3 text-center font-bold text-[#a89a74] dark:text-slate-400 text-[10px] uppercase tracking-wider w-16">#</th>
              <th className="px-3 py-3 text-left font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-wider">Назва / Опис товару</th>
              <th className="px-2 py-3 text-center font-bold text-[#a89a74] dark:text-slate-400 text-[10px] uppercase tracking-wider w-14">Од.</th>
              <th className="px-3 py-3 text-center font-bold text-[#a89a74] dark:text-slate-400 text-[10px] uppercase tracking-wider w-20">Кіл.</th>
              {showCostPrices && (
                <>
                  <th className="px-3 py-3 text-center font-bold text-[#a89a74] dark:text-slate-400 text-[10px] uppercase tracking-wider w-28 cost-column">Собів. ({activeCurrency})</th>
                  <th className="px-3 py-3 text-center font-bold text-[#a89a74] dark:text-slate-400 text-[10px] uppercase tracking-wider w-28 cost-column">Сума соб.</th>
                </>
              )}
              <th className="px-3 py-3 text-center font-bold text-[#a89a74] dark:text-slate-400 text-[10px] uppercase tracking-wider w-28">Ціна ({activeCurrency})</th>
              <th className="px-3 py-3 text-center font-black text-amber-800 dark:text-amber-400 text-[10px] uppercase tracking-wider w-28">Сума</th>
              <th className="px-1 py-3 w-10 no-print"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e4d1]/40 dark:divide-slate-800/40">
            {items.map((item, index) => (
              <ProposalItemRow
                key={item.id}
                item={item}
                index={index}
                totalItems={items.length}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateCostPrice={onUpdateCostPrice}
                onUpdateSalePrice={onUpdateSalePrice}
                onUpdateField={onUpdateField}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onReorder={onReorder}
                onRemove={onRemove}
                showCostPrices={showCostPrices}
              />
            ))}
            
            {/* Minimalist Add Button Row */}
            <tr className="no-print border-t border-[#e8e4d1]/50 dark:border-slate-800/50 hover:bg-[#faf5ec]/50 dark:hover:bg-slate-800/20 transition-all">
              <td colSpan={showCostPrices ? 9 : 7} className="px-4 py-3">
                <button
                  onClick={onAddManualItem}
                  className="flex items-center gap-2 px-3 py-2 text-[10px] font-extrabold text-[#a89a74] dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all uppercase tracking-wider cursor-pointer"
                >
                  <span className="text-xs">+</span> Додати довільну позицію
                </button>
              </td>
            </tr>

            {items.length === 0 && (
              <tr>
                <td colSpan={showCostPrices ? 9 : 7} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
                  <div className="text-4xl mb-3 opacity-20">📋</div>
                  <p className="text-sm font-medium italic">Список порожній. Скористайтесь каталогом або додайте товар вручну.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
