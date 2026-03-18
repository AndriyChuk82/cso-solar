import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWarehouses, getCatalog, addOperation, getBalances } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductSearch from '../components/ProductSearch';
import { formatQuantity } from '../utils/formatUtils';
import CONFIG from '../config';

/**
 * Форма створення операції Прихід / Розхід.
 * Підтримує добавлення кількох позицій в одній операції.
 *
 * @param {string} type — 'income' або 'expense'
 */
export default function OperationForm({ type = 'income' }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isIncome = type === 'income';
  const title = isIncome ? '📥 Новий прихід' : '📤 Новий розхід';
  const subtitle = isIncome
    ? 'Оформлення надходження товарів на склад'
    : 'Оформлення списання товарів зі складу';

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [balances, setBalances] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedWarehouse, setSavedWarehouse] = useState('');

  const [formData, setFormData] = useState({
    warehouseId: '',
    date: new Date().toISOString().split('T')[0],
    comment: '',
    items: []
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [whResult, catResult] = await Promise.all([
          getWarehouses(),
          getCatalog()
        ]);

        if (whResult?.success) setWarehouses(whResult.warehouses || []);
        if (catResult?.success) setProducts(catResult.products || []);

        // Запам'ятований склад
        const saved = localStorage.getItem('cso_last_warehouse');
        const defaultWh = user?.isStorekeeper ? user.warehouseId : (saved || '');
        if (defaultWh) {
          setFormData((prev) => ({ ...prev, warehouseId: defaultWh }));
          setSavedWarehouse(defaultWh);
        }
      } catch (err) {
        console.error('Помилка завантаження даних:', err);
      }
    }
    loadData();
  }, [user]);

  // Завантаження залишків при зміні складу (для розходу)
  useEffect(() => {
    if (!isIncome && formData.warehouseId) {
      getBalances(formData.warehouseId).then((result) => {
        if (result?.success) {
          const map = {};
          (result.balances || []).forEach((b) => {
            map[b.product_id] = b.quantity;
          });
          setBalances(map);
        }
      });
    }
  }, [formData.warehouseId, isIncome]);

  function handleProductSelect(product) {
    // Перевірка на дублікат
    if (formData.items.some((item) => item.productId === product.id)) return;

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: product.id,
          productName: product.name,
          productArticle: product.article,
          unit: product.unit,
          quantity: 1,
          comment: ''
        }
      ]
    }));
  }

  function updateItem(index, field, value) {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }

  function removeItem(index) {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.warehouseId) return showToast('Оберіть склад', 'error');
    if (formData.items.length === 0) return showToast('Додайте хоча б одну позицію', 'error');

    setSaving(true);
    try {
      const operation = {
        type,
        warehouseId: formData.warehouseId,
        date: formData.date,
        comment: formData.comment,
        items: formData.items.map((item) => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity) || 0,
          comment: item.comment
        })),
        user: user?.email
      };

      const result = await addOperation(operation);
      if (result?.success) {
        showToast(isIncome ? 'Прихід успішно збережено' : 'Розхід успішно збережено', 'success');
        localStorage.setItem('cso_last_warehouse', formData.warehouseId);
        navigate('/');
      } else {
        showToast(result?.error || 'Помилка збереження', 'error');
      }
    } catch (err) {
      console.error('Помилка:', err);
      showToast('Помилка підключення до сервера', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', alignItems: 'start' }}>
              {/* Ліва частина: Склад та Дата */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Склад *</label>
                  <select
                    className="form-select"
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    required
                  >
                    <option value="">Оберіть склад</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Дата операції</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Права частина: Додати товар */}
              <div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔍 Додати товар
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                      (пошук за назвою або артикулом)
                    </span>
                  </label>
                  <ProductSearch
                    products={products}
                    onSelect={handleProductSelect}
                    placeholder="Введіть назву або артикул..."
                  />
                  <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    💡 Ви можете додати декілька різних товарів в одну операцію.
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px', marginBottom: 0 }}>
              <label>Загальний коментар</label>
              <input
                type="text"
                className="form-input"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder={isIncome ? 'Напр.: Початкові залишки або Поставка від...' : 'Причина списання...'}
              />
            </div>
          </div>
        </div>

        {/* Позиції */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Обрані позиції ({formData.items.length})</h3>
            {formData.items.length > 0 && (
               <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                 Всього: {formData.items.length} найменувань
               </div>
            )}
          </div>
          <div className="card-body" style={{ padding: formData.items.length === 0 ? '0' : '20px' }}>

            {formData.items.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>Додайте товари через пошук вище</p>
              </div>
            ) : (
              <div className="op-items-list">
                {formData.items.map((item, index) => (
                  <div key={item.productId} className="op-item-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.productArticle && `Арт: ${item.productArticle}`}
                      </div>
                      {/* Попередження при розході */}
                      {!isIncome && balances[item.productId] !== undefined && (
                        <div className="stock-warning" style={{
                          color: parseFloat(item.quantity) > balances[item.productId] ? 'var(--danger)' : 'var(--text-muted)'
                        }}>
                          ⚠️ Залишок: {formatQuantity(balances[item.productId], products.find(p => p.id === item.productId)?.category)} {item.unit}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      className="form-input"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                      style={{ textAlign: 'center' }}
                    />
                    <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {item.unit}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon-only"
                      onClick={() => removeItem(index)}
                      title="Видалити"
                      style={{ color: 'var(--danger)' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>
            Скасувати
          </button>
          <button
            type="submit"
            className={`btn ${isIncome ? 'btn-success' : 'btn-danger'}`}
            disabled={saving || formData.items.length === 0}
          >
            {saving ? 'Збереження...' : (isIncome ? '📥 Зберегти прихід' : '📤 Зберегти розхід')}
          </button>
        </div>
      </form>
    </div>
  );
}
