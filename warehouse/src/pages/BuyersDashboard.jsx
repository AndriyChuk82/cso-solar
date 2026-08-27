import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBuyersWithBalances, addBuyer, updateBuyer, deleteBuyer } from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import { Button } from '@cso/design-system';

export default function BuyersDashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [buyers, setBuyers] = useState([]);
  const [rawTransactions, setRawTransactions] = useState([]);
  const [currencyFilter, setCurrencyFilter] = useState('ALL'); // 'ALL', 'UAH', 'USD'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, buyer: null, loading: false });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: '',
    representatives: '',
    active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getBuyersWithBalances();
      if (result?.success) {
        setBuyers(result.buyers || []);
        setRawTransactions(result.transactions || []);
      } else {
        showToast(result?.error || 'Помилка завантаження даних', 'error');
      }
    } catch (err) {
      console.error('Помилка завантаження покупців:', err);
      showToast('Помилка підключення до сервера', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditItem(null);
    setFormData({ name: '', phone: '', notes: '', representatives: '', active: true });
    setShowModal(true);
  }

  function openEdit(item, e) {
    e.preventDefault();
    e.stopPropagation();
    setEditItem(item);
    setFormData({
      name: item.name,
      phone: item.phone || '',
      notes: item.notes || '',
      representatives: item.representatives || '',
      active: item.active !== false
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Введіть ім'я покупця", 'error');
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        const res = await updateBuyer({ id: editItem.id, ...formData });
        if (res.success) {
          showToast('Дані покупця оновлено', 'success');
          setShowModal(false);
          loadData();
        }
      } else {
        const res = await addBuyer(formData);
        if (res.success) {
          showToast('Покупця успішно додано', 'success');
          setShowModal(false);
          loadData();
        }
      }
    } catch (err) {
      console.error('Помилка збереження:', err);
      showToast('Помилка збереження даних', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handlePromptDelete(buyer, e) {
    e.preventDefault();
    e.stopPropagation();

    // Перевіряємо борг відразу перед відкриттям
    const isUahDebt = (buyer.balanceUah || 0) < -0.01;
    const isUsdDebt = (buyer.balanceUsd || 0) < -0.01;

    if (isUahDebt || isUsdDebt) {
      const debtParts = [];
      if (isUahDebt) debtParts.push(`${Math.abs(buyer.balanceUah).toLocaleString('uk-UA')} грн`);
      if (isUsdDebt) debtParts.push(`${Math.abs(buyer.balanceUsd).toLocaleString('uk-UA')} $`);

      showToast(`Неможливо видалити клієнта "${buyer.name}": наявна заборгованість (${debtParts.join(', ')}). Спочатку необхідно повністю погасити борг.`, 'error');
      return;
    }

    setDeleteConfirm({ isOpen: true, buyer, loading: false });
  }

  async function confirmDeleteBuyer() {
    if (!deleteConfirm.buyer) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      const res = await deleteBuyer(deleteConfirm.buyer.id);
      if (res.success) {
        showToast(`Клієнта "${deleteConfirm.buyer.name}" успішно видалено`, 'success');
        setDeleteConfirm({ isOpen: false, buyer: null, loading: false });
        loadData();
      } else {
        showToast(res.error || 'Помилка видалення', 'error');
        setDeleteConfirm(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка видалення клієнта', 'error');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  }



  // Обчислення балансів з урахуванням перемикача валюти
  const processedBuyers = buyers.map(b => {
    if (currencyFilter === 'ALL') return b;

    let convertedBalance = 0;
    const buyerTxs = rawTransactions.filter(t => t.buyer_id === b.id && t.status !== 'reserved');

    buyerTxs.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      const rate = parseFloat(t.conversion_rate) || 45.0;
      const cur = String(t.currency).toUpperCase();
      let val = 0;

      if (currencyFilter === 'UAH') {
        val = cur === 'USD' ? amt * rate : amt;
      } else if (currencyFilter === 'USD') {
        val = cur === 'UAH' ? amt / rate : amt;
      }

      if (t.type === 'issue') {
        convertedBalance -= val;
      } else if (t.type === 'payment' || t.type === 'adjustment') {
        convertedBalance += val;
      }
    });

    return {
      ...b,
      convertedBalance
    };
  });

  // Фільтрація списку за пошуковим запитом
  const filteredBuyers = processedBuyers.filter(b => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      b.name.toLowerCase().includes(term) ||
      (b.phone && b.phone.toLowerCase().includes(term)) ||
      (b.notes && b.notes.toLowerCase().includes(term))
    );
  });

  // Допоміжні класи кольору для балансу
  function getBalanceClass(val) {
    if (val < -0.001) return 'text-red-500 font-bold'; // борг
    if (val > 0.001) return 'text-green-500 font-bold'; // переплата
    return 'text-gray-400';
  }

  function formatMoney(val, symbol = '') {
    if (Math.abs(val) < 0.001) return `0 ${symbol}`.trim();
    const prefix = val > 0 ? '+' : '';
    const formatted = val.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return `${prefix}${formatted} ${symbol}`.trim();
  }

  return (
    <div className="pb-8">
      {/* Шапка екрану */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text)]">👥 Баланси клієнтів</h1>
          <p className="text-xs md:text-sm text-[var(--text-secondary)]">Облік виданих матеріалів та розрахунків з покупцями</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => navigate('/buyers/issue')}>
            📤 Видати товар
          </Button>
          <Button variant="success" size="sm" onClick={() => navigate('/buyers/payment')}>
            💰 Прийняти оплату
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/buyers/report')}>
            📊 Загальний звіт
          </Button>
          <Button variant="ghost" size="sm" onClick={openAdd}>
            ➕ Новий клієнт
          </Button>
        </div>
      </div>

      {/* Фільтр та пошук */}
      <div className="mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          className="form-input flex-1 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-blue-500"
          placeholder="🔍 Швидкий пошук клієнта за назвою чи телефоном..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] text-sm focus:outline-none focus:border-blue-500 md:w-72 font-semibold"
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
        >
          <option value="ALL">Всі валюти (UAH та USD)</option>
          <option value="UAH">Все в UAH (грн) — $→грн</option>
          <option value="USD">Все в USD ($) — грн→$</option>
        </select>
      </div>

      {/* Головний контент */}
      <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="spinner" />
          </div>
        ) : filteredBuyers.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-secondary)] text-sm">
            👥 Клієнтів не знайдено
          </div>
        ) : (
          <>
            {/* Десктоп-версія: Таблиця (приховується на мобільних) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-bottom border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] font-semibold">
                    <th className="p-4">Покупець</th>
                    <th className="p-4">Телефон</th>
                    {currencyFilter === 'ALL' ? (
                      <>
                        <th className="p-4 text-right">Баланс UAH</th>
                        <th className="p-4 text-right">Баланс USD</th>
                      </>
                    ) : (
                      <th className="p-4 text-right">Баланс {currencyFilter === 'UAH' ? 'UAH (грн)' : 'USD ($)'}</th>
                    )}
                    <th className="p-4 text-center">Статус</th>
                    <th className="p-4 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredBuyers.map((b) => (
                    <tr 
                      key={b.id} 
                      onClick={() => navigate(`/buyers/${b.id}`)}
                      className={`hover:bg-[var(--border-light)] transition-colors cursor-pointer ${!b.active ? 'opacity-50' : ''}`}
                    >
                      <td className="p-4">
                        <Link 
                          to={`/buyers/${b.id}`} 
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-blue-500 hover:underline block"
                        >
                          {b.name}
                        </Link>
                        {b.notes && <span className="text-xs text-[var(--text-secondary)] block mt-0.5 max-w-xs truncate" title={b.notes}>{b.notes}</span>}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">{b.phone || '—'}</td>
                      {currencyFilter === 'ALL' ? (
                        <>
                          <td className={`p-4 text-right ${getBalanceClass(b.balanceUah)}`}>
                            {formatMoney(b.balanceUah, 'грн')}
                          </td>
                          <td className={`p-4 text-right ${getBalanceClass(b.balanceUsd)}`}>
                            {formatMoney(b.balanceUsd, '$')}
                          </td>
                        </>
                      ) : (
                        <td className={`p-4 text-right ${getBalanceClass(b.convertedBalance)}`}>
                          {currencyFilter === 'UAH' ? formatMoney(b.convertedBalance, 'грн') : `$${formatMoney(b.convertedBalance)}`}
                        </td>
                      )}
                      <td className="p-4 text-center">
                        <div className="flex flex-col gap-1 items-center justify-center">
                          {b.pendingCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse whitespace-nowrap">
                              ⚠️ Очікує ціну: {b.pendingCount}
                            </span>
                          )}
                          {b.reservedCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                              ⏳ Бронь: {b.reservedCount}
                            </span>
                          )}
                          {b.pendingCount === 0 && b.reservedCount === 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                              ок
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Link to={`/buyers/${b.id}`} className="btn btn-ghost btn-xs text-blue-500 hover:bg-blue-500/10">
                            👁️ Звіт
                          </Link>
                          <button 
                            onClick={(e) => openEdit(b, e)} 
                            className="btn btn-ghost btn-xs text-amber-500 hover:bg-amber-500/10 font-semibold"
                            title="Редагувати профіль клієнта"
                          >
                            ✏️ Профіль
                          </button>
                          <button 
                            onClick={(e) => handlePromptDelete(b, e)} 
                            className="btn btn-ghost btn-xs text-red-500 hover:bg-red-500/10 font-semibold"
                            title="Видалити клієнта (тільки якщо немає боргу)"
                          >
                            🗑️ Видалити
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Мобільна версія: Адаптивний список карток (показується на телефонах) */}
            <div className="block md:hidden divide-y divide-[var(--border)]">
              {filteredBuyers.map((b) => {
                const isUahDebt = (b.balanceUah || 0) < -0.01;
                const isUahAdvance = (b.balanceUah || 0) > 0.01;
                const isUsdDebt = (b.balanceUsd || 0) < -0.01;
                const isUsdAdvance = (b.balanceUsd || 0) > 0.01;

                return (
                  <div 
                    key={b.id} 
                    className={`p-4 flex flex-col gap-3 transition-colors bg-[var(--bg-card)] ${!b.active ? 'opacity-60 bg-gray-50/50 dark:bg-neutral-800/30' : ''}`}
                  >
                    {/* Заголовок картки: Назва + Телефон + Бейджі статусів */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/buyers/${b.id}`}
                          className="font-bold text-base text-blue-600 dark:text-blue-400 block leading-snug hover:underline break-words"
                        >
                          {b.name}
                        </Link>
                        {b.phone && (
                          <a
                            href={`tel:${b.phone.replace(/\s+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium mt-1 hover:text-primary transition-colors py-0.5 px-2 rounded-md bg-[var(--border-light)]"
                          >
                            📞 {b.phone}
                          </a>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 items-end shrink-0">
                        {b.pendingCount > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse whitespace-nowrap">
                            ⚠️ Ціна: {b.pendingCount}
                          </span>
                        )}
                        {b.reservedCount > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse whitespace-nowrap">
                            ⏳ Бронь: {b.reservedCount}
                          </span>
                        )}
                        {b.pendingCount === 0 && b.reservedCount === 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                            ✓ ок
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Баланси клієнта (UAH та USD) */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {currencyFilter === 'ALL' ? (
                        <>
                          <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                            isUahDebt
                              ? 'bg-red-500/10 border-red-500/30 dark:bg-red-950/20'
                              : isUahAdvance
                                ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20'
                                : 'bg-[var(--border-light)] border-[var(--border)]'
                          }`}>
                            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                              🇺🇦 Гривня (UAH)
                            </span>
                            <div className={`font-bold text-sm mt-1 ${getBalanceClass(b.balanceUah)}`}>
                              {formatMoney(b.balanceUah, 'грн')}
                            </div>
                            <span className="text-[9px] text-[var(--text-muted)] mt-0.5">
                              {isUahDebt ? '🔴 Борг' : isUahAdvance ? '🟢 Аванс' : '⚪ Баланс 0'}
                            </span>
                          </div>

                          <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                            isUsdDebt
                              ? 'bg-red-500/10 border-red-500/30 dark:bg-red-950/20'
                              : isUsdAdvance
                                ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20'
                                : 'bg-[var(--border-light)] border-[var(--border)]'
                          }`}>
                            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                              💵 Долар (USD)
                            </span>
                            <div className={`font-bold text-sm mt-1 ${getBalanceClass(b.balanceUsd)}`}>
                              {formatMoney(b.balanceUsd, '$')}
                            </div>
                            <span className="text-[9px] text-[var(--text-muted)] mt-0.5">
                              {isUsdDebt ? '🔴 Борг' : isUsdAdvance ? '🟢 Аванс' : '⚪ Баланс 0'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className={`col-span-2 p-3 rounded-xl border flex items-center justify-between ${
                          b.convertedBalance < -0.01
                            ? 'bg-red-500/10 border-red-500/30 dark:bg-red-950/20'
                            : b.convertedBalance > 0.01
                              ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20'
                              : 'bg-[var(--border-light)] border-[var(--border)]'
                        }`}>
                          <div>
                            <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                              Зведений баланс ({currencyFilter})
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {b.convertedBalance < -0.01 ? '🔴 Заборгованість' : b.convertedBalance > 0.01 ? '🟢 Переплата' : '⚪ Розраховано'}
                            </span>
                          </div>
                          <div className={`font-bold text-base ${getBalanceClass(b.convertedBalance)}`}>
                            {currencyFilter === 'UAH' ? formatMoney(b.convertedBalance, 'грн') : `$${formatMoney(b.convertedBalance)}`}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Рядок дій картки (великі тач-кнопки) */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--border)]/40" onClick={(e) => e.stopPropagation()}>
                      <Link 
                        to={`/buyers/${b.id}`} 
                        className="py-2.5 px-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-1 transition-colors active:scale-95 text-center"
                      >
                        👁️ Деталі
                      </Link>
                      <button 
                        type="button"
                        onClick={(e) => openEdit(b, e)} 
                        className="py-2.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                      >
                        ✏️ Профіль
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => handlePromptDelete(b, e)} 
                        className="py-2.5 px-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                      >
                        🗑️ Видалити
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Модальне вікно створення/редагування покупця */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-[var(--text)]">{editItem ? '✏️ Редагувати покупця' : '➕ Новий покупець'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body space-y-4">
                <div className="form-group flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Ім'я / Назва покупця *</label>
                  <input
                    type="text"
                    className="form-input w-full p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Напр.: Іван Петренко"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Телефон</label>
                  <input
                    type="text"
                    className="form-input w-full p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Напр.: +380971234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Нотатки</label>
                  <textarea
                    className="form-input w-full p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-blue-500 min-h-[60px]"
                    placeholder="Додаткова інформація..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="form-group flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Представники (через кому)</label>
                  <input
                    type="text"
                    className="form-input w-full p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Напр.: Водій Іван, Менеджер Марія"
                    value={formData.representatives}
                    onChange={(e) => setFormData({ ...formData, representatives: e.target.value })}
                  />
                </div>
                {editItem && (
                  <div className="form-group flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="buyer-active-checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="rounded border-[var(--border)]"
                    />
                    <label htmlFor="buyer-active-checkbox" className="text-xs font-semibold text-[var(--text-secondary)] cursor-pointer select-none">
                      Активний покупець
                    </label>
                  </div>
                )}
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

      {/* Модальне вікно підтвердження видалення */}
      {deleteConfirm.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm({ isOpen: false, buyer: null, loading: false })}>
          <div className="modal max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-red-600 text-white">
              <h3 className="font-bold text-sm">🗑️ Видалити клієнта?</h3>
              <button className="modal-close text-white" onClick={() => setDeleteConfirm({ isOpen: false, buyer: null, loading: false })}>×</button>
            </div>
            <div className="p-4 text-xs space-y-3 text-[var(--text)]">
              <p>Ви дійсно бажаєте безповоротно видалити клієнта <strong>"{deleteConfirm.buyer?.name}"</strong>?</p>
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-700 dark:text-amber-300">
                ⚠️ Перевірка пройшла успішно: клієнт не має заборгованості.
              </div>
            </div>
            <div className="modal-footer">
              <Button type="button" variant="ghost" onClick={() => setDeleteConfirm({ isOpen: false, buyer: null, loading: false })}>
                Скасувати
              </Button>
              <Button 
                type="button" 
                variant="danger" 
                onClick={confirmDeleteBuyer} 
                disabled={deleteConfirm.loading} 
                loading={deleteConfirm.loading}
              >
                Видалити
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
