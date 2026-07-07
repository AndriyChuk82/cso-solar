import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import { Link } from 'react-router-dom';
import { getOperations, getWarehouses, deleteOperation, updateOperation } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportToExcel } from '../utils/exportUtils';
import { formatDate } from '../utils/dateUtils';
import { matchesSearch } from '../utils/searchUtils';
import { formatQuantity } from '../utils/formatUtils';
import CONFIG from '../config';
import { Button } from '@cso/design-system';
import ResizableHeader from '../components/ResizableHeader';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Журнал операцій — основний документ системи.
 * Хронологічна історія руху товарів з фільтрами.
 */
export default function Journal() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [operations, setOperations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    warehouseId: user?.isStorekeeper ? user.warehouseId : '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const deferredSearch = useDeferredValue(debouncedSearch);
  const [sortAsc, setSortAsc] = useState(false);
  const [editModal, setEditModal] = useState(null); // { op, formData }
  const [savingEdit, setSavingEdit] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [opsResult, whResult] = await Promise.all([
        getOperations(filters),
        getWarehouses()
      ]);
      if (opsResult?.success) setOperations(opsResult.operations || []);
      if (whResult?.success) setWarehouses(whResult.warehouses || []);
    } catch (err) {
      console.error('Помилка завантаження:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(opId) {
    if (!confirm('Видалити цей запис? Залишки будуть перераховані.')) return;
    try {
      const result = await deleteOperation(opId);
      if (result?.success) {
        showToast('Операцію успішно видалено', 'success');
        loadData();
      } else {
        showToast(result?.error || 'Помилка видалення', 'error');
      }
    } catch (err) {
      console.error('Помилка видалення:', err);
      showToast('Помилка підключення до сервера', 'error');
    }
  }

  function handleOpenEdit(op) {
    console.log('--- HANDLE OPEN EDIT START ---', op);
    // window.alert('Натиснуто РЕДАГУВАТИ!'); 
    
    if (!op) {
      console.warn('Об’єкт операції порожній');
      return;
    }

    try {
      const initialData = {
        date: op.date || new Date().toISOString().split('T')[0],
        quantity: parseFloat(op.quantity) || 0,
        comment: String(op.comment || op.note || op.primitka || ''),
        product_id: op.product_id || op.productId || '',
        warehouse_id: op.warehouse_id || op.warehouseId || '',
        type: op.type || ''
      };

      setEditModal({ op, formData: initialData });
    } catch (err) {
      console.error('Помилка логіки редагування:', err);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const result = await updateOperation({
        id: editModal.op.id,
        ...editModal.formData,
        user_email: user?.email
      });
      if (result?.success) {
        showToast('Операцію успішно оновлено', 'success');
        setEditModal(null);
        loadData();
      } else {
        showToast(result?.error || 'Помилка оновлення', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка сервера', 'error');
    } finally {
      setSavingEdit(false);
    }
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset page on filter change
  }

  useEffect(() => {
    setCurrentPage(1); // Reset page on search change
  }, [deferredSearch]);

  function getWarehouseName(id) {
    return warehouses.find((w) => w.id === id)?.name || id || '—';
  }

  // Пошукова фільтрація на клієнті та сортування
  const filteredOperations = useMemo(() => {
    const list = operations.filter((op) => {
      if (!deferredSearch.trim()) return true;
      const content = `${op.product_name || ''} ${op.product_article || ''} ${op.comment || ''}`;
      return matchesSearch(content, deferredSearch);
    });
    if (sortAsc) {
      list.sort((a, b) => (a.product_name || '').localeCompare(b.product_name || '', undefined, { numeric: true, sensitivity: 'base' }));
    }
    return list;
  }, [operations, deferredSearch, sortAsc]);

  const totalPages = Math.ceil(filteredOperations.length / PAGE_SIZE);
  const paginatedOperations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOperations.slice(start, start + PAGE_SIZE);
  }, [filteredOperations, currentPage]);

  function handleExport() {
    if (filteredOperations.length === 0) return showToast('Немає операцій для експорту', 'info');
    
    const columns = ['Дата', 'Склад', 'Товар', 'Тип', 'Од.', 'К-сть', 'Залишок після', 'Коментар', 'Автор'];
    const items = filteredOperations.map(op => ({
      'Дата': formatDate(op.date),
      'Склад': op.warehouse_name || '',
      'Товар': op.product_name || '',
      'Тип': CONFIG.OPERATION_LABELS[op.type] || op.type,
      'Од.': op.unit || '',
      'К-сть': formatQuantity(op.quantity, op.product_category, op.product_name),
      'Залишок після': formatQuantity(op.balance_after, op.product_category, op.product_name),
      'Коментар': op.comment || '',
      'Автор': op.user_name || op.user || ''
    }));
    
    exportToExcel(columns, items, 'журнал_операцій');
  }

  return (
    <div>
      {/* Спеціальні стилі адаптивності */}
      <style>{`
        @media (max-width: 767px) {
          .desktop-report-table {
            display: none !important;
          }
          .mobile-report-cards {
            display: block !important;
          }
        }
        @media (min-width: 768px) {
          .desktop-report-table {
            display: table !important;
          }
          .mobile-report-cards {
            display: none !important;
          }
        }
        /* Більш компактний вигляд десктопної таблиці */
        .desktop-report-table th,
        .desktop-report-table td {
          padding: 6px 8px !important;
          font-size: 12px !important;
          line-height: 1.3 !important;
        }
        /* Кнопки дій у таблиці */
        .btn-action-edit,
        .btn-action-delete {
          padding: 4px 6px !important;
          font-size: 0.85rem !important;
          border-radius: 4px !important;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          width: 26px;
        }
        .btn-action-edit {
          background: rgba(245, 158, 11, 0.08) !important;
          color: #d97706 !important;
          border: 1px solid rgba(245, 158, 11, 0.2) !important;
        }
        .btn-action-edit:hover {
          background: rgba(245, 158, 11, 0.2) !important;
          color: #b45309 !important;
          border-color: rgba(245, 158, 11, 0.4) !important;
        }
        .btn-action-delete {
          background: rgba(239, 68, 68, 0.08) !important;
          color: #dc2626 !important;
          border: 1px solid rgba(239, 68, 68, 0.2) !important;
        }
        .btn-action-delete:hover {
          background: rgba(239, 68, 68, 0.2) !important;
          color: #b91c1c !important;
          border-color: rgba(239, 68, 68, 0.4) !important;
        }
      `}</style>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">📋 Журнал операцій</h1>
            <p className="page-subtitle">Хронологічна історія руху товарів</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/income">
              <Button variant="success" size="sm">📥 Прихід</Button>
            </Link>
            <Link to="/expense">
              <Button variant="danger" size="sm">📤 Розхід</Button>
            </Link>
            <Link to="/transfer">
              <Button variant="primary" size="sm">🔄 Переміщення</Button>
            </Link>
          </div>
        </div>
        <div>
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={filteredOperations.length === 0}>
            📥 Експорт Excel
          </Button>
        </div>
      </div>

      {/* Фільтри */}
      <div className="card p-2 sm:p-2.5 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl mb-3 no-print">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-2 text-xs">
          <div className="flex flex-col gap-0.5 col-span-1 sm:w-40">
            <label className="text-[10px] text-[var(--text-secondary)] font-semibold pl-0.5">Склад</label>
            <select
              className="p-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-xs focus:outline-none w-full h-[32px]"
              value={filters.warehouseId}
              onChange={(e) => updateFilter('warehouseId', e.target.value)}
            >
              <option value="">Всі склади</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-0.5 col-span-1 sm:w-32">
            <label className="text-[10px] text-[var(--text-secondary)] font-semibold pl-0.5">Тип операції</label>
            <select
              className="p-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-xs focus:outline-none w-full h-[32px]"
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
            >
              <option value="">Всі типи</option>
              {Object.entries(CONFIG.OPERATION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-0.5 col-span-1 sm:w-28">
            <label className="text-[10px] text-[var(--text-secondary)] font-semibold pl-0.5">Від</label>
            <input
              type="date"
              className="p-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-xs focus:outline-none w-full h-[32px]"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-0.5 col-span-1 sm:w-28">
            <label className="text-[10px] text-[var(--text-secondary)] font-semibold pl-0.5">До</label>
            <input
              type="date"
              className="p-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-xs focus:outline-none w-full h-[32px]"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-0.5 col-span-2 sm:flex-1 sm:min-w-[160px]">
            <label className="text-[10px] text-[var(--text-secondary)] font-semibold pl-0.5">
              Пошук товару
              {debouncedSearch !== deferredSearch && (
                <span className="ml-1.5 text-[9px] text-[var(--text-secondary)]">⏳</span>
              )}
            </label>
            <input
              type="text"
              className="p-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-xs focus:outline-none w-full h-[32px]"
              placeholder="Назва або артикул..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="col-span-2 sm:col-span-1 flex justify-end sm:w-auto">
            <button 
              className={`p-1.5 rounded border text-xs font-semibold h-[32px] px-3 transition-colors ${
                sortAsc 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-[var(--bg)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--border-light)]'
              }`}
              onClick={() => setSortAsc(!sortAsc)}
              title="Сортувати від А до Я за назвою"
            >
              {sortAsc ? 'А-Я' : 'Сортувати А-Я'}
            </button>
          </div>
        </div>
      </div>

      {/* Таблиця */}
      <div className="card">
        <div className="data-table-wrap">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
              <p>Завантаження журналу...</p>
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>Операцій не знайдено</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                {search ? 'Спробуйте змінити пошуковий запит' : 'Спробуйте змінити фільтри або створіть першу операцію'}
              </p>
            </div>
          ) : (
            <>
              {/* Десктопна версія (таблиця) */}
              <table className="desktop-report-table data-table compact-table">
                <thead>
                   <tr>
                    <th style={{ width: '1px' }}><ResizableHeader pageId="journal" columnId="date">Дата</ResizableHeader></th>
                    <th style={{ width: '1px' }}><ResizableHeader pageId="journal" columnId="warehouse">Склад</ResizableHeader></th>
                    <th style={{ width: '100%' }}><ResizableHeader pageId="journal" columnId="product">Товар</ResizableHeader></th>
                    <th style={{ width: '1px' }}><ResizableHeader pageId="journal" columnId="type">Тип</ResizableHeader></th>
                    <th style={{ textAlign: 'center', width: '1px' }}><ResizableHeader pageId="journal" columnId="unit">Од.</ResizableHeader></th>
                    <th style={{ textAlign: 'right', width: '1px' }}><ResizableHeader pageId="journal" columnId="qty">К-сть</ResizableHeader></th>
                    <th style={{ textAlign: 'right', width: '1px' }}><ResizableHeader pageId="journal" columnId="balance">Залишок</ResizableHeader></th>
                    <th style={{ minWidth: '220px' }}><ResizableHeader pageId="journal" columnId="comment">Коментар</ResizableHeader></th>
                    <th style={{ width: '1px' }}><ResizableHeader pageId="journal" columnId="user">Автор</ResizableHeader></th>
                    {user?.isAdmin && <th style={{ width: '1px', textAlign: 'center', textTransform: 'uppercase' }}>Дії</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedOperations.map((op) => (
                    <tr key={op.id} className={`row-${op.type}`}>
                      <td style={{ fontSize: '0.8rem', width: '1px' }}>{formatDate(op.date)}</td>
                      <td style={{ fontSize: '0.8rem', width: '1px' }}>{op.warehouse_name}</td>
                      <td style={{ fontSize: '0.85rem', width: '100%' }}>{op.product_name || '—'}</td>
                      <td style={{ width: '1px' }}>
                        <span className={`badge badge-${op.type}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          {CONFIG.OPERATION_LABELS[op.type] || op.type}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '1px', textAlign: 'center' }}>{op.unit || '—'}</td>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'pre-line', textAlign: 'right', width: '1px' }}>
                        {formatQuantity(op.quantity, op.product_category, op.product_name)}
                      </td>
                      <td style={{ fontSize: '0.82rem', whiteSpace: 'pre-line', textAlign: 'right', width: '1px' }}>
                        {op.balance_after != null ? formatQuantity(op.balance_after, op.product_category, op.product_name) : '—'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', minWidth: '220px', maxWidth: '350px', whiteSpace: 'normal', lineHeight: '1.2' }}>
                        {typeof (op.comment || op.note || op.primitka) === 'object' ? JSON.stringify(op.comment || op.note || op.primitka) : String(op.comment || op.note || op.primitka || '—')}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '1px' }}>{op.user_name || op.user || '—'}</td>
                      {user?.isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', position: 'relative', zIndex: 100 }}>
                            <button
                              className="btn-action-edit"
                              onClick={(e) => { e.stopPropagation(); handleOpenEdit(op); }}
                              title="Редагувати"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-action-delete"
                              onClick={(e) => { e.stopPropagation(); handleDelete(op.id); }}
                              title="Видалити"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Мобільна версія (список карток) */}
              <div className="mobile-report-cards space-y-3">
                {paginatedOperations.map((op) => {
                  const isIssue = op.type === 'issue' || op.type === 'expense';
                  const isIncome = op.type === 'income';
                  const isTransfer = op.type === 'transfer';
                  const isAdj = op.type === 'adjustment';
                  const amt = parseFloat(op.quantity) || 0;

                  return (
                    <div key={op.id} className="p-3 border border-[var(--border)] rounded-xl bg-[var(--bg-card)] space-y-2 text-xs">
                      {/* Шапка: дата та тип */}
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-[var(--text-secondary)]">📅 {formatDate(op.date)}</span>
                        <span className={`badge badge-${op.type}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          {CONFIG.OPERATION_LABELS[op.type] || op.type}
                        </span>
                      </div>

                      {/* Склад */}
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        🏢 Склад: <span className="font-semibold text-[var(--text)]">{op.warehouse_name}</span>
                      </div>

                      {/* Товар */}
                      <div className="text-[12px] font-semibold text-[var(--text)]">
                        📦 {op.product_name || '—'}
                      </div>

                      {/* Деталі */}
                      {(op.comment || op.note || op.primitka) && (
                        <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)]/50 p-2 rounded border border-[var(--border)]/40 italic">
                          {typeof (op.comment || op.note || op.primitka) === 'object' 
                            ? JSON.stringify(op.comment || op.note || op.primitka) 
                            : String(op.comment || op.note || op.primitka)}
                        </div>
                      )}

                      {/* Кількість, залишок, автор та дії */}
                      <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]/40 text-[11px]">
                        <div className="flex gap-4">
                          <div>
                            <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">К-сть</span>
                            <span className={`${isIncome ? 'text-green-600' : isIssue ? 'text-red-500' : 'text-[var(--text)]'} font-bold`}>
                              {isIssue ? '-' : isIncome ? '+' : ''}{formatQuantity(op.quantity, op.product_category, op.product_name)} {op.unit || ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Залишок</span>
                            <span className="font-bold text-[var(--text)]">
                              {op.balance_after != null ? formatQuantity(op.balance_after, op.product_category, op.product_name) : '—'} {op.unit || ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Автор</span>
                            <span className="text-[var(--text-muted)]">
                              {op.user_name || op.user || '—'}
                            </span>
                          </div>
                        </div>

                        {/* Дії */}
                        {user?.isAdmin && (
                          <div className="flex gap-1.5 no-print">
                            <button
                              className="p-1 px-2 rounded border border-amber-500/20 bg-amber-500/10 text-amber-600 text-[10px] font-semibold"
                              onClick={(e) => { e.stopPropagation(); handleOpenEdit(op); }}
                              title="Редагувати"
                            >
                              ✏️
                            </button>
                            <button
                              className="p-1 px-2 rounded border border-red-500/20 bg-red-500/10 text-red-500 text-[10px] font-semibold"
                              onClick={(e) => { e.stopPropagation(); handleDelete(op.id); }}
                              title="Видалити"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Пагінація */}
      {totalPages > 1 && (
        <div className="pagination-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ← Попередня
          </Button>

          <div className="pagination-info">
            Сторінка <strong>{currentPage}</strong> з {totalPages} (Всього: {filteredOperations.length} зап.)
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Наступна →
          </Button>
        </div>
      )}
      
      {/* Модалка редагування */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Редагування операції</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}>×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', background: 'var(--bg-light)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong>Товар:</strong> {editModal.op.product_name}<br/>
                  <strong>Тип:</strong> {CONFIG.OPERATION_LABELS[editModal.op.type]}
                </div>

                <div className="form-group">
                  <label>Дата</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editModal.formData.date}
                    onChange={e => setEditModal({ ...editModal, formData: { ...editModal.formData, date: e.target.value } })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Кількість ({editModal.op.unit})</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editModal.formData.quantity}
                    onChange={e => setEditModal({ ...editModal, formData: { ...editModal.formData, quantity: Math.round(parseFloat(e.target.value) || 0) } })}
                    step="1"
                    min="0"
                    required
                  />
                </div>

                {user?.isAdmin && (
                  <>
                    <div className="form-group">
                      <label>Склад</label>
                      <select
                        className="form-select"
                        value={editModal.formData.warehouse_id}
                        onChange={e => setEditModal({ ...editModal, formData: { ...editModal.formData, warehouse_id: e.target.value } })}
                      >
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Коментар</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={editModal.formData.comment}
                    onChange={e => setEditModal({ ...editModal, formData: { ...editModal.formData, comment: e.target.value } })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setEditModal(null)}>
                  Скасувати
                </Button>
                <Button type="submit" variant="primary" disabled={savingEdit} loading={savingEdit}>
                  {savingEdit ? 'Збереження...' : 'Зберегти зміни'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
