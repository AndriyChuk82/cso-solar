import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWarehouses, getCatalog, addOperation, getBalances } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { matchesSearch } from '../utils/searchUtils';
import { Button } from '@cso/design-system';

/**
 * Форма переміщення товарів між складами.
 * Створює два пов'язані записи: expense на складі-відправнику та income на складі-отримувачі.
 * Має таку ж саму табличну структуру з inline-пошуком товару в рядку як Новий прихід та Новий розхід.
 */
export default function Transfer() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [balances, setBalances] = useState({});
  const [saving, setSaving] = useState(false);

  // Стан для автокомпліту пошуку товарів у рядках
  const [activeRowSearch, setActiveRowSearch] = useState(null); // Індекс рядка з активним пошуком
  const [searchText, setSearchText] = useState('');
  const desktopDropdownRefs = useRef([]);
  const mobileDropdownRefs = useRef([]);

  const [formData, setFormData] = useState({
    warehouseFrom: '',
    warehouseTo: '',
    date: new Date().toISOString().split('T')[0],
    comment: '',
    items: [
      // Починаємо з одного порожнього рядка для швидкості роботи (1С стиль)
      { productId: '', productName: '', productArticle: '', unit: '', quantity: 1 }
    ]
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
        console.error('Помилка завантаження даних:', err);
      }
    }
    loadData();
  }, []);

  // Завантаження залишків при зміні складу-відправника
  useEffect(() => {
    if (formData.warehouseFrom) {
      getBalances(formData.warehouseFrom).then((result) => {
        if (result?.success) {
          const map = {};
          (result.balances || []).forEach((b) => {
            map[b.product_id] = b.quantity;
          });
          setBalances(map);
        }
      });
    } else {
      setBalances({});
    }
  }, [formData.warehouseFrom]);

  // Закриття автокомпліту при кліку ззовні
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeRowSearch !== null) {
        const desktopRef = desktopDropdownRefs.current[activeRowSearch];
        const mobileRef = mobileDropdownRefs.current[activeRowSearch];
        
        const clickedInsideDesktop = desktopRef && desktopRef.contains(event.target);
        const clickedInsideMobile = mobileRef && mobileRef.contains(event.target);
        
        if (!clickedInsideDesktop && !clickedInsideMobile) {
          setActiveRowSearch(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeRowSearch]);

  // Додавання нового порожнього рядка
  function addRow() {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: '', productName: '', productArticle: '', unit: '', quantity: 1 }
      ]
    }));
  }

  // Видалення рядка
  function removeRow(index) {
    if (formData.items.length === 1) {
      setFormData((prev) => ({
        ...prev,
        items: [{ productId: '', productName: '', productArticle: '', unit: '', quantity: 1 }]
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    if (activeRowSearch === index) setActiveRowSearch(null);
  }

  // Оновлення полів конкретного рядка
  function updateRowField(index, field, value) {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }

  // Вибір товару в автокомпліті
  function handleSelectProduct(index, product) {
    const isDuplicate = formData.items.some((item, i) => i !== index && item.productId === product.id);
    if (isDuplicate) {
      showToast('Цей товар вже додано до списку', 'warning');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? {
          ...item,
          productId: product.id,
          productName: product.name,
          productArticle: product.article,
          unit: product.unit
        } : item
      )
    }));
    setActiveRowSearch(null);
  }

  // Фільтрація товарів для автокомпліту
  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    return matchesSearch(`${p.name} ${p.article || ''}`, searchText);
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.warehouseFrom || !formData.warehouseTo) {
      return showToast('Оберіть склад-відправник і склад-отримувач', 'error');
    }
    if (formData.warehouseFrom === formData.warehouseTo) {
      return showToast('Склад-відправник і склад-отримувач не можуть бути однаковими', 'error');
    }

    // Фільтруємо незаповнені рядки
    const filledItems = formData.items.filter(item => item.productId !== '');
    if (filledItems.length === 0) return showToast('Додайте хоча б одну позицію', 'error');

    setSaving(true);
    try {
      const operation = {
        type: 'transfer',
        warehouseFrom: formData.warehouseFrom,
        warehouseTo: formData.warehouseTo,
        date: formData.date,
        comment: formData.comment,
        items: filledItems.map((item) => ({
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
    <div className="pb-10 w-full">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xl p-1 text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors shrink-0"
        >
          ←
        </button>
        <h1 className="text-base font-bold text-[var(--text)] truncate">🔄 Переміщення між складами</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Компактні поля шапки */}
        <div className="card p-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex flex-col gap-0.5 w-[135px] sm:w-48">
              <label className="font-semibold text-[var(--text-secondary)] text-[10px] pl-0.5">Відправник *</label>
              <select
                className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none w-full"
                value={formData.warehouseFrom}
                onChange={(e) => setFormData({ ...formData, warehouseFrom: e.target.value })}
                required
              >
                <option value="">Звідки</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-0.5 w-[135px] sm:w-48">
              <label className="font-semibold text-[var(--text-secondary)] text-[10px] pl-0.5">Отримувач *</label>
              <select
                className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none w-full"
                value={formData.warehouseTo}
                onChange={(e) => setFormData({ ...formData, warehouseTo: e.target.value })}
                required
              >
                <option value="">Куди</option>
                {warehouses.filter(w => w.id !== formData.warehouseFrom).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-0.5 w-[100px] sm:w-28">
              <label className="font-semibold text-[var(--text-secondary)] text-[10px] pl-0.5">Дата</label>
              <input
                type="date"
                className="h-[32px] py-0 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none w-full"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-0.5 w-full sm:flex-1 sm:min-w-0">
              <label className="font-semibold text-[var(--text-secondary)] text-[10px] pl-0.5">Коментар</label>
              <input
                type="text"
                placeholder="Причина переміщення..."
                className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none w-full"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Таблична частина */}
        <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3">
          {/* Десктопна версія */}
          <div className="hidden sm:block overflow-x-auto" style={{ minHeight: '260px' }}>
            <table className="w-full text-xs text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[var(--bg)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border)]">
                  <th className="p-2 w-8 text-center">№</th>
                  <th className="p-2">Товар</th>
                  <th className="p-2 w-36">Кількість</th>
                  <th className="p-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {formData.items.map((item, index) => {
                  const isLastRows = index >= formData.items.length - 2 && formData.items.length >= 3;
                  const stock = balances[item.productId] || 0;
                  const isOver = item.productId && parseFloat(item.quantity) > stock;

                  return (
                    <tr key={index} className="hover:bg-[var(--border-light)]/40 transition-colors">
                      <td className="p-2 text-center text-[var(--text-secondary)] font-mono">{index + 1}</td>

                      <td className="p-2 relative overflow-visible" ref={el => desktopDropdownRefs.current[index] = el}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                          <div className="flex-1">
                            {activeRowSearch === index ? (
                              <>
                                <input
                                  type="text"
                                  autoFocus
                                  className="w-full p-1.5 rounded border border-blue-500 bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none"
                                  placeholder="Введіть назву або артикул..."
                                  value={searchText}
                                  onChange={(e) => setSearchText(e.target.value)}
                                />
                                <div className={`absolute left-2 right-2 ${isLastRows ? 'bottom-full mb-1' : 'top-11'} bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl max-h-80 overflow-y-auto z-50 text-xs divide-y divide-[var(--border)]`}>
                                  {filteredProducts.length === 0 ? (
                                    <div className="p-2 text-[var(--text-secondary)] text-center">Нічого не знайдено</div>
                                  ) : (
                                    filteredProducts.map(p => {
                                      const pStock = balances[p.id] || 0;
                                      return (
                                        <div
                                          key={p.id}
                                          onClick={() => handleSelectProduct(index, p)}
                                          className="p-2 hover:bg-blue-500 hover:text-white cursor-pointer transition-colors flex justify-between gap-3"
                                        >
                                          <div>
                                            <span className="font-semibold">{p.name}</span>
                                            {p.article && <span className="text-[10px] opacity-75 block font-mono">Арт: {p.article}</span>}
                                          </div>
                                          <span className="font-semibold text-right whitespace-nowrap">
                                            Залишок: {pStock} {p.unit}
                                          </span>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </>
                            ) : (
                              <div
                                onClick={() => {
                                  setActiveRowSearch(index);
                                  setSearchText(item.productName || '');
                                }}
                                className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg)] cursor-pointer text-xs min-h-[30px] flex items-center justify-between"
                              >
                                <span className={item.productName ? 'text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] italic'}>
                                  {item.productName || 'Клацніть для вибору товару...'}
                                </span>
                                {item.productArticle && (
                                  <span className="text-[9px] text-[var(--text-secondary)] font-mono bg-[var(--border-light)] px-1 rounded mr-2">
                                    {item.productArticle}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Залишок товару в рядку */}
                          {item.productId && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap bg-[var(--border-light)] px-2 py-1 rounded w-32 shrink-0">
                              <span className="text-[var(--text-secondary)] font-medium">Залишок:</span>
                              <span className="text-green-600 font-semibold">
                                {stock} {item.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-2">
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required={!!item.productId}
                            disabled={!item.productId}
                            className="w-24 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 text-center font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {item.unit && <span className="text-[10px] text-[var(--text-secondary)] w-10 text-left truncate" title={item.unit}>{item.unit}</span>}
                        </div>
                        {isOver && (
                          <div className="text-[10px] text-red-500 font-semibold mt-1">
                            ⚠️ Недостатньо
                          </div>
                        )}
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="text-red-500 hover:bg-red-500/10 p-1 rounded text-xs transition-colors"
                          title="Видалити рядок"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Мобільна версія */}
          <div className="block sm:hidden space-y-3" style={{ minHeight: '260px' }}>
            {formData.items.map((item, index) => {
              const stock = balances[item.productId] || 0;
              const isOver = item.productId && parseFloat(item.quantity) > stock;

              return (
                <div key={index} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 relative space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]/60 font-medium">
                    <span className="text-[var(--text-secondary)] font-mono text-[11px]">Рядок №{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-red-500 hover:bg-red-500/10 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors"
                      title="Видалити рядок"
                    >
                      ✕ Видалити
                    </button>
                  </div>

                  <div className="relative overflow-visible" ref={el => mobileDropdownRefs.current[index] = el}>
                    <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-1 uppercase tracking-wider">Товар</label>
                    {activeRowSearch === index ? (
                      <>
                        <input
                          type="text"
                          autoFocus
                          className="w-full p-2 rounded border border-blue-500 bg-[var(--bg)] text-[var(--text)] text-[16px] focus:outline-none"
                          placeholder="Введіть назву або артикул..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                        />
                        <div className="absolute left-0 right-0 top-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl max-h-80 overflow-y-auto z-50 text-xs divide-y divide-[var(--border)]">
                          {filteredProducts.length === 0 ? (
                            <div className="p-2 text-[var(--text-secondary)] text-center">Нічого не знайдено</div>
                          ) : (
                            filteredProducts.map(p => {
                              const pStock = balances[p.id] || 0;
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => handleSelectProduct(index, p)}
                                  className="p-2 hover:bg-blue-500 hover:text-white cursor-pointer transition-colors flex justify-between gap-2"
                                >
                                  <div>
                                    <span className="font-semibold">{p.name}</span>
                                    {p.article && <span className="text-[10px] opacity-75 block font-mono">Арт: {p.article}</span>}
                                  </div>
                                  <span className="font-semibold text-right whitespace-nowrap">
                                    Залишок: {pStock} {p.unit}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => {
                          setActiveRowSearch(index);
                          setSearchText(item.productName || '');
                        }}
                        className="w-full p-2 rounded border border-[var(--border)] bg-[var(--bg)] cursor-pointer text-xs min-h-[34px] flex items-center justify-between"
                      >
                        <span className={item.productName ? 'text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] italic'}>
                          {item.productName || 'Клацніть для вибору товару...'}
                        </span>
                        {item.productArticle && (
                          <span className="text-[9px] text-[var(--text-secondary)] font-mono bg-[var(--border-light)] px-1 rounded mr-1">
                            {item.productArticle}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-1 text-xs">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-secondary)] shrink-0">Кількість:</span>
                        <div className="flex flex-col items-start gap-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required={!!item.productId}
                              disabled={!item.productId}
                              className="w-16 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] focus:outline-none disabled:opacity-40 text-center font-semibold"
                              value={item.quantity}
                              onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                              onFocus={(e) => e.target.select()}
                            />
                            {item.unit && <span className="text-xs text-[var(--text-secondary)] font-medium truncate" title={item.unit}>{item.unit}</span>}
                          </div>
                          {isOver && (
                            <span className="text-[9px] text-red-500 font-bold mt-0.5">
                              ⚠️ Недостатньо
                            </span>
                          )}
                        </div>
                      </div>

                      {item.productId && (
                        <div className="flex items-center gap-1 text-[11px] justify-end">
                          <span className="text-[var(--text-secondary)] font-medium">Доступно:</span>
                          <span className="text-green-600 font-semibold">
                            {stock} {item.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 border-t border-[var(--border)] pt-2">
            <button
              type="button"
              onClick={addRow}
              className="px-3 py-1.5 rounded bg-[var(--border-light)] hover:bg-[var(--border)] text-[var(--text)] text-xs font-semibold transition-colors flex items-center gap-1"
            >
              ➕ Додати рядок
            </button>
          </div>
        </div>

        {/* Кнопки збереження/скасування */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="md" onClick={() => navigate('/')} className="w-full sm:w-auto">
            Скасувати
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={saving || formData.items.filter(item => item.productId !== '').length === 0}
            loading={saving}
            className="w-full sm:w-auto"
          >
            {saving ? 'Збереження...' : '🔄 Зберегти переміщення'}
          </Button>
        </div>
      </form>
    </div>
  );
}
