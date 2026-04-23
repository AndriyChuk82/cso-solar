import { useState, useEffect } from 'react';
import { getCatalog, addProduct, updateProduct, archiveProduct, getCategories } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { matchesSearch, normalizeForSearch } from '../utils/searchUtils';
import CONFIG from '../config';
import { Button } from '@cso/design-system';

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
 * Управління каталогом товарів.
 * Повне керування — лише адміністратор.
 */
export default function Catalog() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    article: '',
    unit: 'шт',
    category: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const [pResult, cResult] = await Promise.all([
        getCatalog(),
        getCategories()
      ]);
      if (pResult?.success) setProducts(pResult.products || []);
      if (cResult?.success) setCategories(cResult.categories || []);
    } catch (err) {
      console.error('Помилка:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditProduct(null);
    const firstCat = (categories || []).find(c => c.active)?.name || '';
    setFormData({ name: '', article: '', unit: 'шт', category: firstCat });
    setShowModal(true);
  }

  function openEditModal(product) {
    setEditProduct(product);
    setFormData({
      name: product.name,
      article: product.article,
      unit: product.unit,
      category: product.category || ''
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const productData = {
        name: formData.name.trim(),
        article: formData.article.trim(),
        unit: formData.unit,
        category: formData.category,
        active: true
      };

      const normalizedNewName = normalizeForSearch(productData.name);

      if (editProduct) {
        productData.id = editProduct.id;
        // При редагуванні перевіряємо чи не конфліктує нова назва з іншими існуючими товарами
        const isDuplicate = products.some(p => 
          p.id !== editProduct.id && 
          normalizeForSearch(p.name) === normalizedNewName
        );
        if (isDuplicate) {
          setSaving(false);
          return showToast('Товар з такою назвою вже існує', 'error');
        }
        await updateProduct(productData);
      } else {
        // При додаванні нового
        const isDuplicate = products.some(p => 
          normalizeForSearch(p.name) === normalizedNewName
        );
        if (isDuplicate) {
          setSaving(false);
          return showToast('Товар з такою назвою вже існує', 'error');
        }
        const result = await addProduct(productData);
        if (!result.success) {
          setSaving(false);
          return showToast(result.error || 'Помилка збереження', 'error');
        }
      }

      setShowModal(false);
      showToast(editProduct ? 'Товар оновлено' : 'Товар додано', 'success');
      loadProducts();
    } catch (err) {
      console.error('Помилка:', err);
      showToast('Помилка збереження', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(productId) {
    if (!confirm('Архівувати цей товар? Він зникне зі списку, але історія операцій збережеться.')) return;
    try {
      await archiveProduct(productId);
      showToast('Товар перенесено в архів', 'success');
      loadProducts();
    } catch (err) {
      console.error('Помилка:', err);
      showToast('Помилка архівації', 'error');
    }
  }

  const filtered = products.filter((p) => {
    if (!showArchived && !p.active) return false;
    if (!debouncedSearch.trim()) return true;
    const content = `${p.name} ${p.article} ${p.category}`;
    return matchesSearch(content, debouncedSearch);
  }).sort((a, b) => sortAsc ? (a.name || '').localeCompare(b.name || '') : 0);

  return (
    <div>
      <div className="page-header" style={{ justifyContent: 'flex-start', gap: '32px' }}>
        <div>
          <h1 className="page-title">📦 Каталог товарів</h1>
          <p className="page-subtitle">Управління переліком товарів</p>
        </div>
        {user?.isAdmin && (
          <Button variant="primary" onClick={() => openAddModal()} type="button">
            ➕ Додати товар
          </Button>
        )}
      </div>

      <div className="filters-bar">
        <div className="form-group" style={{ flex: 1 }}>
          <label>Пошук</label>
          <input
            type="text"
            className="form-input"
            placeholder="За назвою або артикулом..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
          <button 
            className={`btn btn-sm ${sortAsc ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSortAsc(!sortAsc)}
            title="Сортувати від А до Я за назвою"
          >
            {sortAsc ? 'Сортування: А-Я' : 'Сортувати А-Я'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Показати архівні
          </label>
        </div>
      </div>

      <div className="card">
        <div className="data-table-wrap">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>Товарів не знайдено</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Од. виміру</th>
                  <th>Категорія</th>
                  <th>Статус</th>
                  {user?.isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.5 }}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.unit}</td>
                    <td>{p.category || '—'}</td>
                    <td>
                      <span className={`badge ${p.active ? 'badge-income' : 'badge-expense'}`}>
                        {p.active ? 'Активний' : 'Архів'}
                      </span>
                    </td>
                    {user?.isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(p)}>✏️</Button>
                          {p.active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(p.id)}
                              style={{ color: 'var(--danger)' }}
                            >🗄️</Button>
                          )}
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

      {/* Модалка додавання/редагування */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editProduct ? '✏️ Редагувати товар' : '➕ Новий товар'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Назва товару *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Одиниця виміру</label>
                  <select
                    className="form-select"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    {CONFIG.UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Категорія *</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Оберіть категорію</option>
                    {categories.filter(c => c.active || c.name === formData.category).map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Скасувати
                </Button>
                <Button type="submit" variant="primary" disabled={saving} loading={saving}>
                  {saving ? 'Збереження...' : 'Зберегти'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
