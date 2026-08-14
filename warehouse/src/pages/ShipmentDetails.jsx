import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShipmentById, cancelShipment, deleteShipment } from '../api/gasApi';
import { trackTtn } from '../api/novaPoshtaApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ShipmentConfirmModal from '../components/ShipmentConfirmModal';
import ShipmentPaymentModal from '../components/ShipmentPaymentModal';
import ShipmentPrintModal from '../components/ShipmentPrintModal';
import { DocumentGeneratorModal } from '../components/DocumentGeneratorModal';
import { ArrowLeft, Truck, DollarSign, RotateCcw, Calendar, User, MapPin, Package, Pencil, Printer, Trash2, RefreshCw, FileText, Shield } from 'lucide-react';

export default function ShipmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shipmentData, setShipmentData] = useState(null);

  // Live Nova Poshta Tracking State
  const [npLiveStatus, setNpLiveStatus] = useState(null);
  const [npLoading, setNpLoading] = useState(false);
  const [npError, setNpError] = useState(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDocGenerator, setShowDocGenerator] = useState(false);
  const [docModalType, setDocModalType] = useState('warranty');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadShipment();
  }, [id]);

  async function loadShipment() {
    setLoading(true);
    try {
      const res = await getShipmentById(id);
      if (res.success) {
        setShipmentData(res);
        if (res.shipment?.ttn && res.shipment.ttn !== 'Самовивіз') {
          fetchLiveTracking(res.shipment.ttn, res.shipment.client_phone);
        }
      } else {
        showToast("Не вдалося завантажити деталі відправлення", "error");
      }
    } catch (err) {
      console.error("Failed to fetch shipment details:", err);
      showToast("Помилка завантаження даних", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLiveTracking(ttn, phone) {
    if (!ttn || ttn === 'Самовивіз' || ttn.length < 10) return;
    setNpLoading(true);
    setNpError(null);
    try {
      const res = await trackTtn(ttn, phone);
      if (res.success) {
        setNpLiveStatus(res);
      }
    } catch (err) {
      setNpError(err.message || 'Не вдалося завантажити статус з НП');
    } finally {
      setNpLoading(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Ви дійсно бажаєте скасувати відправлення? Бронь буде знято / списані товари повернуто на склад.")) {
      return;
    }
    const reason = window.prompt("Вкажіть причину скасування (необов'язково):");
    setCancelling(true);
    try {
      const res = await cancelShipment(id, reason || '', user);
      if (res.success) {
        showToast("Відправлення скасовано, товарам повернено статус вільних", "success");
        loadShipment();
      }
    } catch (err) {
      showToast(err.message || "Помилка скасування відправлення", "error");
    } finally {
      setCancelling(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Ви дійсно бажаєте безповоротно видалити це відправлення разом із його товарами та операціями?")) {
      return;
    }
    try {
      const res = await deleteShipment(id, user);
      if (res.success) {
        showToast("Відправлення успішно видалено", "success");
        navigate('/shipments');
      }
    } catch (err) {
      showToast(err.message || "Помилка видалення відправлення", "error");
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-neutral-400">
        <div className="spinner mx-auto mb-3" />
        Завантаження деталей...
      </div>
    );
  }

  if (!shipmentData || !shipmentData.shipment) {
    return (
      <div className="p-8 text-center text-red-500">
        Відправлення не знайдено.
      </div>
    );
  }

  const { shipment, items, payments, auditLogs = [] } = shipmentData;

  const statusBadges = {
    reserved: { label: 'Бронь', bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300' },
    shipped: { label: 'Відправлено', bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300' },
    paid: { label: 'Оплачено', bg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300' },
    cancelled: { label: 'Скасовано', bg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-300' }
  };

  const currentBadge = statusBadges[shipment.status] || statusBadges.reserved;

  const paymentMethodLabels = {
    cod: '📦 Оплата при отриманні',
    kit_group: '🐱 КИТ Group',
    cash: '💵 Готівка'
  };

  // Складаємо повну хронологічну історію всіх операцій відправлення
  const timelineEvents = [];

  if (shipment.created_at) {
    timelineEvents.push({
      id: 'created',
      date: shipment.created_at,
      icon: '📝',
      title: 'Створення відправлення (Бронь)',
      description: `Створено картку накладної для клієнта: ${shipment.client_name}. Сума: ${shipment.total_amount} ${shipment.currency}`,
      badge: 'Бронь',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
    });
  }

  if (shipment.shipped_at) {
    timelineEvents.push({
      id: 'shipped',
      date: shipment.shipped_at,
      icon: '🚚',
      title: 'Підтвердження відправки & ТТН',
      description: `Відправлено перевізником "${shipment.carrier || 'Нова Пошта'}". Внесено ТТН: ${shipment.ttn || 'без ТТН'}. Товари відписано зі складу.`,
      badge: 'Відправлено',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
    });
  }

  (payments || []).forEach(p => {
    timelineEvents.push({
      id: `payment_${p.id}`,
      date: p.created_at,
      icon: '💳',
      title: p.type === 'advance' ? 'Находження авансу' : 'Підтвердження оплати',
      description: `Отримано коштів: +${p.amount} ${p.currency} (${paymentMethodLabels[p.payment_method] || p.payment_method})${p.comment ? ` — ${p.comment}` : ''}`,
      badge: `+${p.amount} ${p.currency}`,
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold'
    });
  });

  (auditLogs || []).forEach(log => {
    if (log.action_type === 'UPDATE' || log.action_type === 'CANCEL') {
      timelineEvents.push({
        id: `audit_${log.id}`,
        date: log.created_at,
        icon: log.action_type === 'CANCEL' ? '🔄' : '✏️',
        title: log.entity_title || 'Зміна відправлення',
        description: `Оператор: ${log.user_name || log.user_email || 'Оператор'}. ${log.details?.comment || ''}`,
        badge: log.action_type,
        badgeBg: 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300'
      });
    }
  });

  timelineEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-700 pb-4">
        <button
          onClick={() => navigate('/shipments')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
          Назад до відправлень
        </button>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentBadge.bg}`}>
            {currentBadge.label}
          </span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {shipment.shipment_number || `Відправлення #${shipment.id.slice(0, 8)}`}
          </h1>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700">
        {shipment.status === 'reserved' && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Truck size={18} />
            Підтвердити відправку & ТТН
          </button>
        )}

        {parseFloat(shipment.debt_amount) > 0 && shipment.status !== 'cancelled' && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <DollarSign size={18} />
            Внести оплату ({shipment.debt_amount} {shipment.currency})
          </button>
        )}

        <button
          onClick={() => navigate(`/shipments/edit/${shipment.id}`)}
          className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-neutral-200 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-xl transition-all flex items-center gap-2"
        >
          <Pencil size={16} />
          Редагувати
        </button>

        <button
          onClick={() => setShowPrintModal(true)}
          className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-neutral-200 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-xl transition-all flex items-center gap-2"
        >
          <Printer size={16} />
          Друк накладної
        </button>

        <button
          onClick={handleDelete}
          className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center gap-2"
          title="Безповоротно видалити відправлення"
        >
          <Trash2 size={16} />
          Видалити
        </button>

        {shipment.status !== 'cancelled' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors flex items-center gap-2 ml-auto"
          >
            <RotateCcw size={16} />
            {cancelling ? 'Скасування...' : 'Скасувати / Повернення'}
          </button>
        )}
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Card */}
        <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <User size={16} />
            Клієнт та Отримувач
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="text-base font-bold text-gray-900 dark:text-white">
              {shipment.client_name}
            </div>
            {shipment.client_phone && (
              <div className="text-gray-600 dark:text-neutral-300 flex items-center gap-2">
                <span>📞</span> {shipment.client_phone}
              </div>
            )}
            {shipment.shipping_address && (
              <div className="text-gray-600 dark:text-neutral-300 flex items-start gap-2 pt-1">
                <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span>{shipment.shipping_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Details Card */}
        <div className="bg-white dark:bg-neutral-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <Truck size={16} />
            Деталі відправки
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Від кого відправлено:</span>
              <strong className="text-gray-900 dark:text-white">{shipment.sender_name || '—'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Перевізник:</span>
              <span>{shipment.carrier || 'Нова Пошта'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-neutral-400">№ ТТН:</span>
              <div className="text-right">
                <strong className="font-mono text-primary text-base block">{shipment.ttn || 'Ще не внесено'}</strong>
                {!shipment.ttn && (shipment.carrier || 'Нова Пошта') === 'Нова Пошта' && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 italic block mt-0.5">
                    (Після внесення ТТН увімкнеться живий трекінг НП)
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Спосіб оплати:</span>
              <span>{paymentMethodLabels[shipment.payment_method] || shipment.payment_method}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>Створено:</span>
              <span>{new Date(shipment.created_at).toLocaleString('uk-UA')} ({shipment.user_name || 'Оператор'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Nova Poshta Tracking Widget Box (Visible ONLY when TTN exists) */}
      {shipment.ttn && shipment.ttn !== 'Самовивіз' && (
        <div className="bg-gradient-to-br from-red-50 to-amber-50 dark:from-neutral-800 dark:to-neutral-900 p-5 rounded-2xl border border-red-200 dark:border-neutral-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-red-900 dark:text-red-300 uppercase tracking-wider flex items-center gap-2">
              <Truck size={18} className="text-red-600" />
              📡 Живий статус Нової Пошти (ТТН: <span className="font-mono">{shipment.ttn}</span>)
            </h3>
            <button
              onClick={() => fetchLiveTracking(shipment.ttn, shipment.client_phone)}
              disabled={npLoading}
              className="text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-neutral-700 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200 dark:border-neutral-600"
            >
              <RefreshCw size={14} className={npLoading ? 'animate-spin' : ''} />
              Оновити
            </button>
          </div>

          {npLoading ? (
            <div className="py-4 text-center text-xs font-semibold text-gray-500 dark:text-neutral-400 animate-pulse">
              Отримання статусу з Нової Пошти...
            </div>
          ) : npError ? (
            <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200">
              ⚠️ {npError}
            </div>
          ) : npLiveStatus ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-red-100 dark:border-neutral-700 shadow-sm space-y-1">
                <div className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-base">
                    {npLiveStatus.statusGroup === 'DELIVERED' ? '🟢' : npLiveStatus.statusGroup === 'ARRIVED' ? '📍' : npLiveStatus.statusGroup === 'REFUSED' ? '🔴' : '🚚'}
                  </span>
                  {npLiveStatus.statusText}
                </div>
                {(npLiveStatus.cityRecipient || npLiveStatus.warehouseRecipient) && (
                  <div className="text-gray-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 pt-0.5">
                    <span>📍</span>
                    <span>
                      <strong>Пункт призначення:</strong> {npLiveStatus.cityRecipient ? `${npLiveStatus.cityRecipient}` : ''}
                      {npLiveStatus.warehouseRecipient ? ` (${npLiveStatus.warehouseRecipient})` : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap md:flex-nowrap gap-2 text-[11px]">
                {npLiveStatus.actualDeliveryDate ? (
                  <div className="flex-1 min-w-[130px] bg-white dark:bg-neutral-800 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                    <span className="text-emerald-600 dark:text-emerald-400 block font-semibold">🟢 Вручено:</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
                      {npLiveStatus.actualDeliveryDate.replace(/\s*\d{2}:\d{2}:\d{2}$/, '')}
                    </strong>
                  </div>
                ) : npLiveStatus.scheduledDeliveryDate ? (
                  <div className="flex-1 min-w-[130px] bg-white dark:bg-neutral-800 p-2 rounded-xl border border-gray-200 dark:border-neutral-700">
                    <span className="text-gray-400 block font-semibold">📅 Доставка:</span>
                    <strong className="text-gray-900 dark:text-white font-bold">
                      {npLiveStatus.scheduledDeliveryDate.replace(/\s*\d{2}:\d{2}:\d{2}$/, '')}
                    </strong>
                  </div>
                ) : null}

                {npLiveStatus.documentCost && (
                  <div className="flex-1 min-w-[110px] bg-white dark:bg-neutral-800 p-2 rounded-xl border border-gray-200 dark:border-neutral-700">
                    <span className="text-gray-400 block font-semibold">💰 Вартість:</span>
                    <strong className="text-blue-600 dark:text-blue-400 font-bold">{npLiveStatus.documentCost} ₴</strong>
                  </div>
                )}

                {npLiveStatus.documentWeight && (
                  <div className="flex-1 min-w-[90px] bg-white dark:bg-neutral-800 p-2 rounded-xl border border-gray-200 dark:border-neutral-700">
                    <span className="text-gray-400 block font-semibold">⚖️ Вага:</span>
                    <strong className="text-gray-800 dark:text-neutral-200 font-bold">{npLiveStatus.documentWeight} кг</strong>
                  </div>
                )}

                {npLiveStatus.redeliverySum && parseFloat(npLiveStatus.redeliverySum) > 0 && (
                  <div className="flex-1 min-w-[110px] bg-white dark:bg-neutral-800 p-2 rounded-xl border border-gray-200 dark:border-neutral-700">
                    <span className="text-gray-400 block font-semibold">💵 Післяплата:</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-bold">{npLiveStatus.redeliverySum} ₴</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">
              Натисніть кнопку «Оновити», щоб завантажити стан ТТН з Нової Пошти.
            </div>
          )}
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Package size={18} />
          Специфікація товарів ({items.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-neutral-700 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase">
                <th className="py-2.5 px-3">Товар / ID</th>
                <th className="py-2.5 px-3">Склад</th>
                <th className="py-2.5 px-3 text-right">Кількість</th>
                <th className="py-2.5 px-3 text-right">Ціна</th>
                <th className="py-2.5 px-3 text-right">Сума</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">
                    {item.product_name || item.product_id}
                  </td>
                  <td className="py-3 px-3 text-gray-600 dark:text-neutral-300 font-medium">
                    {item.warehouse_name || item.warehouse_id}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white">
                    {item.quantity} шт
                  </td>
                  <td className="py-3 px-3 text-right text-gray-600 dark:text-neutral-300">
                    {item.price} {shipment.currency}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white">
                    {(parseFloat(item.quantity) * parseFloat(item.price)).toFixed(2)} {shipment.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Document Printing Bar */}
        <div className="pt-4 border-t border-gray-100 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
            <FileText size={16} className="text-primary" />
            Формування офіційних складських документів:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setDocModalType('warranty');
                setShowDocGenerator(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Shield size={15} className="text-amber-600" />
              🛡️ Друк Гарантії
            </button>

            <button
              onClick={() => {
                setDocModalType('expense');
                setShowDocGenerator(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Package size={15} className="text-blue-600" />
              📋 Видаткова накладна
            </button>

            <button
              onClick={() => {
                setDocModalType('all');
                setShowDocGenerator(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-neutral-200 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={15} />
              📄 Всі документи / Друк...
            </button>
          </div>
        </div>
      </div>

      {/* Financial Summary & Payments */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          💰 Фінансовий підсумок та Оплати
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-neutral-700/50">
          <div>
            <div className="text-xs text-gray-500 dark:text-neutral-400">Загальна сума:</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {shipment.total_amount} {shipment.currency}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-neutral-400">Аванс:</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {shipment.advance_amount} {shipment.currency}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-neutral-400">Сплачено всього:</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {shipment.paid_amount} {shipment.currency}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-neutral-400">Залишок боргу:</div>
            <div className="text-xl font-extrabold text-primary">
              {shipment.debt_amount} {shipment.currency}
            </div>
          </div>
        </div>

        {/* Payment History */}
        {payments && payments.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              Історія надходження коштів
            </h4>
            <div className="divide-y divide-gray-100 dark:divide-neutral-700">
              {payments.map(p => (
                <div key={p.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {p.type === 'advance' ? 'Аванс' : 'Оплата'} ({paymentMethodLabels[p.payment_method] || p.payment_method})
                    </span>
                    <span className="text-xs text-gray-500 dark:text-neutral-400 ml-2">
                      {new Date(p.created_at).toLocaleString('uk-UA')}
                    </span>
                  </div>
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    +{p.amount} {p.currency}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Operations Timeline */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          📜 Хронологія та історія всіх операцій ({timelineEvents.length})
        </h3>

        <div className="relative border-l-2 border-gray-200 dark:border-neutral-700 ml-3 space-y-6 pt-2 pb-2">
          {timelineEvents.map((ev, index) => (
            <div key={ev.id || index} className="relative pl-6">
              {/* Icon Marker */}
              <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border-2 border-primary flex items-center justify-center text-xs shadow-sm">
                {ev.icon}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-sm text-gray-900 dark:text-white">
                  {ev.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-neutral-400 font-mono">
                  {new Date(ev.date).toLocaleString('uk-UA')}
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-neutral-300 mt-1 leading-relaxed">
                {ev.description}
              </p>

              {ev.badge && (
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold ${ev.badgeBg}`}>
                  {ev.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showConfirmModal && (
        <ShipmentConfirmModal
          shipment={shipment}
          onClose={() => setShowConfirmModal(false)}
          onSuccess={() => {
            setShowConfirmModal(false);
            loadShipment();
          }}
        />
      )}

      {showPaymentModal && (
        <ShipmentPaymentModal
          shipment={shipment}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadShipment();
          }}
        />
      )}

      {showPrintModal && (
        <ShipmentPrintModal
          shipments={[{ ...shipment, shipment_items: items }]}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {showDocGenerator && (
        <DocumentGeneratorModal
          isOpen={showDocGenerator}
          onClose={() => setShowDocGenerator(false)}
          initialDocType={docModalType === 'all' ? 'warranty' : docModalType}
          issueData={{
            buyerName: shipment.client_name || '',
            buyerPhone: shipment.client_phone || '',
            buyerAddress: shipment.shipping_address || '',
            senderName: shipment.sender_name || '',
            ttn: shipment.ttn || '',
            number: shipment.shipment_number || `ВН-${shipment.id.slice(0, 8)}`,
            issueNumber: shipment.shipment_number || `ВН-${shipment.id.slice(0, 8)}`,
            date: shipment.created_at ? new Date(shipment.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            items: items.map(it => ({
              name: it.product_name || it.product_id,
              productName: it.product_name || it.product_id,
              quantity: parseFloat(it.quantity) || 1,
              unit: it.unit || 'шт',
              price: parseFloat(it.price) || 0,
              warrantyMonths: 12,
              serialNumbers: ''
            }))
          }}
        />
      )}
    </div>
  );
}
