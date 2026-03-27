import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getOperations, getWarehouses, deleteOperation, updateOperation } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportToExcel } from '../utils/exportUtils';
import { formatDate } from '../utils/dateUtils';
import { matchesSearch } from '../utils/searchUtils';
import { formatQuantity } from '../utils/formatUtils';
import CONFIG from '../config';
import ResizableHeader from '../components/ResizableHeader';

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
  const [sortAsc, setSortAsc] = useState(false);
  const [editModal, setEditModal] = useState(null); // { op, formData }
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

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
  }, [search]);

  function getWarehouseName(id) {
    return warehouses.find((w) => w.id === id)?.name || id || '—';
  }

  // Пошукова фільтрація на клієнті та сортування
  const filteredOperations = useMemo(() => {
    const list = operations.filter((op) => {
      if (!search.trim()) return true;
      const content = `${op.product_name || ''} ${op.product_article || ''} ${op.comment || ''}`;
      return matchesSearch(content, search);
    });
    if (sortAsc) {
      list.sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
    }
    return list;
  }, [operations, search, sortAsc]);

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
      'Автор': op.user || ''
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
            <Link to="/income" className="btn btn-success btn-sm">📥 Прихід</Link>
            <Link to="/expense" className="btn btn-danger btn-sm">📤 Розхід</Link>
            <Link to="/transfer" className="btn btn-primary btn-sm">🔄 Переміщення</Link>
          </div>
        </div>
        <div>
          <button className="btn btn-outline btn-sm" onClick={handleExport} disabled={filteredOperations.length === 0}>
            📥 Експорт Excel
          </button>
        </div>
      </div>

      {/* Фільтри */}
      <div className="filters-bar">
        <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
          <label>Склад</label>
          <select
            className="form-select"
            value={filters.warehouseId}
            onChange={(e) => updateFilter('warehouseId', e.target.value)}
          >
            <option value="">Всі склади</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ minWidth: '140px' }}>
          <label>Тип операції</label>
          <select
            className="form-select"
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
          >
            <option value="">Всі типи</option>
            {Object.entries(CONFIG.OPERATION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Від</label>
          <input
            type="date"
            className="form-input"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>До</label>
          <input
            type="date"
            className="form-input"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
          <label>Пошук товару</label>
          <input
            type="text"
            className="form-input"
            placeholder="Назва або артикул..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            className={`btn btn-sm ${sortAsc ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSortAsc(!sortAsc)}
            title="Сортувати від А до Я за назвою"
            style={{ height: '38px' }}
          >
            {sortAsc ? 'Сортування: А-Я' : 'Сортувати А-Я'}
          </button>
        </div>
      </div>

      {/* Таблиця */}
      <div className="card">
        <div className="data-table-wrap">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '12px' }}>Завантаження журналу...</p>
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
                  <th><ResizableHeader pageId="journal" columnId="date">Дата</ResizableHeader></th>
                  <th><ResizableHeader pageId="journal" columnId="warehouse">Склад</ResizableHeader></th>
                  <th><ResizableHeader pageId="journal" columnId="product">Товар</ResizableHeader></th>
                  <th><ResizableHeader pageId="journal" columnId="type">Тип</ResizableHeader></th>
                  <th><ResizableHeader pageId="journal" columnId="unit">Од.</ResizableHeader></th>
                  <th><ResizableHeader pageId="journal" columnId="qty">Кількість</ResizableHeader></th>
                  <th><ResizableHeader pageId="journal" columnId="balance">Залишок</ResizableHeader></th>
                  {user?.isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {paginatedOperations.map((op) => (
                  <tr key={op.id} className={`row-${op.type}`}>
                    <td>{formatDate(op.date)}</td>
                    <td>{getWarehouseName(op.warehouse_from || op.warehouse_to)}</td>
                    <td style={{ fontWeight: 600, fontSize: '0.95rem' }}>{op.product_name || '—'}</td>
                    <td>
                      <span className={`badge badge-${op.type}`}>
                        {CONFIG.OPERATION_LABELS[op.type] || op.type}
                      </span>
                    </td>
                     <td style={{ color: 'var(--text-muted)' }}>{op.unit || '—'}</td>
                    <td style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                      {formatQuantity(op.quantity, op.product_category, op.product_name)}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {op.balance_after != null ? formatQuantity(op.balance_after, op.product_category, op.product_name) : '—'}
                    </td>
                    {user?.isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenEdit(op)}
                            title="Редагувати"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDelete(op.id)}
                            title="Видалити"
                            style={{ color: 'var(--danger)' }}
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
          )}
        </div>
      </div>

      {/* Пагінація */}
      {totalPages > 1 && (
        <div className="pagination-wrap">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ← Попередня
          </button>
          
          <div className="pagination-info">
            Сторінка <strong>{currentPage}</strong> з {totalPages} (Всього: {filteredOperations.length} зап.)
          </div>

          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Наступна →
          </button>
        </div>
      )}
      
      {/* Модалка редагування */}
      {editModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>✏️ Редагування операції</h3>
              <button className="btn-close" onClick={() => setEditModal(null)}>×</button>
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
                <button type="button" className="btn btn-outline" onClick={() => setEditModal(null)}>
                  Скасувати
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? '⏳ Збереження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
