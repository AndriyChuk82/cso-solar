import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWarehouses, getCatalog, addOperation, getBalances } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { matchesSearch } from '../utils/searchUtils';
import { Button } from '@cso/design-system';

/**
 * Форма створення операції Прихід / Розхід.
 * Підтримує додавання кількох позицій в одній операції з inline-пошуком.
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

  // Стан для автокомпліту пошуку товарів у рядках
  const [activeRowSearch, setActiveRowSearch] = useState(null); // Індекс рядка, де зараз активний пошук
  const [searchText, setSearchText] = useState('');
  const dropdownRefs = useRef([]);

  const [formData, setFormData] = useState({
    warehouseId: '',
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

        let loadedWhList = [];
        if (whResult?.success) {
          loadedWhList = whResult.warehouses || [];
          setWarehouses(loadedWhList);
        }
        if (catResult?.success) setProducts(catResult.products || []);

        // Запам'ятований склад
        const saved = localStorage.getItem('cso_last_warehouse');
        const defaultWh = user?.isStorekeeper ? user.warehouseId : (saved || '');
        if (defaultWh) {
          setFormData((prev) => ({ ...prev, warehouseId: defaultWh }));
        } else if (loadedWhList.length > 0) {
          const ternopil = loadedWhList.find(w => w.name.toLowerCase().includes('тернопіль'));
          const fallback = ternopil ? ternopil.id : loadedWhList[0].id;
          setFormData((prev) => ({ ...prev, warehouseId: fallback }));
        }
      } catch (err) {
        console.error('Помилка завантаження даних:', err);
      }
    }
    loadData();
  }, [user]);

  // Завантаження залишків при зміні складу
  useEffect(() => {
    if (formData.warehouseId) {
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
  }, [formData.warehouseId]);

  // Закриття автокомпліту при кліку ззовні
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeRowSearch !== null) {
        const currentRef = dropdownRefs.current[activeRowSearch];
        if (currentRef && !currentRef.contains(event.target)) {
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
      // Очищуємо єдиний рядок замість видалення
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
    // Перевірка на дублікат у решті рядків
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
    if (!formData.warehouseId) return showToast('Оберіть склад', 'error');

    // Фільтруємо незаповнені рядки
    const filledItems = formData.items.filter(item => item.productId !== '');
    if (filledItems.length === 0) return showToast('Додайте хоча б одну позицію', 'error');

    setSaving(true);
    try {
      const operation = {
        type,
        warehouseId: formData.warehouseId,
        date: formData.date,
        comment: formData.comment,
        items: filledItems.map((item) => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity) || 0,
          comment: ''
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
        <h1 className="text-base font-bold text-[var(--text)] truncate">{title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Компактні поля шапки (1С стиль) */}
        <div className="card p-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex flex-col gap-0.5 flex-1 min-w-[140px] sm:flex-initial sm:w-48">
              <label className="font-semibold text-[var(--text-secondary)] text-[10px] pl-0.5">Склад *</label>
              <select
                className="p-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-xs focus:outline-none w-full"
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                required
              >
                <option value="">-- Склад --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-0.5 w-[110px] sm:w-28">
              <label className="font-semibold text-[var(--text-secondary)] text-[10px] pl-0.5">Дата</label>
              <input
                type="date"
                className="p-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-xs focus:outline-none w-full"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-0.5 w-full sm:flex-1 sm:min-w-0">
              <label className="font-semibold text-[var(--text-secondary)] text-[10px] pl-0.5">Коментар</label>
              <input
                type="text"
                placeholder={isIncome ? 'Поставка від...' : 'Причина...'}
                className="p-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-xs focus:outline-none w-full"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Таблична частина (1С Склад стиль) */}
        <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3">
          {/* Десктопна версія: Таблиця (показується від sm: і вище) */}
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
                  const stock = balances[item.productId] || 0;
                  const isOver = !isIncome && item.productId && parseFloat(item.quantity) > stock;

                  return (
                    <tr key={index} className="hover:bg-[var(--border-light)]/40 transition-colors">
                      {/* Номер рядка */}
                      <td className="p-2 text-center text-[var(--text-secondary)] font-mono">{index + 1}</td>

                      {/* Товар (Пошук/Автокомпліт в один рядок) */}
                      <td className="p-2 relative overflow-visible" ref={el => dropdownRefs.current[index] = el}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                          <div className="flex-1">
                            {activeRowSearch === index ? (
                              <>
                                <input
                                  type="text"
                                  autoFocus
                                  className="w-full p-1.5 rounded border border-blue-500 bg-[var(--bg)] text-[var(--text)] text-xs focus:outline-none"
                                  placeholder="Введіть назву або артикул..."
                                  value={searchText}
                                  onChange={(e) => setSearchText(e.target.value)}
                                />
                                {/* Випадаючий список пошуку */}
                                <div className="absolute left-2 right-2 top-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 text-xs divide-y divide-[var(--border)]">
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
                                          {!isIncome && (
                                            <span className="font-semibold text-right whitespace-nowrap">
                                              Залишок: {pStock} {p.unit}
                                            </span>
                                          )}
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

                          {/* Залишок товару в рядку (тільки для розходу) */}
                          {!isIncome && item.productId && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap bg-[var(--border-light)] px-2 py-1 rounded w-32 shrink-0">
                              <span className="text-[var(--text-secondary)] font-medium">Залишок:</span>
                              <span className={isOver ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}>
                                {stock} {item.unit}
                              </span>
                              {isOver && (
                                <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded ml-1">
                                  ⚠️ Мінус
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Кількість */}
                      <td className="p-2">
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            required={!!item.productId}
                            disabled={!item.productId}
                            className="w-24 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 text-center font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {item.unit && <span className="text-[10px] text-[var(--text-secondary)] w-10 text-left truncate" title={item.unit}>{item.unit}</span>}
                        </div>
                      </td>

                      {/* Кнопка видалення */}
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

          {/* Мобільна версія: Список карток (показується тільки на мобілках < sm) */}
          <div className="block sm:hidden space-y-3" style={{ minHeight: '260px' }}>
            {formData.items.map((item, index) => {
              const stock = balances[item.productId] || 0;
              const isOver = !isIncome && item.productId && parseFloat(item.quantity) > stock;

              return (
                <div key={index} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 relative space-y-3">
                  {/* Заголовок картки */}
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

                  {/* Товар */}
                  <div className="relative overflow-visible" ref={el => dropdownRefs.current[index] = el}>
                    <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-1 uppercase tracking-wider">Товар</label>
                    {activeRowSearch === index ? (
                      <>
                        <input
                          type="text"
                          autoFocus
                          className="w-full p-2 rounded border border-blue-500 bg-[var(--bg)] text-[var(--text)] text-xs focus:outline-none"
                          placeholder="Введіть назву або артикул..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                        />
                        {/* Випадаючий список пошуку */}
                        <div className="absolute left-0 right-0 top-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 text-xs divide-y divide-[var(--border)]">
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
                                  {!isIncome && (
                                    <span className="font-semibold text-right whitespace-nowrap">
                                      Залишок: {pStock} {p.unit}
                                    </span>
                                  )}
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

                  {/* Кількість та Залишок */}
                  <div className="pt-1 text-xs">
                    {isIncome ? (
                      /* Для Приходу: одна компактна лінія */
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-secondary)]">Кількість:</span>
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          required={!!item.productId}
                          disabled={!item.productId}
                          className="w-20 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] focus:outline-none disabled:opacity-40 text-center font-semibold"
                          value={item.quantity}
                          onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                          onFocus={(e) => e.target.select()}
                        />
                        {item.unit && <span className="text-xs text-[var(--text-secondary)] font-medium">{item.unit}</span>}
                      </div>
                    ) : (
                      /* Для Розходу: Кількість та Доступно поруч */
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-secondary)] shrink-0">Кількість:</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <input
                              type="number"
                              step="any"
                              min="0.001"
                              required={!!item.productId}
                              disabled={!item.productId}
                              className="w-16 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] focus:outline-none disabled:opacity-40 text-center font-semibold"
                              value={item.quantity}
                              onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                              onFocus={(e) => e.target.select()}
                            />
                            {item.unit && <span className="text-xs text-[var(--text-secondary)] font-medium truncate" title={item.unit}>{item.unit}</span>}
                          </div>
                        </div>

                        {item.productId && (
                          <div className="flex items-center gap-1 text-[11px] justify-end">
                            <span className="text-[var(--text-secondary)] font-medium">Доступно:</span>
                            <span className={isOver ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}>
                              {stock} {item.unit}
                            </span>
                            {isOver && (
                              <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded">
                                ⚠️ Мінус
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Кнопка "+ Додати рядок" під таблицею */}
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
            variant={isIncome ? 'success' : 'danger'}
            size="md"
            disabled={saving || formData.items.filter(item => item.productId !== '').length === 0}
            loading={saving}
            className="w-full sm:w-auto"
          >
            {saving ? 'Збереження...' : (isIncome ? '📥 Зберегти прихід' : '📤 Зберегти розхід')}
          </Button>
        </div>
      </form>
    </div>
  );
}
