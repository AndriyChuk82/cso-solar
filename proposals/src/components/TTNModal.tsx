import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Proposal, ProposalItem } from '../types';
import { formatCurrency } from '../utils/currency';

interface TTNModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  onPrint?: (data: TTNData) => void;
  onComplete?: () => void;
}

export interface TTNData {
  selectedItems: Array<ProposalItem & { selected: boolean; editedName?: string; editedQuantity?: number }>;
  date: string;
  car: string;
  trailer: string;
  carrier: string;
  driver: string;
  sender: string;
  receiver: string;
  loadPoint: string;
  unloadPoint: string;
  place: string;
  transportType: string;
  carLength: string;
  carWidth: string;
  carHeight: string;
  totalWeightWithCargo: string;
  totalSumWords: string;
  vatSum: string;
  additionalDocs: string;
  sealType: 'none' | 'cso' | 'fop';
}

export function TTNModal({ isOpen, onClose, proposal, onPrint, onComplete }: TTNModalProps) {
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setItems([...proposal.items]);
      setSelectedItems(proposal.items.map(item => item.id));
    }
  }, [isOpen, proposal.items, proposal.seller]);

  const [editedItems, setEditedItems] = useState<Record<string, { name?: string; quantity?: number }>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [car, setCar] = useState('');
  const [trailer, setTrailer] = useState('');
  const [carrier, setCarrier] = useState('');
  const [driver, setDriver] = useState('');
  const [loadPoint, setLoadPoint] = useState('м. Тернопіль');
  const [unloadPoint, setUnloadPoint] = useState(proposal.clientAddress || '');
  const [place, setPlace] = useState('м. Тернопіль');
  const [transportType, setTransportType] = useState('Автомобільні');
  const [carLength, setCarLength] = useState('');
  const [carWidth, setCarWidth] = useState('');
  const [carHeight, setCarHeight] = useState('');
  const [totalWeightWithCargo, setTotalWeightWithCargo] = useState('');
  const [totalSumWords, setTotalSumWords] = useState('');
  const [vatSum, setVatSum] = useState('');
  const [additionalDocs, setAdditionalDocs] = useState('');
  const [sealType, setSealType] = useState<'none' | 'cso' | 'fop'>('none');

  if (!isOpen) return null;

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  };

  const updateItemName = (itemId: string, name: string) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], name }
    }));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity }
    }));
  };

  const handlePrint = () => {
    const itemsData = items
      .filter(item => selectedItems.includes(item.id))
      .map(item => ({
        ...item,
        selected: true,
        editedName: editedItems[item.id]?.name,
        editedQuantity: editedItems[item.id]?.quantity,
      }));

    const data: TTNData = {
      selectedItems: itemsData,
      date,
      car,
      trailer,
      carrier,
      driver,
      sender: proposal.seller?.fullName || '',
      receiver: proposal.clientName || '',
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
    };

    if (onPrint) onPrint(data);
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Товарно-транспортна накладна</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Дата */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Дата складання
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Транспорт & Водій */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Автомобіль (марка, модель, тип, номер)
              </label>
              <input
                type="text"
                value={car}
                onChange={(e) => setCar(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Причіп/напівпричіп (марка, номер)
              </label>
              <input
                type="text"
                value={trailer}
                onChange={(e) => setTrailer(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Автомобільний перевізник
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Водій (ПІБ, № посвідчення)
              </label>
              <input
                type="text"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Відправник / Одержувач */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Вантажовідправник
              </label>
              <input
                type="text"
                value={proposal.seller?.fullName || ''}
                readOnly
                className="w-full px-2 py-1.5 text-xs border border-gray-200 bg-gray-50 rounded text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Вантажоодержувач
              </label>
              <input
                type="text"
                value={proposal.clientName || ''}
                readOnly
                className="w-full px-2 py-1.5 text-xs border border-gray-200 bg-gray-50 rounded text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Пункти завантаження / розвантаження */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Пункт навантаження
              </label>
              <input
                type="text"
                value={loadPoint}
                onChange={(e) => setLoadPoint(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Пункт розвантаження
              </label>
              <input
                type="text"
                value={unloadPoint}
                onChange={(e) => setUnloadPoint(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Місце складання
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Вид перевезень
              </label>
              <input
                type="text"
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Довжина, м
              </label>
              <input
                type="text"
                value={carLength}
                onChange={(e) => setCarLength(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ширина, м
              </label>
              <input
                type="text"
                value={carWidth}
                onChange={(e) => setCarWidth(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Висота, м
              </label>
              <input
                type="text"
                value={carHeight}
                onChange={(e) => setCarHeight(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Заг. вага з вант., т
              </label>
              <input
                type="text"
                value={totalWeightWithCargo}
                onChange={(e) => setTotalWeightWithCargo(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Усього відпущено (словами)
              </label>
              <input
                type="text"
                value={totalSumWords}
                onChange={(e) => setTotalSumWords(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                У тому числі ПДВ
              </label>
              <input
                type="text"
                value={vatSum}
                onChange={(e) => setVatSum(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Супровідні документи на вантаж
            </label>
            <input
              type="text"
              value={additionalDocs}
              onChange={(e) => setAdditionalDocs(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Електронна печатка</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ttnSealType"
                  checked={sealType === 'none'}
                  onChange={() => setSealType('none')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-gray-600">Без печатки</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ttnSealType"
                  checked={sealType === 'cso'}
                  onChange={() => setSealType('cso')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-gray-600">Печатка ЦСО</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ttnSealType"
                  checked={sealType === 'fop'}
                  onChange={() => setSealType('fop')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-gray-600">Печатка ФОП</span>
              </label>
            </div>
          </div>

          {/* Список товарів */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700">
                Товари для відправки
              </label>
              <button
                onClick={toggleAll}
                className="text-xs text-primary hover:underline"
              >
                {selectedItems.length === items.length ? 'Зняти всі' : 'Вибрати всі'}
              </button>
            </div>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 py-1.5 w-8"></th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Назва</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-gray-700 w-16">Од.</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-gray-700 w-16">Кіл.</th>
                    <th className="px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isSelected = selectedItems.includes(item.id);
                    const editedName = editedItems[item.id]?.name;
                    const editedQuantity = editedItems[item.id]?.quantity;

                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(item.id)}
                            className="w-4 h-4 text-primary rounded focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={editedName ?? item.name ?? item.product.name}
                            onChange={(e) => updateItemName(item.id, e.target.value)}
                            disabled={!isSelected}
                            className="w-full px-1.5 py-0.5 text-[11px] border border-gray-200 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center text-gray-600">
                          {item.unit || item.product.unit}
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="1"
                            value={editedQuantity ?? item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                            disabled={!isSelected}
                            className="w-full px-1.5 py-0.5 text-[11px] text-center border border-gray-200 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
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
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition"
          >
            Скасувати
          </button>
          <button
            onClick={handlePrint}
            disabled={selectedItems.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Друкувати ТТН
          </button>
        </div>
      </div>
    </div>
  );
}
