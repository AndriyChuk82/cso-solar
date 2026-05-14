import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { projectService } from '../services/api';

export function AddPaymentSheet({ isOpen, projectId, balances = { USD: 0, UAH: 0 }, currency = 'USD', onClose, onSaved }) {

  const today = new Date().toISOString().split('T')[0];

  const [type, setType] = useState('Аванс');
  const [sum, setSum] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState(currency || 'USD');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleTypeSelect = (newType) => {
    setType(newType);
    if (newType === 'Повна оплата') {
      const currentBalance = balances?.[paymentCurrency] || 0;
      setSum(currentBalance > 0 ? Number(currentBalance.toFixed(2)) : '');
    } else {
      setSum('');
    }
  };

  useEffect(() => {
    if (type === 'Повна оплата') {
      const currentBalance = balances?.[paymentCurrency] || 0;
      setSum(currentBalance > 0 ? Number(currentBalance.toFixed(2)) : '');
    }
  }, [paymentCurrency, balances, type]);

  const handleSave = async () => {
    if (!sum || parseFloat(sum) <= 0) {
      setError('Вкажіть суму платежу');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const inputSum = parseFloat(sum);

      const res = await projectService.savePayment({
        project_id: projectId,
        sum: Number(inputSum.toFixed(2)),
        currency: paymentCurrency,
        payment_type: type,
        date,
        note,
        status: 'Оплачено',
      });
      if (res.success) {
        if (typeof onSaved === 'function') onSaved();
        onClose();
      } else {
        setError(res.error || 'Не вдалося зберегти платіж');
      }
    } catch (err) {
      console.error('Save payment error:', err);
      setError('Помилка підключення до сервера');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet-panel">
        <div className="sheet-handle" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h3 className="sheet-title" style={{ marginBottom: 2, fontSize: '1.25rem', fontWeight: 800 }}>💰 Додати платіж</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Фіксація оплати по проєкту</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 8, borderRadius: '50%', background: 'var(--bg)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Тип платежу */}
        <div style={{ marginBottom: 20 }}>
          <div className="stat-label" style={{ marginBottom: 8, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Тип платежу</div>
          <div className="type-toggle" style={{ background: 'var(--bg-sidebar)', padding: '5px' }}>
            <button
              className={`type-btn ${type === 'Аванс' ? 'selected-advance' : ''}`}
              onClick={() => handleTypeSelect('Аванс')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: type === 'Аванс' ? '#fff' : '#3b82f6' }} />
              Аванс
            </button>
            <button
              className={`type-btn ${type === 'Повна оплата' ? 'selected-full' : ''}`}
              onClick={() => handleTypeSelect('Повна оплата')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Check size={14} strokeWidth={3} />
              Повна оплата
            </button>
          </div>
        </div>

        <div className="payment-form-grid" style={{ marginBottom: 16 }}>
          {/* Сума */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>Сума ({paymentCurrency})</label>
              <div style={{ display: 'flex', gap: 2, background: 'var(--bg-sidebar)', padding: 2, borderRadius: 4 }}>
                <button 
                  onClick={() => setPaymentCurrency('USD')}
                  style={{ 
                    padding: '2px 8px', fontSize: '0.65rem', fontWeight: 800, border: 'none', borderRadius: 3,
                    background: paymentCurrency === 'USD' ? 'var(--primary)' : 'transparent',
                    color: paymentCurrency === 'USD' ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >$</button>
                <button 
                  onClick={() => setPaymentCurrency('UAH')}
                  style={{ 
                    padding: '2px 8px', fontSize: '0.65rem', fontWeight: 800, border: 'none', borderRadius: 3,
                    background: paymentCurrency === 'UAH' ? 'var(--primary)' : 'transparent',
                    color: paymentCurrency === 'UAH' ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >₴</button>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                inputMode="decimal"
                className="form-input"
                placeholder="0.00"
                value={sum}
                onChange={e => setSum(e.target.value)}
                style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 800, 
                  paddingLeft: 12, 
                  height: 46, 
                  boxSizing: 'border-box',
                  borderLeft: `4px solid ${type === 'Аванс' ? '#3b82f6' : 'var(--success)'}`,
                  borderRadius: 'var(--radius)'
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Дата */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Дата</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ 
                height: 46, 
                fontWeight: 600, 
                fontSize: '0.88rem',
                boxSizing: 'border-box',
                padding: '0 10px',
                borderRadius: 'var(--radius)'
              }}
            />
          </div>
        </div>

        {/* Примітка */}
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Примітка</label>
          <input
            type="text"
            className="form-input"
            placeholder="Напр.: готівка, Монобанк, карта..."
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ padding: '12px 14px' }}
          />
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            borderRadius: 'var(--radius)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: 20,
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span> {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ 
            width: '100%', 
            padding: '16px', 
            fontSize: '1rem', 
            fontWeight: 800,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(232, 137, 10, 0.3)',
            background: 'var(--brand)',
            border: 'none'
          }}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Збереження...' : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               {type === 'Аванс' ? '🔵' : '✅'} Зберегти {type}
            </div>
          )}
        </button>
      </div>
    </div>,
    document.body
  );
}

