import { useState, useMemo, useEffect } from 'react';
import { Plus, X, Save, Trash2, Edit2, Package } from 'lucide-react';
import { useProposalStore, clearProductsCache } from '../store';
import { Product, Currency } from '../types';
import { formatCurrency } from '../utils/currency';
import { addCustomMaterial as addCustomMaterialAPI, deleteCustomMaterial as deleteCustomMaterialAPI } from '../services/api';

interface CustomMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string;
}

export function CustomMaterialsModal({ isOpen, onClose, initialProductId }: CustomMaterialsModalProps) {
  const customMaterials = useProposalStore((state) => state.customMaterials);
  const products = useProposalStore((state) => state.products);
  const addCustomMaterial = useProposalStore((state) => state.addCustomMaterial);
  const removeCustomMaterial = useProposalStore((state) => state.removeCustomMaterial);
  const loadProducts = useProposalStore((state) => state.loadProducts);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    currency: 'USD' as Currency,
    unit: 'шт',
    description: '',
    manufacturer: '',
    category: 'Різне',
  });

  // Initialize for editing if opened from a ProductCard
  useEffect(() => {
    if (initialProductId && isOpen) {
      // Look in both custom materials and spreadsheet products
      const allPossible = [...customMaterials, ...products];
      const material = allPossible.find(m => m.id === initialProductId);

      if (material) {
        setFormData({
          name: material.name,
          price: material.price.toString(),
          currency: material.currency,
          unit: material.unit,
          description: material.description || '',
          manufacturer: material.manufacturer || '',
          category: material.category || 'Різне',
        });
        setEditingId(material.id);
        setShowForm(true);
      }
    }
  }, [initialProductId, isOpen, customMaterials, products]);

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      currency: 'USD',
      unit: 'шт',
      description: '',
      manufacturer: '',
      category: 'Різне',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (material: Product) => {
    setFormData({
      name: material.name,
      price: material.price.toString(),
      currency: material.currency,
      unit: material.unit,
      description: material.description || '',
      manufacturer: material.manufacturer || '',
      category: material.category || 'Різне',
    });
    setEditingId(material.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price) return;

    setIsSaving(true);

    try {
      const materialData: Product = {
        id: editingId || `custom_${Date.now()}`,
        name: formData.name.trim(),
        category: formData.category,
        mainCategory: 'Власні матеріали',
        price: parseFloat(formData.price),
        currency: formData.currency,
        unit: formData.unit,
        description: formData.description.trim(),
        manufacturer: formData.manufacturer.trim(),
        inStock: true,
        isCustom: true,
      };

      if (editingId) {
        // Редагування існуючого - оновлюємо локально
        removeCustomMaterial(editingId);
        addCustomMaterial(materialData);
        alert('✅ Товар оновлено локально');
      } else {
        // Додавання нового - зберігаємо в Google Sheets
        const result = await addCustomMaterialAPI(materialData);

        if (result.success && result.product) {
          // Додаємо в локальний стор (без перезавантаження сторінки)
          addCustomMaterial(result.product);

          // Очищаємо кеш щоб при наступному оновленні завантажилось з сервера
          clearProductsCache();

          alert('✅ Товар додано та збережено в Google Sheets');
        } else {
          alert('❌ Помилка: ' + (result.error || 'Не вдалося зберегти товар'));
          return;
        }
      }

      resetForm();
    } catch (error) {
      console.error('Failed to save material:', error);
      alert('❌ Помилка збереження товару');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Видалити цей матеріал?')) return;

    setIsSaving(true);

    try {
      // Спочатку видаляємо з локального стору (миттєво)
      removeCustomMaterial(id);
      if (editingId === id) resetForm();

      // Потім видаляємо з Google Sheets в фоні
      deleteCustomMaterialAPI(id).then((success: any) => {
        if (!success) {
          console.warn('Failed to delete from Google Sheets, but removed locally');
        }
      }).catch((error: any) => {
        console.error('Failed to delete from Google Sheets:', error);
      });

      alert('✅ Товар видалено');
    } catch (error) {
      console.error('Failed to delete material:', error);
      alert('❌ Помилка видалення товару');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-[100] p-4 overflow-y-auto pt-20">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛠️</span>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">
              Мої товари ({customMaterials.length})
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="p-1.5 bg-primary text-white rounded hover:bg-opacity-90 transition shadow-sm"
                title="Додати матеріал"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 rounded transition text-gray-500"
              title="Закрити"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-white">
          {/* Форма */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-4 shadow-inner">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Назва *</label>
                  <input
                    type="text"
                    autoFocus
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                    placeholder="Назва товару"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="col-span-6">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Категорія *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                    disabled={isSaving}
                  >
                    <option value="Кріплення">Кріплення</option>
                    <option value="Розхідники">Розхідники</option>
                    <option value="Кабель солярний">Кабель солярний</option>
                    <option value="Різне">Різне</option>
                  </select>
                </div>

                <div className="col-span-6">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Од. вим.</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                    placeholder="шт, м..."
                    disabled={isSaving}
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ціна *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                    placeholder="0.00"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Валюта</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                    disabled={isSaving}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="UAH">UAH (₴)</option>
                  </select>
                </div>

                <div className="col-span-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Виробник</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                    placeholder="Бренд"
                    disabled={isSaving}
                  />
                </div>

                <div className="col-span-12">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Опис / Характеристики</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={1}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white"
                    placeholder="Параметри, розміри тощо..."
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Збереження...' : (editingId ? 'Оновити' : 'Зберегти')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-bold text-xs uppercase tracking-wider hover:bg-gray-300 disabled:opacity-50"
                >
                  Скасувати
                </button>
              </div>
            </form>
          )}

          {/* Список */}
          <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
            {customMaterials.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">Список порожній</p>
              </div>
            ) : (
              [...customMaterials].reverse().map((material) => (
                <div
                  key={material.id}
                  className={`group flex items-center justify-between p-2 rounded border transition-all ${
                    editingId === material.id ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                       <h4 className="text-xs font-bold text-gray-900 truncate">{material.name}</h4>
                       <span className="text-[10px] text-gray-400 font-medium px-1 bg-gray-100 rounded">{material.unit}</span>
                    </div>
                    {(material.description || material.manufacturer) && (
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {[material.manufacturer, material.description].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-primary">
                      {formatCurrency(material.price, material.currency)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(material)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Редагувати"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(material.id, e)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Видалити"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="text-[11px] font-bold text-gray-500 hover:text-gray-800 uppercase tracking-widest transition"
          >
            Закрити вікно
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomMaterialsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1 text-primary hover:bg-primary/5 rounded border border-primary/20 transition-all hover:border-primary/40"
        title="Керування власними матеріалами"
      >
        <span className="text-xs">🛠️</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">Мої товари</span>
      </button>
      <CustomMaterialsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
