import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBuyers, addBuyerTransaction } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '@cso/design-system';

export default function BuyerPaymentForm() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [buyers, setBuyers] = useState([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    buyerId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'UAH',
    comment: '',
    useConversion: false,
    conversionRate: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getBuyers();
        if (res?.success) {
          setBuyers(res.buyers?.filter(b => b.active) || []);
        }
      } catch (err) {
        console.error('Помилка завантаження покупців:', err);
        showToast('Помилка завантаження списку покупців', 'error');
      }
    }
    loadData();
  }, []);

  // Розрахунок суми зарахування при конвертації
  const receivedAmount = parseFloat(formData.amount) || 0;
  const rate = parseFloat(formData.conversionRate) || 0;
  const targetCurrency = formData.currency === 'UAH' ? 'USD' : 'UAH';
  
  let creditedAmount = receivedAmount;
  if (formData.useConversion && rate > 0) {
    if (formData.currency === 'UAH') {
      // Конвертуємо грн в USD (ділимо на курс)
      creditedAmount = receivedAmount / rate;
    } else {
      // Конвертуємо USD в грн (множимо на курс)
      creditedAmount = receivedAmount * rate;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.buyerId) return showToast('Оберіть покупця', 'error');
    if (!formData.amount || receivedAmount <= 0) return showToast('Введіть коректну суму', 'error');
    if (formData.useConversion && (!formData.conversionRate || rate <= 0)) {
      return showToast('Введіть коректний курс конвертації', 'error');
    }

    setSaving(true);
    try {
      const selectedBuyer = buyers.find(b => b.id === formData.buyerId);
      
      const payload = {
        buyerId: formData.buyerId,
        buyerName: selectedBuyer?.name,
        date: formData.date,
        type: 'payment',
        // Якщо включено конвертацію, в БД записуємо суму в цільовій валюті
        amount: formData.useConversion ? parseFloat(creditedAmount.toFixed(2)) : receivedAmount,
        currency: formData.useConversion ? targetCurrency : formData.currency,
        convertedAmount: formData.useConversion ? receivedAmount : null,
        conversionRate: formData.useConversion ? rate : null,
        status: 'completed',
        comment: formData.comment || (formData.useConversion 
          ? `Оплата: ${receivedAmount} ${formData.currency} (зараховано за курсом ${rate})`
          : `Оплата: ${receivedAmount} ${formData.currency}`
        ),
        user: user?.email
      };

      const result = await addBuyerTransaction(payload);
      if (result?.success) {
        showToast('Оплату успішно зареєстровано', 'success');
        navigate('/buyers');
      } else {
        showToast(result?.error || 'Помилка збереження', 'error');
      }
    } catch (err) {
      console.error('Помилка збереження оплати:', err);
      showToast('Помилка з\'єднання з базою даних', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button 
          type="button" 
          onClick={() => navigate('/buyers')}
          className="text-xl p-1 text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text)]">💰 Реєстрація оплати</h1>
          <p className="text-xs md:text-sm text-[var(--text-secondary)]">Отримання коштів від покупця</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-5 space-y-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
          {/* Покупець */}
          <div className="form-group flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Покупець *</label>
            <select
              className="form-select w-full p-2.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
              value={formData.buyerId}
              onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
              required
            >
              <option value="">Оберіть покупця</option>
              {buyers.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Дата */}
          <div className="form-group flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Дата оплати</label>
            <input
              type="date"
              className="form-input w-full p-2.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Сума та валюта отримання */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Отримана сума *</label>
              <input
                type="number"
                step="any"
                min="0.01"
                className="form-input w-full p-2.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Валюта *</label>
              <select
                className="form-select w-full p-2.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
                value={formData.currency}
                onChange={(e) => {
                  setFormData({ ...formData, currency: e.target.value });
                }}
              >
                <option value="UAH">UAH (грн)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {/* Чекбокс конвертації */}
          <div className="pt-2 border-t border-[var(--border)]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.useConversion}
                onChange={(e) => setFormData({ ...formData, useConversion: e.target.checked })}
                className="rounded border-[var(--border)] text-blue-500"
              />
              <span className="text-xs font-semibold text-[var(--text)]">Зарахувати в рахунок іншої валюти</span>
            </label>
          </div>

          {/* Поля конвертації (якщо включено) */}
          {formData.useConversion && (
            <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg space-y-3 animation-fade-in">
              <div className="text-xs font-bold text-blue-500">
                💱 Конвертація: {formData.currency} → {targetCurrency}
              </div>

              <div className="form-group flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)]">
                  Курс обміну ({formData.currency} за 1 {targetCurrency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  className="form-input w-full p-2 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] text-xs focus:outline-none"
                  placeholder="Напр.: 41.20"
                  value={formData.conversionRate}
                  onChange={(e) => setFormData({ ...formData, conversionRate: e.target.value })}
                  required={formData.useConversion}
                />
              </div>

              {rate > 0 && receivedAmount > 0 && (
                <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                  Буде зараховано на баланс: <b>{formData.currency === 'UAH' ? '$' : ''}{creditedAmount.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {formData.currency === 'UAH' ? '' : 'грн'}</b>
                </div>
              )}
            </div>
          )}

          {/* Коментар */}
          <div className="form-group flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Коментар</label>
            <input
              type="text"
              className="form-input w-full p-2.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
              placeholder="Наприклад: Готівка на складі, безготівковий переказ..."
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            />
          </div>
        </div>

        {/* Кнопки дії */}
        <div className="flex justify-end gap-3 pt-2">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => navigate('/buyers')}
            disabled={saving}
          >
            Скасувати
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={saving} 
            loading={saving}
          >
            {saving ? 'Збереження...' : 'Зберегти оплату'}
          </Button>
        </div>
      </form>
    </div>
  );
}
