import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { SELLERS, numberToWords } from '../utils/documents';

export function TTNModal({ isOpen, onClose, issueData, onPrint, onComplete }) {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [editedItems, setEditedItems] = useState({});

  const defaultSellerStr = `${SELLERS.fop_pastushok.fullName}, ${SELLERS.fop_pastushok.taxIdType} ${SELLERS.fop_pastushok.taxId}`;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [car, setCar] = useState('');
  const [trailer, setTrailer] = useState('');
  const [carrier, setCarrier] = useState('');
  const [driver, setDriver] = useState('');
  const [sender, setSender] = useState(defaultSellerStr);
  const [receiver, setReceiver] = useState('');
  const [loadPoint, setLoadPoint] = useState('м. Тернопіль');
  const [unloadPoint, setUnloadPoint] = useState('');
  const [place, setPlace] = useState('м. Тернопіль');
  const [transportType, setTransportType] = useState('Автомобільні');
  const [carLength, setCarLength] = useState('');
  const [carWidth, setCarWidth] = useState('');
  const [carHeight, setCarHeight] = useState('');
  const [totalWeightWithCargo, setTotalWeightWithCargo] = useState('');
  const [totalSumWords, setTotalSumWords] = useState('');
  const [vatSum, setVatSum] = useState('');
  const [additionalDocs, setAdditionalDocs] = useState('');
  const [carStoragePlace, setCarStoragePlace] = useState('');
  const [grossWeightWords, setGrossWeightWords] = useState('');
  const [sealType, setSealType] = useState('none');

  useEffect(() => {
    if (isOpen && issueData) {
      const issueItems = issueData.items || [];
      setItems([...issueItems]);
      setSelectedItems(issueItems.map((_, idx) => `item_${idx}`));
      setSender(defaultSellerStr);
      setReceiver(issueData.buyerName || issueData.clientName || '');
      setUnloadPoint(issueData.clientAddress || issueData.address || '');
      setDate(issueData.date ? issueData.date.split('T')[0] : new Date().toISOString().split('T')[0]);

      // Calculate total sum if available
      const totalAmount = issueData.amount || issueItems.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
      if (totalAmount > 0) {
        setTotalSumWords(numberToWords(totalAmount));
      }
    }
  }, [isOpen, issueData]);

  if (!isOpen) return null;

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
    const itemsData = items
      .map((item, idx) => {
        const itemId = `item_${idx}`;
        const isSelected = selectedItems.includes(itemId);
        if (!isSelected) return null;

        return {
          ...item,
          selected: true,
          editedName: editedItems[itemId]?.name,
          editedQuantity: editedItems[itemId]?.quantity ?? item.quantity ?? 1,
        };
      })
      .filter(Boolean);

    const data = {
      selectedItems: itemsData,
      date,
      car,
      trailer,
      carrier,
      driver,
      sender,
      receiver,
      loadPoint,
      unloadPoint,
      place,
      transportType,
      carLength,
      carWidth,
      carHeight,
      totalWeightWithCargo,
      totalSumWords,
      vatSum,
      additionalDocs,
      sealType,
      carStoragePlace,
      grossWeightWords,
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
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            🚚 Товарно-транспортна накладна (ТТН)
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Дата складання</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Автомобіль (марка, модель, тип, номер)</label>
              <input
                type="text"
                value={car}
                onChange={(e) => setCar(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
                placeholder="напр. MAN AA1234BB"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Причіп/напівпричіп (марка, номер)</label>
              <input
                type="text"
                value={trailer}
                onChange={(e) => setTrailer(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Місце де зберігається автомобіль (адреса перевізника/філії)</label>
            <input
              type="text"
              value={carStoragePlace}
              onChange={(e) => setCarStoragePlace(e.target.value)}
              placeholder="Адреса місцезнаходження перевізника чи його філії..."
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Автомобільний перевізник</label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Водій (ПІБ, № посвідчення)</label>
              <input
                type="text"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Вантажовідправник</label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary font-medium"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Вантажоодержувач</label>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Пункт навантаження</label>
              <input
                type="text"
                value={loadPoint}
                onChange={(e) => setLoadPoint(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Пункт розвантаження</label>
              <input
                type="text"
                value={unloadPoint}
                onChange={(e) => setUnloadPoint(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Місце складання</label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Вид перевезень</label>
              <input
                type="text"
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Довжина, м</label>
              <input
                type="text"
                value={carLength}
                onChange={(e) => setCarLength(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Ширина, м</label>
              <input
                type="text"
                value={carWidth}
                onChange={(e) => setCarWidth(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Висота, м</label>
              <input
                type="text"
                value={carHeight}
                onChange={(e) => setCarHeight(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Заг. вага, т</label>
              <input
                type="text"
                value={totalWeightWithCargo}
                onChange={(e) => setTotalWeightWithCargo(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Усього відпущено (словами)</label>
              <input
                type="text"
                value={totalSumWords}
                onChange={(e) => setTotalSumWords(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">У тому числі ПДВ</label>
              <input
                type="text"
                value={vatSum}
                onChange={(e) => setVatSum(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-slate-400 mb-1">Супровідні документи на вантаж</label>
            <input
              type="text"
              value={additionalDocs}
              onChange={(e) => setAdditionalDocs(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary"
              placeholder="Паспорт якості, накладна..."
            />
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Електронна печатка</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ttnSealType"
                  checked={sealType === 'fop'}
                  onChange={() => setSealType('fop')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-gray-600 dark:text-slate-400">Печатка ФОП</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ttnSealType"
                  checked={sealType === 'cso'}
                  onChange={() => setSealType('cso')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-gray-600 dark:text-slate-400">Печатка ЦСО</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ttnSealType"
                  checked={sealType === 'none'}
                  onChange={() => setSealType('none')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-gray-600 dark:text-slate-400">Без печатки</span>
              </label>
            </div>
          </div>

          {/* Table of items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-bold text-gray-700 dark:text-slate-300">Товари для відправки</label>
              <button onClick={toggleAll} className="text-xs text-primary dark:text-blue-400 hover:underline">
                {selectedItems.length === items.length ? 'Зняти всі' : 'Вибрати всі'}
              </button>
            </div>
            <div className="border border-gray-200 dark:border-slate-800 rounded overflow-hidden">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-2 py-1.5 w-8"></th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 dark:text-slate-300">Назва</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-gray-700 dark:text-slate-300 w-16">Од.</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-gray-700 dark:text-slate-300 w-16">Кіл.</th>
                    <th className="px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const itemId = `item_${idx}`;
                    const isSelected = selectedItems.includes(itemId);
                    const editedName = editedItems[itemId]?.name;
                    const editedQuantity = editedItems[itemId]?.quantity;

                    return (
                      <tr key={itemId} className={`border-b border-gray-100 dark:border-slate-800 ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                        <td className="px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(itemId)}
                            className="w-4 h-4 text-primary rounded focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={editedName ?? item.name ?? item.productName ?? item.product?.name ?? ''}
                            onChange={(e) => updateItemField(itemId, 'name', e.target.value)}
                            disabled={!isSelected}
                            className="w-full px-1.5 py-0.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center text-gray-600 dark:text-slate-400">
                          {item.unit || item.product?.unit || 'шт'}
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="1"
                            value={editedQuantity ?? item.quantity ?? 1}
                            onChange={(e) => updateItemField(itemId, 'quantity', parseInt(e.target.value) || 1)}
                            disabled={!isSelected}
                            className="w-full px-1.5 py-0.5 text-center border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 dark:disabled:bg-slate-900/50"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button onClick={() => removeItem(idx)} className="p-1 text-gray-400 hover:text-red-500 rounded transition">
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
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition"
          >
            Скасувати
          </button>
          <button
            onClick={handlePrint}
            disabled={selectedItems.length === 0}
            className="px-5 py-2 font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Друкувати ТТН
          </button>
        </div>
      </div>
    </div>
  );
}
