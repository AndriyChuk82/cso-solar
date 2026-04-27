import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addOperation, getCatalog, getWarehouses } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductSearch from '../components/ProductSearch';
import { formatQuantity } from '../utils/formatUtils';
import { getBalances } from '../api/gasApi';
import { Button } from '@cso/design-system';

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
  const [balances, setBalances] = useState({});
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

  useEffect(() => {
    if (formData.warehouseFrom) {
      getBalances(formData.warehouseFrom).then((result) => {
        if (result?.success) {
          const map = {};
          (result.balances || []).forEach((b) => { map[b.product_id] = b.quantity; });
          setBalances(map);
        }
      });
    }
  }, [formData.warehouseFrom]);

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
          quantity: Math.round(parseFloat(item.quantity) || 0)
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
        <div className="card" style={{ marginBottom: '20px', borderTop: '4px solid var(--transfer)' }}>
          <div className="card-body">
            <div className="form-split-2">
              {/* Ліва частина: Основні дані */}
              <div>
                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Склад-відправник *</label>
                    <select
                      className="form-select form-control-compact"
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
                      className="form-select form-control-compact"
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
                </div>

                <div className="form-row" style={{ gridTemplateColumns: '140px 1fr' }}>
                  <div className="form-group">
                    <label>Дата</label>
                    <input
                      type="date"
                      className="form-input form-control-compact"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Коментар (причина переміщення)</label>
                    <input
                      type="text"
                      className="form-input form-control-compact"
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      placeholder="Напр.: Перерозподіл залишків..."
                    />
                  </div>
                </div>
              </div>

              {/* Права частина: Пошук товару */}
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '32px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', marginBottom: '8px' }}>
                    🔍 Швидкий пошук товару
                  </label>
                  <ProductSearch 
                    products={products} 
                    onSelect={handleProductSelect} 
                    placeholder="Артикул або назва..." 
                  />
                  <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    💡 Знайдіть товар та натисніть на нього, щоб додати до списку переміщення.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>📦 Позиції для переміщення ({formData.items.length})</h3>
          </div>
          <div className="card-body" style={{ padding: '16px 20px' }}>

            {formData.items.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📦</div>
                <p style={{ margin: 0, fontWeight: 500 }}>Список порожній</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Скористайтеся пошуком вище, щоб додати товари</p>
              </div>
            ) : (
              <div className="op-items-list">
                {formData.items.map((item, index) => (
                  <div key={item.productId} className="op-item-row">
                    <div className="product-info">
                      <div className="product-name" title={item.productName}>{item.productName}</div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '2px' }}>
                        {item.productArticle && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--border-light)', padding: '1px 6px', borderRadius: '4px' }}>
                            {item.productArticle}
                          </div>
                        )}
                        <div className="stock-warning" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Доступно: <span style={{ fontWeight: 600, color: (balances[item.productId] || 0) < parseFloat(item.quantity) ? 'var(--danger)' : 'var(--text-secondary)' }}>
                            {formatQuantity(balances[item.productId] || 0, products.find(p => p.id === item.productId)?.category)}
                          </span> {item.unit}
                        </div>
                      </div>
                    </div>
                    <div className="qty-input-wrap">
                      <input
                        type="number"
                        className="form-input"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        min="1"
                        step="1"
                        required
                        style={{ textAlign: 'center', fontWeight: 600 }}
                      />
                    </div>
                    <div className="unit-label">
                      {item.unit}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      style={{ color: 'var(--danger)', width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
                      title="Видалити"
                    >✕</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={() => navigate('/')}>Скасувати</Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving || formData.items.length === 0}
            loading={saving}
          >
            {saving ? 'Збереження...' : '🔄 Зберегти переміщення'}
          </Button>
        </div>
      </form>
    </div>
  );
}
