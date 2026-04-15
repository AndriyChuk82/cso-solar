import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Proposal, ProposalItem } from '../types';

interface WarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  onPrint?: (data: WarrantyData) => void;
  onComplete?: () => void;
}

export interface WarrantyData {
  selectedItems: Array<ProposalItem & {
    selected: boolean;
    editedName?: string;
    editedQuantity?: number;
    serialNumber?: string;
    warrantyPeriod?: string;
  }>;
  date: string;
  seller: string;
  sellerAddress: string;
  buyer: string;
  sealType: 'none' | 'cso' | 'fop';
  notes: string;
}

export function WarrantyModal({ isOpen, onClose, proposal, onPrint, onComplete }: WarrantyModalProps) {
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setItems([...proposal.items]);
      setSelectedItems(proposal.items.map(item => item.id));
      setBuyer(proposal.clientName || '');
    }
  }, [isOpen, proposal.items, proposal.clientName, proposal.seller]);

  const [editedItems, setEditedItems] = useState<Record<string, {
    name?: string;
    quantity?: number;
    serialNumber?: string;
    warrantyPeriod?: string;
  }>>({});

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [buyer, setBuyer] = useState(proposal.clientName || '');
  const [sealType, setSealType] = useState<'none' | 'cso' | 'fop'>('none');
  const [notes, setNotes] = useState('');

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

  const updateItemField = (itemId: string, field: string, value: string | number) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
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
        serialNumber: editedItems[item.id]?.serialNumber,
        warrantyPeriod: editedItems[item.id]?.warrantyPeriod,
      }));

    const data: WarrantyData = {
      selectedItems: itemsData,
      date,
      seller: proposal.seller?.fullName || '',
      sellerAddress: proposal.seller?.address || proposal.seller?.office || '',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Гарантійний талон</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Дата продажу
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="pt-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Електронна печатка</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sealType"
                    checked={sealType === 'none'}
                    onChange={() => setSealType('none')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-gray-600">Без печатки</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sealType"
                    checked={sealType === 'cso'}
                    onChange={() => setSealType('cso')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-gray-600">Печатка ЦСО</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sealType"
                    checked={sealType === 'fop'}
                    onChange={() => setSealType('fop')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-gray-600">Печатка ФОП</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Продавець (назва)
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
                Адреса продавця
              </label>
              <input
                type="text"
                value={proposal.seller?.address || proposal.seller?.office || ''}
                readOnly
                className="w-full px-2 py-1.5 text-xs border border-gray-200 bg-gray-50 rounded text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Покупець (ПІБ)
            </label>
            <input
              type="text"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              placeholder="Іванов Іван Іванович"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Примітки (додатково)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary"
              placeholder="Додаткова інформація... (за потреби)"
            />
          </div>

          {/* Список товарів */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700">
                Обладнання під гарантією
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
                     <th className="px-2 py-1.5 text-center font-semibold text-gray-700 w-16">Кіл.</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 w-32">Серійний №</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-gray-700 w-24">Гарантія</th>
                    <th className="px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isSelected = selectedItems.includes(item.id);
                    const editedName = editedItems[item.id]?.name;
                    const editedQuantity = editedItems[item.id]?.quantity;
                    const serialNumber = editedItems[item.id]?.serialNumber;
                    const warrantyPeriod = editedItems[item.id]?.warrantyPeriod;

                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 ${isSelected ? 'bg-green-50' : ''}`}
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
                            onChange={(e) => updateItemField(item.id, 'name', e.target.value)}
                            disabled={!isSelected}
                            className="w-full px-1.5 py-0.5 text-[11px] border border-gray-200 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min="1"
                            value={editedQuantity ?? item.quantity}
                            onChange={(e) => updateItemField(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            disabled={!isSelected}
                            className="w-full px-1.5 py-0.5 text-[11px] text-center border border-gray-200 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={serialNumber ?? ''}
                            onChange={(e) => updateItemField(item.id, 'serialNumber', e.target.value)}
                            disabled={!isSelected}
                            placeholder="SN123456"
                            className="w-full px-1.5 py-0.5 text-[11px] border border-gray-200 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={warrantyPeriod ?? item.product.warranty ?? '5 років'}
                            onChange={(e) => updateItemField(item.id, 'warrantyPeriod', e.target.value)}
                            disabled={!isSelected}
                            className="w-full px-1.5 py-0.5 text-[11px] border border-gray-200 rounded focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
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
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Друкувати гарантію
          </button>
        </div>
      </div>
    </div>
  );
}
