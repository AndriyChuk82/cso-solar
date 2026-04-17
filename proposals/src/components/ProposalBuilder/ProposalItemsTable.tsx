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
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="px-1 py-1.5 text-left font-semibold text-gray-700 dark:text-slate-400 w-6">#</th>
              <th className="px-1 py-2 text-left font-semibold text-gray-700 dark:text-slate-300">Назва / Опис товару</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 dark:text-slate-400 w-12">Од.</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 dark:text-slate-400 w-16">Кіл.</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 dark:text-slate-400 w-24 bg-blue-50/40 dark:bg-blue-900/10 cost-column">Собів. ({activeCurrency})</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 dark:text-slate-400 w-24 bg-blue-50/60 dark:bg-blue-900/20 cost-column">Сума соб.</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 dark:text-slate-400 w-24 bg-green-50/40 dark:bg-green-900/10">Ціна ({activeCurrency})</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 dark:text-slate-300 w-24 bg-green-50/60 dark:bg-green-900/20 font-bold text-gray-900 dark:text-slate-100">Сума</th>
              <th className="px-1 py-2 w-10 no-print"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
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
            <tr className="no-print border-t border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all">
              <td colSpan={9} className="px-4 py-2">
                <button
                  onClick={onAddManualItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-primary/70 dark:text-blue-400 hover:text-primary transition-all uppercase tracking-wide group"
                >
                  <div className="p-0.5 bg-primary/10 dark:bg-blue-500/10 rounded group-hover:bg-primary/20 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  Додати довільну позицію
                </button>
              </td>
            </tr>

            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-gray-400 dark:text-slate-500">
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
