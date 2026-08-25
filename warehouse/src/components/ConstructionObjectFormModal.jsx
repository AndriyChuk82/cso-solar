import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, SunMedium } from 'lucide-react';
import { CONSTRUCTION_STATUSES, PAYMENT_TYPES } from '../api/constructionService';

export default function ConstructionObjectFormModal({ isOpen, onClose, onSave, initialData }) {
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('kp_sent');
  const [paymentType, setPaymentType] = useState('cash_end');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [totalPrice, setTotalPrice] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mouseDownOnOverlay = useRef(false);

  const handleOverlayMouseDown = (e) => {
    mouseDownOnOverlay.current = (e.target === e.currentTarget);
  };

  const handleOverlayClick = (e) => {
    if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
      onClose();
    }
    mouseDownOnOverlay.current = false;
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setClientName(initialData.client_name || '');
        setPhone(initialData.phone || '');
        setAddress(initialData.address || '');
        setStatus(initialData.status || 'kp_sent');
        setPaymentType(initialData.payment_type || 'cash_end');
        setPaymentNotes(initialData.payment_notes || '');
        setNotes(initialData.notes || '');
        setCurrency(initialData.currency || 'USD');
        setTotalPrice(initialData.total_price !== undefined && initialData.total_price !== null ? String(initialData.total_price) : '');
        setAdvanceAmount(initialData.advance_amount !== undefined && initialData.advance_amount !== null ? String(initialData.advance_amount) : '');
        setPaidAmount(initialData.paid_amount !== undefined && initialData.paid_amount !== null ? String(initialData.paid_amount) : '');
      } else {
        setClientName('');
        setPhone('');
        setAddress('');
        setStatus('kp_sent');
        setPaymentType('cash_end');
        setPaymentNotes('');
        setNotes('');
        setCurrency('USD');
        setTotalPrice('');
        setAdvanceAmount('');
        setPaidAmount('');
      }
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const parseNum = (val) => {
    if (!val) return 0;
    const clean = String(val).replace(/,/g, '.').replace(/[^\d.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!clientName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSave({
        ...(initialData || {}),
        client_name: clientName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        status,
        payment_type: paymentType,
        payment_notes: paymentNotes.trim(),
        notes: notes.trim(),
        currency,
        total_price: parseNum(totalPrice),
        advance_amount: parseNum(advanceAmount),
        paid_amount: parseNum(paidAmount)
      });

      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div 
      className="modal-overlay" 
      onMouseDown={handleOverlayMouseDown} 
      onClick={handleOverlayClick}
    >
      <div className="modal" style={{ maxWidth: '580px' }}>
        <div className="sheet-handle" />
        
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <SunMedium className="text-amber-500" size={24} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {initialData ? 'Редагувати об\'єкт будівництва' : 'Новий об\'єкт будівництва'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5 rounded-full">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-4" style={{ padding: '16px 20px' }}>
          {/* Client Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">ПІБ Клієнта *</label>
            <input
              type="text"
              required
              placeholder="Наприклад: Шевченко Тарас Григорович"
              className="form-input w-full text-sm font-medium"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
            />
          </div>

          {/* Phone & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Телефон</label>
              <input
                type="text"
                placeholder="+380..."
                className="form-input w-full text-sm"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Валюта угоди</label>
              <select
                className="form-select w-full text-sm font-bold"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                <option value="USD">USD ($ - Долар США)</option>
                <option value="UAH">UAH (₴ - Гривня)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Адреса об'єкта</label>
            <input
              type="text"
              placeholder="Наприклад: м. Львів, вул. Сонячна, 15"
              className="form-input w-full text-sm"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          {/* Status & Payment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Статус будівництва</label>
              <select
                className="form-select w-full text-sm"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                {Object.entries(CONSTRUCTION_STATUSES).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Тип розрахунку</label>
              <select
                className="form-select w-full text-sm"
                value={paymentType}
                onChange={e => setPaymentType(e.target.value)}
              >
                {Object.entries(PAYMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Amounts: Total, Advance, Paid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 dark:bg-neutral-900/60 p-3 rounded-xl border border-gray-100 dark:border-neutral-800">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                Сума КП ({currency === 'UAH' ? '₴' : '$'})
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                className="form-input w-full text-sm font-bold text-gray-900 dark:text-white"
                value={totalPrice}
                onChange={e => setTotalPrice(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Аванс / Завдаток ({currency === 'UAH' ? '₴' : '$'})
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                className="form-input w-full text-sm font-bold text-emerald-600 dark:text-emerald-400"
                value={advanceAmount}
                onChange={e => setAdvanceAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Сплачено ({currency === 'UAH' ? '₴' : '$'})
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                className="form-input w-full text-sm font-bold text-blue-600 dark:text-blue-400"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Примітки щодо оплати</label>
            <input
              type="text"
              placeholder="Наприклад: Завдаток 1000$, залишок готівкою при здачі"
              className="form-input w-full text-sm"
              value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Загальні примітки / нотатки</label>
            <textarea
              rows={2}
              placeholder="Додаткова інформація по об'єкту..."
              className="form-input w-full text-sm"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-secondary text-sm">
              Скасувати
            </button>
            <button 
              type="submit" 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="btn btn-primary text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={16} /> 
              {isSubmitting ? 'Збереження...' : (initialData ? 'Зберегти зміни' : 'Створити об\'єкт')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
