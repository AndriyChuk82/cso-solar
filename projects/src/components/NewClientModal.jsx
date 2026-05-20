import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Phone, Mail, Building, Check, RefreshCw } from 'lucide-react';

export function NewClientModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    note: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Введіть назву клієнта');
    
    setIsSaving(true);
    try {
      await onSave(formData);
      setFormData({ name: '', phone: '', note: '' });
    } catch (error) {
      console.error(error);
      alert('Помилка збереження: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ background: '#FAF8F5', borderRadius: '12px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden', border: '1px solid #D4C5B9' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #EAE7E2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF6F0' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#2C2520' }}>Новий контрагент</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#8B7D73' }}>Заповніть інформацію для створення картки</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', color: '#8B7D73', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.background = '#EAE7E2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#2C2520', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <User size={14} color="#C4B4A6" /> ПІБ / Назва контрагента *
              </label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Введіть ім'я..." 
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520' }} 
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#2C2520', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Phone size={14} color="#C4B4A6" /> Номер телефону
              </label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                placeholder="+380..." 
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520' }} 
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#2C2520', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Коментар
              </label>
              <textarea 
                value={formData.note} 
                onChange={e => setFormData({...formData, note: e.target.value})} 
                placeholder="Опис, додаткові деталі..." 
                rows={3}
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', resize: 'vertical', minHeight: '80px' }} 
              />
            </div>

          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #EAE7E2', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{ background: '#FFFFFF', border: '1px solid #D4C5B9', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#8B7D73', cursor: 'pointer', outline: 'none' }} onMouseEnter={e => e.currentTarget.style.background = '#FAF6F0'} onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}>
              Скасувати
            </button>
            <button type="submit" disabled={isSaving} style={{ background: '#C4B4A6', border: 'none', padding: '8px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', outline: 'none' }} onMouseEnter={e => e.currentTarget.style.background = '#B3A395'} onMouseLeave={e => e.currentTarget.style.background = '#C4B4A6'}>
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {isSaving ? 'Збереження...' : 'Створити'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
