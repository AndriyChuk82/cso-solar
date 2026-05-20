import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Phone, Mail, Building, Check, RefreshCw } from 'lucide-react';

export function NewClientModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'Фізична особа'
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Введіть назву клієнта');
    
    setIsSaving(true);
    try {
      await onSave(formData);
      setFormData({ name: '', phone: '', email: '', type: 'Фізична особа' });
    } catch (error) {
      console.error(error);
      alert('Помилка збереження: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ background: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>Новий контрагент</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>Заповніть контактну інформацію</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', color: '#9CA3AF' }} onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>
                <User size={14} color="#3B82F6" /> ПІБ / Назва компанії *
              </label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Введіть ім'я..." 
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none' }} 
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>
                <Building size={14} color="#F59E0B" /> Тип клієнта
              </label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})} 
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none', background: '#FFFFFF' }}
              >
                <option value="Фізична особа">Фізична особа</option>
                <option value="ФОП">ФОП</option>
                <option value="Юридична особа">Юридична особа</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>
                  <Phone size={14} color="#10B981" /> Телефон
                </label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="+380..." 
                  style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none' }} 
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#4B5563', marginBottom: '6px' }}>
                  <Mail size={14} color="#8B5CF6" /> Email
                </label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="mail@example.com" 
                  style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #D1D5DB', borderRadius: '6px', outline: 'none' }} 
                />
              </div>
            </div>

          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#4B5563', cursor: 'pointer' }}>
              Скасувати
            </button>
            <button type="submit" disabled={isSaving} style={{ background: '#2563EB', border: 'none', padding: '8px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
