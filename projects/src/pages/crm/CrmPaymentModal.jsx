import React, { useState, useEffect } from 'react';
import { X, Plus, DollarSign, Calendar, FileText, Check } from 'lucide-react';
import { crmApi } from '../../services/crmApi';

export function CrmPaymentModal({ project, onClose, onUpdate }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Форма нового платежу
  const [showAdd, setShowAdd] = useState(false);
  const [newPayment, setNewPayment] = useState({
    sum: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    payment_type: 'Оплата',
    note: ''
  });

  useEffect(() => {
    loadPayments();
  }, [project.id]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getPaymentsByProject(project.id);
      setPayments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newPayment.sum) return;
    setSaving(true);
    try {
      await crmApi.savePayment({
        project_id: project.id,
        sum: parseFloat(newPayment.sum),
        currency: newPayment.currency,
        date: newPayment.date,
        payment_type: newPayment.payment_type,
        note: newPayment.note,
        status: 'Оплачено'
      });
      setShowAdd(false);
      setNewPayment({ ...newPayment, sum: '', note: '' });
      await loadPayments();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Помилка збереження платежу');
    } finally {
      setSaving(false);
    }
  };

  const validPayments = payments.filter(p => !p.status?.toLowerCase().includes('скасовано'));
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '8px', width: '90%', maxWidth: '500px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="#10B981" /> Журнал платежів
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#4B5563', fontWeight: 600 }}>Історія транзакцій ({validPayments.length})</div>
            {!showAdd && (
              <button onClick={() => setShowAdd(true)} style={{
                background: '#10B981', color: 'white', border: 'none', borderRadius: '4px',
                padding: '4px 10px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
              }}>
                <Plus size={14} /> Додати платіж
              </button>
            )}
          </div>

          {showAdd && (
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Сума</label>
                  <input 
                    type="number" value={newPayment.sum} onChange={e => setNewPayment({...newPayment, sum: e.target.value})}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '14px', border: '1px solid #D1D5DB', borderRadius: '4px', boxSizing: 'border-box' }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Валюта</label>
                  <select 
                    value={newPayment.currency} onChange={e => setNewPayment({...newPayment, currency: e.target.value})}
                    style={{ width: '100%', padding: '6px', fontSize: '14px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                  >
                    <option value="USD">USD</option>
                    <option value="UAH">UAH</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Дата</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} color="#9CA3AF" style={{ position: 'absolute', left: '8px', top: '8px' }} />
                    <input 
                      type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})}
                      style={{ width: '100%', padding: '6px 8px 6px 28px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Тип</label>
                  <select 
                    value={newPayment.payment_type} onChange={e => setNewPayment({...newPayment, payment_type: e.target.value})}
                    style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                  >
                    <option value="Аванс">Аванс</option>
                    <option value="Оплата">Оплата</option>
                    <option value="Доплата">Доплата</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '4px' }}>Коментар</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={14} color="#9CA3AF" style={{ position: 'absolute', left: '8px', top: '8px' }} />
                  <input 
                    type="text" value={newPayment.note} onChange={e => setNewPayment({...newPayment, note: e.target.value})}
                    style={{ width: '100%', padding: '6px 8px 6px 28px', fontSize: '13px', border: '1px solid #D1D5DB', borderRadius: '4px', boxSizing: 'border-box' }}
                    placeholder="За що платіж..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', border: '1px solid #D1D5DB', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Скасувати</button>
                <button onClick={handleSave} disabled={saving} style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {saving ? 'Збереження...' : <><Check size={14} /> Зберегти</>}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: '#6B7280' }}>Завантаження платежів...</div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', background: '#F9FAFB', borderRadius: '6px', fontSize: '13px', color: '#6B7280' }}>
              Платежів ще не було
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {payments.map(p => {
                const cancelled = p.status?.toLowerCase().includes('скасовано');
                const isUAH = p.currency === 'UAH';
                return (
                  <div key={p.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '6px',
                    opacity: cancelled ? 0.5 : 1
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                        {isUAH ? `${Number(p.sum).toLocaleString()} ₴` : `$${Number(p.sum).toLocaleString()}`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span>{p.date}</span>
                        <span style={{ color: '#D1D5DB' }}>|</span>
                        <span>{p.payment_type}</span>
                        {p.note && (
                          <>
                            <span style={{ color: '#D1D5DB' }}>|</span>
                            <span>{p.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {cancelled && <span style={{ fontSize: '10px', background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>СКАСОВАНО</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
