import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getOperations, getWarehouses, deleteOperation } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportToExcel } from '../utils/exportUtils';
import { formatDate } from '../utils/dateUtils';
import { matchesSearch } from '../utils/searchUtils';
import CONFIG from '../config';

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

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function getWarehouseName(id) {
    return warehouses.find((w) => w.id === id)?.name || id || '—';
  }

  // Пошукова фільтрація на клієнті
  const filteredOperations = useMemo(() => operations.filter((op) => {
    if (!search.trim()) return true;
    const content = `${op.product_name || ''} ${op.product_article || ''} ${op.comment || ''}`;
    return matchesSearch(content, search);
  }), [operations, search]);

  function handleExport() {
    if (filteredOperations.length === 0) return showToast('Немає операцій для експорту', 'info');
    
    const columns = ['Дата', 'Склад', 'Товар', 'Тип', 'Од.', 'К-сть', 'Артикул', 'Залишок після', "Пов'язаний склад", 'Коментар', 'Автор'];
    const items = filteredOperations.map(op => ({
      'Дата': formatDate(op.date),
      'Склад': getWarehouseName(op.warehouse_from || op.warehouse_to),
      'Товар': op.product_name || '',
      'Тип': CONFIG.OPERATION_LABELS[op.type] || op.type,
      'Од.': op.unit || '',
      'К-сть': op.quantity,
      'Артикул': op.product_article || '',
      'Залишок після': op.balance_after != null ? op.balance_after : '',
      "Пов'язаний склад": op.type === 'transfer' ? getWarehouseName(op.warehouse_to) : '',
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
            <table className="data-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Склад</th>
                  <th>Товар</th>
                  <th>Тип</th>
                  <th>Од.</th>
                  <th>Кількість</th>
                  <th>Артикул</th>
                  <th>Залишок</th>
                  <th>Пов'язаний склад</th>
                  <th>Коментар</th>
                  <th>Автор</th>
                  {user?.isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filteredOperations.map((op) => (
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
                    <td style={{ fontWeight: 700, fontSize: '1rem' }}>{op.quantity}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{op.product_article || '—'}</td>
                    <td>{op.balance_after != null ? op.balance_after : '—'}</td>
                    <td>
                      {op.type === 'transfer'
                        ? getWarehouseName(op.warehouse_to)
                        : '—'
                      }
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{op.comment || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{op.user || '—'}</td>
                    {user?.isAdmin && (
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(op.id)}
                          title="Видалити"
                          style={{ color: 'var(--danger)' }}
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
