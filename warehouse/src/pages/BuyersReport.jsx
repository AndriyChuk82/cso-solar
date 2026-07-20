import { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getBuyers, getAllBuyerTransactions, deleteBuyerTransaction } from '../api/gasApi';
import { Button } from '@cso/design-system';

export default function BuyersReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [buyers, setBuyers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trial-balance'); // 'trial-balance' | 'journal'
  const [currencyFilter, setCurrencyFilter] = useState('ALL'); // 'ALL' | 'UAH' | 'USD'
  const [showDetailed, setShowDetailed] = useState(true); // Деталізувати по накладних за замовчуванням
  const [collapsedBuyers, setCollapsedBuyers] = useState({}); // Стан згорнутих покупців

  function toggleBuyerCollapsed(buyerId) {
    setCollapsedBuyers(prev => ({
      ...prev,
      [buyerId]: !prev[buyerId]
    }));
  }

  // Дата за замовчуванням: з першого числа поточного місяця по сьогодні
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [buyersRes, txRes] = await Promise.all([
        getBuyers(),
        getAllBuyerTransactions()
      ]);

      if (buyersRes?.success) {
        setBuyers(buyersRes.buyers || []);
      }
      if (txRes?.success) {
        setTransactions(txRes.transactions || []);
      }
    } catch (err) {
      console.error('Помилка завантаження даних для звіту:', err);
      showToast('Не вдалося завантажити дані', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Видалення транзакції
  async function handleDeleteTransaction(txId) {
    if (!window.confirm('Ви впевнені, що хочете видалити цю транзакцію? Це автоматично скасує списання товару на складі.')) return;

    try {
      const res = await deleteBuyerTransaction(txId);
      if (res.success) {
        showToast('Транзакцію успішно видалено', 'success');
        loadData();
      }
    } catch (err) {
      console.error('Помилка видалення:', err);
      showToast('Не вдалося видалити транзакцію', 'error');
    }
  }

  // Перенаправлення на редагування накладної
  function startEdit(tx) {
    if (tx.type === 'issue') {
      navigate(`/buyers/issue/edit/${tx.id}`);
    } else {
      showToast('Редагування оплат підтримується безпосередньо з картки деталей клієнта', 'info');
    }
  }

  // Допоміжні функції для форматування балансу
  function getBalanceClass(val) {
    if (val < 0) return 'text-red-500 font-bold';
    if (val > 0) return 'text-green-500 font-bold';
    return 'text-gray-400';
  }

  function formatMoney(val, symbol = '') {
    if (val === 0) return `0 ${symbol}`;
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  }

  // Розрахунок оборотної відомості (Trial Balance) по кожному покупцю
  // 1. Попередній аналіз та групування пов'язаних платежів
  const processedTransactions = [];
  const linkedPaymentsMap = {}; // invoiceId -> array of payments

  // Спочатку збираємо всі пов'язані платежі (які не архівні)
  transactions.forEach(t => {
    if (t.is_archived === true) return;
    if (t.type === 'payment') {
      const match = t.comment?.match(/\[invoice_id:([\w-]+)\]/);
      if (match) {
        const invoiceId = match[1];
        linkedPaymentsMap[invoiceId] = linkedPaymentsMap[invoiceId] || [];
        linkedPaymentsMap[invoiceId].push(t);
      }
    }
  });

  // Будуємо список оброблених транзакцій (виключаючи зв'язані платежі як окремі документи)
  transactions.forEach(t => {
    if (t.type === 'payment') {
      const match = t.comment?.match(/\[invoice_id:([\w-]+)\]/);
      if (match) {
        const invoiceId = match[1];
        const invoiceExists = transactions.some(inv => inv.id === invoiceId && inv.is_archived !== true);
        if (invoiceExists) {
          // Якщо накладна існує, не додаємо цей платіж як окремий рядок
          return;
        }
      }
    }
    
    // Якщо це накладна (issue), додаємо до неї зв'язані платежі
    if (t.type === 'issue') {
      const linked = linkedPaymentsMap[t.id] || [];
      processedTransactions.push({
        ...t,
        linkedPayments: linked,
        paidAmount: linked.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      });
    } else {
      processedTransactions.push({ ...t, linkedPayments: [], paidAmount: 0 });
    }
  });

  // Розрахунок оборотної відомості (Trial Balance) по кожному покупцю
  const trialBalanceRows = buyers.map(buyer => {
    // Сортуємо транзакції клієнта хронологічно для правильного розрахунку накопичувального підсумку
    const buyerTx = [...processedTransactions]
      .filter(t => t.buyer_id === buyer.id && t.is_archived !== true)
      .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
    
    let uahOpening = 0, usdOpening = 0;
    let uahIssued = 0, usdIssued = 0;
    let uahPaid = 0, usdPaid = 0;

    // 1. Початковий баланс до початку періоду
    buyerTx.forEach(t => {
      const isReservedIssue = t.type === 'issue' && t.status === 'reserved';
      const amt = isReservedIssue ? 0 : (parseFloat(t.amount) || 0);
      const cur = t.currency;

      if (t.date < dateFrom) {
        if (t.type === 'issue') {
          if (cur === 'UAH') uahOpening -= amt;
          if (cur === 'USD') usdOpening -= amt;
        } else {
          if (cur === 'UAH') uahOpening += amt;
          if (cur === 'USD') usdOpening += amt;
        }
        
        // Враховуємо лінковані платежі до періоду
        if (t.type === 'issue' && t.linkedPayments) {
          t.linkedPayments.forEach(lp => {
            const lpAmt = parseFloat(lp.amount) || 0;
            if (lp.date < dateFrom) {
              if (lp.currency === 'UAH') uahOpening += lpAmt;
              if (lp.currency === 'USD') usdOpening += lpAmt;
            } else if (lp.date >= dateFrom && lp.date <= dateTo) {
              if (lp.currency === 'UAH') uahPaid += lpAmt;
              if (lp.currency === 'USD') usdPaid += lpAmt;
            }
          });
        }
      }
    });

    let currentUahRunning = uahOpening;
    let currentUsdRunning = usdOpening;
    const periodItems = [];

    // 2. Обходимо транзакції періоду та розраховуємо накопичувальний підсумок для кожної операції
    buyerTx.forEach(t => {
      const isReservedIssue = t.type === 'issue' && t.status === 'reserved';
      const amt = isReservedIssue ? 0 : (parseFloat(t.amount) || 0);
      const cur = t.currency;

      let uahDeb = 0, uahCred = 0, usdDeb = 0, usdCred = 0;

      if (t.type === 'issue') {
        if (!isReservedIssue) {
          if (cur === 'UAH') { uahDeb = amt; currentUahRunning -= amt; uahIssued += amt; }
          if (cur === 'USD') { usdDeb = amt; currentUsdRunning -= amt; usdIssued += amt; }
        }
        
        // Враховуємо лінковані платежі в межах періоду
        if (t.linkedPayments) {
          t.linkedPayments.forEach(lp => {
            const lpAmt = parseFloat(lp.amount) || 0;
            if (lp.currency === 'UAH') {
              uahCred += lpAmt;
              currentUahRunning += lpAmt;
              if (lp.date >= dateFrom && lp.date <= dateTo) {
                uahPaid += lpAmt;
              }
            }
            if (lp.currency === 'USD') {
              usdCred += lpAmt;
              currentUsdRunning += lpAmt;
              if (lp.date >= dateFrom && lp.date <= dateTo) {
                usdPaid += lpAmt;
              }
            }
          });
        }
      } else {
        if (cur === 'UAH') { uahCred = amt; currentUahRunning += amt; if (t.date >= dateFrom && t.date <= dateTo) uahPaid += amt; }
        if (cur === 'USD') { usdCred = amt; currentUsdRunning += amt; if (t.date >= dateFrom && t.date <= dateTo) usdPaid += amt; }
      }

      if (t.date >= dateFrom && t.date <= dateTo) {
        periodItems.push({
          ...t,
          uahDeb,
          uahCred,
          usdDeb,
          usdCred,
          uahRunning: currentUahRunning,
          usdRunning: currentUsdRunning
        });
      }
    });

    const uahClosing = uahOpening - uahIssued + uahPaid;
    const usdClosing = usdOpening - usdIssued + usdPaid;

    return {
      id: buyer.id,
      name: buyer.name,
      phone: buyer.phone,
      uahOpening,
      usdOpening,
      uahIssued,
      usdIssued,
      uahPaid,
      usdPaid,
      uahClosing,
      usdClosing,
      items: periodItems
    };
  }).filter(row => {
    const hasOpening = Math.abs(row.uahOpening) > 0.01 || Math.abs(row.usdOpening) > 0.01;
    const hasTurnover = Math.abs(row.uahIssued) > 0.01 || Math.abs(row.usdIssued) > 0.01 || Math.abs(row.uahPaid) > 0.01 || Math.abs(row.usdPaid) > 0.01;
    const hasClosing = Math.abs(row.uahClosing) > 0.01 || Math.abs(row.usdClosing) > 0.01;
    return hasOpening || hasTurnover || hasClosing;
  });

  // Підрахунок загальних сум для підвалу відомості
  let totalUahOpening = 0, totalUsdOpening = 0;
  let totalUahIssued = 0, totalUsdIssued = 0;
  let totalUahPaid = 0, totalUsdPaid = 0;
  let totalUahClosing = 0, totalUsdClosing = 0;

  trialBalanceRows.forEach(row => {
    totalUahOpening += row.uahOpening;
    totalUsdOpening += row.usdOpening;
    totalUahIssued += row.uahIssued;
    totalUsdIssued += row.usdIssued;
    totalUahPaid += row.uahPaid;
    totalUahClosing += row.uahClosing;
    totalUsdClosing += row.usdClosing;
  });

  // Фільтрування загального журналу операцій (вкладка 2)
  const filteredJournalTransactions = processedTransactions
    .filter(t => t.is_archived !== true)
    .filter(t => t.date >= dateFrom && t.date <= dateTo)
    .filter(t => currencyFilter === 'ALL' || t.currency === currencyFilter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)); // Новіші спочатку

  return (
    <div className="pb-12 max-w-6xl mx-auto px-2 md:px-4">
      {/* Спеціальні стилі друку */}
      <style>{`
        /* Адаптивність відомості: приховування таблиці на мобілках, карток на десктопі */
        @media (max-width: 767px) {
          .desktop-report-table {
            display: none !important;
          }
          .mobile-report-cards {
            display: block !important;
          }
        }
        @media (min-width: 768px) {
          .desktop-report-table {
            display: table !important;
          }
          .mobile-report-cards {
            display: none !important;
          }
        }
        @media print {
          .no-print, header, nav, button, .flex-wrap, input, select {
            display: none !important;
          }
          .app-sidebar, .sidebar-backdrop {
            display: none !important;
          }
          .app-content, main, body, html {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          table.desktop-report-table {
            display: table !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .mobile-report-cards {
            display: none !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 6px !important;
            font-size: 10px !important;
          }
        }
      `}</style>

      {/* Навігація вгорі (ховається при друку) */}
      <div className="flex items-center justify-between gap-3 mb-6 no-print">
        <div className="flex items-center gap-3">
          <Link 
            to="/buyers" 
            className="text-xl p-1 text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text)]">👥 Звіти по клієнтах</h1>
            <p className="text-xs text-[var(--text-secondary)]">Зведені дані та загальний журнал операцій</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => window.print()}
            className="flex items-center gap-1.5"
          >
            🖨️ Друк звіту
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><div className="spinner" /></div>
      ) : (
        <div className="space-y-6">
          
          {/* Перемикач вкладок (ховається при друку) */}
          <div className="flex gap-2 border-b border-[var(--border)] pb-2 no-print">
            <button
              onClick={() => setActiveTab('trial-balance')}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'trial-balance'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
              }`}
            >
              📊 Оборотна відомість
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'journal'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
              }`}
            >
              📋 Загальний журнал
            </button>
          </div>

          {/* Параметри звіту (ховаються при друку) */}
          <div className="card p-2 sm:p-4 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl space-y-2 sm:space-y-4 no-print">
            <h3 className="hidden sm:block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Параметри звітів</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="flex flex-col gap-1 col-span-1">
                <label className="hidden sm:block text-[10px] text-[var(--text-secondary)]">Дата з</label>
                <input
                  type="date"
                  className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none w-full"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 col-span-1">
                <label className="hidden sm:block text-[10px] text-[var(--text-secondary)]">Дата по</label>
                <input
                  type="date"
                  className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none w-full"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 col-span-1">
                <label className="hidden sm:block text-[10px] text-[var(--text-secondary)]">Валюта</label>
                <select
                  className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none w-full"
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                >
                  <option value="ALL">Всі операції (UAH та USD)</option>
                  <option value="UAH">Лише UAH (Гривня)</option>
                  <option value="USD">Лише USD (Долар)</option>
                </select>
              </div>
              {activeTab === 'trial-balance' ? (
                <div className="flex items-center sm:mt-4 pl-1 sm:pl-2 col-span-1">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-[var(--border)] bg-[var(--bg)] text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={showDetailed}
                      onChange={(e) => setShowDetailed(e.target.checked)}
                    />
                    <span className="hidden sm:inline">Деталізувати по накладних</span>
                    <span className="sm:hidden">Детально</span>
                  </label>
                </div>
              ) : (
                <div className="hidden sm:block" />
              )}
            </div>
          </div>

          {/* Друкований контейнер */}
          <div className="print-container space-y-6">
            
            {/* Вкладка 1: Оборотна відомість */}
            {activeTab === 'trial-balance' && (
              <div className="card border border-[var(--border)] bg-[var(--bg-card)] rounded-xl overflow-hidden p-4">
                <div className="text-center mb-6">
                  <h2 className="text-base md:text-lg font-bold text-[var(--text)] uppercase">
                    {showDetailed ? 'Відомість взаєморозрахунків з деталізацією по накладних' : 'Оборотна відомість взаєморозрахунків'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    за період з <b>{dateFrom}</b> по <b>{dateTo}</b>
                  </p>
                </div>

                <div className="overflow-x-auto">
                  {showDetailed ? (
                    /* ДЕТАЛІЗОВАНИЙ ЗВІТ */
                    <Fragment>
                      {/* Десктопна версія (таблиця) */}
                      <table className="desktop-report-table w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] font-semibold">
                            <th className="p-2 w-28 whitespace-nowrap">Дата / Покупець</th>
                            <th className="p-2">Документ / Деталі операції</th>
                            <th className="p-2 text-center w-28">Нараховано борг</th>
                            <th className="p-2 text-center w-28">Сплачено</th>
                            <th className="p-2 text-right w-32">Поточний баланс</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {trialBalanceRows.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-[var(--text-secondary)]">
                                Немає зареєстрованих клієнтів
                              </td>
                            </tr>
                          ) : (
                            trialBalanceRows.map(row => (
                              <Fragment key={row.id}>
                                {/* Рядок контрагента (Шапка групи) */}
                                <tr 
                                  className="bg-[var(--border-light)] font-bold border-t border-[var(--border)] text-[var(--text)] cursor-pointer select-none hover:bg-[var(--border-light)]/80 transition-colors"
                                  onClick={() => toggleBuyerCollapsed(row.id)}
                                >
                                  <td colSpan="2" className="p-2 text-left">
                                    <span className="inline-block mr-1.5 transition-transform duration-200 text-[10px]" style={{ transform: collapsedBuyers[row.id] ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                                      ▼
                                    </span>
                                    👤 <Link to={`/buyers/${row.id}`} onClick={e => e.stopPropagation()} className="hover:underline text-blue-600 dark:text-blue-400 font-bold">{row.name}</Link>
                                    {row.phone && <span className="text-[10px] text-[var(--text-secondary)] font-normal ml-2">({row.phone})</span>}
                                  </td>
                                  <td colSpan="2" className="p-2 text-right text-[var(--text-secondary)] font-normal text-[10px]">Вхідне сальдо:</td>
                                  <td className="p-2 text-right whitespace-nowrap font-bold text-xs">
                                    <span className={getBalanceClass(row.uahOpening)}>{formatMoney(row.uahOpening, 'грн')}</span>
                                    <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                    <span className={getBalanceClass(row.usdOpening)}>{formatMoney(row.usdOpening)}</span>
                                  </td>
                                </tr>

                                {/* Детальні накладні під контрагентом */}
                                {!collapsedBuyers[row.id] && (
                                  <Fragment>
                                    {row.items.length === 0 ? (
                                      <tr>
                                        <td colSpan="5" className="p-2 text-center text-[10px] text-[var(--text-secondary)] italic pl-6">
                                          Немає операцій за вказаний період
                                        </td>
                                      </tr>
                                    ) : (
                                      [...row.items].reverse().map(t => {
                                        const isIssue = t.type === 'issue';
                                        const isAdj = t.type === 'adjustment';
                                        const amt = parseFloat(t.amount) || 0;

                                        return (
                                          <tr key={t.id} className="hover:bg-[var(--border-light)]/40 transition-colors text-[11px] border-b border-[var(--border)]">
                                            <td className="p-2 align-top whitespace-nowrap pl-6 text-[var(--text-secondary)]">
                                              📅 {t.date}
                                            </td>
                                            <td className="p-2 align-top">
                                              {isIssue ? (
                                                <div className="space-y-0.5">
                                                  <span className="font-semibold text-[var(--text)] flex items-center gap-1.5 flex-wrap">
                                                    {t.status === 'reserved' ? '⏳ Бронь матеріалів:' : 'Видача матеріалів:'}
                                                  </span>
                                                  <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5 pl-1.5">
                                                    {t.items?.map((item, idx) => {
                                                      const priceTxt = item.price !== null && item.price !== undefined && item.price !== ''
                                                        ? ` × ${item.price} ${item.currency || t.currency}`
                                                        : '';
                                                      return (
                                                        <div key={idx} className="leading-tight">
                                                          • {item.product_name} — <span className="font-semibold text-[var(--text)]">{item.quantity} {item.unit}</span>{priceTxt}
                                                        </div>
                                                      );
                                                    })}
                                                    {t.status === 'pending_price' && (
                                                      <div className="text-yellow-600 font-semibold mt-1">⚠️ (Ціна очікується)</div>
                                                    )}
                                                  </div>
                                                  {t.picked_up_by && (
                                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                                                      👤 Отримав: {t.picked_up_by}
                                                    </div>
                                                  )}
                                                  {t.comment && (
                                                    <div className="text-[10px] text-[var(--text-secondary)] italic mt-1">Коментар: {(t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</div>
                                                  )}
                                                  {/* Вкладені лінковані платежі у відомості взаєморозрахунків */}
                                                  {t.linkedPayments && t.linkedPayments.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                                      {t.linkedPayments.map((lp, lIdx) => {
                                                        const displayComment = (lp.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/, '');
                                                        const lpAmt = parseFloat(lp.amount) || 0;
                                                        const formattedLpAmt = lp.currency === 'UAH' ? `${lpAmt.toLocaleString('uk-UA')} грн` : `$${lpAmt.toLocaleString('uk-UA')}`;
                                                        const showAmt = t.linkedPayments.length > 1;
                                                        return (
                                                          <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1 animate-fadeIn">
                                                            <span>💰 {displayComment} ({lp.date}){showAmt ? ` — ${formattedLpAmt}` : ''}</span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div>
                                                  <span className="font-semibold text-[var(--text)] block">
                                                    {t.type === 'payment' ? '📥 Оплата' : '🔧 Коригування'}
                                                  </span>
                                                  <span className="text-[var(--text-secondary)] block mt-0.5">{(t.comment || '—').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</span>
                                                  {t.converted_amount && (
                                                    <span className="text-[10px] text-green-600 block mt-0.5">
                                                      Зараховано: {t.converted_amount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'USD' : 'UAH'} за курсом {t.conversion_rate}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </td>
                                            <td className="p-2 text-center align-top text-red-500 font-medium">
                                              {((isIssue && amt > 0) || (isAdj && amt < 0)) ? (
                                                t.status === 'reserved' ? (
                                                  <span className="text-gray-400 font-normal italic" title="Резерв не списується в борг до видачі">
                                                    (${Math.abs(amt).toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'})
                                                  </span>
                                                ) : (
                                                  `${Math.abs(amt).toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                                )
                                              ) : '—'}
                                            </td>
                                            <td className="p-2 text-center align-top text-green-500 font-medium">
                                              {((t.type === 'payment' && amt > 0) || (isAdj && amt > 0)) ? (
                                                `${amt.toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                              ) : isIssue && t.paidAmount > 0 ? (
                                                `${t.paidAmount.toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                              ) : '—'}</td>
                                            <td className="p-2 text-right align-top font-semibold whitespace-nowrap text-xs">
                                              <span className={getBalanceClass(t.uahRunning)}>{formatMoney(t.uahRunning, 'грн')}</span>
                                              <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                              <span className={getBalanceClass(t.usdRunning)}>{formatMoney(t.usdRunning)}</span>
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}

                                    {/* Рядок підсумку контрагента (Підвал групи) */}
                                    <tr className="bg-[var(--border-light)]/20 font-bold border-b border-[var(--border)] text-[var(--text)] text-[10px]">
                                      <td colSpan="2" className="p-2 text-left pl-4">
                                        Обороти по {row.name}:
                                      </td>
                                      <td className="p-2 text-center text-red-600">
                                        {row.uahIssued > 0 ? `${row.uahIssued.toLocaleString('uk-UA')} грн` : ''}
                                        {row.usdIssued > 0 ? ` / $${row.usdIssued.toLocaleString('uk-UA')}` : ''}
                                        {row.uahIssued === 0 && row.usdIssued === 0 ? '—' : ''}
                                      </td>
                                      <td className="p-2 text-center text-green-600">
                                        {row.uahPaid > 0 ? `${row.uahPaid.toLocaleString('uk-UA')} грн` : ''}
                                        {row.usdPaid > 0 ? ` / $${row.usdPaid.toLocaleString('uk-UA')}` : ''}
                                        {row.uahPaid === 0 && row.usdPaid === 0 ? '—' : ''}
                                      </td>
                                      <td className="p-2 text-right font-bold whitespace-nowrap text-xs">
                                         <span className={getBalanceClass(row.uahClosing)}>{formatMoney(row.uahClosing, 'грн')}</span>
                                         <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                         <span className={getBalanceClass(row.usdClosing)}>{formatMoney(row.usdClosing)}</span>
                                       </td>
                                    </tr>
                                  </Fragment>
                                )}
                              </Fragment>
                            ))
                          )}
                          
                        </tbody>
                      </table>

                      {/* Мобільна версія (список карток) */}
                      <div className="mobile-report-cards space-y-4">
                        {trialBalanceRows.length === 0 ? (
                          <div className="p-8 text-center text-[var(--text-secondary)]">
                            Немає зареєстрованих клієнтів
                          </div>
                        ) : (
                          trialBalanceRows.map(row => (
                            <div key={row.id} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-card)]">
                              {/* Заголовок клієнта */}
                              <div 
                                className="p-3 bg-[var(--border-light)] border-b border-[var(--border)] cursor-pointer select-none"
                                onClick={() => toggleBuyerCollapsed(row.id)}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-sm text-[var(--text)] flex items-center">
                                    <span className="inline-block mr-1.5 transition-transform duration-200 text-[10px]" style={{ transform: collapsedBuyers[row.id] ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                                      ▼
                                    </span>
                                    👤 <Link to={`/buyers/${row.id}`} onClick={e => e.stopPropagation()} className="hover:underline text-blue-600 dark:text-blue-400 font-bold">{row.name}</Link>
                                  </span>
                                  {row.phone && <span className="text-[10px] text-[var(--text-secondary)]">{row.phone}</span>}
                                </div>
                                <div className="flex justify-between items-center mt-1 text-[11px]">
                                  <span className="text-[var(--text-secondary)]">Вхідне сальдо:</span>
                                  <span className="font-semibold">
                                    <span className={getBalanceClass(row.uahOpening)}>{formatMoney(row.uahOpening, 'грн')}</span>
                                    <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                    <span className={getBalanceClass(row.usdOpening)}>{formatMoney(row.usdOpening)}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Операції та підсумки по контрагенту */}
                              {!collapsedBuyers[row.id] && (
                                <Fragment>
                                  <div className="divide-y divide-[var(--border)]">
                                    {row.items.length === 0 ? (
                                      <div className="p-3 text-center text-xs text-[var(--text-secondary)] italic">
                                        Немає операцій за вказаний період
                                      </div>
                                    ) : (
                                      [...row.items].reverse().map(t => {
                                        const isIssue = t.type === 'issue';
                                        const isAdj = t.type === 'adjustment';
                                        const amt = parseFloat(t.amount) || 0;

                                        return (
                                          <div key={t.id} className="p-3 space-y-2 hover:bg-[var(--border-light)]/20 transition-colors">
                                            {/* Дата та Тип */}
                                            <div className="flex justify-between text-xs font-semibold">
                                              <span className="text-[var(--text-secondary)]">📅 {t.date}</span>
                                              <span className="text-[var(--text)]">
                                                {isIssue ? (
                                                  <span className="flex items-center gap-1.5">
                                                    {t.status === 'reserved' ? '⏳ Бронь' : '📤 Видача матеріалів'}
                                                  </span>
                                                ) : t.type === 'payment' ? '📥 Оплата' : '🔧 Коригування'}
                                              </span>
                                            </div>

                                            {/* Деталі */}
                                            {isIssue ? (
                                                <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)]/50 p-2 rounded border border-[var(--border)]/40 space-y-1">
                                                  {t.items?.map((item, idx) => {
                                                    const priceTxt = item.price !== null && item.price !== undefined && item.price !== ''
                                                      ? ` × ${item.price} ${item.currency || t.currency}`
                                                      : '';
                                                    return (
                                                      <div key={idx} className="leading-tight">
                                                        • {item.product_name} — <span className="font-semibold text-[var(--text)]">{item.quantity} {item.unit}</span>{priceTxt}
                                                      </div>
                                                    );
                                                  })}
                                                  {t.status === 'pending_price' && (
                                                    <div className="text-yellow-600 font-semibold mt-1">⚠️ (Ціна очікується)</div>
                                                  )}
                                                  {t.picked_up_by && (
                                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                                                      👤 Отримав: {t.picked_up_by}
                                                    </div>
                                                  )}
                                                  {t.comment && (
                                                    <div className="text-[10px] text-[var(--text-secondary)] italic border-t border-[var(--border)]/40 pt-1 mt-1">
                                                      Коментар: {(t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}
                                                    </div>
                                                  )}
                                                  {/* Вкладені лінковані платежі мобільна версія */}
                                                  {t.linkedPayments && t.linkedPayments.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                                      {t.linkedPayments.map((lp, lIdx) => {
                                                        const displayComment = (lp.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/, '');
                                                        const lpAmt = parseFloat(lp.amount) || 0;
                                                        const formattedLpAmt = lp.currency === 'UAH' ? `${lpAmt.toLocaleString('uk-UA')} грн` : `$${lpAmt.toLocaleString('uk-UA')}`;
                                                        const showAmt = t.linkedPayments.length > 1;
                                                        return (
                                                          <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                                            <span>💰 {displayComment} ({lp.date}){showAmt ? ` — ${formattedLpAmt}` : ''}</span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)]/50 p-2 rounded border border-[var(--border)]/40 space-y-1">
                                                  <div className="leading-tight font-medium">{(t.comment || '—').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</div>
                                                  {t.converted_amount && (
                                                    <div className="text-green-600 font-semibold text-[10px]">
                                                      Зараховано: {t.converted_amount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'USD' : 'UAH'} за курсом {t.conversion_rate}
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {/* Суми */}
                                              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] items-center">
                                                <div>
                                                  <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Нараховано</span>
                                                  <span className="text-red-500 font-bold">
                                                    {(isIssue || (isAdj && amt < 0)) && amt > 0
                                                      ? t.status === 'reserved' ? (
                                                          <span className="text-gray-400 font-normal italic" title="Резерв не списується в борг до видачі">
                                                            (${Math.abs(amt).toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'})
                                                          </span>
                                                        ) : (
                                                          `${Math.abs(amt).toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                                        )
                                                      : '—'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Сплачено</span>
                                                  <span className="text-green-600 font-bold">
                                                    {(!isIssue && !(isAdj && amt < 0)) && amt > 0
                                                      ? `${amt.toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                                      : isIssue && t.paidAmount > 0 ? (
                                                        `${t.paidAmount.toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                                      ) : '—'}
                                                  </span>
                                                </div>
                                                <div className="text-right">
                                                  <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Баланс</span>
                                                  <span className="font-bold">
                                                    <span className={getBalanceClass(t.uahRunning)}>{formatMoney(t.uahRunning, 'грн')}</span>
                                                    <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                                    <span className={getBalanceClass(t.usdRunning)}>{formatMoney(t.usdRunning)}</span>
                                                  </span>
                                                </div>
                                              </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>

                                  {/* Підсумки по контрагенту */}
                                  <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border)] text-xs font-bold space-y-1">
                                    <div className="flex justify-between items-center text-[var(--text-secondary)]">
                                      <span>Обороти:</span>
                                      <span>
                                        {row.uahIssued > 0 ? `-${row.uahIssued.toLocaleString('uk-UA')} грн` : ''}
                                        {row.usdIssued > 0 ? ` / -$${row.usdIssued.toLocaleString('uk-UA')}` : ''}
                                        {row.uahIssued === 0 && row.usdIssued === 0 ? '—' : ''}
                                        {' (вид.) | '}
                                        {row.uahPaid > 0 ? `+${row.uahPaid.toLocaleString('uk-UA')} грн` : ''}
                                        {row.usdPaid > 0 ? ` / +$${row.usdPaid.toLocaleString('uk-UA')}` : ''}
                                        {row.uahPaid === 0 && row.usdPaid === 0 ? '—' : ''}
                                        {' (спл.)'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span>Вихідне сальдо:</span>
                                       <span className="font-semibold text-xs">
                                         <span className={getBalanceClass(row.uahClosing)}>{formatMoney(row.uahClosing, 'грн')}</span>
                                         <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                         <span className={getBalanceClass(row.usdClosing)}>{formatMoney(row.usdClosing)}</span>
                                       </span>
                                     </div>
                                  </div>
                                </Fragment>
                              )}
                            </div>
                          ))
                        )}

                      </div>
                    </Fragment>
                  ) : (
                    /* ЗВЕДЕНИЙ ЗВІТ (СТАРИЙ TRIAL BALANCE) */
                    <Fragment>
                      {/* Десктопна версія (таблиця) */}
                      <table className="desktop-report-table w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] font-semibold">
                            <th className="p-2 whitespace-nowrap">Покупець</th>
                            
                            {(currencyFilter === 'ALL' || currencyFilter === 'UAH') && (
                              <>
                                <th className="p-2 text-right w-24">Вх. сальдо UAH</th>
                                <th className="p-2 text-center w-24">Видано UAH</th>
                                <th className="p-2 text-center w-24">Сплачено UAH</th>
                                <th className="p-2 text-right w-24">Вих. сальдо UAH</th>
                              </>
                            )}

                            {(currencyFilter === 'ALL' || currencyFilter === 'USD') && (
                              <>
                                <th className="p-2 text-right w-24 border-l border-[var(--border)]">Вх. сальдо USD</th>
                                <th className="p-2 text-center w-24">Видано USD</th>
                                <th className="p-2 text-center w-24">Сплачено USD</th>
                                <th className="p-2 text-right w-24">Вих. сальдо USD</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {trialBalanceRows.length === 0 ? (
                            <tr>
                              <td colSpan="9" className="p-8 text-center text-[var(--text-secondary)]">
                                Немає зареєстрованих клієнтів
                              </td>
                            </tr>
                          ) : (
                            trialBalanceRows.map(row => (
                              <tr key={row.id} className="hover:bg-[var(--border-light)] transition-colors">
                                <td className="p-2 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                  <Link to={`/buyers/${row.id}`} className="hover:underline">
                                    {row.name}
                                  </Link>
                                </td>

                                {/* UAH стовпці */}
                                {(currencyFilter === 'ALL' || currencyFilter === 'UAH') && (
                                  <>
                                    <td className={`p-2 text-right align-top ${getBalanceClass(row.uahOpening)}`}>
                                      {formatMoney(row.uahOpening, 'грн')}
                                    </td>
                                    <td className="p-2 text-center align-top text-red-500 font-medium">
                                      {row.uahIssued > 0 ? `${row.uahIssued.toLocaleString('uk-UA')} грн` : '—'}
                                    </td>
                                    <td className="p-2 text-center align-top text-green-500 font-medium">
                                      {row.uahPaid > 0 ? `${row.uahPaid.toLocaleString('uk-UA')} грн` : '—'}
                                    </td>
                                    <td className={`p-2 text-right align-top ${getBalanceClass(row.uahClosing)}`}>
                                      {formatMoney(row.uahClosing, 'грн')}
                                    </td>
                                  </>
                                )}

                                {/* USD стовпці */}
                                {(currencyFilter === 'ALL' || currencyFilter === 'USD') && (
                                  <>
                                    <td className={`p-2 text-right align-top border-l border-[var(--border)] ${getBalanceClass(row.usdOpening)}`}>
                                      {formatMoney(row.usdOpening, '$')}
                                    </td>
                                    <td className="p-2 text-center align-top text-red-500 font-medium">
                                      {row.usdIssued > 0 ? `$${row.usdIssued.toLocaleString('uk-UA')}` : '—'}
                                    </td>
                                    <td className="p-2 text-center align-top text-green-500 font-medium">
                                      {row.usdPaid > 0 ? `$${row.usdPaid.toLocaleString('uk-UA')}` : '—'}
                                    </td>
                                    <td className={`p-2 text-right align-top ${getBalanceClass(row.usdClosing)}`}>
                                      {formatMoney(row.usdClosing, '$')}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))
                          )}
                          
                        </tbody>
                      </table>

                      {/* Мобільна версія (список карток) */}
                      <div className="mobile-report-cards space-y-3">
                        {trialBalanceRows.length === 0 ? (
                          <div className="p-8 text-center text-[var(--text-secondary)]">
                            Немає зареєстрованих клієнтів
                          </div>
                        ) : (
                          trialBalanceRows.map(row => (
                            <div key={row.id} className="p-3 border border-[var(--border)] rounded-xl bg-[var(--bg-card)] space-y-2 text-xs">
                              <div className="font-bold text-sm text-[var(--text)]">
                                👤 <Link to={`/buyers/${row.id}`} className="hover:underline text-blue-600 dark:text-blue-400 font-bold">{row.name}</Link>
                              </div>
                              
                              {/* Гривня UAH */}
                              {(currencyFilter === 'ALL' || currencyFilter === 'UAH') && (
                                <div className="p-2 bg-[var(--bg)]/50 rounded border border-[var(--border)]/40 space-y-1">
                                  <div className="font-bold text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">Гривня (UAH)</div>
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                                    <div className="flex justify-between">
                                      <span className="text-[var(--text-secondary)]">Вх. сальдо:</span>
                                      <span className={getBalanceClass(row.uahOpening)}>{formatMoney(row.uahOpening, 'грн')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[var(--text-secondary)]">Видано:</span>
                                      <span className="text-red-500 font-semibold">{row.uahIssued.toLocaleString('uk-UA')} грн</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[var(--text-secondary)]">Сплачено:</span>
                                      <span className="text-green-600 font-semibold">{row.uahPaid.toLocaleString('uk-UA')} грн</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[var(--text-secondary)]">Вих. сальдо:</span>
                                      <span className={getBalanceClass(row.uahClosing)}>{formatMoney(row.uahClosing, 'грн')}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Долар USD */}
                              {(currencyFilter === 'ALL' || currencyFilter === 'USD') && (
                                <div className="p-2 bg-[var(--bg)]/50 rounded border border-[var(--border)]/40 space-y-1">
                                  <div className="font-bold text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">Долар (USD)</div>
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                                    <div className="flex justify-between">
                                      <span className="text-[var(--text-secondary)]">Вх. сальдо:</span>
                                      <span className={getBalanceClass(row.usdOpening)}>{formatMoney(row.usdOpening, '$')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[var(--text-secondary)]">Видано:</span>
                                      <span className="text-red-500 font-semibold">${row.usdIssued.toLocaleString('uk-UA')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[var(--text-secondary)]">Сплачено:</span>
                                      <span className="text-green-600 font-semibold">${row.usdPaid.toLocaleString('uk-UA')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[var(--text-secondary)]">Вих. сальдо:</span>
                                      <span className={getBalanceClass(row.usdClosing)}>{formatMoney(row.usdClosing, '$')}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}

                      </div>
                    </Fragment>
                  )}
                </div>
              </div>
            )}

            {/* Вкладка 2: Загальний журнал */}
            {activeTab === 'journal' && (
              <div className="card border border-[var(--border)] bg-[var(--bg-card)] rounded-xl overflow-hidden p-4">
                <div className="text-center mb-6">
                  <h2 className="text-base md:text-lg font-bold text-[var(--text)] uppercase">
                    Загальний журнал взаєморозрахунків
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    за період з <b>{dateFrom}</b> по <b>{dateTo}</b>
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <Fragment>
                    {/* Десктопна версія (таблиця) */}
                    <table className="desktop-report-table w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] font-semibold">
                          <th className="p-2 w-28 whitespace-nowrap">Дата</th>
                          <th className="p-2 whitespace-nowrap">Покупець</th>
                          <th className="p-2 w-32">Тип документа</th>
                          <th className="p-2">Деталі (коментар / товари)</th>
                          <th className="p-2 text-center w-28">Нараховано</th>
                          <th className="p-2 text-center w-28">Сплачено</th>
                          <th className="p-2 w-20 text-right no-print">Дії</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filteredJournalTransactions.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-[var(--text-secondary)]">
                              Немає операцій за вказаний період
                            </td>
                          </tr>
                        ) : (
                          filteredJournalTransactions.map(t => {
                            const isIssue = t.type === 'issue';
                            const isAdj = t.type === 'adjustment';
                            const amt = parseFloat(t.amount) || 0;

                            return (
                              <tr key={t.id} className="hover:bg-[var(--border-light)] transition-colors">
                                <td className="p-2 align-top whitespace-nowrap">{t.date}</td>
                                <td className="p-2 align-top font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                  <Link to={`/buyers/${t.buyer_id}`} className="hover:underline">
                                    {t.buyer_name || buyers.find(b => b.id === t.buyer_id)?.name || '—'}
                                  </Link>
                                </td>
                                <td className="p-2 align-top font-semibold text-[var(--text)]">
                                  {isIssue ? '📤 Видача товарів' : t.type === 'payment' ? '📥 Оплата' : '🔧 Коригування'}
                                  {t.status === 'pending_price' && (
                                    <span className="text-[9px] font-bold text-yellow-600 bg-yellow-500/10 px-1 rounded ml-1">
                                      без ціни
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 align-top">
                                  {isIssue ? (
                                    <div className="space-y-0.5">
                                      <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5">
                                        {t.items?.map((item, idx) => {
                                          const priceTxt = item.price !== null && item.price !== undefined && item.price !== ''
                                            ? ` × ${item.price} ${item.currency || t.currency}`
                                            : '';
                                          return (
                                            <div key={idx} className="leading-tight">
                                              • {item.product_name} — <span className="font-semibold text-[var(--text)]">{item.quantity} {item.unit}</span>{priceTxt}
                                            </div>
                                          );
                                        })}
                                        {t.status === 'pending_price' && (
                                          <div className="text-yellow-600 font-semibold mt-1">⚠️ (Ціна очікується)</div>
                                        )}
                                      </div>
                                      {t.comment && (
                                        <div className="text-[10px] text-[var(--text-secondary)] italic mt-1">Коментар: {(t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</div>
                                      )}
                                      {/* Вкладені лінковані платежі */}
                                      {t.linkedPayments && t.linkedPayments.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                          {t.linkedPayments.map((lp, lIdx) => {
                                            const displayComment = (lp.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/, '');
                                            const lpAmt = parseFloat(lp.amount) || 0;
                                            const formattedLpAmt = lp.currency === 'UAH' ? `${lpAmt.toLocaleString('uk-UA')} грн` : `$${lpAmt.toLocaleString('uk-UA')}`;
                                            const showAmt = t.linkedPayments.length > 1;
                                            return (
                                              <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                                <span>💰 {displayComment} ({lp.date}){showAmt ? ` — ${formattedLpAmt}` : ''}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="font-medium text-[var(--text)] block">{(t.comment || '—').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</span>
                                      {t.converted_amount && (
                                        <span className="text-[10px] text-green-600 block mt-0.5">
                                          Зараховано: {t.converted_amount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'USD' : 'UAH'} за курсом {t.conversion_rate}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="p-2 text-center align-top text-red-500 font-medium">
                                  {((isIssue && amt > 0) || (isAdj && amt < 0)) ? (
                                    `${Math.abs(amt).toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                  ) : '—'}
                                </td>
                                <td className="p-2 text-center align-top text-green-500 font-medium">
                                  {((t.type === 'payment' && amt > 0) || (isAdj && amt > 0)) ? (
                                    `${amt.toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                  ) : isIssue && t.paidAmount > 0 ? (
                                    `${t.paidAmount.toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                  ) : '—'}</td>
                                <td className="p-2 text-right align-top no-print">
                                  <div className="flex justify-end gap-1.5">
                                    {isIssue && (
                                      <button 
                                        onClick={() => startEdit(t)} 
                                        className="text-amber-500 hover:bg-amber-500/10 px-1 py-0.5 rounded text-[10px]"
                                        title="Редагувати"
                                      >
                                        ✏️
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => handleDeleteTransaction(t.id)} 
                                      className="text-red-500 hover:bg-red-500/10 px-1 py-0.5 rounded text-[10px]"
                                      title="Видалити"
                                    >
                                      ❌
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    {/* Мобільна версія (список карток) */}
                    <div className="mobile-report-cards space-y-3">
                      {filteredJournalTransactions.length === 0 ? (
                        <div className="p-8 text-center text-[var(--text-secondary)]">
                          Немає операцій за вказаний період
                        </div>
                      ) : (
                        filteredJournalTransactions.map(t => {
                          const isIssue = t.type === 'issue';
                          const isAdj = t.type === 'adjustment';
                          const amt = parseFloat(t.amount) || 0;
                          const buyerName = t.buyer_name || buyers.find(b => b.id === t.buyer_id)?.name || '—';

                          return (
                            <div key={t.id} className="p-3 border border-[var(--border)] rounded-xl bg-[var(--bg-card)] space-y-2 text-xs">
                              {/* Шапка: дата та тип */}
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-[var(--text-secondary)]">📅 {t.date}</span>
                                <span className="text-[var(--text)] font-bold">
                                  {isIssue ? '📤 Видача товарів' : t.type === 'payment' ? '📥 Оплата' : '🔧 Коригування'}
                                </span>
                              </div>

                              {/* Покупець */}
                              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                👤 <Link to={`/buyers/${t.buyer_id}`} className="hover:underline">{buyerName}</Link>
                              </div>

                              {/* Деталі */}
                              {isIssue ? (
                                  <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)]/50 p-2 rounded border border-[var(--border)]/40 space-y-1">
                                    {t.items?.map((item, idx) => {
                                      const priceTxt = item.price !== null && item.price !== undefined && item.price !== ''
                                        ? ` × ${item.price} ${item.currency || t.currency}`
                                        : '';
                                      return (
                                        <div key={idx} className="leading-tight">
                                          • {item.product_name} — <span className="font-semibold text-[var(--text)]">{item.quantity} {item.unit}</span>{priceTxt}
                                        </div>
                                      );
                                    })}
                                    {t.status === 'pending_price' && (
                                      <div className="text-yellow-600 font-semibold mt-1">⚠️ (Ціна очікується)</div>
                                    )}
                                    {t.comment && (
                                      <div className="text-[10px] text-[var(--text-secondary)] italic border-t border-[var(--border)]/40 pt-1 mt-1">
                                        Коментар: {(t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}
                                      </div>
                                    )}
                                    {/* Вкладені лінковані платежі мобільна версія */}
                                    {t.linkedPayments && t.linkedPayments.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                        {t.linkedPayments.map((lp, lIdx) => {
                                          const displayComment = (lp.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/, '');
                                          const lpAmt = parseFloat(lp.amount) || 0;
                                          const formattedLpAmt = lp.currency === 'UAH' ? `${lpAmt.toLocaleString('uk-UA')} грн` : `$${lpAmt.toLocaleString('uk-UA')}`;
                                          const showAmt = t.linkedPayments.length > 1;
                                          return (
                                            <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                              <span>💰 {displayComment} ({lp.date}){showAmt ? ` — ${formattedLpAmt}` : ''}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)]/50 p-2 rounded border border-[var(--border)]/40 space-y-1">
                                    <div className="leading-tight font-medium">{(t.comment || '—').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</div>
                                    {t.converted_amount && (
                                      <div className="text-green-600 font-semibold text-[10px]">
                                        Зараховано: {t.converted_amount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'USD' : 'UAH'} за курсом {t.conversion_rate}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Суми та дії */}
                                <div className="flex justify-between items-center pt-1 border-t border-[var(--border)]/40 text-[11px]">
                                  <div className="flex gap-4">
                                    <div>
                                      <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Нараховано</span>
                                      <span className="text-red-500 font-bold">
                                        {(isIssue || (isAdj && amt < 0)) && amt > 0
                                          ? `${Math.abs(amt).toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                          : '—'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Сплачено</span>
                                      <span className="text-green-600 font-bold">
                                        {(!isIssue && !(isAdj && amt < 0)) && amt > 0
                                          ? `${amt.toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                          : isIssue && t.paidAmount > 0 ? (
                                            `${t.paidAmount.toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                          ) : '—'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Fragment>
                </div>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
