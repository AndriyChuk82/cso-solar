import { useState, useCallback, useRef, useEffect } from 'react';
import { getCatalog, addProduct, getCategories } from '../api/gasApi';
import { fetchCPCatalog } from '../api/externalApi';
import { normalizeForSearch, matchesSearch } from '../utils/searchUtils';
import CONFIG from '../config';
import { Button } from '@cso/design-system';

// Глобальний кеш для зовнішнього каталогу (щоб не качати щоразу)
let externalCatalogCache = null;

/**
 * Компонент живого пошуку товарів із можливістю швидкого додавання нового.
 * Використовується на формах Приходу, Розходу, Переміщення.
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
  const [selectedIds, setSelectedIds] = useState([]);
  const wrapperRef = useRef(null);

  // Завантаження категорій та зовнішнього каталогу
  useEffect(() => {
    if (externalCatalogCache) {
      setExternalProducts(externalCatalogCache);
    } else {
      setExtLoading(true);
      fetchCPCatalog().then(data => {
        if (data?.length > 0) {
          externalCatalogCache = data;
          setExternalProducts(data);
        } else {
          setExtError(true);
        }
      }).catch(() => setExtError(true)).finally(() => setExtLoading(false));
    }

    getCategories().then(res => {
      if (res?.success) setCategories(res.categories || []);
    });
  }, []);

  // Закрити при кліку зовні
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
    return matchesSearch(`${p.name} ${p.article || ''}`, query);
  });

  // Фільтрація зовнішніх (КП)
  const filteredExternal = externalProducts.filter((ext) => {
    if (!query.trim()) return false;
    const isLocal = products.some(p => normalizeForSearch(p.name) === normalizeForSearch(ext.name));
    return !isLocal && matchesSearch(ext.name, query);
  }).slice(0, 30);

  function toggleSelected(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function mapInternalCategory(name = '', sourceCategory = '') {
    const combined = (name + ' ' + sourceCategory).toLowerCase();
    
    // Інвертори
    if (combined.includes('інвертор') || combined.includes('inverter')) return 'Інвертори';
    
    // АКБ / Батареї (LFP, LiFePO4, АКБ)
    if (combined.includes('акб') || combined.includes('lfp') || combined.includes('lifepo4') || combined.includes('батарея') || combined.includes('battery')) {
      // Але якщо це "сонячна батарея", то це панель
      if (combined.includes('сонячна батарея') || combined.includes('сонячні батареї') || combined.includes('panel')) return 'Сонячні панелі';
      return 'АКБ';
    }

    // Сонячні панелі
    if (combined.includes('сонячна батарея') || combined.includes('сонячні батареї') || combined.includes('панель') || combined.includes('panel')) return 'Сонячні панелі';

    // Кріплення
    if (combined.includes('кріплення') || combined.includes('крепление') || combined.includes('рейка') || combined.includes('профіль') || combined.includes('кронштейн')) return 'Кріплення';

    // Розхідники та кабель
    if (combined.includes('кабель') || combined.includes('розхідник') || combined.includes('прв') || combined.includes('пв-3') || combined.includes('солар') || combined.includes('mc4')) return 'Розхідники';

    return 'Розхідники'; // Default fallback
  }

  async function handleSelect(product) {
    if (product.isExternal) {
      setSaving(true);
      try {
        const result = await addProduct({
          name: product.name,
          article: '',
          unit: product.unit || 'шт',
          category: mapInternalCategory(product.name, product.category),
          active: true
        });
        if (result.success && result.product) onSelect(result.product);
      } finally {
        setSaving(false);
        setQuery('');
        setShowResults(false);
        setSelectedIds([]);
      }
      return;
    }
    onSelect(product);
    setQuery('');
    setShowResults(false);
    setSelectedIds([]);
  }

  function handleBatchAdd() {
    const selectedList = products.filter(p => selectedIds.includes(p.id));
    selectedList.forEach(p => onSelect(p));
    setQuery('');
    setShowResults(false);
    setSelectedIds([]);
  }

  async function handleAddNew(e) {
    e.preventDefault();
    if (!newProduct.name.trim()) return;
    setSaving(true);
    try {
      const result = await addProduct({ ...newProduct, active: true });
      if (result.success && result.product) {
        onSelect(result.product);
        setNewProduct({ name: '', article: '', unit: 'шт', category: '' });
        setShowAddForm(false);
        setQuery('');
        setShowResults(false);
        setSelectedIds([]);
      }
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
        onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
        onFocus={() => query.trim() && setShowResults(true)}
        placeholder={placeholder}
      />

      {showResults && (query.trim() || showAddForm) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          maxHeight: '400px', overflowY: 'auto', marginTop: '4px'
        }}>
          {filteredLocal.map((p) => (
            <div
              key={p.id}
              onClick={() => toggleSelected(p.id)}
              style={{
                padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)',
                fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px',
                background: selectedIds.includes(p.id) ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: 'var(--text)'
              }}
            >
              <input type="checkbox" checked={selectedIds.includes(p.id)} readOnly style={{ pointerEvents: 'none', accentColor: 'var(--primary)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {p.article && `Арт: ${p.article}`} {p.unit && `· ${p.unit}`}
                </div>
              </div>
            </div>
          ))}

          {selectedIds.length > 0 && (
            <div style={{ position: 'sticky', bottom: 0, background: 'white', padding: '10px', borderTop: '2px solid var(--primary)' }}>
              <Button 
                variant="primary" 
                onClick={handleBatchAdd} 
                style={{ width: '100%', marginTop: '4px', background: 'var(--primary)', color: '#fff' }}
              >
                📥 Додати обрані позиції ({selectedIds.length})
              </Button>
            </div>
          )}

          {filteredExternal.length > 0 && (
            <div style={{ padding: '6px 14px', background: 'var(--bg)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              З КАТАЛОГУ КП (БУДЕ ІМПОРТОВАНО)
            </div>
          )}

          {filteredExternal.map((p, idx) => (
            <div
              key={'ext-' + idx}
              onClick={() => handleSelect(p)}
               style={{
                padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)',
                fontSize: '0.85rem', color: 'var(--text)'
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                {p.name} 
                <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, marginLeft: '4px' }}>КП</span>
                {p.inStock === false && (
                  <span style={{ 
                    fontSize: '0.65rem', 
                    background: 'var(--danger)', 
                    color: 'white', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    marginLeft: '8px',
                    fontWeight: 700
                  }}>
                    НЕМА В НАЯВНОСТІ
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{p.category}</div>
            </div>
          ))}

          {filteredLocal.length === 0 && filteredExternal.length === 0 && query.trim() && !showAddForm && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Товар не знайдено</div>
          )}

          {!showAddForm && (
            <div onClick={() => setShowAddForm(true)} style={{ padding: '10px 14px', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, borderTop: '1px solid var(--border)' }}>
              ➕ Створити новий товар
            </div>
          )}

          {showAddForm && (
            <form onSubmit={handleAddNew} style={{ padding: '14px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
               <input 
                type="text" 
                className="form-input" 
                placeholder="Назва товару *" 
                value={newProduct.name} 
                onChange={(e) => {
                  const name = e.target.value;
                  const guessedCategory = mapInternalCategory(name, '');
                  setNewProduct({ ...newProduct, name, category: guessedCategory });
                }} 
                required 
                style={{ marginBottom: '8px' }} 
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px', marginBottom: '8px' }}>
                <input type="text" className="form-input" placeholder="Артикул" value={newProduct.article} onChange={(e) => setNewProduct({ ...newProduct, article: e.target.value })} />
                <select className="form-select" value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}>
                  {CONFIG.UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <select className="form-select" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} required style={{ marginBottom: '10px' }}>
                <option value="">Оберіть категорію *</option>
                {categories.filter(c => c.active).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>Зберегти</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddForm(false)}>Скасувати</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
