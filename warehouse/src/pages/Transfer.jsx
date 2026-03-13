import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addOperation, getCatalog, getWarehouses } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductSearch from '../components/ProductSearch';

/**
 * Форма переміщення товарів між складами.
 * Створює два пов'язані записи: expense на складі-відправнику та income на складі-отримувачі.
 */
export default function Transfer() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    warehouseFrom: '',
    warehouseTo: '',
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
      } catch (err) {
        console.error('Помилка:', err);
      }
    }
    loadData();
  }, []);

  function handleProductSelect(product) {
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
          quantity: 1
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
    if (!formData.warehouseFrom || !formData.warehouseTo) {
      return showToast('Оберіть склад-відправник і склад-отримувач', 'error');
    }
    if (formData.warehouseFrom === formData.warehouseTo) {
      return showToast('Склад-відправник і склад-отримувач не можуть бути однаковими', 'error');
    }
    if (formData.items.length === 0) return showToast('Додайте хоча б одну позицію', 'error');

    setSaving(true);
    try {
      const operation = {
        type: 'transfer',
        warehouseFrom: formData.warehouseFrom,
        warehouseTo: formData.warehouseTo,
        date: formData.date,
        comment: formData.comment,
        items: formData.items.map((item) => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity) || 0
        })),
        user: user?.email
      };

      const result = await addOperation(operation);
      if (result?.success) {
        showToast('Переміщення успішно збережено', 'success');
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
          <h1 className="page-title">🔄 Переміщення між складами</h1>
          <p className="page-subtitle">Перенесення товарів з одного складу на інший</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label>Склад-відправник *</label>
                <select
                  className="form-select"
                  value={formData.warehouseFrom}
                  onChange={(e) => setFormData({ ...formData, warehouseFrom: e.target.value })}
                  required
                >
                  <option value="">Звідки</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Склад-отримувач *</label>
                <select
                  className="form-select"
                  value={formData.warehouseTo}
                  onChange={(e) => setFormData({ ...formData, warehouseTo: e.target.value })}
                  required
                >
                  <option value="">Куди</option>
                  {warehouses.filter((w) => w.id !== formData.warehouseFrom).map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Дата</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Коментар (причина переміщення)</label>
              <input
                type="text"
                className="form-input"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Напр.: Перерозподіл залишків"
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <h3>Позиції ({formData.items.length})</h3>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '16px' }}>
              <ProductSearch products={products} onSelect={handleProductSelect} />
            </div>

            {formData.items.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>Додайте товари через пошук вище</p>
              </div>
            ) : (
              <div className="op-items-list">
                {formData.items.map((item, index) => (
                  <div key={item.productId} className="op-item-row">
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.productArticle && `Арт: ${item.productArticle}`}
                      </div>
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
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
                      {item.unit}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon-only"
                      onClick={() => removeItem(index)}
                      style={{ color: 'var(--danger)' }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>Скасувати</button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || formData.items.length === 0}
          >
            {saving ? 'Збереження...' : '🔄 Зберегти переміщення'}
          </button>
        </div>
      </form>
    </div>
  );
}
