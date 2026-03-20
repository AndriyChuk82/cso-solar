import React, { useState } from 'react';
import { X } from 'lucide-react';
import { projectService } from '../services/api';

export function AddPaymentSheet({ projectId, onClose, onSaved }) {
  const today = new Date().toISOString().split('T')[0];

  const [type, setType] = useState('Аванс');
  const [sum, setSum] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!sum || parseFloat(sum) <= 0) {
      setError('Вкажіть суму платежу');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const res = await projectService.savePayment({
        projectId,
        sum: parseFloat(sum),
        payment_type: type,
        date,
        note,
        status: 'Оплачено',
      });
      if (res.success) {
        onSaved();
        onClose();
      } else {
        setError(res.error || 'Не вдалося зберегти платіж');
      }
    } catch {
      setError('Помилка підключення до сервера');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet-panel">
        <div className="sheet-handle" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 className="sheet-title" style={{ marginBottom: 0 }}>💰 Додати платіж</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Тип платежу */}
        <div style={{ marginBottom: 16 }}>
          <div className="stat-label" style={{ marginBottom: 8 }}>Тип платежу</div>
          <div className="type-toggle">
            <button
              className={`type-btn ${type === 'Аванс' ? 'selected-advance' : ''}`}
              onClick={() => setType('Аванс')}
            >
              🔵 Аванс
            </button>
            <button
              className={`type-btn ${type === 'Повна оплата' ? 'selected-full' : ''}`}
              onClick={() => setType('Повна оплата')}
            >
              ✅ Повна оплата
            </button>
          </div>
        </div>

        {/* Сума */}
        <div className="form-group">
          <label>Сума (грн)</label>
          <input
            type="number"
            inputMode="numeric"
            className="form-input"
            placeholder="0"
            value={sum}
            onChange={e => setSum(e.target.value)}
            style={{ fontSize: '1.2rem', fontWeight: 700 }}
            autoFocus
          />
        </div>

        {/* Дата */}
        <div className="form-group">
          <label>Дата</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Примітка */}
        <div className="form-group">
          <label>Примітка (необов'язково)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Напр.: готівка, Монобанк..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Збереження...' : `Зберегти ${type}`}
        </button>
      </div>
    </div>
  );
}
