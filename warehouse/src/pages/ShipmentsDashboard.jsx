import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getShipments, getShipmentSenders, deleteShipment, batchDeleteShipments, toggleShipmentArchive } from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ShipmentConfirmModal from '../components/ShipmentConfirmModal';
import ShipmentPaymentModal from '../components/ShipmentPaymentModal';
import ShipmentPrintModal from '../components/ShipmentPrintModal';
import { Plus, Search, Filter, Truck, DollarSign, Eye, CheckSquare, Square, RefreshCw, Pencil, Printer, Trash2, Archive, ArchiveRestore } from 'lucide-react';

export default function ShipmentsDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({});
  const [senders, setSenders] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [senderFilter, setSenderFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-select state (for batch operations)
  const [selectedIds, setSelectedIds] = useState([]);

  // Active Modals
  const [confirmModalData, setConfirmModalData] = useState({ isOpen: false, shipment: null, isBatch: false });
  const [paymentModalData, setPaymentModalData] = useState({ isOpen: false, shipment: null, isBatch: false });
  const [printModalData, setPrintModalData] = useState({ isOpen: false, shipments: [] });

  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadData();
    loadSenders();
  }, [statusFilter, senderFilter, paymentFilter]);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getShipments({
        status: statusFilter,
        senderId: senderFilter,
        paymentMethod: paymentFilter,
        search: searchQuery
      });

      if (res.success) {
        setShipments(res.shipments || []);
        setStats(res.stats || {});
      } else {
        setLoadError(res.error);
        showToast(res.error || "Помилка завантаження відправлень", "error");
      }
    } catch (err) {
      console.error("Failed to load shipments:", err);
      showToast("Помилка підключення до сервера", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadSenders() {
    try {
      const res = await getShipmentSenders();
      if (res.success) setSenders(res.senders || []);
    } catch (err) {
      console.warn("Failed to load senders:", err);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadData();
  }

  // Checkbox handlers
  function toggleSelectAll() {
    if (selectedIds.length === shipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(shipments.map(s => s.id));
    }
  }

  function toggleSelectOne(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }

  async function handleDeleteSingle(ship) {
    if (!window.confirm(`Ви дійсно бажаєте безповоротно видалити відправлення для "${ship.client_name}"?`)) {
      return;
    }
    try {
      const res = await deleteShipment(ship.id, user);
      if (res.success) {
        showToast('Відправлення успішно видалено', 'success');
        setSelectedIds(prev => prev.filter(id => id !== ship.id));
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Помилка видалення відправлення', 'error');
    }
  }

  async function handleDeleteBatch() {
    if (!window.confirm(`Ви дійсно бажаєте безповоротно видалити ${selectedIds.length} вибраних відправлень?`)) {
      return;
    }
    try {
      const res = await batchDeleteShipments(selectedIds, user);
      if (res.success) {
        showToast(`Успішно видалено ${res.count} відправлень`, 'success');
        setSelectedIds([]);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Помилка масового видалення', 'error');
    }
  }

  async function handleToggleArchive(ship, shouldArchive) {
    try {
      const res = await toggleShipmentArchive(ship.id, shouldArchive, user);
      if (res.success) {
        showToast(shouldArchive ? 'Відправлення перенесено в архів' : 'Відправлення повернуто з архіву', 'success');
        setSelectedIds(prev => prev.filter(id => id !== ship.id));
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Помилка зміни статусу архіву', 'error');
    }
  }

  const selectedShipments = shipments.filter(s => selectedIds.includes(s.id));

  const statusBadges = {
    reserved: { label: 'Бронь', bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200' },
    shipped: { label: 'Відправлено', bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200' },
    paid: { label: 'Оплачено', bg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200' },
    cancelled: { label: 'Скасовано', bg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-200' }
  };

  const paymentMethodLabels = {
    cod: '📦 Оплата при отриманні',
    kit_group: '🐱 КИТ Group',
    cash: '💵 Готівка'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🚚 Відправлення товарів
          </h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Облік разових відправок Новою поштою, бронь складів, ТТН та контроль оплат
          </p>
        </div>

        <button
          onClick={() => navigate('/shipments/new')}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Нове Відправлення
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-neutral-400 uppercase font-semibold">Загальний борг UAH</div>
          <div className="text-xl font-extrabold text-primary mt-1">
            {(stats.totalDebtUah || 0).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ₴
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-neutral-400 uppercase font-semibold">Загальний борг USD</div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {(stats.totalDebtUsd || 0).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} $
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-neutral-400 uppercase font-semibold">Всього Бронь</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.reservedCount || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-neutral-400 uppercase font-semibold">Відправлено (Очікує оплати)</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.shippedCount || 0}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-neutral-700 pb-3">
          {[
            { id: 'ALL', label: 'Усі відправлення' },
            { id: 'reserved', label: `🟡 Бронь (${stats.reservedCount || 0})` },
            { id: 'shipped', label: `🔵 Відправлено (${stats.shippedCount || 0})` },
            { id: 'paid', label: `🟢 Оплачено (${stats.paidCount || 0})` },
            { id: 'cancelled', label: `🔴 Скасовано (${stats.cancelledCount || 0})` },
            { id: 'ARCHIVED', label: `📦 Архів (${stats.archivedCount || 0})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Select Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук по ПІБ, телефону, ТТН, адресі..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-200 rounded-xl text-xs font-semibold"
            >
              Шукати
            </button>
          </form>

          <div className="flex items-center gap-2">
            {/* Sender Filter */}
            <select
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="ALL">Всі відправники</option>
              {senders.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="ALL">Всі способи оплати</option>
              <option value="cod">📦 Оплата при отриманні</option>
              <option value="kit_group">🐱 КИТ Group</option>
              <option value="cash">💵 Готівка</option>
            </select>

            <button
              onClick={loadData}
              className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
              title="Оновити список"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Supabase Error Alert if SQL script not run */}
      {loadError && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 rounded-2xl text-sm flex items-start gap-3 shadow-sm">
          <div className="text-xl flex-shrink-0">⚠️</div>
          <div>
            <strong className="block font-bold">Необхідно налаштувати таблиці в Supabase</strong>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
              {loadError}
            </p>
          </div>
        </div>
      )}

      {/* Batch Operations Bar (When items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <CheckSquare className="text-primary" size={20} />
            Обрано відправлень: <span className="text-primary text-base">{selectedIds.length}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setConfirmModalData({ isOpen: true, shipment: null, isBatch: true })}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Truck size={16} />
              🚀 Масове підтвердження відправки
            </button>

            <button
              onClick={() => setPaymentModalData({ isOpen: true, shipment: null, isBatch: true })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <DollarSign size={16} />
              💳 Масове підтвердження оплати
            </button>

            <button
              onClick={() => setPrintModalData({ isOpen: true, shipments: selectedShipments })}
              className="px-4 py-2 bg-gray-800 dark:bg-neutral-700 hover:bg-gray-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Printer size={16} />
              🖨️ Друк реєстру відправки ({selectedShipments.length})
            </button>

            <button
              onClick={handleDeleteBatch}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Trash2 size={16} />
              🗑️ Видалити відправлення ({selectedShipments.length})
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-xl"
            >
              Скасувати вибір
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-neutral-400">
            <div className="spinner mx-auto mb-3" />
            Завантаження відправлень...
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-neutral-400 space-y-3">
            <div className="text-3xl">📦</div>
            <div className="font-semibold">Відправлень не знайдено</div>
            <p className="text-xs">Створіть перше відправлення клієнту за допомогою кнопки вище</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-700/50 border-b border-gray-200 dark:border-neutral-700 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-gray-400 hover:text-primary"
                    >
                      {selectedIds.length === shipments.length ? (
                        <CheckSquare size={18} className="text-primary" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Статус</th>
                  <th className="py-3 px-3">Клієнт / Телефон</th>
                  <th className="py-3 px-3">Адреса відправки</th>
                  <th className="py-3 px-3">ТТН & Перевізник</th>
                  <th className="py-3 px-3">Від кого</th>
                  <th className="py-3 px-3 text-right">Сума / Борг</th>
                  <th className="py-3 px-3">Оплата</th>
                  <th className="py-3 px-3 text-center">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                {shipments.map(ship => {
                  const badge = statusBadges[ship.status] || statusBadges.reserved;
                  const isSelected = selectedIds.includes(ship.id);

                  return (
                    <tr
                      key={ship.id}
                      className={`hover:bg-gray-50/80 dark:hover:bg-neutral-700/40 transition-colors ${
                        isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(ship.id)}
                          className="text-gray-400 hover:text-primary"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-3">
                        <div className="text-[10px] text-gray-500 font-mono font-bold uppercase">
                          {ship.shipment_number || `№ ${ship.id.slice(0, 8)}`}
                        </div>
                        <Link
                          to={`/shipments/${ship.id}`}
                          className="font-bold text-gray-900 dark:text-white hover:text-primary transition-colors block"
                        >
                          {ship.client_name}
                        </Link>
                        {ship.client_phone && (
                          <div className="text-xs text-gray-500 dark:text-neutral-400">
                            {ship.client_phone}
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3 px-3 max-w-[200px] truncate text-xs text-gray-600 dark:text-neutral-300" title={ship.shipping_address}>
                        {ship.shipping_address || '—'}
                      </td>

                      {/* TTN & Carrier */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          {ship.carrier === 'Самовивіз' || ship.carrier === 'pickup' || ship.ttn === 'Самовивіз' ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md w-fit">
                                🚗 Самовивіз
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-neutral-400 font-semibold block">
                                Зі склада
                              </span>
                            </>
                          ) : ship.ttn ? (
                            <>
                              <strong className="font-mono text-xs font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap block">
                                {ship.ttn}
                              </strong>
                              <span className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase block font-semibold">
                                {ship.carrier || 'Нова Пошта'}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-amber-600 dark:text-amber-400 italic block font-medium">
                                Очікує ТТН
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-neutral-500 uppercase block font-semibold">
                                {ship.carrier || 'Нова Пошта'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Sender */}
                      <td className="py-3 px-3 text-xs text-gray-700 dark:text-neutral-300">
                        {ship.sender_name || '—'}
                      </td>

                      {/* Amount / Debt */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-gray-900 dark:text-white text-xs">
                          {ship.total_amount} {ship.currency}
                        </div>
                        {parseFloat(ship.debt_amount) > 0 ? (
                          <div className={`text-xs font-black flex items-center justify-end gap-1 mt-0.5 ${
                            ship.status === 'shipped' 
                              ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded-md border border-red-200 dark:border-red-800' 
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {ship.status === 'shipped' && <span className="animate-pulse">🔴</span>}
                            Борг: {ship.debt_amount} {ship.currency}
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            ✓ Оплачено
                          </div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-neutral-300">
                        {paymentMethodLabels[ship.payment_method] || ship.payment_method}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {ship.status === 'reserved' && (
                            <button
                              onClick={() => setConfirmModalData({ isOpen: true, shipment: ship, isBatch: false })}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                              title={ship.carrier === 'Самовивіз' || ship.carrier === 'pickup' ? "Підтвердити видачу товару (Самовивіз)" : "Підтвердити відправку"}
                            >
                              <Truck size={16} />
                            </button>
                          )}

                          {parseFloat(ship.debt_amount) > 0 && ship.status !== 'cancelled' && (
                            <button
                              onClick={() => setPaymentModalData({ isOpen: true, shipment: ship, isBatch: false })}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Підтвердити оплату"
                            >
                              <DollarSign size={16} />
                            </button>
                          )}

                          <Link
                            to={`/shipments/edit/${ship.id}`}
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                            title="Редагувати накладну"
                          >
                            <Pencil size={16} />
                          </Link>

                          <button
                            onClick={() => setPrintModalData({ isOpen: true, shipments: [ship] })}
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                            title="Друк накладної"
                          >
                            <Printer size={16} />
                          </button>

                          <Link
                            to={`/shipments/${ship.id}`}
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                            title="Деталі відправлення"
                          >
                            <Eye size={16} />
                          </Link>

                          {ship.is_archived ? (
                            <button
                              onClick={() => handleToggleArchive(ship, false)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Розархівувати (повернути з архіву)"
                            >
                              <ArchiveRestore size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleArchive(ship, true)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                              title="Перенести в архів"
                            >
                              <Archive size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSingle(ship)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Видалити відправлення"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Dispatch Modal */}
      {confirmModalData.isOpen && (
        <ShipmentConfirmModal
          shipment={confirmModalData.shipment}
          isBatch={confirmModalData.isBatch}
          selectedShipments={selectedShipments}
          onClose={() => setConfirmModalData({ isOpen: false, shipment: null, isBatch: false })}
          onSuccess={() => {
            setConfirmModalData({ isOpen: false, shipment: null, isBatch: false });
            setSelectedIds([]);
            loadData();
          }}
        />
      )}

      {/* Confirm Payment Modal */}
      {paymentModalData.isOpen && (
        <ShipmentPaymentModal
          shipment={paymentModalData.shipment}
          isBatch={paymentModalData.isBatch}
          selectedIds={selectedIds}
          onClose={() => setPaymentModalData({ isOpen: false, shipment: null, isBatch: false })}
          onSuccess={() => {
            setPaymentModalData({ isOpen: false, shipment: null, isBatch: false });
            setSelectedIds([]);
            loadData();
          }}
        />
      )}

      {/* Printable Waybills Modal */}
      {printModalData.isOpen && (
        <ShipmentPrintModal
          shipments={printModalData.shipments}
          onClose={() => setPrintModalData({ isOpen: false, shipments: [] })}
        />
      )}
    </div>
  );
}
