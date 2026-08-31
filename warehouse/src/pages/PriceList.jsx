import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { getPriceListData } from '../api/gasApi';
import { matchesSearch } from '../utils/searchUtils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Search, RefreshCw, Layers, CheckCircle2, Box, Info } from 'lucide-react';
import { isStocksHidden, getItemStockForUser } from '../utils/permissions';

export default function PriceList() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const stocksHidden = isStocksHidden(user);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyInStock, setOnlyInStock] = useState(true);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(isManual = false) {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getPriceListData();
      if (res.success) {
        setItems(res.items || []);
        setCategories(res.categories || []);
        setUpdatedAt(res.updatedAt || '');
        if (isManual) {
          showToast('Прайс-лист успішно оновлено', 'success');
        }
      } else {
        showToast('Помилка завантаження прайс-листа', 'error');
      }
    } catch (err) {
      console.error('Price list load error:', err);
      showToast('Помилка з\'єднання з сервером', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Кількість товарів у наявності (з урахуванням прав та закріпленого складу)
  const inStockCount = useMemo(() => {
    if (stocksHidden) return 0;
    return items.filter(item => {
      const { stock } = getItemStockForUser(item, user);
      return stock > 0;
    }).length;
  }, [items, user, stocksHidden]);

  // Адаптивна фільтрація товарів
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Фільтр тільки наявних (якщо залишки не приховані)
      if (!stocksHidden && onlyInStock) {
        const { stock } = getItemStockForUser(item, user);
        if (stock <= 0) {
          return false;
        }
      }

      // 2. Фільтр по категорії
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Адаптивний пошук за назвою, категорією та артикулом
      if (deferredSearch.trim()) {
        const searchText = `${item.name} ${item.category} ${item.article || ''}`;
        return matchesSearch(searchText, deferredSearch);
      }

      return true;
    });
  }, [items, selectedCategory, onlyInStock, deferredSearch, user, stocksHidden]);

  // Групування відфільтрованих товарів по категоріях із сортуванням за потужністю/числами
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach(item => {
      const cat = item.category || 'Інше обладнання';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    });

    // Сортуємо товари всередині кожної категорії за природним числовим порядком
    Object.keys(groups).forEach(cat => {
      groups[cat].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'uk', { numeric: true, sensitivity: 'base' }));
    });

    return groups;
  }, [filteredItems]);

  // Підрахунок кількості по категоріях для бейджів
  const categoryCounts = useMemo(() => {
    const counts = { ALL: items.length };
    items.forEach(item => {
      const cat = item.category || 'Інше обладнання';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);

  const getCategoryIcon = (cat) => {
    const c = cat.toLowerCase();
    if (c.includes('інвертор')) return '⚡';
    if (c.includes('акб') || c.includes('акумулятор') || c.includes('bms')) return '🔋';
    if (c.includes('панел') || c.includes('модул')) return '☀️';
    if (c.includes('стійк') || c.includes('шаф')) return '🗄️';
    if (c.includes('кабел') || c.includes('комутац')) return '🔌';
    if (c.includes('кріплен')) return '🔩';
    return '📦';
  };

  // Копіювання інформації про товар у буфер обміну
  const handleCopyProduct = (item) => {
    const wholesaleText = item.wholesale?.formatted ? `Опт: ${item.wholesale.formatted}` : '';
    const retailText = item.retail?.formatted ? `Роздріб: ${item.retail.formatted}` : '';
    const priceText = [wholesaleText, retailText].filter(Boolean).join(' | ');
    
    let stockText = '';
    if (!stocksHidden) {
      const userStock = getItemStockForUser(item, user);
      stockText = userStock.stock > 0 
        ? ` (${userStock.isAssignedWarehouse ? userStock.warehouseName + ': ' : 'Залишок: '}${userStock.stock} ${item.unit || 'шт'})` 
        : ' (Немає в наявності)';
    }

    const textToCopy = `${item.name}${priceText ? ` — ${priceText}` : ''}${stockText}`;
    
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
      showToast('Скопійовано в буфер обміну', 'success');
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Верхня панель заголовка */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border)] p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">📋</span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[var(--text)] tracking-tight">
              Прайс-лист обладнання
            </h1>
            <span className="text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              {items.length} поз.
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-2 flex-wrap">
            <span>Рекомендовані та оптові ціни продажу</span>
            {updatedAt && (
              <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] bg-[var(--bg)] px-2 py-0.5 rounded-md border border-[var(--border)] font-mono">
                Оновлено: {updatedAt}
              </span>
            )}
          </p>
        </div>

        {/* Кнопка оновлення */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl sm:rounded-2xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--border-light)] active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="Оновити ціни з Google Таблиці"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>{refreshing ? 'Оновлення...' : 'Оновити ціни'}</span>
          </button>
        </div>
      </div>

      {/* Панель фільтрів та пошуку */}
      <div className="space-y-3 sticky top-2 z-10 bg-[var(--bg)]/95 backdrop-blur-md py-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Адаптивне поле пошуку */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Швидкий пошук (напр. 'деє 15', 'соліс', 'лонгі 645', 'BOS-G', 'кабель')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl sm:rounded-2xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] w-6 h-6 flex items-center justify-center rounded-full bg-[var(--bg)] border border-[var(--border)] active:scale-90 transition-transform"
              >
                ✕
              </button>
            )}
          </div>

          {/* Галочка: Показувати лише наявні */}
          {!stocksHidden && (
            <label className="inline-flex items-center justify-between sm:justify-start gap-2 cursor-pointer select-none bg-[var(--bg-card)] border border-[var(--border)] px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-[var(--border-light)] active:scale-98 transition-all shadow-xs shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-[var(--border)] focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span className="text-xs font-bold text-[var(--text)] whitespace-nowrap">Лише в наявності</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${onlyInStock ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
                {inStockCount}
              </span>
            </label>
          )}
        </div>

        {/* Кнопки вибору категорій */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
            }`}
          >
            <span>Всі товари</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--border)]'}`}>
              {categoryCounts.ALL || 0}
            </span>
          </button>

          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
                }`}
              >
                <span>{getCategoryIcon(cat)}</span>
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--border)]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Основний вміст / Стан завантаження */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl sm:rounded-3xl space-y-3">
          <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-[var(--text-secondary)]">Синхронізація цін та товарів...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl sm:rounded-3xl text-center p-6">
          <span className="text-4xl mb-3">🔍</span>
          <h3 className="text-base font-bold text-[var(--text)]">Товарів не знайдено</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md">
            За запитом <span className="font-semibold text-blue-500">"{search}"</span> нічого не знайдено. Спробуйте змінити пошуковий запит або перемкнути категорію.
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-4 px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 active:scale-95 transition-all"
            >
              Очистити пошук
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(groupedItems).map(([categoryName, catItems]) => (
            <div key={categoryName} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs">
              {/* Заголовок категорії */}
              <div className="px-4 py-3 sm:py-3.5 bg-[var(--bg)]/80 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl">{getCategoryIcon(categoryName)}</span>
                  <h2 className="text-xs sm:text-sm font-bold text-[var(--text)] uppercase tracking-wider">
                    {categoryName}
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--bg-card)] px-2.5 py-0.5 rounded-full border border-[var(--border)] shadow-2xs">
                  {catItems.length} поз.
                </span>
              </div>

              {/* Таблиця для Desktop (MD і ширше) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-card)]">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Обладнання / Товар</th>
                      <th className="py-3 px-4 text-center w-44">Оптовий прайс</th>
                      <th className="py-3 px-4 text-center w-44">Роздрібний прайс</th>
                      {!stocksHidden && (
                        <th className="py-3 px-4 text-center min-w-[220px] w-64">Залишок на складі</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-sm">
                    {catItems.map((item, idx) => {
                      const userStock = getItemStockForUser(item, user);
                      const hasStock = userStock.stock > 0;
                      const hasWholesale = item.wholesale?.amount !== null;
                      const hasRetail = item.retail?.amount !== null;

                      return (
                        <tr
                          key={item.id || idx}
                          onClick={() => handleCopyProduct(item)}
                          className="hover:bg-[var(--border-light)]/40 transition-colors group cursor-pointer"
                          title="Натисніть, щоб скопіювати рядок"
                        >
                          {/* Номер */}
                          <td className="py-3.5 px-4 text-center text-xs font-semibold text-[var(--text-muted)]">
                            {idx + 1}
                          </td>

                          {/* Назва та деталі */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-[var(--text)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {item.name}
                                </span>
                                {item.unit && item.unit !== 'шт' && (
                                  <span className="text-[10px] font-medium bg-[var(--bg)] text-[var(--text-muted)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                                    {item.unit}
                                  </span>
                                )}
                              </div>
                              {item.article && (
                                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                                  Арт: {item.article}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Оптовий прайс */}
                          <td className="py-3.5 px-4 text-center">
                            {hasWholesale ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm tracking-tight bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                  {item.wholesale.formatted}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>

                          {/* Роздрібний прайс */}
                          <td className="py-3.5 px-4 text-center">
                            {hasRetail ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm tracking-tight bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                                  {item.retail.formatted}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)]">—</span>
                            )}
                          </td>

                          {/* Залишок на складах */}
                          {!stocksHidden && (
                            <td className="py-3.5 px-4 text-center">
                              {hasStock ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-bold text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-flex items-center gap-1">
                                    <span>{userStock.stock}</span>
                                    <span className="text-[10px] font-normal">{item.unit || 'шт'}</span>
                                  </span>
                                  {userStock.isAssignedWarehouse ? (
                                    <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)] whitespace-nowrap">
                                      {userStock.warehouseName}
                                    </span>
                                  ) : (
                                    item.warehouseStocks && item.warehouseStocks.length > 0 && (
                                      <div className={`flex items-center justify-center gap-1 text-[10px] text-[var(--text-muted)] ${item.warehouseStocks.length <= 2 ? 'flex-nowrap whitespace-nowrap' : 'flex-wrap'}`}>
                                        {item.warehouseStocks.map(wh => (
                                          <span key={wh.warehouseId || wh.warehouseName} className="bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)] whitespace-nowrap">
                                            {wh.warehouseName}: {wh.quantity}
                                          </span>
                                        ))}
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border)]">
                                    0 {item.unit || 'шт'}
                                  </span>
                                  {userStock.isAssignedWarehouse && (
                                    <span className="text-[9px] text-[var(--text-muted)]">
                                      {userStock.warehouseName}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Мобільні картки (Сучасний мобільний вигляд для смартфонів) */}
              <div className="md:hidden divide-y divide-[var(--border)]">
                {catItems.map((item, idx) => {
                  const userStock = getItemStockForUser(item, user);
                  const hasStock = userStock.stock > 0;
                  const hasWholesale = item.wholesale?.amount !== null;
                  const hasRetail = item.retail?.amount !== null;

                  return (
                    <div 
                      key={item.id || idx} 
                      onClick={() => handleCopyProduct(item)}
                      className="p-3.5 sm:p-4 space-y-3 active:bg-[var(--border-light)]/40 transition-colors cursor-pointer"
                    >
                      {/* Шапка картки: назва та бейдж наявності */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-[var(--text)] leading-snug break-words">
                              {item.name}
                            </span>
                            {item.unit && item.unit !== 'шт' && (
                              <span className="text-[9px] font-semibold bg-[var(--bg)] text-[var(--text-muted)] px-1.5 py-0.2 rounded border border-[var(--border)]">
                                {item.unit}
                              </span>
                            )}
                          </div>
                          {item.article && (
                            <div className="text-[11px] text-[var(--text-muted)] font-mono">
                              Арт: {item.article}
                            </div>
                          )}
                        </div>

                        {/* Головний бейдж залишку */}
                        {!stocksHidden && (
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {hasStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{userStock.stock}</span>
                                <span className="text-[10px] font-medium opacity-80">{item.unit || 'шт'}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--border)]">
                                0 {item.unit || 'шт'}
                              </span>
                            )}
                            {userStock.isAssignedWarehouse && (
                              <span className="text-[9px] font-semibold text-[var(--text-muted)] bg-[var(--bg)] px-1.5 py-0.2 rounded border border-[var(--border)]">
                                {userStock.warehouseName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Блок цін: Опт і Роздріб */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Оптовий блок */}
                        <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                          hasWholesale 
                            ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20' 
                            : 'bg-[var(--bg)] border-[var(--border)]'
                        }`}>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 opacity-90">
                            Оптовий прайс
                          </span>
                          <div className={`text-base font-black tracking-tight mt-1 ${
                            hasWholesale ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)] font-normal text-sm'
                          }`}>
                            {item.wholesale?.formatted || '—'}
                          </div>
                        </div>

                        {/* Роздрібний блок */}
                        <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                          hasRetail 
                            ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20' 
                            : 'bg-[var(--bg)] border-[var(--border)]'
                        }`}>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 opacity-90">
                            Роздрібний прайс
                          </span>
                          <div className={`text-base font-black tracking-tight mt-1 ${
                            hasRetail ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-muted)] font-normal text-sm'
                          }`}>
                            {item.retail?.formatted || '—'}
                          </div>
                        </div>
                      </div>

                      {/* Розбивка по складах на мобільному */}
                      {item.warehouseStocks && item.warehouseStocks.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] font-semibold text-[var(--text-muted)]">Склади:</span>
                          {item.warehouseStocks.map(wh => (
                            <span 
                              key={wh.warehouseName} 
                              className="text-[10px] font-semibold bg-[var(--bg)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md border border-[var(--border)] shadow-2xs"
                            >
                              {wh.warehouseName}: <strong className="text-[var(--text)]">{wh.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
