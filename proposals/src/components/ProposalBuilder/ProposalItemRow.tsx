import { memo, useState, useEffect } from 'react';
import type { Currency } from '../../types';

interface ProposalItemRowProps {
  item: any;
  index: number;
  totalItems: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateCostPrice: (itemId: string, price: number) => void;
  onUpdateSalePrice: (itemId: string, price: number) => void;
  onUpdateField: (itemId: string, field: string, value: string) => void;
  onMoveUp: (itemId: string) => void;
  onMoveDown: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

export const ProposalItemRow = memo(function ProposalItemRow({
  item,
  index,
  totalItems,
  onUpdateQuantity,
  onUpdateCostPrice,
  onUpdateSalePrice,
  onUpdateField,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ProposalItemRowProps) {
  const costTotal = item.displayCost * item.quantity;
  const saleTotal = item.displayPrice * item.quantity;

  const [localCost, setLocalCost] = useState(item.displayCost.toString());
  const [localPrice, setLocalPrice] = useState(item.displayPrice.toString());
  const [localQuantity, setLocalQuantity] = useState(item.quantity.toString());
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);

  useEffect(() => {
    if (!isEditingCost) {
      setLocalCost(Number(item.displayCost.toFixed(2)).toString());
    }
  }, [item.displayCost, isEditingCost]);

  useEffect(() => {
    if (!isEditingPrice) {
      setLocalPrice(Number(item.displayPrice.toFixed(2)).toString());
    }
  }, [item.displayPrice, isEditingPrice]);

  useEffect(() => {
    if (!isEditingQuantity) {
      setLocalQuantity(item.quantity.toString());
    }
  }, [item.quantity, isEditingQuantity]);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="px-1 py-1 text-center align-middle" style={{ whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', verticalAlign: 'middle', marginRight: '4px' }} className="no-print">
          <button
            onClick={() => onMoveUp(item.id)}
            disabled={index === 0}
            className={`p-0 w-3 h-3 text-[8px] flex items-center justify-center border-0 bg-transparent cursor-pointer ${index === 0 ? 'opacity-20' : 'opacity-60 hover:opacity-100 text-primary'}`}
            title="Вгору"
          >
            ▲
          </button>
          <button
            onClick={() => onMoveDown(item.id)}
            disabled={index === totalItems - 1}
            className={`p-0 w-3 h-3 text-[8px] flex items-center justify-center border-0 bg-transparent cursor-pointer ${index === totalItems - 1 ? 'opacity-20' : 'opacity-60 hover:opacity-100 text-primary'}`}
            title="Вниз"
          >
            ▼
          </button>
        </div>
        <span className="inline-block align-middle w-4 text-left text-[10px] text-gray-400">
          {index + 1}
        </span>
      </td>
      <td className="px-1 py-1">
        <input
          type="text"
          value={item.name ?? item.product.name}
          onChange={(e) => onUpdateField(item.id, 'name', e.target.value)}
          className="w-full px-1.5 py-0.5 text-[0.88rem] border border-transparent hover:border-gray-200 focus:border-primary focus:ring-0 rounded bg-transparent font-medium transition-all"
          placeholder="Назва"
        />
        <input
          type="text"
          value={item.description || ''}
          onChange={(e) => onUpdateField(item.id, 'description', e.target.value)}
          className="w-full px-1.5 py-0.5 text-[0.7rem] border border-transparent hover:border-gray-200 focus:border-primary focus:ring-0 rounded bg-transparent text-[#94a3b8] italic transition-all"
          placeholder="Опис (опціонально)"
        />
      </td>
      <td className="px-1 py-1 text-center">
        <input
          type="text"
          value={item.unit}
          onChange={(e) => onUpdateField(item.id, 'unit', e.target.value)}
          className="w-full px-1 py-0.5 text-[10px] border border-transparent hover:border-gray-200 focus:border-primary focus:ring-0 rounded text-center bg-transparent transition-all"
        />
      </td>
      <td className="px-1 py-1">
        <input
          type="text"
          inputMode="numeric"
          value={isEditingQuantity ? localQuantity : item.quantity}
          onFocus={() => setIsEditingQuantity(true)}
          onChange={(e) => {
            const val = e.target.value;
            // Дозволяємо лише цифри або порожній рядок
            if (val === '' || /^\d*\.?\d*$/.test(val)) {
              setLocalQuantity(val);
              const num = parseFloat(val);
              if (!isNaN(num) && num >= 0) {
                onUpdateQuantity(item.id, num);
              }
            }
          }}
          onBlur={() => {
            setIsEditingQuantity(false);
            if (localQuantity === '' || isNaN(parseFloat(localQuantity)) || parseFloat(localQuantity) <= 0) {
              onUpdateQuantity(item.id, 1);
            }
          }}
          className="w-full px-1 py-0.5 text-[11px] border border-gray-200 rounded text-center font-bold focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </td>
      <td className="px-1 py-1 cost-column">
        <input
          type="number"
          value={isEditingCost ? localCost : item.displayCost.toFixed(2)}
          onFocus={() => setIsEditingCost(true)}
          onChange={(e) => {
            setLocalCost(e.target.value);
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onUpdateCostPrice(item.id, val);
          }}
          onBlur={() => setIsEditingCost(false)}
          className="w-full px-1 py-0.5 text-[11px] border border-gray-200 rounded text-center bg-blue-50/30 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-all"
          step="0.01"
        />
      </td>
      <td className="px-1 py-1 text-center text-[11px] text-gray-600 cost-column bg-blue-50/30">
        {costTotal.toFixed(1)}
      </td>
      <td className="px-1 py-1 bg-green-50/10">
        <input
          type="number"
          value={isEditingPrice ? localPrice : item.displayPrice.toFixed(1)}
          onFocus={() => setIsEditingPrice(true)}
          onChange={(e) => {
            setLocalPrice(e.target.value);
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onUpdateSalePrice(item.id, val);
          }}
          onBlur={() => setIsEditingPrice(false)}
          className="w-full px-1 py-0.5 text-[11px] border border-gray-200 rounded text-center bg-white focus:border-green-400 focus:ring-1 focus:ring-green-200 transition-all font-medium"
          step="0.1"
        />
      </td>
      <td className="px-1 py-1 text-center font-bold text-[12px] text-gray-900 bg-green-50/30">
        {saleTotal.toFixed(1)}
      </td>
      <td className="px-1 py-1 text-center no-print">
        <button
          onClick={() => onRemove(item.id)}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
          title="Видалити"
        >
          ✕
        </button>
      </td>
    </tr>
  );
});
