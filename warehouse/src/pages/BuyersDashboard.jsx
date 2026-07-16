import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBuyersWithBalances, addBuyer, updateBuyer } from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import { Button } from '@cso/design-system';

export default function BuyersDashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

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



  // Фільтрація списку за пошуковим запитом
  const filteredBuyers = buyers.filter(b => {
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
    if (val < 0) return 'text-red-500 font-bold'; // борг
    if (val > 0) return 'text-green-500 font-bold'; // переплата
    return 'text-gray-400';
  }

  function formatMoney(val, symbol = '') {
    if (val === 0) return `0 ${symbol}`;
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toLocaleString('uk-UA')} ${symbol}`;
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
      <div className="mb-4">
        <input
          type="text"
          className="form-input w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-blue-500"
          placeholder="🔍 Швидкий пошук клієнта за назвою чи телефоном..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
                    <th className="p-4 text-right">Баланс UAH</th>
                    <th className="p-4 text-right">Баланс USD</th>
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
                      <td className={`p-4 text-right ${getBalanceClass(b.balanceUah)}`}>
                        {formatMoney(b.balanceUah, 'грн')}
                      </td>
                      <td className={`p-4 text-right ${getBalanceClass(b.balanceUsd)}`}>
                        {formatMoney(b.balanceUsd, '$')}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col gap-1 items-center justify-center">
                          {b.pendingCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              ⚠️ {b.pendingCount} без ціни
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Мобільна версія: Адаптивний список карток (показується на телефонах) */}
            <div className="block md:hidden divide-y divide-[var(--border)]">
              {filteredBuyers.map((b) => (
                <div 
                  key={b.id} 
                  className={`p-4 flex flex-col gap-2 hover:bg-[var(--border-light)] transition-colors ${!b.active ? 'opacity-50' : ''}`}
                  onClick={() => navigate(`/buyers/${b.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-sm text-blue-500 block">{b.name}</span>
                      {b.phone && <span className="text-xs text-[var(--text-secondary)] block mt-0.5">{b.phone}</span>}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {b.pendingCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          ⚠️ {b.pendingCount} без ціни
                        </span>
                      )}
                      {b.reservedCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                          ⏳ Бронь: {b.reservedCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs mt-1 border-t border-[var(--border)] pt-2">
                    <div>
                      <span className="text-[var(--text-secondary)] mr-1">UAH:</span>
                      <span className={getBalanceClass(b.balanceUah)}>{formatMoney(b.balanceUah, 'грн')}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] mr-1">USD:</span>
                      <span className={getBalanceClass(b.balanceUsd)}>{formatMoney(b.balanceUsd, '$')}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-1 text-[11px] pt-1" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/buyers/${b.id}`} className="text-blue-500 font-semibold hover:underline">
                      👁️ Деталі та Акт
                    </Link>
                    <button onClick={(e) => openEdit(b, e)} className="text-amber-500 font-semibold hover:underline">
                      ✏️ Профіль
                    </button>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
