
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
import { getActivityLogs } from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import { Button } from '@cso/design-system';

export default function AuditLog() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Фільтри
  const [actionFilter, setActionFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
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
    fetchLogs();
  }, [actionFilter, userFilter, dateFrom, dateTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  // Унікальний список користувачів для фільтру
  const uniqueUsers = Array.from(new Set(logs.map(l => l.user_name || l.user_email).filter(Boolean)));

  // Статистика дій за сьогодні
  const todayStr = new Date().toISOString().split('T')[0];
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

  const formatDetails = (details) => {
    if (!details) return '—';
    if (typeof details === 'string') return details;
    
    if (details.changesSummary) {
      return details.changesSummary;
    }

    if (details.deletedTransaction) {
      const t = details.deletedTransaction;
      return `Видалено: ${t.type === 'issue' ? 'Видача' : 'Оплата'} від ${t.date} на суму ${t.amount} ${t.currency}`;
    }

    if (details.itemsSummary) {
      return `Товари: ${details.itemsSummary}`;
    }

    return JSON.stringify(details);
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
                      👤 {getCleanManagerName(log.user_name, log.user_email)}
                    </td>
                    <td className="p-3 align-top font-semibold text-[var(--text)]">
                      {log.entity_title || log.entity_id || '—'}
                    </td>
                    <td className="p-3 align-top text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                      {formatDetails(log.details)}
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
                  👤 {getCleanManagerName(log.user_name, log.user_email)}
                </div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  {log.entity_title || log.entity_id || '—'}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)] p-2 rounded border border-[var(--border)] whitespace-pre-line">
                  {formatDetails(log.details)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
