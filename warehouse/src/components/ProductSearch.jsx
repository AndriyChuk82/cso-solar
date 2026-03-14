import { useState, useCallback, useRef, useEffect } from 'react';
import { getCatalog, addProduct, getCategories } from '../api/gasApi';
import { fetchCPCatalog } from '../api/externalApi';
import { normalizeForSearch, matchesSearch } from '../utils/searchUtils';
import CONFIG from '../config';

// Глобальний кеш для зовнішнього каталогу (щоб не качати щоразу)
let externalCatalogCache = null;

/**
 * Компонент живого пошуку товарів із можливістю швидкого додавання нового.
 * Використовується на формах Приходу, Розходу, Переміщення.
 *
 * @param {Function} onSelect — колбек при виборі товару
 * @param {Array} products — список товарів (з локального кешу)
 * @param {string} placeholder — текст підказки
 */
export default function ProductSearch({ onSelect, products = [], placeholder = 'Пошук товару...' }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', article: '', unit: 'шт', category: '' });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [externalProducts, setExternalProducts] = useState([]);
  const [extLoading, setExtLoading] = useState(false);
  const [extError, setExtError] = useState(false);
  const wrapperRef = useRef(null);

  // Завантаження зовнішнього каталогу КП
  useEffect(() => {
    if (externalCatalogCache) {
      setExternalProducts(externalCatalogCache);
    } else {
      setExtLoading(true);
      fetchCPCatalog().then(data => {
        if (data && data.length > 0) {
          externalCatalogCache = data;
          setExternalProducts(data);
        } else {
          setExtError(true);
        }
      }).catch(err => {
        console.error(err);
        setExtError(true);
      }).finally(() => {
        setExtLoading(false);
      });
    }

    // Завантаження категорій
    getCategories().then(res => {
      if (res && res.success) {
        setCategories(res.categories || []);
      }
    }).catch(err => console.error('Помилка завантаження категорій:', err));
  }, []);

  // Закрити випадаючий список при кліку за межами
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фільтрація локальних товарів
  const filteredLocal = products.filter((p) => {
    if (!query.trim()) return false;
    const content = `${p.name} ${p.article || ''}`;
    return matchesSearch(content, query);
  });

  // Фільтрація зовнішніх товарів (лише тих, яких немає в локальному списку)
  const filteredExternal = externalProducts.filter((ext) => {
    if (!query.trim()) return false;
    // Якщо вже є такий товар локально (по назві), не показуємо як зовнішній
    if (products.some(p => normalizeForSearch(p.name) === normalizeForSearch(ext.name))) return false;

    return matchesSearch(ext.name, query);
  }).slice(0, 50); // Збільшено ліміт, щоб вміщалися всі моделі

  async function handleSelect(product) {
    if (product.isExternal) {
      // Якщо обрано товар із КП — спочатку додаємо його в складську базу
      setSaving(true);
      try {
        const result = await addProduct({
          name: product.name,
          article: '',
          unit: product.unit || 'шт',
          category: product.category || 'Із КП',
          active: true
        });

        if (result.success && result.product) {
          onSelect(result.product);
        }
      } catch (err) {
        console.error('Помилка імпорту товару:', err);
      } finally {
        setSaving(false);
        setQuery('');
        setShowResults(false);
      }
      return;
    }

    onSelect(product);
    setQuery('');
    setShowResults(false);
  }

  async function handleAddNew(e) {
    e.preventDefault();
    if (!newProduct.name.trim()) return;

    setSaving(true);
    try {
      const result = await addProduct({
        name: newProduct.name,
        article: newProduct.article,
        unit: newProduct.unit,
        category: newProduct.category,
        active: true
      });

      if (result.success && result.product) {
        onSelect(result.product);
        setNewProduct({ name: '', article: '', unit: 'шт', category: '' });
        setShowAddForm(false);
        setQuery('');
        setShowResults(false);
      } else {
        alert(result.error || 'Помилка збереження');
      }
    } catch (err) {
      console.error('Помилка додавання товару:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="product-search" ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        className="form-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => query.trim() && setShowResults(true)}
        placeholder={placeholder}
      />

      {showResults && (query.trim() || showAddForm) && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '280px',
          overflowY: 'auto',
          marginTop: '4px'
        }}>
          {filteredLocal.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelect(p)}
              style={{
                padding: '8px 14px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-light)',
                fontSize: '0.85rem',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--primary-bg)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {p.article && `Арт: ${p.article}`} {p.unit && `· ${p.unit}`}
              </div>
            </div>
          ))}

          {filteredExternal.length > 0 && (
            <div style={{ padding: '4px 14px', background: 'var(--bg-alt)', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              З КАТАЛОГУ КП (БУДЕ ІМПОРТОВАНО)
            </div>
          )}

          {filteredExternal.map((p, idx) => (
            <div
              key={'ext-' + idx}
              onClick={() => handleSelect(p)}
              style={{
                padding: '8px 14px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-light)',
                fontSize: '0.85rem',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--primary-bg)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {p.name}
                <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '1px 5px', borderRadius: '4px' }}>
                  КП
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {p.category} {p.unit && `· ${p.unit}`}
              </div>
            </div>
          ))}

          {filteredLocal.length === 0 && filteredExternal.length === 0 && query.trim() && !showAddForm && (
            <div style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div>Товар не знайдено.</div>
              {extLoading && <div style={{ marginTop: '5px', fontSize: '0.75rem', color: 'var(--primary)' }}>Завантаження каталогу КП... ⏳</div>}
              {extError && <div style={{ marginTop: '5px', fontSize: '0.75rem', color: 'var(--danger)' }}>Помилка завантаження бази КП (перевірте доступ до таблиці - Anyone with link).</div>}
            </div>
          )}

          {/* Кнопка "+ Додати новий товар" */}
          {!showAddForm && (
            <div
              onClick={() => setShowAddForm(true)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--primary-bg)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              ➕ Створити товар вручну
            </div>
          )}

          {/* Форма швидкого додавання */}
          {showAddForm && (
            <form onSubmit={handleAddNew} style={{ padding: '14px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '10px' }}>
                Новий товар
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Назва товару *"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                  style={{ fontSize: '0.82rem' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Артикул"
                  value={newProduct.article}
                  onChange={(e) => setNewProduct({ ...newProduct, article: e.target.value })}
                  style={{ fontSize: '0.82rem' }}
                />
                <select
                  className="form-select"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  style={{ fontSize: '0.82rem' }}
                >
                  {CONFIG.UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <select
                  className="form-select"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  style={{ fontSize: '0.82rem' }}
                  required
                >
                  <option value="">Оберіть категорію *</option>
                  {categories.filter(c => c.active).map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Збереження...' : 'Зберегти'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Скасувати
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
