import { useState, useCallback, useRef, useEffect } from 'react';
import { getCatalog, addProduct } from '../api/gasApi';
import CONFIG from '../config';

/**
 * Компонент живого пошуку товарів із можливістю швидкого додавання нового.
 * Використовується на формах Приходу, Розходу, Переміщення.
 *
 * @param {Function} onSelect — колбек при виборі товару
 * @param {Array} products — список товарів (з кешу)
 * @param {string} placeholder — текст підказки
 */
export default function ProductSearch({ onSelect, products = [], placeholder = 'Пошук товару...' }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', article: '', unit: 'шт' });
  const [saving, setSaving] = useState(false);
  const wrapperRef = useRef(null);

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

  const filtered = products.filter((p) => {
    if (!query.trim()) return false;
    const words = query.toLowerCase().split(/\s+/);
    const content = `${p.name} ${p.article}`.toLowerCase();
    return words.every((word) => content.includes(word));
  });

  function handleSelect(product) {
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
        category: '',
        active: true
      });

      if (result.success && result.product) {
        onSelect(result.product);
        setNewProduct({ name: '', article: '', unit: 'шт' });
        setShowAddForm(false);
        setQuery('');
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
          {filtered.map((p) => (
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

          {filtered.length === 0 && query.trim() && !showAddForm && (
            <div style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Товар не знайдено
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
              ➕ Додати новий товар
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
