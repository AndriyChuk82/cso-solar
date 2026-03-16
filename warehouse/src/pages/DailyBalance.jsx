import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWarehouses, getDailyBalanceData, submitDailyBalance } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatQuantity } from '../utils/formatUtils';

/**
 * Підсумок дня — «Ввести залишки на кінець дня».
 * Комірник вводить фактичні залишки, система порівнює з обліковими
 * і автоматично створює записи income/expense для різниць.
 */
export default function DailyBalance() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    getWarehouses().then((result) => {
      if (result?.success) {
        setWarehouses(result.warehouses || []);
        const defaultWh = user?.isStorekeeper ? user.warehouseId : '';
        if (defaultWh) setWarehouseId(defaultWh);
      }
    });
  }, [user]);

  async function loadBalanceData() {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const result = await getDailyBalanceData(warehouseId);
      if (result?.success) {
        setItems(
          (result.items || []).map((item) => ({
            ...item,
            factQuantity: item.quantity, // початково = обліковому
            diff: 0
          }))
        );
      }
    } catch (err) {
      console.error('Помилка:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (warehouseId) loadBalanceData();
  }, [warehouseId]);

  function updateFact(index, value) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const fact = parseFloat(value) || 0;
        return { ...item, factQuantity: value, diff: fact - item.quantity };
      })
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const changedItems = items.filter((item) => item.diff !== 0);
    if (changedItems.length === 0) {
      showToast('Немає відхилень — всі залишки збігаються.', 'info');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    setSaving(true);
    try {
      const result = await submitDailyBalance({
        warehouseId,
        date,
        items: changedItems.map((item) => ({
          productId: item.product_id,
          diff: item.diff
        })),
        user: user?.email
      });

      if (result?.success) {
        showToast(`Підсумок дня збережено. Записано ${changedItems.length} відхилень.`, 'success');
        navigate('/');
      } else {
        showToast(result?.error || 'Помилка збереження', 'error');
      }
    } catch (err) {
      console.error('Помилка:', err);
      showToast('Помилка підключення', 'error');
    } finally {
      setSaving(false);
    }
  }

  const changedCount = items.filter((item) => item.diff !== 0).length;

  const displayedItems = sortAsc 
    ? [...items].sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''))
    : items;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Підсумок дня</h1>
          <p className="page-subtitle">Введіть фактичні залишки на кінець дня</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-body">
          <div className="form-group" style={{ maxWidth: '400px' }}>
            <label>Склад</label>
            <select
              className="form-select"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">Оберіть склад</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '12px' }}>Завантаження залишків...</p>
          </div>
        </div>
      ) : items.length > 0 ? (
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0 }}>Позиції ({items.length})</h3>
                <button 
                  type="button"
                  className={`btn btn-sm ${sortAsc ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSortAsc(!sortAsc)}
                  title="Сортувати від А до Я за назвою"
                >
                  {sortAsc ? 'Сортування: А-Я' : 'Сортувати А-Я'}
                </button>
              </div>
              {changedCount > 0 && (
                <span className="badge badge-balance">{changedCount} відхилень</span>
              )}
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Товар</th>
                    <th>Од.</th>
                    <th>Облікова к-сть</th>
                    <th>Фактична к-сть</th>
                    <th>Різниця</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((item) => {
                    const originalIndex = items.findIndex(i => i.product_id === item.product_id);
                    return (
                    <tr
                      key={item.product_id}
                      style={{
                        background: item.diff > 0
                          ? 'var(--income-bg)'
                          : item.diff < 0
                            ? 'var(--expense-bg)'
                            : 'transparent'
                      }}
                    >
                      <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                      <td>{item.unit}</td>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatQuantity(item.quantity, item.product_category)}
                      </td>
                      <td>
                        <input
                           type="number"
                          className="form-input"
                          value={item.factQuantity}
                          onChange={(e) => updateFact(originalIndex, e.target.value)}
                          min="0"
                          step="0.01"
                          style={{
                            width: '100px',
                            textAlign: 'center',
                            display: 'inline-block',
                            fontWeight: 600
                          }}
                        />
                      </td>
                      <td style={{
                        fontWeight: 700,
                        color: item.diff > 0
                          ? 'var(--income)'
                          : item.diff < 0
                            ? 'var(--expense)'
                            : 'var(--text-muted)'
                      }}>
                        {item.diff > 0 ? `+${item.diff}` : item.diff === 0 ? '—' : item.diff}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>
              Скасувати
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || changedCount === 0}
            >
              {saving ? 'Збереження...' : `📊 Зберегти підсумок (${changedCount} відхилень)`}
            </button>
          </div>
        </form>
      ) : warehouseId ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <p>На цьому складі немає позицій із залишками</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
