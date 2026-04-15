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
    setEditModal({
      op,
      formData: {
        date: op.date,
        quantity: op.quantity,
        comment: op.comment || '',
        warehouse_id: op.warehouse_from || op.warehouse_to,
        type: op.type
      }
    });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const result = await updateOperation({
        id: editModal.op.id,
        ...editModal.formData,
        edited_by: user?.email
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
      'Склад': getWarehouseName(op.warehouse_from || op.warehouse_to),
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
      <div className="card" style={{ marginBottom: '12px', padding: '10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 180px' }}>
            <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Склад</label>
            <select
              className="form-select"
              value={filters.warehouseId}
              onChange={(e) => updateFilter('warehouseId', e.target.value)}
              style={{ padding: '6px 10px', height: '36px' }}
            >
              <option value="">Всі склади</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 140px' }}>
            <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Тип операції</label>
            <select
              className="form-select"
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              style={{ padding: '6px 10px', height: '36px' }}
            >
              <option value="">Всі типи</option>
              {Object.entries(CONFIG.OPERATION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 130px' }}>
            <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Від</label>
            <input
              type="date"
              className="form-input"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              style={{ padding: '6px 10px', height: '36px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: '0 0 130px' }}>
            <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>До</label>
            <input
              type="date"
              className="form-input"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              style={{ padding: '6px 10px', height: '36px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
              Пошук товару
              {debouncedSearch !== deferredSearch && (
                <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  ⏳ Пошук...
                </span>
              )}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Назва або артикул..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '6px 10px', height: '36px' }}
            />
          </div>
          
          <div>
            <button 
              className={`btn btn-sm ${sortAsc ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSortAsc(!sortAsc)}
              title="Сортувати від А до Я за назвою"
              style={{ height: '36px', padding: '0 12px', fontSize: '0.78rem', color: sortAsc ? 'white' : undefined }}
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
            <table className="data-table compact-table">
              <thead>
                 <tr>
                  <th style={{ width: '1px' }}><ResizableHeader pageId="journal" columnId="date">Дата</ResizableHeader></th>
                  <th style={{ width: '1px' }}><ResizableHeader pageId="journal" columnId="warehouse">Склад</ResizableHeader></th>
                  <th style={{ width: '100%' }}><ResizableHeader pageId="journal" columnId="product">Товар</ResizableHeader></th>
                  <th style={{ width: '1px' }}><ResizableHeader pageId="journal" columnId="type">Тип</ResizableHeader></th>
                  <th style={{ width: '1px' }}><ResizableHeader pageId="journal" columnId="unit">Од.</ResizableHeader></th>
                  <th style={{ textAlign: 'center', width: '1px' }}><ResizableHeader pageId="journal" columnId="qty">К-сть</ResizableHeader></th>
                  <th style={{ textAlign: 'center', width: '1px' }}><ResizableHeader pageId="journal" columnId="balance">Залишок</ResizableHeader></th>
                  <th style={{ width: '1px' }}><ResizableHeader pageId="journal" columnId="comment">Коментар</ResizableHeader></th>
                  <th style={{ width: '1px' }}><ResizableHeader pageId="journal" columnId="user">Автор</ResizableHeader></th>
                  {user?.isAdmin && <th style={{ width: '1px' }}>Дії</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedOperations.map((op) => (
                  <tr key={op.id} className={`row-${op.type}`}>
                    <td style={{ fontSize: '0.8rem', width: '1px' }}>{formatDate(op.date)}</td>
                    <td style={{ fontSize: '0.8rem', width: '1px' }}>{getWarehouseName(op.warehouse_from || op.warehouse_to)}</td>
                    <td style={{ fontSize: '0.85rem', width: '100%' }}>{op.product_name || '—'}</td>
                    <td style={{ width: '1px' }}>
                      <span className={`badge badge-${op.type}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        {CONFIG.OPERATION_LABELS[op.type] || op.type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '1px' }}>{op.unit || '—'}</td>
                    <td style={{ fontSize: '0.85rem', whiteSpace: 'pre-line', textAlign: 'center', width: '1px' }}>
                      {formatQuantity(op.quantity, op.product_category, op.product_name)}
                    </td>
                    <td style={{ fontSize: '0.82rem', whiteSpace: 'pre-line', textAlign: 'center', width: '1px' }}>
                      {op.balance_after != null ? formatQuantity(op.balance_after, op.product_category, op.product_name) : '—'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '200px', whiteSpace: 'normal', lineHeight: '1.2', width: '1px' }}>
                      {typeof (op.comment || op.note || op.primitka) === 'object' ? JSON.stringify(op.comment || op.note || op.primitka) : String(op.comment || op.note || op.primitka || '—')}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '1px' }}>{op.user_name || op.user || '—'}</td>
                    {user?.isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(op)}
                            title="Редагувати"
                            style={{ padding: '2px 6px' }}
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(op.id)}
                            title="Видалити"
                            style={{ color: 'var(--danger)', padding: '2px 6px' }}
                          >
                            🗑️
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '450px', background: 'white', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', padding: '20px' }}>
            <div className="modal-header">
              <h3>✏️ Редагування операції</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditModal(null)} style={{ padding: '4px 8px' }}>×</Button>
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
