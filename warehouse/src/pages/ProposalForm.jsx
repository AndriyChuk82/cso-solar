import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCatalog, getProposals, saveProposal } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductSearch from '../components/ProductSearch';

/**
 * Сторінка створення / редагування комерційної пропозиції.
 */
export default function ProposalForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isEdit = !!id;
  const title = isEdit ? '✏️ Редагувати КП' : '➕ Нова комерційна пропозиція';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    number: 'КП-' + String(Date.now()).slice(-3),
    clientName: '',
    clientPhone: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Чернетка',
    statusComment: '',
    items: [],
    discountValue: 0,
    discountType: 'percentage', // 'percentage' або 'amount'
    courseUSD: 41.5,
    courseEUR: 43.5,
    currency: 'UAH',
    markup: 15,
    totalAmount: 0,
    userEmail: user?.email || '',
    comment: '',
    sellerId: 'fop_pastushok'
  });

  useEffect(() => {
    async function loadData() {
      try {
        const catResult = await getCatalog();
        if (catResult?.success) setProducts(catResult.products || []);

        if (isEdit) {
          const propResult = await getProposals();
          if (propResult?.success) {
            const found = propResult.proposals.find(p => p.id === id);
            if (found) {
              setFormData(found);
            } else {
              showToast('КП не знайдена', 'error');
              navigate('/proposals');
            }
          }
        }
      } catch (err) {
        console.error('Помилка завантаження даних:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, isEdit, user]);

  // Перерахунок суми
  useEffect(() => {
    const subtotal = formData.items.reduce((acc, item) => acc + (parseFloat(item.price) * parseFloat(item.quantity) || 0), 0);
    let total = subtotal;

    if (formData.discountType === 'percentage') {
      total = subtotal * (1 - (parseFloat(formData.discountValue) || 0) / 100);
    } else {
      total = subtotal - (parseFloat(formData.discountValue) || 0);
    }

    setFormData(prev => ({ ...prev, totalAmount: Math.max(0, total) }));
  }, [formData.items, formData.discountValue, formData.discountType]);

  function handleProductSelect(product) {
    if (formData.items.some(item => item.productId === product.id)) return;

    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: product.id,
          productName: product.name,
          productArticle: product.article,
          unit: product.unit,
          quantity: 1,
          price: 0,
          total: 0
        }
      ]
    }));
  }

  function updateItem(index, field, value) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const newItem = { ...item, [field]: value };
          if (field === 'price' || field === 'quantity') {
            newItem.total = (parseFloat(newItem.price) || 0) * (parseFloat(newItem.quantity) || 0);
          }
          return newItem;
        }
        return item;
      })
    }));
  }

  function removeItem(index) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.clientName) return showToast('Вкажіть ім\'я клієнта', 'error');
    if (formData.items.length === 0) return showToast('Додайте хоча б одну позицію', 'error');

    setSaving(true);
    try {
      const result = await saveProposal(formData, user?.email);
      if (result?.success) {
        showToast('КП успішно збережено', 'success');
        navigate('/proposals');
      } else {
        showToast(result?.error || 'Помилка збереження', 'error');
      }
    } catch (err) {
      console.error('Помилка:', err);
      showToast('Помилка сервера', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="loading-state" style={{ padding: '60px', textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
      <p>Завантаження даних...</p>
    </div>
  );

  const currencySymbol = formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : 'грн';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">Заповніть дані комерційної пропозиції</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Основна інформація */}
          <div className="card">
            <div className="card-header">
              <h3>Інформація про клієнта</h3>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Клієнт (ПІБ або Назва) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Телефон / Email</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Примітка (для внутрішнього використання)</label>
                <input
                    type="text"
                    className="form-input"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Напр. Звідки клієнт, особливості..."
                />
              </div>
            </div>
          </div>

          {/* Параметри КП */}
          <div className="card">
            <div className="card-header">
              <h3>Параметри КП</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label>Номер КП</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Дата КП</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label>Валюта КП</label>
                  <select
                    className="form-select"
                    value={formData.currency || 'UAH'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="UAH">Гривня (UAH)</option>
                    <option value="USD">Долар (USD)</option>
                    <option value="EUR">Євро (EUR)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Націнка %</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.markup}
                    onChange={(e) => setFormData({ ...formData, markup: e.target.value })}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Курс $</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.courseUSD}
                    onChange={(e) => setFormData({ ...formData, courseUSD: e.target.value })}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Курс €</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.courseEUR || ''}
                    onChange={(e) => setFormData({ ...formData, courseEUR: e.target.value })}
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Від імені (Продавець)</label>
                  <select
                    className="form-select"
                    value={formData.sellerId || 'fop_pastushok'}
                    onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                  >
                    <option value="fop_pastushok">ФОП Пастушок М. В.</option>
                    <option value="tov_cso">ТОВ "Центр сервісного обслуговування"</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Статус</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Чернетка">Чернетка</option>
                    <option value="Надіслано">Надіслано</option>
                    <option value="Прийнято">Прийнято</option>
                    <option value="Відхилено">Відхилено</option>
                  </select>
                </div>
            </div>
          </div>
        </div>

        {/* Склад КП (Товари) */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <h3>Позиції ({formData.items.length})</h3>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '5px', display: 'block' }}>
                Додати товар з каталогу
              </label>
              <ProductSearch
                products={products}
                onSelect={handleProductSelect}
                placeholder="Пошук за назвою або артикулом..."
              />
            </div>

            {formData.items.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>КП порожня. Додайте товари через пошук вище.</p>
              </div>
            ) : (
              <div className="op-items-table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Товар</th>
                      <th style={{ width: '15%' }}>Кількість</th>
                      <th style={{ width: '20%' }}>Ціна за од. ({currencySymbol})</th>
                      <th style={{ width: '20%' }}>Разом</th>
                      <th style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.productName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.productArticle}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
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
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            value={item.price}
                            onChange={(e) => updateItem(index, 'price', e.target.value)}
                            min="0"
                            step="0.01"
                            required
                            style={{ textAlign: 'center' }}
                          />
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {new Intl.NumberFormat('uk-UA').format(item.total)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon-only"
                            onClick={() => removeItem(index)}
                            style={{ color: 'var(--danger)' }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Підсумки */}
        <div className="card" style={{ maxWidth: '400px', marginLeft: 'auto', marginBottom: '16px' }}>
          <div className="card-body">
            <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Сума без знижки:</span>
              <span>{new Intl.NumberFormat('uk-UA').format(formData.items.reduce((a, b) => a + (b.total || 0), 0))} {currencySymbol}</span>
            </div>
            
            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '0.82rem', marginBottom: '8px', display: 'block' }}>Додати знижку</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  className="form-input"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  style={{ width: '80px' }}
                />
                <select 
                   className="form-select"
                   value={formData.discountType}
                   onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                   style={{ width: 'auto' }}
                >
                  <option value="percentage">%</option>
                  <option value="amount">{currencySymbol}</option>
                </select>
              </div>
            </div>

            <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>До сплати:</span>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent)' }}>
                {new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2 }).format(formData.totalAmount)} {currencySymbol}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/proposals')}>
            Скасувати
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || formData.items.length === 0}
          >
            {saving ? 'Збереження...' : (isEdit ? '💾 Зберегти зміни' : '📄 Створити комерційну пропозицію')}
          </button>
        </div>
      </form>
    </div>
  );
}
