import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { SELLERS } from '../utils/documents';

export function WarrantyModal({ isOpen, onClose, issueData, onPrint, onComplete }) {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [editedItems, setEditedItems] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [buyer, setBuyer] = useState('');
  const [sealType, setSealType] = useState('fop');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && issueData) {
      const issueItems = issueData.items || [];
      setItems([...issueItems]);
      setSelectedItems(issueItems.map((_, idx) => `item_${idx}`));
      setBuyer(issueData.buyerName || issueData.clientName || '');
      setDate(issueData.date ? issueData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, issueData]);

  if (!isOpen) return null;

  const isComplexDevice = (nameStr = '') => {
    const n = nameStr.toLowerCase();
    const keywords = [
      'інвертор', 'акумулятор', 'акб', 'батарея', 'bms', 'панель', 'сонячн', 'фотомодуль',
      'inverter', 'battery', 'deye', 'victron', 'fronius', 'huawei', 'pylontech', 'dyness', 
      'must', 'growatt', 'goodwe', 'ja solar', 'jinko', 'longi', 'trina', 'risen', 'canadian'
    ];
    return keywords.some(key => n.includes(key));
  };

  const getDefaultWarranty = (nameStr = '') => {
    const n = nameStr.toLowerCase();
    if (n.includes('панель') || n.includes('сонячн') || n.includes('фотомодуль') || n.includes('модуль') ||
        n.includes('ja solar') || n.includes('jinko') || n.includes('longi') || n.includes('trina') || n.includes('risen') || n.includes('canadian')) {
      return '12 років';
    }
    if (n.includes('роботи') || n.includes('монтаж')) {
      return '12 місяців';
    }
    return '5 років';
  };

  const toggleItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((_, idx) => `item_${idx}`));
    }
  };

  const removeItem = (idxToRemove) => {
    setItems(prev => prev.filter((_, idx) => idx !== idxToRemove));
    setSelectedItems(prev => prev.filter(id => id !== `item_${idxToRemove}`));
  };

  const updateItemField = (itemId, field, value) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const handlePrint = () => {
    const sellerInfo = SELLERS.fop_pastushok;

    const itemsData = items
      .map((item, idx) => {
        const itemId = `item_${idx}`;
        const isSelected = selectedItems.includes(itemId);
        if (!isSelected) return null;

        const currentName = editedItems[itemId]?.name ?? item.name ?? item.productName ?? item.product?.name ?? 'Без назви';
        const defaultWarranty = getDefaultWarranty(currentName);

        return {
          ...item,
          selected: true,
          editedName: editedItems[itemId]?.name,
          editedQuantity: editedItems[itemId]?.quantity ?? item.quantity ?? 1,
          serialNumbers: editedItems[itemId]?.serialNumbers || [],
          warrantyPeriod: editedItems[itemId]?.warrantyPeriod ?? defaultWarranty,
        };
      })
      .filter(Boolean);

    const data = {
      selectedItems: itemsData,
      date,
      seller: sellerInfo.fullName,
      sellerAddress: sellerInfo.address,
      buyer,
      sealType,
      notes,
    };

    if (onPrint) onPrint(data);
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            🛡️ Гарантійний талон
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded transition text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Дата продажу
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Електронна печатка
              </label>
              <div className="flex items-center gap-4 pt-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sealType"
                    checked={sealType === 'fop'}
                    onChange={() => setSealType('fop')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-gray-700 dark:text-slate-300">Печатка ФОП</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sealType"
                    checked={sealType === 'cso'}
                    onChange={() => setSealType('cso')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-gray-700 dark:text-slate-300">Печатка ЦСО</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sealType"
                    checked={sealType === 'none'}
                    onChange={() => setSealType('none')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-gray-700 dark:text-slate-300">Без печатки</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Продавець (назва)
              </label>
              <input
                type="text"
                value={SELLERS.fop_pastushok.fullName}
                readOnly
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 rounded text-gray-600 dark:text-slate-400 cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Адреса продавця
              </label>
              <input
                type="text"
                value={SELLERS.fop_pastushok.address}
                readOnly
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 rounded text-gray-600 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Покупець (ПІБ)
            </label>
            <input
              type="text"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary font-medium"
              placeholder="ПІБ Клієнта"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Примітки (додатково)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              placeholder="Додаткова інформація (за потреби)..."
            />
          </div>

          {/* Table of items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-bold text-gray-800 dark:text-slate-200">
                Обладнання під гарантією
              </label>
              <button
                onClick={toggleAll}
                className="text-xs text-primary dark:text-blue-400 hover:underline font-semibold"
              >
                {selectedItems.length === items.length ? 'Зняти всі' : 'Вибрати всі'}
              </button>
            </div>

            <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-2 py-1.5 w-8"></th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-slate-300">Назва</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-slate-300 w-20">Кіл.</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-slate-300 w-48">Серійні номери</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-slate-300 w-28">Гарантія</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const itemId = `item_${idx}`;
                    const isSelected = selectedItems.includes(itemId);
                    const currentName = editedItems[itemId]?.name ?? item.name ?? item.productName ?? item.product?.name ?? 'Без назви';
                    const editedQty = editedItems[itemId]?.quantity ?? item.quantity ?? 1;
                    const defaultWarranty = getDefaultWarranty(currentName);
                    const warrantyPeriod = editedItems[itemId]?.warrantyPeriod ?? defaultWarranty;

                    return (
                      <tr
                        key={itemId}
                        className={`border-b border-gray-100 dark:border-slate-800 ${isSelected ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}
                      >
                        <td className="px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(itemId)}
                            className="w-4 h-4 text-primary rounded focus:ring-1 focus:ring-primary cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={currentName}
                            onChange={(e) => updateItemField(itemId, 'name', e.target.value)}
                            disabled={!isSelected}
                            className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 dark:disabled:bg-slate-900/50 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={editedQty}
                            onChange={(e) => updateItemField(itemId, 'quantity', parseInt(e.target.value) || 1)}
                            disabled={!isSelected}
                            className="w-full px-2 py-1 text-xs text-center border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary font-medium disabled:bg-gray-50 dark:disabled:bg-slate-900/50 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1.5">
                            {(() => {
                              const complex = isComplexDevice(currentName);
                              const serials = editedItems[itemId]?.serialNumbers ?? 
                                Array.from({ length: complex ? editedQty : 1 }).map(() => '');

                              return (
                                <>
                                  {serials.map((sn, snIdx) => (
                                    <div key={`${itemId}-sn-${snIdx}`} className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={sn}
                                        onChange={(e) => {
                                          const newSerials = [...serials];
                                          newSerials[snIdx] = e.target.value;
                                          setEditedItems(prev => ({
                                            ...prev,
                                            [itemId]: { ...prev[itemId], serialNumbers: newSerials }
                                          }));
                                        }}
                                        disabled={!isSelected}
                                        placeholder={complex ? `SN №${snIdx + 1}` : 'SN / Примітка'}
                                        className="flex-1 px-2 py-0.5 text-[11px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 dark:disabled:bg-slate-900/50 font-mono"
                                      />
                                      <div className="flex items-center">
                                        <button
                                          onClick={() => {
                                            const newSerials = [...serials];
                                            newSerials.splice(snIdx + 1, 0, '');
                                            setEditedItems(prev => ({
                                              ...prev,
                                              [itemId]: { ...prev[itemId], serialNumbers: newSerials }
                                            }));
                                          }}
                                          disabled={!isSelected}
                                          className="p-0.5 text-primary hover:text-blue-700 transition"
                                          title="Додати серійний номер"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            const newSerials = serials.filter((_, i) => i !== snIdx);
                                            setEditedItems(prev => ({
                                              ...prev,
                                              [itemId]: { ...prev[itemId], serialNumbers: newSerials }
                                            }));
                                          }}
                                          disabled={!isSelected}
                                          className="p-0.5 text-gray-400 hover:text-red-500 transition"
                                          title="Видалити"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={warrantyPeriod}
                            onChange={(e) => updateItemField(itemId, 'warrantyPeriod', e.target.value)}
                            disabled={!isSelected}
                            className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 dark:disabled:bg-slate-900/50 disabled:text-gray-500 font-medium"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition"
          >
            Скасувати
          </button>
          <button
            onClick={handlePrint}
            disabled={selectedItems.length === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 rounded hover:bg-teal-700 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Друкувати гарантію
          </button>
        </div>
      </div>
    </div>
  );
}
