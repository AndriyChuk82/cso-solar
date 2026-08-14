import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { confirmShipmentDispatch, batchConfirmShipments } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';

export default function ShipmentConfirmModal({ shipment, isBatch, selectedShipments, onClose, onSuccess }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isBatchMode = isBatch && selectedShipments?.length > 0;
  const isPickup = shipment?.carrier === 'Самовивіз' || shipment?.carrier === 'pickup';
  const [carrier, setCarrier] = useState(shipment?.carrier || 'Нова Пошта');
  const [ttn, setTtn] = useState(shipment?.ttn || (isPickup ? 'Самовивіз' : ''));

  // Batch TTNs state: { [shipmentId]: string }
  const [batchTtns, setBatchTtns] = useState(() => {
    const initial = {};
    if (selectedShipments) {
      selectedShipments.forEach(s => {
        initial[s.id] = s.ttn && s.ttn !== 'Самовивіз' ? s.ttn : '';
      });
    }
    return initial;
  });

  const handleBatchTtnChange = (id, val) => {
    setBatchTtns(prev => ({ ...prev, [id]: val }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isBatchMode) {
        const batchItems = selectedShipments.map(s => ({
          id: s.id,
          ttn: batchTtns[s.id]?.trim() || (s.carrier === 'Самовивіз' ? 'Самовивіз' : s.ttn || undefined),
          carrier: s.carrier || carrier
        }));

        const res = await batchConfirmShipments(batchItems, { carrier }, user);
        if (res.success) {
          showToast(`Успішно підтверджено відправку для ${res.count} накладних`, 'success');
          onSuccess();
        } else {
          showToast('Помилка при масовому підтвердженні відправки', 'error');
        }
      } else {
        const finalTtn = isPickup ? (ttn || 'Самовивіз') : ttn;
        const res = await confirmShipmentDispatch(shipment.id, { ttn: finalTtn, carrier }, user);
        if (res.success) {
          showToast(isPickup ? 'Видачу та списання товарів підтверджено' : 'Відправку та списання товарів підтверджено', 'success');
          onSuccess();
        } else {
          showToast('Помилка підтвердження', 'error');
        }
      }
    } catch (err) {
      console.error('Dispatch confirmation failed:', err);
      showToast(err.message || 'Помилка проведення операції', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-xl border border-gray-100 dark:border-neutral-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-neutral-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {isPickup ? '🚗 Підтвердити видачу товару (Самовивіз)' : isBatchMode ? `🚚 Масове підтвердження відправки (${selectedShipments.length})` : '🚚 Підтвердити відправку & ТТН'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
          {!isBatchMode && shipment && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-xl text-sm space-y-1">
              <div><strong>Клієнт:</strong> {shipment.client_name}</div>
              <div><strong>Спосіб:</strong> {isPickup ? '🚗 Самовивіз зі склада' : `🚚 ${shipment.carrier || 'Нова Пошта'}`}</div>
              <div><strong>Адреса / Склад:</strong> {shipment.shipping_address || 'Не вказано'}</div>
              <div className="text-xs text-amber-700 dark:text-amber-400 pt-1">
                ⚠️ Увага: При підтвердженні товар буде остаточно списано з залишків відповідного складу!
              </div>
            </div>
          )}

          {isBatchMode && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-xl text-xs space-y-1">
                <div>Ви обрали <strong>{selectedShipments.length}</strong> відправлень для масового підтвердження.</div>
                <div>Заповніть ТТН для тих відправлень, куди потрібно (необов'язково — якщо не заповнити, можна підтвердити без ТТН).</div>
              </div>

              {/* Scrollable list of shipments with optional TTN inputs */}
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1.5 divide-y divide-gray-100 dark:divide-neutral-700">
                {selectedShipments.map((s, idx) => {
                  const sIsPickup = s.carrier === 'Самовивіз' || s.carrier === 'pickup';
                  return (
                    <div key={s.id} className={`${idx > 0 ? 'pt-2.5' : ''} space-y-1.5`}>
                      <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
                        <span>{idx + 1}. {s.client_name}</span>
                        <span className="text-[11px] font-semibold text-gray-500">
                          {sIsPickup ? '🚗 Самовивіз' : `🚚 ${s.carrier || 'Нова Пошта'}`}
                        </span>
                      </div>

                      {!sIsPickup && (
                        <div>
                          <input
                            type="text"
                            value={batchTtns[s.id] || ''}
                            onChange={(e) => handleBatchTtnChange(s.id, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                            placeholder="№ ТТН (необов'язково, наприклад 20450000...)"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isBatchMode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Спосіб доставки / Перевізник
                </label>
                <select
                  value={carrier}
                  onChange={(e) => {
                    setCarrier(e.target.value);
                    if (e.target.value === 'Самовивіз' || e.target.value === 'pickup') {
                      setTtn('Самовивіз');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="Нова Пошта">🚚 Нова Пошта</option>
                  <option value="Самовивіз">🚗 Самовивіз зі склада</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  {isPickup ? 'Спосіб / Примітка видачі' : '№ ТТН (Товарно-транспортна накладна)'}
                </label>
                <input
                  type="text"
                  value={ttn}
                  onChange={(e) => setTtn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono text-base tracking-wide"
                  placeholder={isPickup ? 'Самовивіз зі склада' : '20450000000000...'}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Проведення...' : isPickup ? '🚗 Підтвердити видачу & Списати' : '🚀 Підтвердити та списати товар'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
