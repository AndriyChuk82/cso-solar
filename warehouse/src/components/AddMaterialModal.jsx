import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Package } from 'lucide-react';
import { fetchCPCatalog } from '../api/externalApi';
import CONFIG from '../config';

export default function AddMaterialModal({ isOpen, onClose, onAdd }) {
  const [productName, setProductName] = useState('');
  const [unit, setUnit] = useState('шт.');
  const [plannedQty, setPlannedQty] = useState(1);
  const [actualQty, setActualQty] = useState(1);
  const [notes, setNotes] = useState('');

  // Catalog search / autocomplete
  const [catalog, setCatalog] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showCatalogList, setShowCatalogList] = useState(false);

  const mouseDownOnOverlay = useRef(false);

  const handleOverlayMouseDown = (e) => {
    mouseDownOnOverlay.current = (e.target === e.currentTarget);
  };

  const handleOverlayClick = (e) => {
    if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
      onClose();
    }
    mouseDownOnOverlay.current = false;
  };

  useEffect(() => {
    if (isOpen) {
      setProductName('');
      setUnit('шт.');
      setPlannedQty(1);
      setActualQty(1);
      setNotes('');
      setCatalogSearch('');
      setShowCatalogList(false);
      loadCatalog();
    }
  }, [isOpen]);

  const loadCatalog = async () => {
    try {
      const items = await fetchCPCatalog();
      setCatalog(items || []);
    } catch (err) {
      console.warn('Catalog load error:', err);
    }
  };

  if (!isOpen) return null;

  const handleSelectCatalogItem = (item) => {
    setProductName(item.name);
    if (item.unit) setUnit(item.unit);
    setShowCatalogList(false);
  };

  const filteredCatalog = catalogSearch.trim()
    ? catalog.filter(c => c.name.toLowerCase().includes(catalogSearch.toLowerCase())).slice(0, 10)
    : catalog.slice(0, 10);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productName.trim()) return;

    onAdd({
      id: crypto.randomUUID(),
      product_name: productName.trim(),
      unit: unit.trim() || 'шт.',
      planned_qty: parseFloat(plannedQty || 0),
      actual_qty: parseFloat(actualQty || 0),
      is_custom: true,
      notes: notes.trim()
    });

    onClose();
  };

  return createPortal(
    <div 
      className="modal-overlay" 
      onMouseDown={handleOverlayMouseDown} 
      onClick={handleOverlayClick}
    >
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="sheet-handle" />
        
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Package className="text-primary" size={22} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Додати позицію матеріалу</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5 rounded-full">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-4" style={{ padding: '16px 20px' }}>
          {/* Quick select from catalog */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">
              Пошук у каталозі Складу/КП (необов'язково):
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Введіть для швидкого вибору..."
                className="form-input w-full text-sm"
                value={catalogSearch}
                onChange={e => {
                  setCatalogSearch(e.target.value);
                  setShowCatalogList(true);
                }}
                onFocus={() => setShowCatalogList(true)}
              />
              {showCatalogList && filteredCatalog.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filteredCatalog.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectCatalogItem(item)}
                      className="px-3 py-2 text-xs hover:bg-primary/10 cursor-pointer border-b border-gray-100 dark:border-neutral-700/50 last:border-0"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                      {item.unit && <span className="ml-2 text-gray-400">({item.unit})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hr border-t border-gray-100 dark:border-neutral-800" />

          {/* Product Name (Custom text) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
              Назва матеріалу / обладнання *
            </label>
            <input
              type="text"
              required
              placeholder="Наприклад: Кабель СІП-4 4х16 або Кронштейн фасадний"
              className="form-input w-full text-sm font-medium"
              value={productName}
              onChange={e => setProductName(e.target.value)}
            />
          </div>

          {/* Unit & Quantities */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Одиниця вим.</label>
              <select
                className="form-select w-full text-sm"
                value={unit}
                onChange={e => setUnit(e.target.value)}
              >
                {(CONFIG.UNITS || ['шт', 'компл', 'м', 'кг', 'уп']).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
                <option value="м.п.">м.п.</option>
                <option value="пач.">пач.</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Заплановано</label>
              <input
                type="number"
                step="any"
                min="0"
                className="form-input w-full text-sm font-semibold"
                value={plannedQty}
                onChange={e => setPlannedQty(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Фактично</label>
              <input
                type="number"
                step="any"
                min="0"
                className="form-input w-full text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                value={actualQty}
                onChange={e => setActualQty(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Примітка</label>
            <input
              type="text"
              placeholder="Додатковий коментар (опціонально)"
              className="form-input w-full text-sm"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary text-sm">
              Скасувати
            </button>
            <button type="submit" className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={16} /> Додати позицію
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
