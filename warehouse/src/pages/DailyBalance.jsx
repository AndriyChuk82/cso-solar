import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWarehouses, getDailyBalanceData, submitDailyBalance } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatQuantity } from '../utils/formatUtils';
import ResizableHeader from '../components/ResizableHeader';
import { Button } from '@cso/design-system';

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
        const fact = Math.round(parseFloat(value) || 0);
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

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // Спочатку за категорією
      const catCompare = (a.category || '').localeCompare(b.category || '');
      if (catCompare !== 0) return catCompare;
      // Потім за назвою всередині категорії
      return (a.product_name || '').localeCompare(b.product_name || '');
    });
  }, [items]);

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
              </div>
              {changedCount > 0 && (
                <span className="badge badge-balance">{changedCount} відхилень</span>
              )}
            </div>
            <div className="data-table-wrap">
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th><ResizableHeader pageId="daily-balance" columnId="product">Товар</ResizableHeader></th>
                    <th><ResizableHeader pageId="daily-balance" columnId="unit">Од.</ResizableHeader></th>
                    <th><ResizableHeader pageId="daily-balance" columnId="qty">Облікова к-сть</ResizableHeader></th>
                    <th><ResizableHeader pageId="daily-balance" columnId="fact">Фактична к-сть</ResizableHeader></th>
                    <th><ResizableHeader pageId="daily-balance" columnId="diff">Різниця</ResizableHeader></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item, idx) => {
                    const originalIndex = items.findIndex(i => i.product_id === item.product_id);
                    const showCategoryHeader = idx === 0 || sortedItems[idx-1].category !== item.category;

                    return (
                    <Fragment key={item.product_id}>
                      {showCategoryHeader && (
                        <tr className="category-row" style={{ background: 'var(--bg-light)', fontWeight: 'bold' }}>
                          <td colSpan="5" style={{ padding: '4px 12px', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            📁 {item.category || 'Без категорії'}
                          </td>
                        </tr>
                      )}
                      <tr
                        style={{
                          background: item.diff > 0
                            ? 'var(--income-bg)'
                            : item.diff < 0
                              ? 'var(--expense-bg)'
                              : 'transparent'
                        }}
                      >
                        <td style={{ fontWeight: 500, paddingLeft: '24px', paddingTop: '4px', paddingBottom: '4px', fontSize: '0.85rem' }}>{item.product_name}</td>
                        <td style={{ paddingTop: '4px', paddingBottom: '4px', fontSize: '0.8rem' }}>{item.unit}</td>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap', paddingTop: '4px', paddingBottom: '4px', fontSize: '0.85rem' }}>
                          {formatQuantity(item.quantity, item.product_category)}
                        </td>
                        <td style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                          <input
                             type="number"
                            className="form-input"
                            value={item.factQuantity}
                            onChange={(e) => updateFact(originalIndex, e.target.value)}
                            onFocus={(e) => {
                              const target = e.target;
                              setTimeout(() => target.select(), 0);
                            }}
                            min="0"
                            step="1"
                            style={{
                              width: '80px',
                              height: '28px',
                              padding: '2px 8px',
                              textAlign: 'center',
                              display: 'inline-block',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px'
                            }}
                          />
                        </td>
                        <td style={{
                          fontWeight: 700,
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          fontSize: '0.85rem',
                          color: item.diff > 0
                            ? 'var(--income)'
                            : item.diff < 0
                              ? 'var(--expense)'
                              : 'var(--text-muted)'
                        }}>
                          {item.diff > 0 ? `+${item.diff.toLocaleString('uk-UA')}` : item.diff === 0 ? '—' : item.diff.toLocaleString('uk-UA')}
                        </td>
                      </tr>
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => navigate('/')}>
              Скасувати
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || changedCount === 0}
              loading={saving}
            >
              {saving ? 'Збереження...' : `📊 Зберегти підсумок (${changedCount} відхилень)`}
            </Button>
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
