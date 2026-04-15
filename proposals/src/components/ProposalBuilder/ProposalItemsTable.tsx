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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-1 py-1.5 text-left font-semibold text-gray-700 w-6">#</th>
              <th className="px-1 py-2 text-left font-semibold text-gray-700">Назва / Опис товару</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 w-12">Од.</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 w-16">Кіл.</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 w-24 bg-blue-50/40 cost-column">Собів. ({activeCurrency})</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 w-24 bg-blue-50/60 cost-column">Сума соб.</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 w-24 bg-green-50/40">Ціна ({activeCurrency})</th>
              <th className="px-1 py-2 text-center font-semibold text-gray-700 w-24 bg-green-50/60 font-bold text-gray-900">Сума</th>
              <th className="px-1 py-2 w-10 no-print"></th>
            </tr>
          </thead>
          <tbody>
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
            <tr className="no-print border-t border-gray-50 hover:bg-gray-50/50 transition-all">
              <td colSpan={9} className="px-4 py-2">
                <button
                  onClick={onAddManualItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-primary/70 hover:text-primary transition-all uppercase tracking-wide group"
                >
                  <div className="p-0.5 bg-primary/10 rounded group-hover:bg-primary/20 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  Додати довільну позицію
                </button>
              </td>
            </tr>

            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
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
