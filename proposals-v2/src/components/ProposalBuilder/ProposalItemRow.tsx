import { memo, useState, useEffect, useRef } from 'react';
import { formatNumber } from '../../utils/currency';
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
  const displayCostNum = item.displayCost ?? 0;
  const displayPriceNum = item.displayPrice ?? 0;
  const quantityNum = item.quantity ?? 1;

  const costTotal = item.displayCostSum ?? 0;
  const saleTotal = item.displayPriceSum ?? 0;

  const [localCost, setLocalCost] = useState(displayCostNum.toString());
  const [localPrice, setLocalPrice] = useState(displayPriceNum.toString());
  const [localQuantity, setLocalQuantity] = useState(quantityNum.toString());
  const [localUnit, setLocalUnit] = useState(item.unit || 'шт');
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [isEditingUnit, setIsEditingUnit] = useState(false);

  useEffect(() => {
    if (!isEditingCost) {
      setLocalCost(Number(displayCostNum.toFixed(2)).toString());
    }
  }, [displayCostNum, isEditingCost]);

  useEffect(() => {
    if (!isEditingPrice) {
      setLocalPrice(Number(displayPriceNum.toFixed(2)).toString());
    }
  }, [displayPriceNum, isEditingPrice]);

  useEffect(() => {
    if (!isEditingQuantity) {
      setLocalQuantity(quantityNum.toString());
    }
  }, [quantityNum, isEditingQuantity]);

  useEffect(() => {
    if (!isEditingUnit) {
      setLocalUnit(item.unit || 'шт');
    }
  }, [item.unit, isEditingUnit]);

  return (
    <tr className="border-b border-[#e8e4d1]/40 dark:border-slate-800/30 hover:bg-[#faf5ec]/50 dark:hover:bg-slate-800/15 transition-all duration-200 bg-white/20 dark:bg-transparent">
      <td className="px-2 py-2 text-center align-middle" style={{ whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', verticalAlign: 'middle', marginRight: '4px' }} className="no-print">
          <button
            onClick={() => onMoveUp(item.id)}
            disabled={index === 0}
            className={`p-0 w-3 h-3 text-[8px] flex items-center justify-center border-0 bg-transparent cursor-pointer ${index === 0 ? 'opacity-10' : 'opacity-40 hover:opacity-100 text-[#a89a74] dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400'}`}
            title="Вгору"
          >
            ▲
          </button>
          <button
            onClick={() => onMoveDown(item.id)}
            disabled={index === totalItems - 1}
            className={`p-0 w-3 h-3 text-[8px] flex items-center justify-center border-0 bg-transparent cursor-pointer ${index === totalItems - 1 ? 'opacity-10' : 'opacity-40 hover:opacity-100 text-[#a89a74] dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400'}`}
            title="Вниз"
          >
            ▼
          </button>
        </div>
        <span className="inline-block align-middle w-4 text-center text-[10px] text-slate-300 dark:text-slate-600 font-bold">
          {String(index + 1).padStart(2, '0')}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-0.5 transition-all">
          <textarea
            value={item.name ?? item.product?.name ?? ''}
            onChange={(e) => onUpdateField(item.id, 'name', e.target.value)}
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
            rows={1}
            className="w-full px-0 py-0.5 text-xs font-semibold border-0 border-b border-transparent focus:border-amber-500/40 dark:focus:border-slate-700 focus:ring-0 bg-transparent text-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none overflow-hidden"
            placeholder="Назва товару"
            ref={(el) => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }
            }}
          />
          <textarea
            value={item.description || ''}
            onChange={(e) => onUpdateField(item.id, 'description', e.target.value)}
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
            rows={1}
            className="w-full px-0 py-0 text-[10px] border-0 border-b border-transparent focus:border-amber-500/20 dark:focus:border-slate-800 focus:ring-0 bg-transparent text-slate-400 dark:text-slate-500 italic transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none overflow-hidden"
            placeholder="Додати опис..."
            ref={(el) => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }
            }}
          />
          {item.supplierName && (
            <div className="flex mt-1 select-none">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight bg-primary/10 text-primary border border-primary/20">
                Постачальник: {item.supplierName}
              </span>
            </div>
          )}
        </div>
      </td>
      <td className="px-2 py-2 text-center text-xs">
        {isEditingUnit ? (
          <input
            type="text"
            value={localUnit}
            autoFocus
            onBlur={() => setIsEditingUnit(false)}
            onChange={(e) => {
              setLocalUnit(e.target.value);
              onUpdateField(item.id, 'unit', e.target.value);
            }}
            className="w-full px-1 py-0.5 text-center text-xs border border-[#e8e4d1] dark:border-slate-800 rounded bg-white dark:bg-slate-900 focus:outline-none focus:border-amber-500 dark:focus:border-slate-700 text-slate-800 dark:text-slate-100"
          />
        ) : (
          <div
            onClick={() => setIsEditingUnit(true)}
            className="cursor-pointer hover:bg-[#faf5ec]/80 dark:hover:bg-slate-900/60 px-1 py-1 rounded text-slate-500 dark:text-slate-400 font-medium select-none min-h-[24px] flex items-center justify-center transition-all duration-150 cursor-pointer"
          >
            {item.unit || 'шт'}
          </div>
        )}
      </td>
      <td className="px-2 py-2 text-center text-xs">
        {isEditingQuantity ? (
          <input
            type="text"
            inputMode="numeric"
            value={localQuantity}
            autoFocus
            onFocus={(e) => e.target.select()}
            onBlur={() => {
              setIsEditingQuantity(false);
              if (localQuantity === '' || isNaN(parseFloat(localQuantity)) || parseFloat(localQuantity) <= 0) {
                onUpdateQuantity(item.id, 1);
              }
            }}
            onChange={(e) => {
              const val = e.target.value.replace(/\s/g, '');
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setLocalQuantity(val);
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) {
                  onUpdateQuantity(item.id, num);
                }
              }
            }}
            className="w-14 mx-auto px-1 py-0.5 text-center text-xs border border-[#e8e4d1] dark:border-slate-800 rounded bg-white dark:bg-slate-900 focus:outline-none focus:border-amber-500 dark:focus:border-slate-700 text-slate-800 dark:text-slate-100 font-bold"
          />
        ) : (
          <div
            onClick={() => setIsEditingQuantity(true)}
            className="cursor-pointer hover:bg-[#faf5ec]/80 dark:hover:bg-slate-900/60 px-1 py-1 rounded text-slate-800 dark:text-slate-200 font-bold select-none min-h-[24px] flex items-center justify-center transition-all duration-150 cursor-pointer"
          >
            {formatNumber(item.quantity, item.quantity % 1 === 0 ? 0 : 2)}
          </div>
        )}
      </td>
      <td className="px-2 py-2 text-center text-xs cost-column">
        {isEditingCost ? (
          <input
            type="text"
            inputMode="decimal"
            value={localCost}
            autoFocus
            onFocus={(e) => e.target.select()}
            onBlur={() => setIsEditingCost(false)}
            onChange={(e) => {
              const val = e.target.value.replace(/\s/g, '').replace(',', '.');
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setLocalCost(val);
                const num = parseFloat(val);
                if (!isNaN(num)) onUpdateCostPrice(item.id, num);
              }
            }}
            className="w-20 mx-auto px-1 py-0.5 text-center text-xs border border-[#e8e4d1] dark:border-slate-800 rounded bg-white dark:bg-slate-900 focus:outline-none focus:border-amber-500 dark:focus:border-slate-700 text-slate-800 dark:text-slate-100"
          />
        ) : (
          <div
            onClick={() => setIsEditingCost(true)}
            className="cursor-pointer hover:bg-[#faf5ec]/80 dark:hover:bg-slate-900/60 px-1 py-1 rounded text-slate-600 dark:text-slate-300 select-none min-h-[24px] flex items-center justify-center transition-all duration-150 cursor-pointer"
          >
            {formatNumber(displayCostNum)}
          </div>
        )}
      </td>
      <td className="px-2 py-2 text-center text-xs text-slate-500 dark:text-slate-400 cost-column select-none">
        {formatNumber(costTotal)}
      </td>
      <td className="px-2 py-2 text-center text-xs">
        {isEditingPrice ? (
          <input
            type="text"
            inputMode="decimal"
            value={localPrice}
            autoFocus
            onFocus={(e) => e.target.select()}
            onBlur={() => setIsEditingPrice(false)}
            onChange={(e) => {
              const val = e.target.value.replace(/\s/g, '').replace(',', '.');
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setLocalPrice(val);
                const num = parseFloat(val);
                if (!isNaN(num)) onUpdateSalePrice(item.id, num);
              }
            }}
            className="w-20 mx-auto px-1 py-0.5 text-center text-xs border border-[#e8e4d1] dark:border-slate-800 rounded bg-white dark:bg-slate-900 focus:outline-none focus:border-amber-500 dark:focus:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold"
          />
        ) : (
          <div
            onClick={() => setIsEditingPrice(true)}
            className="cursor-pointer hover:bg-[#faf5ec]/80 dark:hover:bg-slate-900/60 px-1 py-1 rounded text-slate-900 dark:text-slate-100 font-bold select-none min-h-[24px] flex items-center justify-center transition-all duration-150 cursor-pointer"
          >
            {formatNumber(displayPriceNum)}
          </div>
        )}
      </td>
      <td className="px-2 py-2 text-center text-xs font-bold text-slate-800 dark:text-slate-100 select-none">
        {formatNumber(saleTotal)}
      </td>
      <td className="px-2 py-2 text-center no-print">
        <button
          onClick={() => onRemove(item.id)}
          className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-md transition-all duration-150"
          title="Видалити"
        >
          ✕
        </button>
      </td>
    </tr>
  );
});
