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
  onRemove: (itemId: string) => void;
  onAddManualItem: () => void;
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
  onRemove,
  onAddManualItem,
}: ProposalItemsTableProps) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-900 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-900/60" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as any}>
            <tr>
              <th className="px-3 py-3 text-center font-semibold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider w-10">#</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Назва / Опис товару</th>
              <th className="px-2 py-3 text-center font-semibold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider w-14">Од.</th>
              <th className="px-3 py-3 text-center font-semibold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider w-20">Кіл.</th>
              <th className="px-3 py-3 text-center font-semibold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider w-28 cost-column">Собів. ({activeCurrency})</th>
              <th className="px-3 py-3 text-center font-semibold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider w-28 cost-column">Сума соб.</th>
              <th className="px-3 py-3 text-center font-semibold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider w-28">Ціна ({activeCurrency})</th>
              <th className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-wider w-28">Сума</th>
              <th className="px-1 py-3 w-10 no-print"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-900/40">
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
                onRemove={onRemove}
              />
            ))}
            
            {/* Minimalist Add Button Row */}
            <tr className="no-print border-t border-slate-100 dark:border-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
              <td colSpan={9} className="px-4 py-3">
                <button
                  onClick={onAddManualItem}
                  className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all uppercase tracking-wider"
                >
                  <span className="text-xs">+</span> Додати довільну позицію
                </button>
              </td>
            </tr>

            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
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
