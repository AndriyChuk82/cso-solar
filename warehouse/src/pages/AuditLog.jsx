
const getCleanManagerName = (name, email) => {
  let raw = name || email || '';
  if (!raw) return 'Оператор';
  if (raw.includes('@')) {
    const prefix = raw.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return raw;
};
import { useState, useEffect } from 'react';
import { getActivityLogs, fetchUsersMap, formatUserName } from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import { Button } from '@cso/design-system';

export default function AuditLog() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingLog, setViewingLog] = useState(null);

  const [actionFilter, setActionFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [search, setSearch] = useState('');

  // Завантаження логів
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getActivityLogs({
        actionType: actionFilter,
        user: userFilter,
        dateFrom,
        dateTo,
        search
      });
      if (res.success) {
        setLogs(res.data || []);
      } else {
        showToast(res.error || 'Не вдалося завантажити журнал дій', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка при з\'єднанні з сервером', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersMap().then(() => fetchLogs());
  }, [actionFilter, userFilter, dateFrom, dateTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  // Унікальний список користувачів для фільтру
  const uniqueUsers = Array.from(new Set(logs.map(l => l.user_name || l.user_email).filter(Boolean)));

  // Статистика дій за сьогодні
  const todayLogs = logs.filter(l => l.created_at?.startsWith(todayStr));
  const countCreates = todayLogs.filter(l => l.action_type === 'CREATE').length;
  const countUpdates = todayLogs.filter(l => l.action_type === 'UPDATE').length;
  const countDeletes = todayLogs.filter(l => l.action_type === 'DELETE').length;

  const getActionBadge = (type) => {
    switch (type) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">🟢 Створено</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">🟡 Змінено</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">🔴 Видалено</span>;
      case 'ARCHIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">🗄️ Архів</span>;
      case 'UNARCHIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">🔄 Розархівовано</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/10 text-gray-600 border border-gray-500/20">{type}</span>;
    }
  };

  const formatLogTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('uk-UA', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };


const formatDetails = (log) => {
  if (!log) return '—';
  const details = log.details || {};
  
  if (typeof details === 'string') return details;
  
  if (details.changesSummary) {
    return details.changesSummary;
  }

  if (log.action_type === 'CREATE' || details.type) {
    const typeLabel = details.type === 'issue' 
      ? (details.status === 'reserved' ? 'Бронь товарів' : 'Видача товарів')
      : details.type === 'payment' ? 'Оплата' 
      : details.type === 'adjustment' ? 'Коригування' 
      : 'Створення документа';

    const parts = [];
    if (details.amount !== undefined && details.amount !== null) {
      parts.push(`💰 Сума: ${parseFloat(details.amount).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ${details.currency || ''}`);
    }
    if (details.itemsSummary) {
      const count = details.itemsCount || (details.items ? details.items.length : 0);
      parts.push(`📦 Товари (${count || 1} поз.): ${details.itemsSummary}`);
    } else if (details.itemsCount > 0) {
      parts.push(`📦 Кількість позицій: ${details.itemsCount}`);
    }
    if (details.comment) {
      const cleanComment = String(details.comment).replace(/\s*\[invoice_id:[\w-]+\]/g, '').trim();
      if (cleanComment) parts.push(`💬 Коментар: "${cleanComment}"`);
    }

    return parts.join('\n') || `Створено ${typeLabel.toLowerCase()}`;
  }

  if (log.action_type === 'DELETE' || details.transactionId) {
    if (details.deletedTransaction) {
      const t = details.deletedTransaction;
      return `🔴 Видалено: ${t.type === 'issue' ? 'Видача' : 'Оплата'} від ${t.date} на суму ${parseFloat(t.amount || 0).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ${t.currency || ''}`;
    }
    return `Видалено документ (ID: ${(details.transactionId || log.entity_id || '').slice(0, 8)})`;
  }

  if (log.action_type === 'ARCHIVE') return '🗄️ Переміщено документ в архів';
  if (log.action_type === 'UNARCHIVE') return '🔄 Відновлено документ з архіву';

  try {
    const cleanKeys = Object.entries(details)
      .filter(([k, v]) => v !== undefined && v !== null && k !== 'buyerId' && k !== 'transactionId')
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
    return cleanKeys.join('\n') || 'Операція виконана';
  } catch {
    return 'Деталі операції зафіксовано';
  }
};

const renderStructuredDetails = (log) => {
  if (!log) return null;
  const details = log.details || {};

  // 1. Сума та коментар
  const amountVal = details.amount !== undefined && details.amount !== null 
    ? details.amount 
    : details.deletedTransaction?.amount;
  const currencyStr = details.currency || details.deletedTransaction?.currency || '';
  const amountStr = amountVal !== undefined && amountVal !== null 
    ? `${parseFloat(amountVal).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ${currencyStr}`
    : null;

  let cleanComment = details.comment || (details.deletedTransaction?.comment);
  if (!cleanComment && typeof details.changesSummary === 'string' && details.changesSummary.includes('Коментар:')) {
    cleanComment = details.changesSummary.split('Коментар:')[1]?.replace(/^[\s"]+|[\s"]+$/g, '');
  }
  if (cleanComment) {
    cleanComment = String(cleanComment).replace(/\s*\[invoice_id:[\w-]+\]/g, '').trim();
  }

  // 2. Повноцінний масив товарів (якщо збережений у лозі)
  const itemsList = details.items || details.deletedTransaction?.items || [];

  // 3. Якщо масиву немає, розбираємо itemsSummary на окремі елементи
  let parsedSummaryItems = [];
  if (itemsList.length === 0 && details.itemsSummary) {
    parsedSummaryItems = String(details.itemsSummary)
      .split(/\),\s*/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.endsWith(')') ? s : `${s})`);
  }

  // 4. Перелік внесених змін (для UPDATE дій)
  const changesList = details.changesList || (typeof details.changesSummary === 'string' && details.changesSummary.includes('\n• ')
    ? details.changesSummary.split('\n• ').map(c => c.replace(/^•\s*/, '').trim()).filter(Boolean)
    : (details.changesSummary && !details.itemsSummary && !details.comment ? [details.changesSummary] : []));

  return (
    <div className="space-y-4 text-xs">
      {/* Сума та Коментар у структурованій картці */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {amountStr && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              💳 Загальна сума документа:
            </span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
              {amountStr}
            </span>
          </div>
        )}
        {cleanComment && (
          <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              💬 Примітка / Коментар:
            </span>
            <span className="text-xs font-medium text-[var(--text)] mt-1 italic leading-relaxed">
              "{cleanComment}"
            </span>
          </div>
        )}
      </div>

      {/* Перелік дій/змін (UPDATE) */}
      {changesList.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            📝 Зафіксовані зміни у документі:
          </h4>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-1.5 text-[var(--text)]">
            {changesList.map((ch, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-amber-500 font-bold">•</span>
                <span>{ch}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Специфікація товарів - повноцінна таблиця (якщо є масив items) */}
      {itemsList.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[var(--text)]">📦 Специфікація товарів:</h4>
            <span className="text-[10px] font-semibold text-[var(--text-secondary)]">Позицій: {itemsList.length}</span>
          </div>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg)] text-[var(--text-secondary)] font-bold border-b border-[var(--border)] text-[11px]">
                  <th className="p-2.5 w-10 text-center">№</th>
                  <th className="p-2.5">Найменування товару</th>
                  <th className="p-2.5 w-24 text-right">Кількість</th>
                  <th className="p-2.5 w-28 text-right">Ціна</th>
                  <th className="p-2.5 w-28 text-right">Сума</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {itemsList.map((item, idx) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const price = parseFloat(item.price) || 0;
                  const sum = qty * price;
                  return (
                    <tr key={idx} className="hover:bg-[var(--border-light)]/20">
                      <td className="p-2.5 text-center text-[var(--text-secondary)] font-mono text-[10px]">{idx + 1}</td>
                      <td className="p-2.5 font-medium text-[var(--text)]">{item.productName || item.name || 'Товар'}</td>
                      <td className="p-2.5 text-right font-mono text-[var(--text)] font-semibold">{qty} {item.unit || 'шт'}</td>
                      <td className="p-2.5 text-right font-mono text-[var(--text-secondary)]">
                        {price > 0 ? `${price.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ${item.currency || currencyStr}` : '—'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-[var(--text)]">
                        {sum > 0 ? `${sum.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ${item.currency || currencyStr}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : parsedSummaryItems.length > 0 ? (
        /* Специфікація товарів розібрана з тексту itemsSummary */
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[var(--text)]">📦 Перелік товарів (Специфікація):</h4>
            <span className="text-[10px] font-semibold text-[var(--text-secondary)]">Позицій: {parsedSummaryItems.length}</span>
          </div>
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-1.5 text-[var(--text)] font-mono text-[11px]">
            {parsedSummaryItems.map((itemText, idx) => (
              <div key={idx} className="flex items-start gap-2 border-b border-[var(--border)]/40 pb-1.5 last:border-b-0 last:pb-0">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">#{idx + 1}</span>
                <span className="leading-relaxed">{itemText}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};


  return (
    <div className="pb-12 max-w-7xl mx-auto px-2 md:px-4 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text)] flex items-center gap-2">
            📜 Журнал дій користувачів (Аудит-лог)
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">Фіксація та контроль усіх операцій створення, зміни цін, видалень та архівування.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="self-start sm:self-auto">
          🔄 Оновити дані
        </Button>
      </div>

      {/* Підсумкові картки за сьогодні */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Дій за сьогодні</span>
          <span className="text-xl md:text-2xl font-extrabold text-[var(--text)] mt-1">{todayLogs.length}</span>
        </div>
        <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">🟢 Створено</span>
          <span className="text-xl md:text-2xl font-extrabold text-green-600 dark:text-green-400 mt-1">{countCreates}</span>
        </div>
        <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">🟡 Змінено</span>
          <span className="text-xl md:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{countUpdates}</span>
        </div>
        <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">🔴 Видалено</span>
          <span className="text-xl md:text-2xl font-extrabold text-red-500 mt-1">{countDeletes}</span>
        </div>
      </div>

      {/* Панель фільтрів */}
      <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Тип дії */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[var(--text-secondary)]">Тип дії</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-[34px] px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none"
            >
              <option value="ALL">Всі дії</option>
              <option value="CREATE">🟢 Створення</option>
              <option value="UPDATE">🟡 Зміни / Ціни</option>
              <option value="DELETE">🔴 Видалення</option>
              <option value="ARCHIVE">🗄️ Архівування</option>
            </select>
          </div>

          {/* Менеджер */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[var(--text-secondary)]">Менеджер</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="h-[34px] px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none"
            >
              <option value="ALL">Всі менеджери</option>
              {uniqueUsers.map((u, idx) => (
                <option key={idx} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Дата Від */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[var(--text-secondary)]">Дата з</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-[34px] px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none"
            />
          </div>

          {/* Дата До */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-[var(--text-secondary)]">Дата по</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-[34px] px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none"
            />
          </div>

          {/* Пошук */}
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
            <label className="font-semibold text-[var(--text-secondary)]">Пошук</label>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Покупець, товар..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[34px] px-2.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none"
              />
              <button type="submit" className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs">
                🔍
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Список дій */}
      {loading ? (
        <div className="p-12 flex justify-center"><div className="spinner" /></div>
      ) : logs.length === 0 ? (
        <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-12 text-center text-[var(--text-secondary)]">
          <span className="text-3xl block mb-2">🔍</span>
          Жодної дії за обраними фільтрами не знайдено.
        </div>
      ) : (
        <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          {/* Десктоп таблиця */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg)] text-[var(--text-secondary)] font-bold border-b border-[var(--border)]">
                  <th className="p-3 w-40 whitespace-nowrap">Дата та час</th>
                  <th className="p-3 w-32">Операція</th>
                  <th className="p-3 w-44">Менеджер</th>
                  <th className="p-3 w-64">Об'єкт / Клієнт</th>
                  <th className="p-3">Деталі змін</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--border-light)]/40 transition-colors">
                    <td className="p-3 whitespace-nowrap text-[var(--text-secondary)] font-mono text-[11px]">
                      ⏱️ {formatLogTime(log.created_at)}
                    </td>
                    <td className="p-3 align-top whitespace-nowrap">
                      {getActionBadge(log.action_type)}
                    </td>
                    <td className="p-3 align-top font-semibold text-[var(--text)]">
                      👤 {formatUserName(log.user_name || log.user_email)}
                    </td>
                    <td className="p-3 align-top font-semibold text-[var(--text)]">
                      {log.entity_title || log.entity_id || '—'}
                    </td>
                    <td className="p-3 align-top text-[var(--text-secondary)] leading-relaxed">
                      <div className="flex items-start justify-between gap-2">
                        <div className="whitespace-pre-line">{formatDetails(log)}</div>
                        <button
                          onClick={() => setViewingLog(log)}
                          className="shrink-0 px-2 py-1 rounded bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--border-light)] text-[10px] font-bold text-blue-600 dark:text-blue-400 transition-colors"
                          title="Переглянути картку фіксації дій"
                        >
                          👁️ Деталі
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Мобільні картки */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  {getActionBadge(log.action_type)}
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                    ⏱️ {formatLogTime(log.created_at)}
                  </span>
                </div>
                <div className="font-bold text-[var(--text)]">
                  👤 {formatUserName(log.user_name || log.user_email)}
                </div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  {log.entity_title || log.entity_id || '—'}
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)] bg-[var(--bg)] p-2 rounded border border-[var(--border)]">
                  <div className="whitespace-pre-line leading-relaxed">{formatDetails(log)}</div>
                  <button
                    onClick={() => setViewingLog(log)}
                    className="shrink-0 px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--border-light)] text-[10px] font-bold text-blue-600 dark:text-blue-400 transition-colors"
                  >
                    👁️ Деталі
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модальне вікно перегляду детального акту фіксації */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 md:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                📄 Акт фіксації аудит-журналу
              </h3>
              <button 
                onClick={() => setViewingLog(null)} 
                className="w-8 h-8 rounded-full hover:bg-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Основна інформація */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[var(--bg)] p-3.5 rounded-lg border border-[var(--border)]">
              <div>
                <span className="text-[var(--text-secondary)] block">Тип операції:</span>
                <span className="font-bold mt-0.5 inline-block">{getActionBadge(viewingLog.action_type)}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] block">Дата та час запису:</span>
                <span className="font-mono font-bold text-[var(--text)]">{formatLogTime(viewingLog.created_at)}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] block">Менеджер (Виконавець):</span>
                <span className="font-bold text-[var(--text)]">{formatUserName(viewingLog.user_name || viewingLog.user_email)}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] block">Клієнт / Покупець:</span>
                <span className="font-bold text-[var(--text)]">
                  {viewingLog.details?.buyerName || 
                   viewingLog.details?.deletedTransaction?.buyerName || 
                   (viewingLog.entity_title && !viewingLog.entity_title.includes('ID ') ? viewingLog.entity_title : null) || 
                   'Документ (видалено до оновлення журналу)'}
                </span>
              </div>
            </div>

            {/* Опис / Деталі та Специфікація */}
            {renderStructuredDetails(viewingLog)}

            <div className="flex justify-end pt-2 border-t border-[var(--border)]">
              <Button onClick={() => setViewingLog(null)} variant="outline" size="sm">
                Закрити
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
