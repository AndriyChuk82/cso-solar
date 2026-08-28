import { useState, useEffect } from 'react';
import { getCatalog, addProduct, updateProduct, archiveProduct, restoreProduct, getCategories, getOperations } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { matchesSearch, normalizeForSearch, normalizeForComparison } from '../utils/searchUtils';
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
    category: '',
    price_wholesale: '',
    price_retail: '',
    price_currency: 'USD'
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
    setFormData({
      name: '',
      article: '',
      unit: 'шт',
      category: firstCat,
      price_wholesale: '',
      price_retail: '',
      price_currency: 'USD'
    });
    setShowModal(true);
  }

  function openEditModal(product) {
    setEditProduct(product);
    setFormData({
      name: product.name,
      article: product.article || '',
      unit: product.unit,
      category: product.category || '',
      price_wholesale: product.price_wholesale || '',
      price_retail: product.price_retail || '',
      price_currency: product.price_currency || 'USD'
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
        price_wholesale: formData.price_wholesale ? formData.price_wholesale.trim() : null,
        price_retail: formData.price_retail ? formData.price_retail.trim() : null,
        price_currency: formData.price_currency || 'USD',
        active: true
      };

      const normalizedNewName = normalizeForComparison(productData.name);
      const normalizedNewArticle = productData.article ? normalizeForComparison(productData.article) : '';

      if (editProduct) {
        productData.id = editProduct.id;
        // При редагуванні перевіряємо чи не конфліктує нова назва або артикул з іншими існуючими товарами
        const duplicate = products.find(p => 
          p.id !== editProduct.id && 
          (normalizeForComparison(p.name) === normalizedNewName || 
           (normalizedNewArticle && normalizeForComparison(p.article) === normalizedNewArticle))
        );
        
        if (duplicate) {
          setSaving(false);
          const isNameDup = normalizeForComparison(duplicate.name) === normalizedNewName;
          return showToast(
            isNameDup ? `Товар з такою назвою вже існує: ${duplicate.name}` : `Товар з таким артикулом вже існує: ${duplicate.article}`, 
            'error'
          );
        }
        await updateProduct(productData);
      } else {
        // При додаванні нового
        const duplicate = products.find(p => 
          normalizeForComparison(p.name) === normalizedNewName || 
          (normalizedNewArticle && normalizeForComparison(p.article) === normalizedNewArticle)
        );

        if (duplicate) {
          setSaving(false);
          const isNameDup = normalizeForComparison(duplicate.name) === normalizedNewName;
          return showToast(
            isNameDup ? `Товар з такою назвою вже існує: ${duplicate.name}` : `Товар з таким артикулом вже існує: ${duplicate.article}`, 
            'error'
          );
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
    try {
      // Перевірка залишків перед архівацією
      const opsResult = await getOperations({ productId });
      if (!opsResult.success) {
        return showToast('Не вдалося завантажити дані для перевірки залишків', 'error');
      }

      const totalBalance = (opsResult.operations || []).reduce((sum, op) => {
        const qty = parseFloat(op.quantity) || 0;
        if (op.type === 'income' || op.type === 'balance') return sum + qty;
        if (op.type === 'expense') return sum - qty;
        return sum;
      }, 0);

      // Округлюємо для запобігання помилок плаваючої коми
      const roundedBalance = Math.round(totalBalance * 10000) / 10000;

      if (roundedBalance > 0) {
        return showToast(`Неможливо архівувати товар з позитивним залишком (${roundedBalance}). Спочатку спишіть товар або перенесіть залишки.`, 'error');
      }
      if (roundedBalance < 0) {
        return showToast(`Неможливо архівувати товар з від'ємним залишком (${roundedBalance}). Перевірте історію операцій.`, 'error');
      }

      if (!confirm('Архівувати цей товар? Він зникне зі списку, але історія операцій збережеться.')) return;
      await archiveProduct(productId);
      showToast('Товар перенесено в архів', 'success');
      loadProducts();
    } catch (err) {
      console.error('Помилка:', err);
      showToast('Помилка архівації', 'error');
    }
  }

  async function handleRestore(productId) {
    try {
      await restoreProduct(productId);
      showToast('Товар відновлено з архіву', 'success');
      loadProducts();
    } catch (err) {
      console.error('Помилка:', err);
      showToast('Помилка відновлення', 'error');
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
            <>
              {/* Десктопна таблиця (без змін) */}
              <table className="data-table hidden md:table">
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
                            {p.active ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchive(p.id)}
                                style={{ color: 'var(--danger)' }}
                                title="В архів"
                              >🗄️</Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRestore(p.id)}
                                style={{ color: 'var(--success)' }}
                                title="Відновити з архіву"
                              >♻️</Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Мобільні адаптивні картки товарів */}
              <div className="block md:hidden divide-y divide-[var(--border)]">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3.5 flex flex-col gap-2.5 transition-colors bg-[var(--bg-card)] ${
                      !p.active ? 'opacity-60 bg-gray-50/50 dark:bg-neutral-800/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[var(--text)] leading-snug break-words">
                          {p.name}
                        </div>
                        {p.article && (
                          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                            Арт: {p.article}
                          </div>
                        )}
                      </div>
                      <span className={`badge ${p.active ? 'badge-income' : 'badge-expense'} shrink-0 text-[10px] font-semibold`}>
                        {p.active ? 'Активний' : 'Архів'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {p.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                          🏷️ {p.category}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--border-light)] text-[var(--text-secondary)] font-medium text-[11px]">
                        Од: {p.unit}
                      </span>
                    </div>

                    {user?.isAdmin && (
                      <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]/40 mt-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="flex-1 py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                        >
                          ✏️ Редагувати
                        </button>
                        {p.active ? (
                          <button
                            type="button"
                            onClick={() => handleArchive(p.id)}
                            className="py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                            title="Перемістити в архів"
                          >
                            🗄️ В архів
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestore(p.id)}
                            className="py-2 px-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                            title="Відновити з архіву"
                          >
                            ♻️ Відновити
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
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

                {/* Блок цін для прайс-листа */}
                <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 space-y-2 mt-3">
                  <div className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <span>💰</span> Орієнтовні ціни (для Прайс-листа)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="form-group mb-0">
                      <label className="text-[11px] font-semibold text-[var(--text-muted)]">Опт (базовий)</label>
                      <input
                        type="text"
                        className="form-input text-xs"
                        placeholder="напр. 150"
                        value={formData.price_wholesale}
                        onChange={(e) => setFormData({ ...formData, price_wholesale: e.target.value })}
                      />
                    </div>
                    <div className="form-group mb-0">
                      <label className="text-[11px] font-semibold text-[var(--text-muted)]">Роздріб</label>
                      <input
                        type="text"
                        className="form-input text-xs"
                        placeholder="напр. 180"
                        value={formData.price_retail}
                        onChange={(e) => setFormData({ ...formData, price_retail: e.target.value })}
                      />
                    </div>
                    <div className="form-group mb-0">
                      <label className="text-[11px] font-semibold text-[var(--text-muted)]">Валюта</label>
                      <select
                        className="form-select text-xs"
                        value={formData.price_currency}
                        onChange={(e) => setFormData({ ...formData, price_currency: e.target.value })}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="UAH">UAH (грн)</option>
                      </select>
                    </div>
                  </div>
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
