import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { addShipmentPayment, batchAddShipmentPayments } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';

export default function ShipmentPaymentModal({ shipment, isBatch, selectedIds, onClose, onSuccess }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isBatchMode = isBatch && selectedIds?.length > 0;
  const remainingDebt = shipment ? (parseFloat(shipment.debt_amount) || 0) : 0;

  const [paymentMethod, setPaymentMethod] = useState(shipment?.payment_method || 'cod');
  const [amount, setAmount] = useState(remainingDebt > 0 ? remainingDebt.toString() : '');
  const [comment, setComment] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isBatchMode) {
        const res = await batchAddShipmentPayments(selectedIds, { paymentMethod, comment }, user);
        if (res.success) {
          showToast(`Оплату успішно підтверджено для ${res.count} відправлень`, 'success');
          onSuccess();
        } else {
          showToast('Помилка при проведенні масової оплати', 'error');
        }
      } else {
        const payVal = parseFloat(amount);
        if (!payVal || payVal <= 0) {
          showToast('Введіть коректну суму оплати', 'error');
          setLoading(false);
          return;
        }

        const res = await addShipmentPayment(shipment.id, {
          amount: payVal,
          paymentMethod,
          comment
        }, user);

        if (res.success) {
          showToast('Оплату успішно підтверджено', 'success');
          onSuccess();
        } else {
          showToast('Помилка збереження оплати', 'error');
        }
      }
    } catch (err) {
      console.error('Failed to save payment:', err);
      showToast(err.message || 'Помилка виконання операції', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-xl border border-gray-100 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-neutral-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            💳 {isBatchMode ? `Масове підтвердження оплати (${selectedIds.length})` : 'Підтвердження оплати'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isBatchMode && shipment && (
            <div className="p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-xl space-y-1 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-neutral-300">
                <span>Клієнт:</span>
                <strong className="text-gray-900 dark:text-white">{shipment.client_name}</strong>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-neutral-300">
                <span>Загальна вартість:</span>
                <span>{shipment.total_amount} {shipment.currency}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-neutral-300">
                <span>Оплачено / Аванс:</span>
                <span>{shipment.paid_amount} {shipment.currency}</span>
              </div>
              <div className="flex justify-between text-primary font-bold text-base pt-1 border-t border-gray-200 dark:border-neutral-600">
                <span>Залишок боргу:</span>
                <span>{remainingDebt} {shipment.currency}</span>
              </div>
            </div>
          )}

          {isBatchMode && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm">
              Ви обрали <strong>{selectedIds.length}</strong> відправлень для повного підтвердження оплати.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Спосіб оплати
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="cod">📦 Оплата при отриманні</option>
              <option value="kit_group">🐱 КИТ Group</option>
              <option value="cash">💵 Готівка</option>
            </select>
          </div>

          {!isBatchMode && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Сума оплати ({shipment?.currency || 'UAH'})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingDebt > 0 ? remainingDebt : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none font-medium text-base"
                placeholder="Введіть суму..."
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Примітка (необов'язково)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Коментар до оплати..."
            />
          </div>

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
              className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Збереження...' : '✅ Підтвердити оплату'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
