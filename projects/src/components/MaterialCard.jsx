import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatAmount } from '../lib/utils';

/**
 * Mobile-friendly material card component
 * Replaces table layout on small screens
 */
export function MaterialCard({ item, onUpdate, onDelete, isEditing, currency, rate }) {
  if (isEditing) {
    return (
      <div style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        marginBottom: '10px',
      }}>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Назва
          </label>
          <input
            type="text"
            value={item.name || ''}
            onChange={e => onUpdate({ ...item, name: e.target.value })}
            className="form-input"
            style={{ padding: '8px 10px', fontSize: '0.9rem', fontWeight: 500 }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Примітка
          </label>
          <input
            type="text"
            value={item.note || ''}
            onChange={e => onUpdate({ ...item, note: e.target.value })}
            className="form-input"
            placeholder="Додаткова інформація..."
            style={{ padding: '6px 10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              К-сть
            </label>
            <input
              type="number"
              min="0"
              value={item.quantity || ''}
              onChange={e => {
                const q = parseFloat(e.target.value) || 0;
                const p = parseFloat(item.price) || 0;
                onUpdate({ ...item, quantity: e.target.value, sum: q * p });
              }}
              className="form-input"
              style={{ padding: '8px 6px', fontSize: '0.85rem', textAlign: 'center' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Видано
            </label>
            <input
              type="number"
              min="0"
              value={item.issued_qty || ''}
              onChange={e => onUpdate({ ...item, issued_qty: e.target.value })}
              className="form-input"
              placeholder="0"
              style={{ padding: '8px 6px', fontSize: '0.85rem', textAlign: 'center', background: 'var(--success-bg)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Ціна ({currency})
            </label>
            <input
              type="number"
              min="0"
              value={item.price || ''}
              onChange={e => {
                const p = parseFloat(e.target.value) || 0;
                const q = parseFloat(item.quantity) || 0;
                onUpdate({ ...item, price: e.target.value, sum: q * p });
              }}
              className="form-input"
              style={{ padding: '8px 6px', fontSize: '0.85rem', textAlign: 'right' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Сума</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
              {parseFloat(item.sum) > 0 ? formatAmount(item.sum, currency, rate) : '—'}
            </div>
          </div>
          <button
            onClick={() => onDelete(item)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '8px', color: 'var(--danger)', minHeight: '44px', minWidth: '44px' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Read-only view
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)',
      padding: '12px',
      marginBottom: '8px',
      position: 'relative'
    }}>
      <div style={{ marginBottom: '6px', paddingRight: '30px' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
          {item.name}
        </div>
        {item.note && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {item.note}
          </div>
        )}
      </div>

      <button 
        onClick={() => {
          if (confirm('Видалити цю позицію?')) {
            onDelete && onDelete(item);
          }
        }}
        style={{ 
          position: 'absolute', top: 8, right: 8, 
          padding: 8, color: 'var(--danger)', opacity: 0.3,
          background: 'none', border: 'none'
        }}
      >
        <Trash2 size={14} />
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              План
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {parseFloat(item.quantity) || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Видано
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: (parseFloat(item.issued_qty) || 0) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
              {parseFloat(item.issued_qty) || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ціна
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {parseFloat(item.price) > 0 ? formatAmount(item.price, currency, rate) : '—'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Сума
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
            {parseFloat(item.sum) > 0 ? formatAmount(item.sum, currency, rate) : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
