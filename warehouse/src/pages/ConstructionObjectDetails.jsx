import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, SunMedium, Phone, MapPin, Edit3, Plus, 
  FileDown, Save, Trash2, CheckCircle, AlertCircle, Info, RefreshCw
} from 'lucide-react';
import { 
  constructionService, CONSTRUCTION_STATUSES, PAYMENT_TYPES 
} from '../api/constructionService';
import KPImportModal from '../components/KPImportModal';
import AddMaterialModal from '../components/AddMaterialModal';
import ConstructionObjectFormModal from '../components/ConstructionObjectFormModal';
import { useToast } from '../context/ToastContext';

export default function ConstructionObjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [object, setObject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isKPModalOpen, setIsKPModalOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isEditObjectOpen, setIsEditObjectOpen] = useState(false);

  useEffect(() => {
    loadObjectDetails();
  }, [id]);

  const loadObjectDetails = async () => {
    setLoading(true);
    try {
      const res = await constructionService.getObjectDetails(id);
      if (res.success) {
        setObject(res.object);
        setMaterials(res.materials || []);
      } else {
        showToast(res.error || 'Об\'єкт не знайдено', 'error');
        navigate('/construction-objects');
      }
    } catch (err) {
      console.error('Error loading object details:', err);
      showToast('Помилка при завантаженні об\'єкта', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Status Change
  const handleStatusChange = async (newStatus) => {
    if (!object) return;
    try {
      const updated = { ...object, status: newStatus };
      const res = await constructionService.saveObject(updated);
      if (res.success) {
        setObject(res.data);
        showToast('Статус успішно змінено', 'success');
      }
    } catch (err) {
      showToast('Помилка при зміні статусу', 'error');
    }
  };

  // Update actual qty in state
  const handleActualQtyChange = (matId, val) => {
    const parsed = parseFloat(val);
    setMaterials(prev => prev.map(m => {
      if (m.id === matId) {
        return { ...m, actual_qty: isNaN(parsed) ? 0 : parsed };
      }
      return m;
    }));
  };

  // Save all materials
  const handleSaveMaterials = async () => {
    setIsSaving(true);
    try {
      const res = await constructionService.saveMaterials(id, materials);
      if (res.success) {
        showToast('Матеріали успішно збережено', 'success');
        loadObjectDetails();
      }
    } catch (err) {
      showToast('Помилка при збереженні матеріалів', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Add custom material
  const handleAddMaterial = (newMat) => {
    setMaterials(prev => [...prev, newMat]);
    showToast('Позицію додано (не забудьте зберегти)', 'info');
  };

  // Delete material
  const handleDeleteMaterial = (matId) => {
    setMaterials(prev => prev.filter(m => m.id !== matId));
  };

  // Import from KP
  const handleSelectKP = async (proposalId) => {
    setIsKPModalOpen(false);
    setLoading(true);
    try {
      const res = await constructionService.importFromProposal(id, proposalId);
      if (res.success) {
        showToast(`Імпортовано ${res.count || 0} матеріалів з КП`, 'success');
        loadObjectDetails();
      } else {
        showToast(res.error || 'Помилка імпорту з КП', 'error');
        setLoading(false);
      }
    } catch (err) {
      showToast('Помилка при виконанні імпорту', 'error');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="spinner" />
        <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">
          Завантаження картки об'єкта...
        </p>
      </div>
    );
  }

  if (!object) return null;

  const currentStatus = CONSTRUCTION_STATUSES[object.status] || CONSTRUCTION_STATUSES.kp_sent;
  const paymentLabel = PAYMENT_TYPES[object.payment_type] || PAYMENT_TYPES.cash_end;
  const currencyBadge = (object.currency || 'USD').toUpperCase();
  const currSymbol = currencyBadge === 'UAH' ? '₴' : '$';

  const totalPrice = parseFloat(object.total_price || 0);
  const advanceAmount = parseFloat(object.advance_amount || 0);
  const paidAmount = parseFloat(object.paid_amount || 0);
  const remainingAmount = Math.max(0, totalPrice - advanceAmount - paidAmount);

  return (
    <div className="p-3 sm:p-4 max-w-7xl mx-auto space-y-3">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/construction-objects')}
          className="btn btn-ghost text-xs py-1 px-2 flex items-center gap-1.5 text-gray-600 dark:text-neutral-300 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          <span>Назад до списку об'єктів</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditObjectOpen(true)}
            className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5 rounded-lg"
          >
            <Edit3 size={14} />
            <span>Редагувати дані</span>
          </button>
        </div>
      </div>

      {/* Main Object Header Card */}
      <div className="bg-white dark:bg-neutral-800 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-neutral-700 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <SunMedium size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {object.client_name}
                </h1>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                  currencyBadge === 'UAH' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}>
                  {currencyBadge} ({currencyBadge === 'UAH' ? 'Гривня ₴' : 'Долар $'})
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-neutral-400 mt-1 flex-wrap">
                {object.phone && (
                  <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-neutral-300">
                    <Phone size={13} className="text-gray-400" />
                    {object.phone}
                  </span>
                )}
                {object.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-amber-500" />
                    {object.address}
                  </span>
                )}
                <span className="text-xs text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700/60 px-2 py-0.5 rounded font-medium">
                  💰 {paymentLabel} {object.payment_notes ? `(${object.payment_notes})` : ''}
                </span>
                {object.notes && (
                  <span className="text-xs text-gray-500 dark:text-neutral-400 italic">
                    • {object.notes}
                  </span>
                )}
                {object.proposal_number && (
                  <span className="font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded text-[11px]">
                    КП #{object.proposal_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary Bar (Погоджена сума, Аванс, Залишок) */}
        <div 
          onClick={() => setIsEditObjectOpen(true)}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 dark:bg-neutral-900/40 p-2 rounded-xl border border-gray-100 dark:border-neutral-800 cursor-pointer hover:bg-gray-100/80 dark:hover:bg-neutral-800/80 transition group"
          title="Натисніть, щоб відредагувати суму КП, аванс чи оплати"
        >
          <div className="flex flex-col px-2 border-r border-gray-200 dark:border-neutral-700/60 last:border-0">
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Сума по КП</span>
              <Edit3 size={10} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
              {totalPrice > 0 ? `${totalPrice.toLocaleString()} ${currSymbol}` : '0 ' + currSymbol}
            </span>
          </div>

          <div className="flex flex-col px-2 border-r border-gray-200 dark:border-neutral-700/60 last:border-0">
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <span>Аванс / Завдаток</span>
              <Edit3 size={10} className="opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              {advanceAmount > 0 ? `${advanceAmount.toLocaleString()} ${currSymbol}` : '0 ' + currSymbol}
            </span>
          </div>

          <div className="flex flex-col px-2 border-r border-gray-200 dark:border-neutral-700/60 last:border-0">
            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <span>Сплачено</span>
              <Edit3 size={10} className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400">
              {paidAmount > 0 ? `${paidAmount.toLocaleString()} ${currSymbol}` : '0 ' + currSymbol}
            </span>
          </div>

          <div className="flex flex-col px-2">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Залишок до сплати</span>
            <span className={`text-xs sm:text-sm font-extrabold ${remainingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
              {remainingAmount > 0 ? `${remainingAmount.toLocaleString()} ${currSymbol}` : '0 ' + currSymbol}
            </span>
          </div>
        </div>

        {/* Compact Sequential Status Stepper Ribbon */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
              Статус будівництва:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-gray-50 dark:bg-neutral-900/60 p-1.5 rounded-xl border border-gray-100 dark:border-neutral-800">
            {Object.entries(CONSTRUCTION_STATUSES).map(([key, item], index) => {
              const isActive = object.status === key;
              const statusKeys = Object.keys(CONSTRUCTION_STATUSES);
              const currentIndex = statusKeys.indexOf(object.status);
              const isPassed = index <= currentIndex;

              return (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all relative group cursor-pointer ${
                    isActive
                      ? 'ring-1 ring-primary shadow-xs text-white scale-[1.01]'
                      : isPassed
                      ? 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 border border-gray-200 dark:border-neutral-700 hover:border-primary/50'
                      : 'bg-transparent text-gray-400 dark:text-neutral-500 hover:bg-white/50 dark:hover:bg-neutral-800/50'
                  }`}
                  style={{
                    backgroundColor: isActive ? item.color : undefined,
                  }}
                  title={`Переключити на статус "${item.label}"`}
                >
                  <span className="text-xs">{item.label.split(' ')[0]}</span>
                  <span className="truncate text-center text-[11px]">{item.label.substring(item.label.indexOf(' ') + 1)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Materials Table Section */}
      <div className="bg-white dark:bg-neutral-800 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-neutral-700 pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Специфікація матеріалів для будівництва
              </h2>
              <span className="px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300">
                {materials.length} поз.
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
              Введіть фактично використані матеріали в колонку <strong>"Фактично використано"</strong>. Списання зі Складу не здійснюється.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setIsKPModalOpen(true)}
              className="btn btn-secondary text-xs py-1.5 px-2.5 rounded-lg flex items-center gap-1"
            >
              <FileDown size={14} />
              <span>Імпорт з КП</span>
            </button>
            <button
              onClick={() => setIsAddMaterialOpen(true)}
              className="btn btn-secondary text-xs py-1.5 px-2.5 rounded-lg flex items-center gap-1"
            >
              <Plus size={14} />
              <span>+ Позиція вручну</span>
            </button>
            <button
              onClick={handleSaveMaterials}
              disabled={isSaving}
              className="btn btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold shadow-xs"
            >
              <Save size={14} />
              <span>{isSaving ? 'Збереження...' : 'Зберегти зміни'}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {materials.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
            <Info size={36} className="text-gray-300 dark:text-neutral-600" />
            <p className="text-sm font-bold text-gray-700 dark:text-neutral-300">
              Список матеріалів порожній
            </p>
            <p className="text-xs text-gray-400 max-w-sm">
              Імпортуйте товари з комерційної пропозиції (КП) або додайте позиції вручну кнопкою вище.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-700 bg-gray-50/90 dark:bg-neutral-900/60 font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-2 px-2.5 w-8 text-center">№</th>
                  <th className="py-2 px-3">Найменування матеріалу</th>
                  <th className="py-2 px-2 text-center w-20">Од. вим.</th>
                  <th className="py-2 px-3 text-center w-36">Заплановано (по КП)</th>
                  <th className="py-2 px-3 text-center w-36">Фактично використано</th>
                  <th className="py-2 px-3 text-center w-24">Різниця</th>
                  <th className="py-2 px-2 text-right w-12">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700/50">
                {materials.map((m, idx) => {
                  const planned = parseFloat(m.planned_qty || 0);
                  const actual = parseFloat(m.actual_qty || 0);
                  const diff = actual - planned;

                  return (
                    <tr key={m.id || idx} className="hover:bg-gray-50/80 dark:hover:bg-neutral-700/30 transition">
                      {/* Index */}
                      <td className="py-1.5 px-2.5 text-center text-xs font-semibold text-gray-400">
                        {idx + 1}
                      </td>

                      {/* Material Name */}
                      <td className="py-1.5 px-3 font-semibold text-gray-900 dark:text-white leading-snug">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{m.product_name}</span>
                          {m.is_custom && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-1 py-0.1 rounded">
                              Вручну
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="py-1.5 px-2 text-center text-xs text-gray-500 font-medium">
                        {m.unit || 'шт.'}
                      </td>

                      {/* Planned Qty */}
                      <td className="py-1.5 px-3 text-center font-bold text-gray-800 dark:text-neutral-200">
                        {planned}
                      </td>

                      {/* Actual Qty (Editable input) */}
                      <td className="py-1 px-3 text-center">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={m.actual_qty}
                          onChange={e => handleActualQtyChange(m.id, e.target.value)}
                          className="form-input text-center font-extrabold text-xs py-0.5 px-1.5 h-7 rounded-lg border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 w-20 mx-auto focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Difference */}
                      <td className="py-1.5 px-3 text-center text-xs font-bold">
                        {diff === 0 ? (
                          <span className="text-gray-400">0</span>
                        ) : diff > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold">+ {diff}</span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-extrabold">{diff}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-1.5 px-2 text-right">
                        <button
                          onClick={() => handleDeleteMaterial(m.id)}
                          className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                          title="Видалити позицію"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KP Import Modal */}
      <KPImportModal
        isOpen={isKPModalOpen}
        onClose={() => setIsKPModalOpen(false)}
        onSelect={handleSelectKP}
      />

      {/* Add Custom Material Modal */}
      <AddMaterialModal
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        onAdd={handleAddMaterial}
      />

      {/* Edit Object Form Modal */}
      <ConstructionObjectFormModal
        isOpen={isEditObjectOpen}
        onClose={() => setIsEditObjectOpen(false)}
        onSave={async (updatedData) => {
          const res = await constructionService.saveObject(updatedData);
          if (res.success) {
            setObject(res.data);
            showToast('Дані об\'єкта оновлено', 'success');
          }
        }}
        initialData={object}
      />
    </div>
  );
}
