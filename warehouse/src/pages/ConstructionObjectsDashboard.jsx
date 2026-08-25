import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SunMedium, Plus, Search, Filter, Phone, MapPin, 
  FileText, ChevronRight, Edit3, Trash2, CheckCircle2 
} from 'lucide-react';
import { 
  constructionService, CONSTRUCTION_STATUSES, PAYMENT_TYPES 
} from '../api/constructionService';
import ConstructionObjectFormModal from '../components/ConstructionObjectFormModal';
import { useToast } from '../context/ToastContext';

export default function ConstructionObjectsDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingObject, setEditingObject] = useState(null);

  useEffect(() => {
    loadObjects();
  }, []);

  const loadObjects = async () => {
    setLoading(true);
    try {
      const res = await constructionService.getObjects();
      if (res.success) {
        setObjects(res.data || []);
      }
    } catch (err) {
      console.error('Error loading construction objects:', err);
      showToast('Не вдалося завантажити об\'єкти будівництва', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingObject(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (e, obj) => {
    e.stopPropagation();
    setEditingObject(obj);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Ви дійсно бажаєте видалити об'єкт "${name}"?`)) return;

    try {
      await constructionService.deleteObject(id);
      showToast('Об\'єкт успішно видалено', 'success');
      loadObjects();
    } catch (err) {
      showToast('Помилка при видаленні об\'єкта', 'error');
    }
  };

  const handleSaveForm = async (formData) => {
    try {
      const res = await constructionService.saveObject(formData);
      if (res.success) {
        showToast(editingObject ? 'Об\'єкт оновлено' : 'Новий об\'єкт створено', 'success');
        loadObjects();
        if (!editingObject && res.data?.id) {
          navigate(`/construction-objects/${res.data.id}`);
        }
      }
    } catch (err) {
      showToast('Помилка при збереженні об\'єкта', 'error');
    }
  };

  // Filter objects
  const filteredObjects = objects.filter(obj => {
    const matchesStatus = statusFilter === 'all' || obj.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      String(obj.client_name || '').toLowerCase().includes(q) ||
      String(obj.phone || '').toLowerCase().includes(q) ||
      String(obj.address || '').toLowerCase().includes(q) ||
      String(obj.proposal_number || '').toLowerCase().includes(q)
    );
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-5 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 rounded-xl">
            <SunMedium size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              Об'єкти будівництва
            </h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 font-medium">
              Перелік сонячних станцій для монтажу, матеріали та супровід клієнтів
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="btn btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm active:scale-95 transition"
          >
            <Plus size={18} />
            <span>Новий об'єкт</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search 
            size={18} 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
          />
          <input
            type="text"
            placeholder="Пошук за ПІБ клієнта, телефоном, адресою або № КП..."
            className="form-input w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50 text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-gray-100 text-gray-600 dark:bg-neutral-700/60 dark:text-neutral-300 hover:bg-gray-200'
            }`}
          >
            Всі об'єкти ({objects.length})
          </button>

          {Object.entries(CONSTRUCTION_STATUSES).map(([key, item]) => {
            const count = objects.filter(o => o.status === key).length;
            const isSelected = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'ring-2 ring-primary bg-primary/10 text-primary font-bold'
                    : 'bg-gray-100 text-gray-700 dark:bg-neutral-700/60 dark:text-neutral-300 hover:bg-gray-200'
                }`}
              >
                <span>{item.label}</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-black/10 dark:bg-white/10 font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Objects Table / List */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="spinner" />
            <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">
              Завантаження об'єктів будівництва...
            </p>
          </div>
        ) : filteredObjects.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <SunMedium size={48} className="text-gray-300 dark:text-neutral-600" />
            <p className="text-base font-bold text-gray-800 dark:text-neutral-200">
              Об'єктів не знайдено
            </p>
            <p className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm">
              {searchQuery || statusFilter !== 'all' 
                ? 'Спробуйте змінити параметри пошуку або фільтрів'
                : 'Натисніть кнопку "Новий об\'єкт", щоб додати першу станцію'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-700 bg-gray-50/80 dark:bg-neutral-900/40 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Статус</th>
                  <th className="py-3.5 px-4">ПІБ Клієнта</th>
                  <th className="py-3.5 px-4">Телефон</th>
                  <th className="py-3.5 px-4">Адреса</th>
                  <th className="py-3.5 px-4 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700/60">
                {filteredObjects.map(obj => {
                  const statusInfo = CONSTRUCTION_STATUSES[obj.status] || CONSTRUCTION_STATUSES.kp_sent;

                  return (
                    <tr
                      key={obj.id}
                      onClick={() => navigate(`/construction-objects/${obj.id}`)}
                      className="hover:bg-gray-50/80 dark:hover:bg-neutral-700/40 cursor-pointer transition group"
                    >
                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span 
                          className="px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                          style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Client Name */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        {obj.client_name || 'Без імені'}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {obj.phone ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-neutral-300 font-semibold">
                            <Phone size={13} className="text-gray-400" />
                            <span>{obj.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4">
                        {obj.address ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-neutral-300">
                            <MapPin size={14} className="text-amber-500 flex-shrink-0" />
                            <span>{obj.address}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => handleEdit(e, obj)}
                            title="Редагувати об'єкт"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={e => handleDelete(e, obj.id, obj.client_name)}
                            title="Видалити"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/construction-objects/${obj.id}`)}
                            title="Відкрити картку"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ConstructionObjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveForm}
        initialData={editingObject}
      />
    </div>
  );
}
