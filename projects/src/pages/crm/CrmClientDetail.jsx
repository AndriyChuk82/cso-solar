import React, { useState, useEffect } from 'react';
import { crmApi } from '../../services/crmApi';
import { KPSelectionModal } from '../../components/KPSelectionModal';
import { projectService } from '../../services/api';
import { ChevronLeft, Phone, Plus, DollarSign, Package, Calendar, FileText, Check, Truck, X, Layers, CreditCard, Trash2, Pencil } from 'lucide-react';
import { QuickShipmentModal } from './QuickShipmentModal';
import { supabase } from '../../services/supabaseClient';

function parseShipmentInfo(note) {
  if (!note) {
    return { isShipment: false, groupId: null, date: null, carrier: null, trackingNumber: null, cleanNote: '' };
  }

  const groupMatch = note.match(/\[Group:\s*([^\]]+)\]/);
  const migratedMatch = note.match(/\[Migrated:\s*shipment-item-([^\]]+)\]/);
  const logisticMatch = note.match(/\[Накладна від\s*([^,\]]+),\s*Перевізник:\s*([^,\]]+)(?:,\s*ТТН:\s*([^\]]+))?\]/);

  if (!logisticMatch && !groupMatch && !migratedMatch) {
    return { isShipment: false, groupId: null, date: null, carrier: null, trackingNumber: null, cleanNote: note };
  }

  const date = logisticMatch ? logisticMatch[1].trim() : null;
  const carrier = logisticMatch ? logisticMatch[2].trim() : null;
  const trackingNumber = logisticMatch && logisticMatch[3] ? logisticMatch[3].trim() : null;

  let groupId = null;
  if (groupMatch) {
    groupId = groupMatch[1].trim();
  } else if (logisticMatch) {
    groupId = `logistic_${date}_${carrier}_${trackingNumber || ''}`.replace(/\s+/g, '_');
  } else if (migratedMatch) {
    groupId = `migrated_${migratedMatch[1].trim()}`;
  }

  let cleanNote = note;
  cleanNote = cleanNote.replace(/\[Group:\s*[^\]]+\]/g, '');
  cleanNote = cleanNote.replace(/\[Migrated:\s*[^\]]+\]/g, '');
  cleanNote = cleanNote.replace(/\[Накладна від\s*[^\]]+\]/g, '');
  cleanNote = cleanNote.replace(/\s+/g, ' ').trim();

  return {
    isShipment: true,
    groupId,
    date,
    carrier,
    trackingNumber,
    cleanNote
  };
}

export function CrmClientDetail({ client, onBack, onUpdate }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientName, setClientName] = useState(client.name || '');
  const [clientPhone, setClientPhone] = useState(client.phone || '');
  const [clientNote, setClientNote] = useState(client.note || '');
  const [exchangeRateInput, setExchangeRateInput] = useState('44.3');
  const [ledgerDisplayCurrency, setLedgerDisplayCurrency] = useState('both');

  useEffect(() => {
    setClientName(client.name || '');
    setClientPhone(client.phone || '');
    setClientNote(client.note || '');
    setIsEditingClient(false);
  }, [client]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (client.id) loadProjects();
  }, [client.id]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getProjectsByClient(client.id);
      setProjects(data || []);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to load projects', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      const newProj = await crmApi.createProject(client.id);
      await crmApi.saveAuditLog({
        projectId: newProj.id,
        clientId: client.id,
        actionType: 'Створення угоди',
        details: `Створено нову угоду: "${newProj.name}"`
      });
      await loadProjects();
    } catch (error) {
      alert('Помилка створення угоди: ' + error.message);
      setLoading(false);
    }
  };

  const handleSaveClientInfo = async () => {
    if (!clientName.trim()) {
      alert("Ім'я контрагента не може бути порожнім.");
      return;
    }
    setLoading(true);
    try {
      const updated = await crmApi.saveClient({
        id: client.id,
        name: clientName.trim(),
        phone: clientPhone.trim(),
        note: clientNote.trim()
      });
      await crmApi.saveAuditLog({
        clientId: client.id,
        actionType: 'Редагування контрагента',
        details: `Оновлено контактні дані: Ім'я: "${updated.name}", Телефон: "${updated.phone || ''}", Коментар: "${updated.note || ''}"`
      });
      
      // Update local object immediately to avoid layout lag
      client.name = updated.name;
      client.phone = updated.phone;
      client.note = updated.note;
      
      setIsEditingClient(false);
      if (onUpdate) await onUpdate();
    } catch (error) {
      console.error('Failed to save client info', error);
      alert('Помилка збереження даних контрагента: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Розрахунок загальних показників по всіх угодах клієнта (тільки активні, без завершених та скасованих)
  const nonCancelledProjects = projects.filter(p => p.status !== 'Скасовано' && p.status !== 'Завершено');

  let totalAgreedUSD = 0;
  let totalPaidUSD = 0;
  let totalAgreedUAH = 0;
  let totalPaidUAH = 0;

  nonCancelledProjects.forEach(p => {
    const validPayments = (p.project_payments || []).filter(pay => !pay.status?.toLowerCase().includes('скасовано'));
    const paidUSD = validPayments.filter(pay => pay.currency === 'USD').reduce((acc, pay) => acc + (parseFloat(pay.sum) || 0), 0);
    const paidUAH = validPayments.filter(pay => pay.currency === 'UAH').reduce((acc, pay) => acc + (parseFloat(pay.sum) || 0), 0);
    
    totalAgreedUSD += parseFloat(p.agreed_sum_usd) || 0;
    totalPaidUSD += paidUSD;
    totalAgreedUAH += parseFloat(p.agreed_sum_uah) || 0;
    totalPaidUAH += paidUAH;
  });

  const totalDebtUSD = totalAgreedUSD - totalPaidUSD;
  const totalDebtUAH = totalAgreedUAH - totalPaidUAH;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FAF8F5', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header - Warm light coffee theme */}
      <div style={{ background: '#FAF6F0', borderBottom: '1px solid #D4C5B9', padding: '20px 24px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(139, 125, 112, 0.05)' }}>
        <div style={{ maxWidth: '100%', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'stretch' : 'center', 
            gap: '16px' 
          }}>
            {/* Left: Client name, phone, back button */}
            <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', gap: '16px', flexDirection: isMobile ? 'column' : 'row', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={onBack}
                  style={{ 
                    background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '8px', 
                    padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: '#8B7D73', transition: 'all 0.2s', flexShrink: 0 
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#EAE7E2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                >
                  <ChevronLeft size={18} />
                </button>
                
                {!isEditingClient && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#2C2520', letterSpacing: '0.2px' }}>{client.name}</h2>
                      <button
                        onClick={() => setIsEditingClient(true)}
                        title="Редагувати контактну інформацію"
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #D4C5B9',
                          color: '#8B7D73',
                          cursor: 'pointer',
                          padding: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 2px rgba(139, 125, 112, 0.05)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#EAE7E2'; e.currentTarget.style.color = '#2C2520'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#8B7D73'; }}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '13px', color: '#8B7D73' }}>
                      {client.phone ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><Phone size={13} color="#C4B4A6" /> {client.phone}</span>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#B3A395' }}>Телефон не вказано</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isEditingClient && (
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #D4C5B9',
                  borderRadius: '12px',
                  padding: '16px',
                  width: '100%',
                  maxWidth: '500px',
                  boxSizing: 'border-box',
                  boxShadow: '0 4px 12px rgba(139, 125, 112, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Редагувати контактну інформацію
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#2C2520' }}>Ім'я контрагента *</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Введіть ім'я контрагента..."
                      style={{
                        padding: '8px 12px',
                        fontSize: '13px',
                        color: '#2C2520',
                        border: '1px solid #D4C5B9',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#FAF8F5',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#C4B4A6'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#D4C5B9'; }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#2C2520' }}>Телефон</label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Введіть номер телефону..."
                      style={{
                        padding: '8px 12px',
                        fontSize: '13px',
                        color: '#2C2520',
                        border: '1px solid #D4C5B9',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#FAF8F5',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#C4B4A6'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#D4C5B9'; }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#2C2520' }}>Коментар менеджера</label>
                    <textarea
                      value={clientNote}
                      onChange={(e) => setClientNote(e.target.value)}
                      placeholder="Введіть коментар або додаткову інформацію..."
                      rows={2}
                      style={{
                        padding: '8px 12px',
                        fontSize: '13px',
                        color: '#2C2520',
                        border: '1px solid #D4C5B9',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#FAF8F5',
                        width: '100%',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#C4B4A6'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#D4C5B9'; }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      onClick={() => {
                        setIsEditingClient(false);
                        setClientName(client.name || '');
                        setClientPhone(client.phone || '');
                        setClientNote(client.note || '');
                      }}
                      disabled={loading}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #D4C5B9',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#8B7D73',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF6F0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                    >
                      Скасувати
                    </button>
                    <button
                      onClick={handleSaveClientInfo}
                      disabled={loading}
                      style={{
                        background: '#C4B4A6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: '0 2px 4px rgba(139, 125, 112, 0.15)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#B3A395'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#C4B4A6'; }}
                    >
                      {loading ? 'Збереження...' : 'Зберегти'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: compact general balance widget */}
            {projects.filter(p => p.status !== 'Скасовано').length > 0 && (
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #D4C5B9',
                borderRadius: '10px',
                padding: '8px 14px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '10px' : '16px',
                boxShadow: '0 2px 6px rgba(139, 125, 112, 0.04)',
                boxSizing: 'border-box',
                alignSelf: isMobile ? 'stretch' : 'auto'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRight: isMobile ? 'none' : '1px solid #FAF6F0', 
                  borderBottom: isMobile ? '1px solid #FAF6F0' : 'none',
                  paddingRight: isMobile ? '0' : '14px', 
                  paddingBottom: isMobile ? '6px' : '0'
                }}>
                  <span style={{ fontSize: '10px', color: '#8B7D73', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Загальний баланс</span>
                  <span style={{ fontSize: '11px', color: '#C4B4A6', marginTop: '1px' }}>{projects.filter(p => p.status !== 'Скасовано').length} активних угод</span>
                </div>

                {/* USD Summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '30px', height: '30px', borderRadius: '50%', background: '#FAF6F0', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                    border: '1px solid #D4C5B9'
                  }}>
                    🇺🇸
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: totalDebtUSD < 0 ? '#15803D' : totalDebtUSD > 0 ? '#1D4ED8' : '#2C2520' }}>
                      {totalDebtUSD < 0 ? `Переплата: $${Math.abs(Math.round(totalDebtUSD)).toLocaleString('en-US')}` : totalDebtUSD > 0 ? `Борг: $${Math.round(totalDebtUSD).toLocaleString('en-US')}` : 'Оплачено'}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#8B7D73' }}>
                      Угоди: ${Math.round(totalAgreedUSD).toLocaleString('en-US')} | Спл: ${Math.round(totalPaidUSD).toLocaleString('en-US')}
                    </div>
                  </div>
                </div>

                {/* Divider on desktop */}
                {!isMobile && <div style={{ height: '28px', width: '1px', background: '#FAF6F0' }} />}

                {/* UAH Summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '30px', height: '30px', borderRadius: '50%', background: '#FAF6F0', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                    border: '1px solid #D4C5B9'
                  }}>
                    🇺🇦
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: totalDebtUAH < 0 ? '#15803D' : totalDebtUAH > 0 ? '#C2410C' : '#2C2520' }}>
                      {totalDebtUAH < 0 ? `Переплата: ${Math.abs(Math.round(totalDebtUAH)).toLocaleString('uk-UA')} ₴` : totalDebtUAH > 0 ? `Борг: ${Math.round(totalDebtUAH).toLocaleString('uk-UA')} ₴` : 'Оплачено'}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#8B7D73' }}>
                      Угоди: {Math.round(totalAgreedUAH).toLocaleString('uk-UA')} ₴ | Спл: {Math.round(totalPaidUAH).toLocaleString('uk-UA')} ₴
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Client Note / Comment - Beautiful styled card */}
          {!isEditingClient && client.note && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #D4C5B9',
              borderLeft: '4px solid #C4B4A6',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '13px',
              color: '#2C2520',
              boxShadow: '0 2px 4px rgba(139, 125, 112, 0.03)'
            }}>
              <strong style={{ display: 'block', fontSize: '11px', color: '#8B7D73', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Коментар менеджера</strong>
              <span style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{client.note}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '100%', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* Left Sidebar - 330px width on desktop, only when there is more than 0 non-cancelled projects */}
          {!isMobile && nonCancelledProjects.length > 0 && (
            <div style={{ width: '330px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Зведена фінансова відомість по угодах */}
              <div style={{ 
                background: '#FFFFFF', 
                border: '1px solid #D4C5B9', 
                borderRadius: '16px', 
                padding: '16px', 
                boxShadow: '0 4px 12px rgba(139, 125, 112, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📊</span> Зведена відомість по угодах
                  </span>
                  <span style={{ display: 'flex', gap: '2px' }}>
                    {['both', 'USD', 'UAH'].map(mode => (
                      <button key={mode}
                        onClick={() => setLedgerDisplayCurrency(mode)}
                        style={{
                          padding: '2px 7px',
                          fontSize: '9px',
                          fontWeight: ledgerDisplayCurrency === mode ? 800 : 600,
                          border: `1px solid ${ledgerDisplayCurrency === mode ? '#8B7D73' : '#D4C5B9'}`,
                          borderRadius: '5px',
                          background: ledgerDisplayCurrency === mode ? '#2C2520' : '#FAF8F5',
                          color: ledgerDisplayCurrency === mode ? '#FFFFFF' : '#8B7D73',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          textTransform: 'none'
                        }}
                      >
                        {mode === 'both' ? 'Обидві' : mode === 'USD' ? '$' : '₴'}
                      </button>
                    ))}
                  </span>
                </h4>
                {ledgerDisplayCurrency === 'both' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 13px 6px 13px', borderBottom: '1px solid #EAE7E2', marginTop: '4px' }}>
                    <span style={{ width: '55px', flexShrink: 0 }}>Валюта</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Договір / Сплачено</span>
                    <span style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}><span style={{ color: '#C2410C' }}>Борг</span> / <span style={{ color: '#15803D' }}>Переплата</span></span>
                  </div>
                )}
                {ledgerDisplayCurrency !== 'both' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 13px 6px 13px', borderBottom: '1px solid #EAE7E2', marginTop: '4px' }}>
                    <span style={{ flex: 1, textAlign: 'center' }}>Договір / Сплачено</span>
                    <span style={{ width: '100px', textAlign: 'right', flexShrink: 0 }}><span style={{ color: '#C2410C' }}>Борг</span> / <span style={{ color: '#15803D' }}>Переплата</span></span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {nonCancelledProjects.map(p => {
                    const validPayments = (p.project_payments || []).filter(pay => !pay.status?.toLowerCase().includes('скасовано'));
                    const paidUSD = validPayments.filter(pay => pay.currency === 'USD').reduce((acc, pay) => acc + (parseFloat(pay.sum) || 0), 0);
                    const paidUAH = validPayments.filter(pay => pay.currency === 'UAH').reduce((acc, pay) => acc + (parseFloat(pay.sum) || 0), 0);
                    
                    const agreedUSD = parseFloat(p.agreed_sum_usd) || 0;
                    const agreedUAH = parseFloat(p.agreed_sum_uah) || 0;
                    const debtUSD = agreedUSD - paidUSD;
                    const debtUAH = agreedUAH - paidUAH;

                    const rate = parseFloat(exchangeRateInput) || 1;

                    const mapped = (() => {
                      const raw = p.status || 'Борг';
                      if (raw === 'Нова угода' || raw === 'В роботі' || raw === 'Борг') return 'Борг';
                      if (raw === 'Повна оплата / Передоплата' || raw === 'Часткова оплата') return 'Часткова оплата';
                      if (raw === 'До відвантаження' || raw === 'Відвантаження' || raw === 'Повна оплата') return 'Повна оплата';
                      return raw;
                    })();
                    const bg = mapped === 'Завершено' ? '#E6F4EA' : mapped === 'Повна оплата' ? '#FFF4E5' : mapped === 'Часткова оплата' ? '#E0F2FE' : '#FEF2F2';
                    const color = mapped === 'Завершено' ? '#137333' : mapped === 'Повна оплата' ? '#B06000' : mapped === 'Часткова оплата' ? '#0369A1' : '#991B1B';
                    const border = mapped === 'Завершено' ? '#CEEAD6' : mapped === 'Повна оплата' ? '#FFE0B2' : mapped === 'Часткова оплата' ? '#BAE6FD' : '#FECACA';

                    // Unified amounts based on selected currency
                    const uniAgreed = ledgerDisplayCurrency === 'USD' ? agreedUSD + agreedUAH / rate : agreedUAH + agreedUSD * rate;
                    const uniPaid = ledgerDisplayCurrency === 'USD' ? paidUSD + paidUAH / rate : paidUAH + paidUSD * rate;
                    const uniDebt = uniAgreed - uniPaid;
                    const sym = ledgerDisplayCurrency === 'USD' ? '$' : '₴';
                    const loc = ledgerDisplayCurrency === 'USD' ? 'en-US' : 'uk-UA';
                    const fmtAmt = (v) => ledgerDisplayCurrency === 'USD' ? `$${Math.round(v).toLocaleString(loc)}` : `${Math.round(v).toLocaleString(loc)} ₴`;
                    const fmtDebt = (v) => {
                      if (ledgerDisplayCurrency === 'USD') return v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString(loc)}` : `$${Math.round(v).toLocaleString(loc)}`;
                      return v < 0 ? `-${Math.abs(Math.round(v)).toLocaleString(loc)} ₴` : `${Math.round(v).toLocaleString(loc)} ₴`;
                    };

                    return (
                      <div key={p.id} style={{ border: '1px solid #EAE7E2', borderRadius: '10px', padding: '10px 12px', background: '#FAFDFD' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '12px', color: '#2C2520', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }} title={p.address || p.name || `Угода #${p.id.slice(0, 5)}`}>
                            {p.address || p.name || `Угода #${p.id.slice(0, 5)}`}
                          </span>
                          <span style={{ 
                            background: bg, color: color, border: `1px solid ${border}`,
                            fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', textTransform: 'uppercase'
                          }}>
                            {mapped}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                          {ledgerDisplayCurrency === 'both' ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px dotted #EAE7E2', paddingBottom: '3px' }}>
                                <span style={{ color: '#8B7D73', width: '55px', flexShrink: 0 }}>🇺🇸 USD:</span>
                                <span style={{ fontWeight: 600, color: '#4A607A', flex: 1, textAlign: 'center' }}>
                                  ${Math.round(agreedUSD).toLocaleString('en-US')} / <span style={{ color: '#15803D' }}>${Math.round(paidUSD).toLocaleString('en-US')}</span>
                                </span>
                                <span style={{ fontWeight: 800, color: debtUSD < 0 ? '#15803D' : debtUSD > 0 ? '#1D4ED8' : '#2C2520', width: '90px', textAlign: 'right', flexShrink: 0 }}>
                                  {debtUSD < 0 ? `-$${Math.abs(Math.round(debtUSD)).toLocaleString('en-US')}` : `$${Math.round(debtUSD).toLocaleString('en-US')}`}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: '#8B7D73', width: '55px', flexShrink: 0 }}>🇺🇦 UAH:</span>
                                <span style={{ fontWeight: 600, color: '#8C7355', flex: 1, textAlign: 'center' }}>
                                  {Math.round(agreedUAH).toLocaleString('uk-UA')} / <span style={{ color: '#15803D' }}>{Math.round(paidUAH).toLocaleString('uk-UA')}</span>
                                </span>
                                <span style={{ fontWeight: 800, color: debtUAH < 0 ? '#15803D' : debtUAH > 0 ? '#C2410C' : '#2C2520', width: '90px', textAlign: 'right', flexShrink: 0 }}>
                                  {debtUAH < 0 ? `-${Math.abs(Math.round(debtUAH)).toLocaleString('uk-UA')} ₴` : `${Math.round(debtUAH).toLocaleString('uk-UA')} ₴`}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, color: ledgerDisplayCurrency === 'USD' ? '#4A607A' : '#8C7355', flex: 1, textAlign: 'center' }}>
                                {fmtAmt(uniAgreed)} / <span style={{ color: '#15803D' }}>{fmtAmt(uniPaid)}</span>
                              </span>
                              <span style={{ fontWeight: 800, color: uniDebt < 0 ? '#15803D' : uniDebt > 0 ? (ledgerDisplayCurrency === 'USD' ? '#1D4ED8' : '#C2410C') : '#2C2520', width: '100px', textAlign: 'right', flexShrink: 0 }}>
                                {fmtDebt(uniDebt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Grand totals card */}
                <div style={{ background: '#FAF6F0', border: '1px solid #D4C5B9', borderRadius: '10px', padding: '10px 12px', marginTop: '4px', fontSize: '11px' }}>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', color: '#2C2520', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🤝</span> Всього по усіх угодах:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {ledgerDisplayCurrency === 'both' ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px dotted #D4C5B9', paddingBottom: '3px' }}>
                          <span style={{ color: '#8B7D73', fontWeight: 600, width: '55px', flexShrink: 0 }}>🇺🇸 USD:</span>
                          <span style={{ fontWeight: 600, color: '#4A607A', flex: 1, textAlign: 'center' }}>
                            ${Math.round(totalAgreedUSD).toLocaleString('en-US')} / <span style={{ color: '#15803D' }}>${Math.round(totalPaidUSD).toLocaleString('en-US')}</span>
                          </span>
                          <span style={{ fontWeight: 900, color: totalDebtUSD < 0 ? '#15803D' : totalDebtUSD > 0 ? '#1D4ED8' : '#2C2520', width: '90px', textAlign: 'right', flexShrink: 0 }}>
                            {totalDebtUSD < 0 ? `-$${Math.abs(Math.round(totalDebtUSD)).toLocaleString('en-US')}` : `$${Math.round(totalDebtUSD).toLocaleString('en-US')}`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: '#8B7D73', fontWeight: 600, width: '55px', flexShrink: 0 }}>🇺🇦 UAH:</span>
                          <span style={{ fontWeight: 600, color: '#8C7355', flex: 1, textAlign: 'center' }}>
                            {Math.round(totalAgreedUAH).toLocaleString('uk-UA')} / <span style={{ color: '#15803D' }}>{Math.round(totalPaidUAH).toLocaleString('uk-UA')}</span>
                          </span>
                          <span style={{ fontWeight: 900, color: totalDebtUAH < 0 ? '#15803D' : totalDebtUAH > 0 ? '#C2410C' : '#2C2520', width: '90px', textAlign: 'right', flexShrink: 0 }}>
                            {totalDebtUAH < 0 ? `-${Math.abs(Math.round(totalDebtUAH)).toLocaleString('uk-UA')} ₴` : `${Math.round(totalDebtUAH).toLocaleString('uk-UA')} ₴`}
                          </span>
                        </div>
                      </>
                    ) : (() => {
                      const rate = parseFloat(exchangeRateInput) || 1;
                      const tAgreed = ledgerDisplayCurrency === 'USD' ? totalAgreedUSD + totalAgreedUAH / rate : totalAgreedUAH + totalAgreedUSD * rate;
                      const tPaid = ledgerDisplayCurrency === 'USD' ? totalPaidUSD + totalPaidUAH / rate : totalPaidUAH + totalPaidUSD * rate;
                      const tDebt = tAgreed - tPaid;
                      const loc = ledgerDisplayCurrency === 'USD' ? 'en-US' : 'uk-UA';
                      const fA = (v) => ledgerDisplayCurrency === 'USD' ? `$${Math.round(v).toLocaleString(loc)}` : `${Math.round(v).toLocaleString(loc)} ₴`;
                      const fD = (v) => {
                        if (ledgerDisplayCurrency === 'USD') return v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString(loc)}` : `$${Math.round(v).toLocaleString(loc)}`;
                        return v < 0 ? `-${Math.abs(Math.round(v)).toLocaleString(loc)} ₴` : `${Math.round(v).toLocaleString(loc)} ₴`;
                      };
                      return (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: ledgerDisplayCurrency === 'USD' ? '#4A607A' : '#8C7355', flex: 1, textAlign: 'center' }}>
                            {fA(tAgreed)} / <span style={{ color: '#15803D' }}>{fA(tPaid)}</span>
                          </span>
                          <span style={{ fontWeight: 900, color: tDebt < 0 ? '#15803D' : tDebt > 0 ? (ledgerDisplayCurrency === 'USD' ? '#1D4ED8' : '#C2410C') : '#2C2520', width: '100px', textAlign: 'right', flexShrink: 0 }}>
                            {fD(tDebt)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Consolidated Balance Section */}
                  <div style={{ borderTop: '1px solid #D4C5B9', marginTop: '8px', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        Консолідований баланс:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#8B7D73' }}>
                        <span>курс $:</span>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          value={exchangeRateInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                            setExchangeRateInput(val);
                          }}
                          style={{
                            width: '50px',
                            border: '1px solid #D4C5B9',
                            borderRadius: '4px',
                            padding: '1px 3px',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: '#2C2520',
                            background: '#FFFFFF',
                            textAlign: 'center',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                    {(() => {
                      const rate = parseFloat(exchangeRateInput) || 0;
                      // Consolidated debt in UAH: positive is client owes us, negative is we owe client
                      const netDebtUAH = totalDebtUAH + (totalDebtUSD * rate);
                      const netDebtUSD = totalDebtUSD + (totalDebtUAH / rate);
                      
                      const isClientOwes = netDebtUAH > 0;
                      const isZero = Math.abs(netDebtUAH) < 1;
                      
                      if (isZero) {
                        return (
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#2C2520', textAlign: 'center', padding: '2px 0' }}>
                            ⚖️ Розрахунки повністю закриті
                          </div>
                        );
                      }
                      
                      const color = isClientOwes ? '#1D4ED8' : '#15803D';
                      const bg = isClientOwes ? '#EFF6FF' : '#F0FDF4';
                      const border = isClientOwes ? '#DBEAFE' : '#DCFCE7';
                      const label = isClientOwes ? 'Клієнт винен нам' : 'Ми винні клієнту';
                      
                      return (
                        <div style={{ 
                          background: bg, 
                          border: `1px solid ${border}`, 
                          borderRadius: '6px', 
                          padding: '6px 8px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '2px'
                        }}>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            {label}:
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '13px', fontWeight: 900, color }}>
                              ${Math.round(Math.abs(netDebtUSD)).toLocaleString('en-US')}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#8B7D73' }}>
                              або ~{Math.round(Math.abs(netDebtUAH)).toLocaleString('uk-UA')} ₴
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Main Content Area - flex: 1 */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', width: '100%' }}>
            
            {/* Header: Title and Create Deal button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#2C2520', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#C4B4A6" />
                Угоди контрагента ({projects.length})
              </h3>
              <button 
                onClick={handleCreateProject}
                disabled={loading}
                style={{ 
                  background: '#C4B4A6', color: 'white', border: 'none', borderRadius: '6px', 
                  padding: '8px 16px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                  opacity: loading ? 0.7 : 1, transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(139, 125, 112, 0.15)'
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#B3A395'; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#C4B4A6'; }}
              >
                <Plus size={14} /> Нова угода
              </button>
            </div>

            {loading && projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8B7D73', fontSize: '13px', fontWeight: 500 }}>Завантаження інформації про угоди...</div>
            ) : projects.length === 0 ? (
              <div style={{ background: '#FFFFFF', border: '1px dashed #D4C5B9', borderRadius: '12px', padding: '60px 40px', textAlign: 'center', color: '#8B7D73', fontSize: '14px' }}>
                У цього контрагента ще немає активних або завершених угод. Натисніть кнопку вище, щоб створити нову угоду.
              </div>
            ) : (() => {
              const activeProjects = projects.filter(p => p.status !== 'Завершено' && p.status !== 'Скасовано');
              const archivedProjects = projects.filter(p => p.status === 'Завершено' || p.status === 'Скасовано');
              const nonCancelledProjects = activeProjects;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* On Mobile: Зведена відомість по усіх угодах (shown at the top of the main area) */}
                  {isMobile && nonCancelledProjects.length > 0 && (
                    <div style={{ 
                      background: '#FFFFFF', 
                      border: '1px solid #D4C5B9', 
                      borderRadius: '16px', 
                      padding: '16px', 
                      boxShadow: '0 4px 12px rgba(139, 125, 112, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📊</span> Зведена відомість по угодах
                        </span>
                        <span style={{ display: 'flex', gap: '2px' }}>
                          {['both', 'USD', 'UAH'].map(mode => (
                            <button key={mode}
                              onClick={() => setLedgerDisplayCurrency(mode)}
                              style={{
                                padding: '2px 7px',
                                fontSize: '9px',
                                fontWeight: ledgerDisplayCurrency === mode ? 800 : 600,
                                border: `1px solid ${ledgerDisplayCurrency === mode ? '#8B7D73' : '#D4C5B9'}`,
                                borderRadius: '5px',
                                background: ledgerDisplayCurrency === mode ? '#2C2520' : '#FAF8F5',
                                color: ledgerDisplayCurrency === mode ? '#FFFFFF' : '#8B7D73',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                textTransform: 'none'
                              }}
                            >
                              {mode === 'both' ? 'Обидві' : mode === 'USD' ? '$' : '₴'}
                            </button>
                          ))}
                        </span>
                      </h4>
                      {ledgerDisplayCurrency === 'both' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 13px 6px 13px', borderBottom: '1px solid #EAE7E2', marginTop: '4px' }}>
                          <span style={{ width: '55px', flexShrink: 0 }}>Валюта</span>
                          <span style={{ flex: 1, textAlign: 'center' }}>Договір / Сплачено</span>
                          <span style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}><span style={{ color: '#C2410C' }}>Борг</span> / <span style={{ color: '#15803D' }}>Переплата</span></span>
                        </div>
                      )}
                      {ledgerDisplayCurrency !== 'both' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 13px 6px 13px', borderBottom: '1px solid #EAE7E2', marginTop: '4px' }}>
                          <span style={{ flex: 1, textAlign: 'center' }}>Договір / Сплачено</span>
                          <span style={{ width: '100px', textAlign: 'right', flexShrink: 0 }}><span style={{ color: '#C2410C' }}>Борг</span> / <span style={{ color: '#15803D' }}>Переплата</span></span>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {nonCancelledProjects.map(p => {
                          const validPayments = (p.project_payments || []).filter(pay => !pay.status?.toLowerCase().includes('скасовано'));
                          const paidUSD = validPayments.filter(pay => pay.currency === 'USD').reduce((acc, pay) => acc + (parseFloat(pay.sum) || 0), 0);
                          const paidUAH = validPayments.filter(pay => pay.currency === 'UAH').reduce((acc, pay) => acc + (parseFloat(pay.sum) || 0), 0);
                          
                          const agreedUSD = parseFloat(p.agreed_sum_usd) || 0;
                          const agreedUAH = parseFloat(p.agreed_sum_uah) || 0;
                          const debtUSD = agreedUSD - paidUSD;
                          const debtUAH = agreedUAH - paidUAH;

                          const rate = parseFloat(exchangeRateInput) || 1;

                          const mapped = (() => {
                            const raw = p.status || 'Борг';
                            if (raw === 'Нова угода' || raw === 'В роботі' || raw === 'Борг') return 'Борг';
                            if (raw === 'Повна оплата / Передоплата' || raw === 'Часткова оплата') return 'Часткова оплата';
                            if (raw === 'До відвантаження' || raw === 'Відвантаження' || raw === 'Повна оплата') return 'Повна оплата';
                            return raw;
                          })();
                          const bg = mapped === 'Завершено' ? '#E6F4EA' : mapped === 'Повна оплата' ? '#FFF4E5' : mapped === 'Часткова оплата' ? '#E0F2FE' : '#FEF2F2';
                          const color = mapped === 'Завершено' ? '#137333' : mapped === 'Повна оплата' ? '#B06000' : mapped === 'Часткова оплата' ? '#0369A1' : '#991B1B';
                          const border = mapped === 'Завершено' ? '#CEEAD6' : mapped === 'Повна оплата' ? '#FFE0B2' : mapped === 'Часткова оплата' ? '#BAE6FD' : '#FECACA';

                          const uniAgreed = ledgerDisplayCurrency === 'USD' ? agreedUSD + agreedUAH / rate : agreedUAH + agreedUSD * rate;
                          const uniPaid = ledgerDisplayCurrency === 'USD' ? paidUSD + paidUAH / rate : paidUAH + paidUSD * rate;
                          const uniDebt = uniAgreed - uniPaid;
                          const loc = ledgerDisplayCurrency === 'USD' ? 'en-US' : 'uk-UA';
                          const fmtAmt = (v) => ledgerDisplayCurrency === 'USD' ? `$${Math.round(v).toLocaleString(loc)}` : `${Math.round(v).toLocaleString(loc)} ₴`;
                          const fmtDebt = (v) => {
                            if (ledgerDisplayCurrency === 'USD') return v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString(loc)}` : `$${Math.round(v).toLocaleString(loc)}`;
                            return v < 0 ? `-${Math.abs(Math.round(v)).toLocaleString(loc)} ₴` : `${Math.round(v).toLocaleString(loc)} ₴`;
                          };

                          return (
                            <div key={p.id} style={{ border: '1px solid #EAE7E2', borderRadius: '10px', padding: '10px 12px', background: '#FAFDFD' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 800, fontSize: '12px', color: '#2C2520', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }} title={p.address || p.name || `Угода #${p.id.slice(0, 5)}`}>
                                  {p.address || p.name || `Угода #${p.id.slice(0, 5)}`}
                                </span>
                                <span style={{ 
                                  background: bg, color: color, border: `1px solid ${border}`,
                                  fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', textTransform: 'uppercase'
                                }}>
                                  {mapped}
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                                {ledgerDisplayCurrency === 'both' ? (
                                  <>
                                    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px dotted #EAE7E2', paddingBottom: '3px' }}>
                                      <span style={{ color: '#8B7D73', width: '55px', flexShrink: 0 }}>🇺🇸 USD:</span>
                                      <span style={{ fontWeight: 600, color: '#4A607A', flex: 1, textAlign: 'center' }}>
                                        ${Math.round(agreedUSD).toLocaleString('en-US')} / <span style={{ color: '#15803D' }}>${Math.round(paidUSD).toLocaleString('en-US')}</span>
                                      </span>
                                      <span style={{ fontWeight: 800, color: debtUSD < 0 ? '#15803D' : debtUSD > 0 ? '#1D4ED8' : '#2C2520', width: '90px', textAlign: 'right', flexShrink: 0 }}>
                                        {debtUSD < 0 ? `-$${Math.abs(Math.round(debtUSD)).toLocaleString('en-US')}` : `$${Math.round(debtUSD).toLocaleString('en-US')}`}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <span style={{ color: '#8B7D73', width: '55px', flexShrink: 0 }}>🇺🇦 UAH:</span>
                                      <span style={{ fontWeight: 600, color: '#8C7355', flex: 1, textAlign: 'center' }}>
                                        {Math.round(agreedUAH).toLocaleString('uk-UA')} / <span style={{ color: '#15803D' }}>{Math.round(paidUAH).toLocaleString('uk-UA')}</span>
                                      </span>
                                      <span style={{ fontWeight: 800, color: debtUAH < 0 ? '#15803D' : debtUAH > 0 ? '#C2410C' : '#2C2520', width: '90px', textAlign: 'right', flexShrink: 0 }}>
                                        {debtUAH < 0 ? `-${Math.abs(Math.round(debtUAH)).toLocaleString('uk-UA')} ₴` : `${Math.round(debtUAH).toLocaleString('uk-UA')} ₴`}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: ledgerDisplayCurrency === 'USD' ? '#4A607A' : '#8C7355', flex: 1, textAlign: 'center' }}>
                                      {fmtAmt(uniAgreed)} / <span style={{ color: '#15803D' }}>{fmtAmt(uniPaid)}</span>
                                    </span>
                                    <span style={{ fontWeight: 800, color: uniDebt < 0 ? '#15803D' : uniDebt > 0 ? (ledgerDisplayCurrency === 'USD' ? '#1D4ED8' : '#C2410C') : '#2C2520', width: '100px', textAlign: 'right', flexShrink: 0 }}>
                                      {fmtDebt(uniDebt)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ background: '#FAF6F0', border: '1px solid #D4C5B9', borderRadius: '10px', padding: '10px 12px', marginTop: '4px', fontSize: '11px' }}>
                        <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', color: '#2C2520', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>🤝</span> Всього по усіх угодах:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {ledgerDisplayCurrency === 'both' ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px dotted #D4C5B9', paddingBottom: '3px' }}>
                                <span style={{ color: '#8B7D73', fontWeight: 600, width: '55px', flexShrink: 0 }}>🇺🇸 USD:</span>
                                <span style={{ fontWeight: 600, color: '#4A607A', flex: 1, textAlign: 'center' }}>
                                  ${Math.round(totalAgreedUSD).toLocaleString('en-US')} / <span style={{ color: '#15803D' }}>${Math.round(totalPaidUSD).toLocaleString('en-US')}</span>
                                </span>
                                <span style={{ fontWeight: 900, color: totalDebtUSD < 0 ? '#15803D' : totalDebtUSD > 0 ? '#1D4ED8' : '#2C2520', width: '90px', textAlign: 'right', flexShrink: 0 }}>
                                  {totalDebtUSD < 0 ? `-$${Math.abs(Math.round(totalDebtUSD)).toLocaleString('en-US')}` : `$${Math.round(totalDebtUSD).toLocaleString('en-US')}`}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: '#8B7D73', fontWeight: 600, width: '55px', flexShrink: 0 }}>🇺🇦 UAH:</span>
                                <span style={{ fontWeight: 600, color: '#8C7355', flex: 1, textAlign: 'center' }}>
                                  {Math.round(totalAgreedUAH).toLocaleString('uk-UA')} / <span style={{ color: '#15803D' }}>{Math.round(totalPaidUAH).toLocaleString('uk-UA')}</span>
                                </span>
                                <span style={{ fontWeight: 900, color: totalDebtUAH < 0 ? '#15803D' : totalDebtUAH > 0 ? '#C2410C' : '#2C2520', width: '90px', textAlign: 'right', flexShrink: 0 }}>
                                  {totalDebtUAH < 0 ? `-${Math.abs(Math.round(totalDebtUAH)).toLocaleString('uk-UA')} ₴` : `${Math.round(totalDebtUAH).toLocaleString('uk-UA')} ₴`}
                                </span>
                              </div>
                            </>
                          ) : (() => {
                            const rate = parseFloat(exchangeRateInput) || 1;
                            const tAgreed = ledgerDisplayCurrency === 'USD' ? totalAgreedUSD + totalAgreedUAH / rate : totalAgreedUAH + totalAgreedUSD * rate;
                            const tPaid = ledgerDisplayCurrency === 'USD' ? totalPaidUSD + totalPaidUAH / rate : totalPaidUAH + totalPaidUSD * rate;
                            const tDebt = tAgreed - tPaid;
                            const loc = ledgerDisplayCurrency === 'USD' ? 'en-US' : 'uk-UA';
                            const fA = (v) => ledgerDisplayCurrency === 'USD' ? `$${Math.round(v).toLocaleString(loc)}` : `${Math.round(v).toLocaleString(loc)} ₴`;
                            const fD = (v) => {
                              if (ledgerDisplayCurrency === 'USD') return v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString(loc)}` : `$${Math.round(v).toLocaleString(loc)}`;
                              return v < 0 ? `-${Math.abs(Math.round(v)).toLocaleString(loc)} ₴` : `${Math.round(v).toLocaleString(loc)} ₴`;
                            };
                            return (
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: ledgerDisplayCurrency === 'USD' ? '#4A607A' : '#8C7355', flex: 1, textAlign: 'center' }}>
                                  {fA(tAgreed)} / <span style={{ color: '#15803D' }}>{fA(tPaid)}</span>
                                </span>
                                <span style={{ fontWeight: 900, color: tDebt < 0 ? '#15803D' : tDebt > 0 ? (ledgerDisplayCurrency === 'USD' ? '#1D4ED8' : '#C2410C') : '#2C2520', width: '100px', textAlign: 'right', flexShrink: 0 }}>
                                  {fD(tDebt)}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Consolidated Balance Section */}
                        <div style={{ borderTop: '1px solid #D4C5B9', marginTop: '8px', paddingTop: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                              Консолідований баланс:
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#8B7D73' }}>
                              <span>курс $:</span>
                              <input 
                                type="text" 
                                inputMode="decimal"
                                value={exchangeRateInput}
                                onChange={(e) => {
                                  const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                                  setExchangeRateInput(val);
                                }}
                                style={{
                                  width: '50px',
                                  border: '1px solid #D4C5B9',
                                  borderRadius: '4px',
                                  padding: '1px 3px',
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  color: '#2C2520',
                                  background: '#FFFFFF',
                                  textAlign: 'center',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </div>
                          {(() => {
                            const rate = parseFloat(exchangeRateInput) || 0;
                            // Consolidated debt in UAH: positive is client owes us, negative is we owe client
                            const netDebtUAH = totalDebtUAH + (totalDebtUSD * rate);
                            const netDebtUSD = totalDebtUSD + (totalDebtUAH / rate);
                            
                            const isClientOwes = netDebtUAH > 0;
                            const isZero = Math.abs(netDebtUAH) < 1;
                            
                            if (isZero) {
                              return (
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#2C2520', textAlign: 'center', padding: '2px 0' }}>
                                  ⚖️ Розрахунки повністю закриті
                                </div>
                              );
                            }
                            
                            const color = isClientOwes ? '#1D4ED8' : '#15803D';
                            const bg = isClientOwes ? '#EFF6FF' : '#F0FDF4';
                            const border = isClientOwes ? '#DBEAFE' : '#DCFCE7';
                            const label = isClientOwes ? 'Клієнт винен нам' : 'Ми винні клієнту';
                            
                            return (
                              <div style={{ 
                                background: bg, 
                                border: `1px solid ${border}`, 
                                borderRadius: '6px', 
                                padding: '6px 8px', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '2px'
                              }}>
                                <div style={{ fontSize: '9px', fontWeight: 700, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                  {label}:
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 900, color }}>
                                    ${Math.round(Math.abs(netDebtUSD)).toLocaleString('en-US')}
                                  </span>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#8B7D73' }}>
                                    або ~{Math.round(Math.abs(netDebtUAH)).toLocaleString('uk-UA')} ₴
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Deals */}
                  <div>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '8px' }}>🟢</span> Активні угоди ({activeProjects.length})
                    </h4>
                    {activeProjects.length === 0 ? (
                      <div style={{ background: '#FFFFFF', border: '1px dashed #D4C5B9', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#8B7D73', fontSize: '13px' }}>
                        Немає активних угод. Усі угоди завершено та перенесено в архів, або ще не створено.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {activeProjects.map(project => (
                          <ProjectCRMCard 
                            key={project.id} 
                            project={project} 
                            client={client} 
                            onUpdate={loadProjects} 
                            isMobile={isMobile} 
                            ledgerDisplayCurrency={ledgerDisplayCurrency}
                            exchangeRateInput={exchangeRateInput}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Archive Section */}
                  {archivedProjects.length > 0 && (
                    <div style={{ marginTop: '10px', borderTop: '1px solid #D4C5B9', paddingTop: '24px' }}>
                      <button 
                        onClick={() => setShowArchive(!showArchive)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', background: '#FAF6F0',
                          border: '1px solid #D4C5B9', borderRadius: '8px', padding: '12px 18px',
                          color: '#2C2520', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.2s', outline: 'none', width: '100%', justifyContent: 'space-between'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#EAE7E2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FAF6F0'}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📁</span> Архів завершених угод ({archivedProjects.length})
                        </span>
                        <span style={{ fontSize: '11px', color: '#8B7D73', fontWeight: 800 }}>
                          {showArchive ? 'Приховати ▲' : 'Показати ▼'}
                        </span>
                      </button>
                      
                      {showArchive && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
                          {archivedProjects.map(project => (
                            <ProjectCRMCard 
                              key={project.id} 
                              project={project} 
                              client={client} 
                              onUpdate={loadProjects} 
                              isMobile={isMobile} 
                              ledgerDisplayCurrency={ledgerDisplayCurrency}
                              exchangeRateInput={exchangeRateInput}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCRMCard({ project, client, onUpdate, isMobile, ledgerDisplayCurrency, exchangeRateInput }) {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(project.address || '');
  const [noteInput, setNoteInput] = useState(project.note || '');
  const [auditLogs, setAuditLogs] = useState([]);
  const [showQuickShipment, setShowQuickShipment] = useState(false);
  const [showKPImportModal, setShowKPImportModal] = useState(false);
  const [expressMaterials, setExpressMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [pricingMode, setPricingMode] = useState(false);
  const [pricingPrices, setPricingPrices] = useState({});
  const [pricingCurrencies, setPricingCurrencies] = useState({});
  const [savingPrices, setSavingPrices] = useState(false);
  const [activeTab, setActiveTab] = useState('finances');
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineEditingData, setInlineEditingData] = useState({});
  const [editingUnifiedId, setEditingUnifiedId] = useState(null);
  const [editingUnifiedData, setEditingUnifiedData] = useState({});
  const [unifiedSearch, setUnifiedSearch] = useState('');
  const [materialsViewMode, setMaterialsViewMode] = useState('grouped'); // 'grouped', 'list', 'client'
  const [agreedSums, setAgreedSums] = useState({
    usd: parseFloat(project.agreed_sum_usd) || 0,
    uah: parseFloat(project.agreed_sum_uah) || 0
  });

  const [catalogProducts, setCatalogProducts] = useState([]);

  // Load products catalog from Supabase
  useEffect(() => {
    const loadCatalogProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('name, unit');
        if (!error && data) {
          setCatalogProducts(data);
        }
      } catch (err) {
        console.warn('Failed to load products from catalog in detail card:', err);
      }
    };
    loadCatalogProducts();
  }, []);

  const combinedSuggestions = React.useMemo(() => {
    const kpSuggestions = (expressMaterials || []).map(item => ({
      name: item.name,
      unit: item.unit || 'шт.',
      source: 'Імпортовані/Видані'
    }));

    const catalogSuggestions = (catalogProducts || []).map(prod => ({
      name: prod.name,
      unit: prod.unit || 'шт.',
      source: 'Каталог'
    }));

    const combined = [...kpSuggestions];
    catalogSuggestions.forEach(cat => {
      if (!combined.some(c => c.name.toLowerCase() === cat.name.toLowerCase())) {
        combined.push(cat);
      }
    });

    return combined;
  }, [expressMaterials, catalogProducts]);

  const getFilteredSuggestions = (query) => {
    if (!query || query.trim() === '') {
      return combinedSuggestions.slice(0, 15);
    }
    const words = query.toLowerCase().trim().split(/\s+/);
    return combinedSuggestions
      .filter(s => {
        const nameLower = s.name.toLowerCase();
        return words.every(word => nameLower.includes(word));
      })
      .slice(0, 15);
  };

  useEffect(() => {
    setAgreedSums({
      usd: parseFloat(project.agreed_sum_usd) || 0,
      uah: parseFloat(project.agreed_sum_uah) || 0
    });
  }, [project.agreed_sum_usd, project.agreed_sum_uah, project.id]);

  const saveAgreedSums = async (newSums = agreedSums) => {
    try {
      await crmApi.updateProjectAgreedSums(project.id, newSums);
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Оновлення суми договору',
        details: `Оновлено узгоджену суму угоди: ${newSums.usd} USD / ${newSums.uah} UAH`
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка збереження суми боргу: ' + err.message);
    }
  };

  const handleSelectKPForProject = async (proposalId) => {
    setShowKPImportModal(false);
    try {
      const res = await projectService.importFromProposal(project.id, proposalId);
      if (res.success) {
        alert('Імпорт КП завершено успішно!');
        await loadExpressMaterials();
        if (onUpdate) onUpdate();
      } else {
        alert('Помилка імпорту з КП: ' + res.error);
      }
    } catch (err) {
      alert('Помилка імпорту: ' + err.message);
    }
  };

  const loadExpressMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const data = await crmApi.getProjectMaterials(project.id);
      setExpressMaterials(data || []);
      
      // Pre-fill pricing states
      const priceMap = {};
      const currMap = {};
      (data || []).forEach(m => {
        if (!m.is_priced) {
          priceMap[m.id] = '';
          currMap[m.id] = 'UAH';
        }
      });
      setPricingPrices(priceMap);
      setPricingCurrencies(currMap);
    } catch (err) {
      console.error('Failed to load project express materials:', err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    loadExpressMaterials();
  }, [project.id]);

  const handleEditUnifiedRow = (item) => {
    setEditingUnifiedId(item.id);
    setEditingUnifiedData({
      name: item.name,
      date: item.date,
      quantity: item.quantity,
      price: item.price !== null ? item.price : '',
      currency: item.currency || 'UAH',
      note: item.shipInfo && item.shipInfo.isShipment ? item.shipInfo.cleanNote : item.note,
      unit: item.unit || 'шт.'
    });
  };

  const handleSaveUnifiedRow = async (item) => {
    try {
      const quantity = parseFloat(editingUnifiedData.quantity) || 0;
      const price = editingUnifiedData.price !== '' ? parseFloat(editingUnifiedData.price) : 0;
      const currency = editingUnifiedData.currency || 'UAH';
      const name = editingUnifiedData.name;
      const cleanNoteInput = editingUnifiedData.note || '';
      const date = editingUnifiedData.date;

      let updatedNote = cleanNoteInput;
      if (item.shipInfo && item.shipInfo.isShipment) {
        const groupTag = item.note.match(/\[Group:\s*[^\]]+\]/);
        const migratedTag = item.note.match(/\[Migrated:\s*[^\]]+\]/);
        const carrier = item.shipInfo.carrier || 'Самовивіз';
        const trackingNumber = item.shipInfo.trackingNumber || '';
        const logisticTag = `[Накладна від ${date}, Перевізник: ${carrier}${trackingNumber ? `, ТТН: ${trackingNumber}` : ''}]`;
        
        const tags = [];
        if (groupTag) tags.push(groupTag[0]);
        if (migratedTag) tags.push(migratedTag[0]);
        tags.push(logisticTag);
        
        updatedNote = [...tags, cleanNoteInput.trim()].filter(Boolean).join(' ');
      }

      // Check if price or currency changed and item is already added to debt
      if (item.addedToDebt) {
        const oldCost = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
        const newCost = quantity * price;
        const oldCurrency = item.currency;
        const newCurrency = currency;

        let usdDelta = 0;
        let uahDelta = 0;

        if (oldCurrency === 'USD') usdDelta -= oldCost;
        if (oldCurrency === 'UAH') uahDelta -= oldCost;
        if (newCurrency === 'USD') usdDelta += newCost;
        if (newCurrency === 'UAH') uahDelta += newCost;

        if (usdDelta !== 0 || uahDelta !== 0) {
          const newUSD = (parseFloat(project.agreed_sum_usd) || 0) + usdDelta;
          const newUAH = (parseFloat(project.agreed_sum_uah) || 0) + uahDelta;
          await crmApi.updateProjectAgreedSums(project.id, { usd: newUSD, uah: newUAH });
        }
      }

      await crmApi.saveProjectMaterial({
        id: item.dbId,
        project_id: project.id,
        name,
        quantity,
        unit: editingUnifiedData.unit || 'шт.',
        price,
        currency,
        note: updatedNote,
        issued_at: date,
        is_priced: price > 0,
        added_to_debt: item.addedToDebt
      });

      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Редагування матеріалу',
        details: `Відредаговано матеріал "${name}" (Кількість: ${quantity}, Ціна: ${price} ${currency}, Дата: ${date}, Коментар: "${cleanNoteInput}")`
      });

      setEditingUnifiedId(null);
      if (onUpdate) onUpdate();
      await loadExpressMaterials();
      await loadAuditLogs();
    } catch (err) {
      console.error(err);
      alert('Помилка збереження змін: ' + err.message);
    }
  };

  const handleDeleteUnifiedRow = async (item) => {
    if (!window.confirm(`Ви впевнені, що хочете видалити видачу матеріалу "${item.name}"?`)) return;
    try {
      if (item.addedToDebt) {
        const cost = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
        if (cost > 0) {
          const newUSD = (parseFloat(project.agreed_sum_usd) || 0) - (item.currency === 'USD' ? cost : 0);
          const newUAH = (parseFloat(project.agreed_sum_uah) || 0) - (item.currency === 'UAH' ? cost : 0);
          await crmApi.updateProjectAgreedSums(project.id, { usd: newUSD, uah: newUAH });
        }
      }

      await crmApi.deleteProjectMaterial(item.dbId);
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Видалення матеріалу',
        details: `Видалено матеріал "${item.name}"`
      });

      if (onUpdate) onUpdate();
      await loadExpressMaterials();
      await loadAuditLogs();
    } catch (err) {
      console.error(err);
      alert('Помилка видалення матеріалу: ' + err.message);
    }
  };

  const handleDeleteDateGroup = async (group) => {
    const groupDateStr = group.date !== '—' ? new Date(group.date).toLocaleDateString('uk-UA') : '—';
    const confirmMsg = `Ви впевнені, що хочете видалити ВСІ видачі матеріалів від ${groupDateStr}? Це видалить усі ${group.items.length} товарів у цій таблиці!`;
    if (!window.confirm(confirmMsg)) return;

    setLoadingMaterials(true);
    try {
      let usdDeduction = 0;
      let uahDeduction = 0;
      const idsToDelete = [];

      group.items.forEach(item => {
        idsToDelete.push(item.dbId);
        if (item.addedToDebt) {
          const cost = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
          if (cost > 0) {
            if (item.currency === 'USD') usdDeduction += cost;
            if (item.currency === 'UAH') uahDeduction += cost;
          }
        }
      });

      if (usdDeduction > 0 || uahDeduction > 0) {
        const newUSD = (parseFloat(project.agreed_sum_usd) || 0) - usdDeduction;
        const newUAH = (parseFloat(project.agreed_sum_uah) || 0) - uahDeduction;
        await crmApi.updateProjectAgreedSums(project.id, { usd: newUSD, uah: newUAH });
      }

      await crmApi.deleteProjectMaterials(idsToDelete);

      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Видалення видачі матеріалів за день',
        details: `Видалено видачі матеріалів від ${group.date}. Кількість позицій: ${group.items.length}`
      });

      alert('Видачі успішно видалено!');
      if (onUpdate) onUpdate();
      await loadExpressMaterials();
      await loadAuditLogs();
    } catch (err) {
      console.error(err);
      alert('Помилка видалення видач: ' + err.message);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleToggleDebtStatus = async (item) => {
    const isAdding = !item.addedToDebt;
    const cost = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
    if (cost <= 0) {
      alert("Ця позиція не має ціни або кількості. Неможливо змінити статус боргу.");
      return;
    }

    const confirmMsg = isAdding
      ? `Ви впевнені, що хочете додати вартість позиції "${item.name}" у розмірі ${cost.toLocaleString()} ${item.currency === 'USD' ? '$' : '₴'} до боргу клієнта? Погоджена сума угоди збільшиться.`
      : `Ви впевнені, що хочете вилучити вартість позиції "${item.name}" з боргу клієнта? Погоджена сума угоди зменшиться.`;

    if (!window.confirm(confirmMsg)) return;

    setLoadingMaterials(true);
    try {
      const delta = isAdding ? cost : -cost;
      const newUSD = (parseFloat(project.agreed_sum_usd) || 0) + (item.currency === 'USD' ? delta : 0);
      const newUAH = (parseFloat(project.agreed_sum_uah) || 0) + (item.currency === 'UAH' ? delta : 0);

      await crmApi.updateProjectAgreedSums(project.id, { usd: newUSD, uah: newUAH });

      const rawMaterial = expressMaterials.find(m => m.id === item.dbId);
      if (rawMaterial) {
        await crmApi.saveProjectMaterial({
          ...rawMaterial,
          added_to_debt: isAdding
        });
      }

      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: isAdding ? 'Перенесення у борг' : 'Вилучення з боргу',
        details: isAdding
          ? `Перенесено вартість позиції "${item.name}" у борг клієнта (+${cost} ${item.currency})`
          : `Вилучено вартість позиції "${item.name}" з боргу клієнта (-${cost} ${item.currency})`
      });

      if (onUpdate) onUpdate();
      await loadExpressMaterials();
      await loadAuditLogs();

      alert(isAdding ? 'Успішно додано до боргу клієнта!' : 'Успішно вилучено з боргу клієнта!');
    } catch (err) {
      console.error(err);
      alert('Помилка оновлення статусу боргу: ' + err.message);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleToggleAllDebtInGroup = async (itemsList, toDebt) => {
    // Filter items that have a price and whose debt status differs from target
    const eligible = itemsList.filter(item => {
      const cost = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
      return cost > 0 && item.addedToDebt !== toDebt;
    });

    if (eligible.length === 0) {
      alert(toDebt ? 'Усі позиції з ціною вже в боргу.' : 'Жодна позиція не знаходиться в боргу.');
      return;
    }

    let totalDeltaUSD = 0;
    let totalDeltaUAH = 0;
    eligible.forEach(item => {
      const cost = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
      const delta = toDebt ? cost : -cost;
      if (item.currency === 'USD') totalDeltaUSD += delta;
      if (item.currency === 'UAH') totalDeltaUAH += delta;
    });

    const action = toDebt ? 'додати' : 'вилучити';
    const confirmMsg = `${toDebt ? 'Додати' : 'Вилучити'} ${eligible.length} поз. ${toDebt ? 'у борг' : 'з боргу'}?\n` +
      (totalDeltaUSD !== 0 ? `USD: ${toDebt ? '+' : ''}${totalDeltaUSD.toLocaleString()} $\n` : '') +
      (totalDeltaUAH !== 0 ? `UAH: ${toDebt ? '+' : ''}${totalDeltaUAH.toLocaleString()} ₴\n` : '') +
      `Погоджена сума угоди ${toDebt ? 'збільшиться' : 'зменшиться'}.`;

    if (!window.confirm(confirmMsg)) return;

    setLoadingMaterials(true);
    try {
      const newUSD = (parseFloat(project.agreed_sum_usd) || 0) + totalDeltaUSD;
      const newUAH = (parseFloat(project.agreed_sum_uah) || 0) + totalDeltaUAH;
      await crmApi.updateProjectAgreedSums(project.id, { usd: newUSD, uah: newUAH });

      for (const item of eligible) {
        const rawMaterial = expressMaterials.find(m => m.id === item.dbId);
        if (rawMaterial) {
          await crmApi.saveProjectMaterial({
            ...rawMaterial,
            added_to_debt: toDebt
          });
        }
      }

      const names = eligible.map(i => i.name).join(', ');
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: toDebt ? 'Масове перенесення у борг' : 'Масове вилучення з боргу',
        details: `${toDebt ? 'Перенесено' : 'Вилучено'} ${eligible.length} поз. ${toDebt ? 'у борг' : 'з боргу'}: ${names}`
      });

      if (onUpdate) onUpdate();
      await loadExpressMaterials();
      await loadAuditLogs();

      alert(`Успішно ${toDebt ? 'додано до боргу' : 'вилучено з боргу'}: ${eligible.length} поз.`);
    } catch (err) {
      console.error(err);
      alert('Помилка масового оновлення статусу боргу: ' + err.message);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await crmApi.getAuditLogs(project.id);
      setAuditLogs(logs || []);
    } catch (e) {
      console.warn("Failed to load audit logs", e);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [project.id, project.updated_at, project]);

  useEffect(() => {
    setAddressInput(project.address || '');
  }, [project.address, project.id]);

  useEffect(() => {
    setNoteInput(project.note || '');
  }, [project.note, project.id]);

  const handleSaveAddress = async () => {
    setIsEditingAddress(false);
    if (addressInput === project.address) return;
    try {
      await crmApi.updateProjectAddress(project.id, addressInput);
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Оновлення адреси',
        details: `Оновлено назву/адресу угоди на: "${addressInput}"`
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка збереження назви/адреси угоди: ' + err.message);
    }
  };

  const handleSaveNote = async () => {
    if (noteInput === project.note) return;
    try {
      await crmApi.updateProjectNote(project.id, noteInput);
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Оновлення коментаря',
        details: noteInput ? `Оновлено коментар до угоди: "${noteInput}"` : 'Видалено коментар до угоди'
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка збереження коментаря угоди: ' + err.message);
    }
  };

  const handleDeleteProject = async () => {
    const userInput = window.prompt(
      'УВАГА! Ви збираєтеся видалити цю угоду назавжди (БЕЗ СЛІДУ).\n' +
      'Всі платежі, специфікації та накладні цієї угоди будуть видалені безпосередньо з бази даних без можливості відновлення!\n\n' +
      'Для підтвердження введіть слово "ВИДАЛИТИ" великими літерами:'
    );
    if (userInput !== 'ВИДАЛИТИ') {
      alert('Видалення скасовано або введене слово є невірним.');
      return;
    }

    try {
      await crmApi.deleteProject(project.id);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка видалення угоди: ' + err.message);
    }
  };

  // Розрахунок Фінансів
  const validPayments = (project.project_payments || []).filter(p => !p.status?.toLowerCase().includes('скасовано'));
  const paidUSD = validPayments.filter(p => p.currency === 'USD').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
  const paidUAH = validPayments.filter(p => p.currency === 'UAH').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
  
  const agreedUSD = parseFloat(project.agreed_sum_usd) || 0;
  const agreedUAH = parseFloat(project.agreed_sum_uah) || 0;
  const debtUSD = agreedUSD - paidUSD;
  const debtUAH = agreedUAH - paidUAH;

  // Розрахунок Логістики
  const materialItems = (project.project_items || []).filter(i => !i.is_service);
  let totalOrdered = 0;
  materialItems.forEach(i => totalOrdered += (parseFloat(i.quantity) || 0));

  let totalIssued = 0;
  (project.project_shipments || []).forEach(ship => {
    (ship.shipment_items || []).forEach(si => {
      if (materialItems.some(mi => mi.id === si.project_item_id)) {
        totalIssued += parseFloat(si.quantity) || 0;
      }
    });
  });
  const leftToIssue = Math.max(0, totalOrdered - totalIssued);

  // Список етапів нашої воронки
  const stages = ['Борг', 'Часткова оплата', 'Повна оплата', 'Завершено'];

  // Нормалізуємо статус (якщо порожній або старий "В роботі", ставимо перший етап)
  const getMappedStatus = (status) => {
    const raw = status || 'Борг';
    if (raw === 'Нова угода' || raw === 'В роботі' || raw === 'Борг') return 'Борг';
    if (raw === 'Повна оплата / Передоплата' || raw === 'Часткова оплата') return 'Часткова оплата';
    if (raw === 'До відвантаження' || raw === 'Відвантаження' || raw === 'Повна оплата') return 'Повна оплата';
    return raw; // e.g. 'Завершено'
  };

  const currentStatus = getMappedStatus(project.status);

  // Оновлення етапу
  const handleStatusChange = async (newStatus) => {
    try {
      if (newStatus === 'Завершено') {
        // Calculate remaining debt
        const validPayments = (project.project_payments || []).filter(p => !p.status?.toLowerCase().includes('скасовано'));
        const paidUSD = validPayments.filter(p => p.currency === 'USD').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
        const paidUAH = validPayments.filter(p => p.currency === 'UAH').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
        const agreedUSD = parseFloat(project.agreed_sum_usd) || 0;
        const agreedUAH = parseFloat(project.agreed_sum_uah) || 0;
        const debtUSD = Math.max(0, agreedUSD - paidUSD);
        const debtUAH = Math.max(0, agreedUAH - paidUAH);

        // Calculate remaining items
        const materialItems = (project.project_items || []).filter(i => !i.is_service);
        const shipments = project.project_shipments || [];
        const itemsToShip = [];
        materialItems.forEach(mi => {
          let issued = 0;
          shipments.forEach(s => {
            (s.shipment_items || []).forEach(si => {
              if (si.project_item_id === mi.id) {
                issued += parseFloat(si.quantity) || 0;
              }
            });
          });
          const remaining = (parseFloat(mi.quantity) || 0) - issued;
          if (remaining > 0) {
            itemsToShip.push({
              project_item_id: mi.id,
              quantity: remaining,
              price: parseFloat(mi.price) || 0,
              currency: mi.currency || 'UAH'
            });
          }
        });

        const hasDebt = debtUSD > 0.01 || debtUAH > 0.01;
        const hasRemainingMaterials = itemsToShip.length > 0;

        if (hasDebt || hasRemainingMaterials) {
          const debtDetails = [];
          if (debtUSD > 0.01) debtDetails.push(`$${debtUSD.toFixed(2)}`);
          if (debtUAH > 0.01) debtDetails.push(`${debtUAH.toFixed(2)} ₴`);
          const itemsCount = itemsToShip.reduce((acc, item) => acc + item.quantity, 0);

          const message = `При завершенні угоди всі борги та невидані товари будуть автоматично закриті (вважатимуться сплаченими та відвантаженими). Бажаєте продовжити?\n\n` +
            `Автоматично буде створено:\n` +
            (hasDebt ? `• Оплату залишку боргу: ${debtDetails.join(' та ')}\n` : '') +
            (hasRemainingMaterials ? `• Відвантаження залишку товарів: ${itemsCount} шт.\n` : '');

          if (!window.confirm(message)) {
            return; // Cancel status change
          }

          // Auto close
          await crmApi.autoCloseProject(project);
        }
      }

      await crmApi.updateProjectStatus(project.id, newStatus);
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Зміна статусу',
        details: `Змінено статус угоди з "${currentStatus}" на "${newStatus}"`
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка оновлення статусу: ' + err.message);
    }
  };

  // Скасування угоди через відмову клієнта (з обов'язковою перевіркою)
  const handleCancelProject = async () => {
    const confirmed = window.confirm(
      'Увага! Ви збираєтеся СКАСУВАТИ цю угоду через відмову клієнта.\n\n' +
      'Будь ласка, підтвердіть, що це не помилкова дія та ви дійсно бажаєте перенести цю угоду в архів як скасовану?'
    );
    if (!confirmed) return;

    try {
      await crmApi.updateProjectStatus(project.id, 'Скасовано');
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Скасування угоди',
        details: `Угоду "${project.address || project.name}" скасовано та перенесено в архів.`
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка скасування угоди: ' + err.message);
    }
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 16px rgba(139, 125, 112, 0.05)' }}>
      
      {/* Project Card Header */}
      <div style={{ background: '#FAF6F0', borderBottom: '1px solid #D4C5B9', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            {isEditingAddress ? (
              <input 
                type="text" 
                value={addressInput} 
                onChange={(e) => setAddressInput(e.target.value)}
                onBlur={handleSaveAddress}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAddress();
                  if (e.key === 'Escape') {
                    setAddressInput(project.address || '');
                    setIsEditingAddress(false);
                  }
                }}
                autoFocus
                placeholder="Введіть назву або адресу угоди..."
                style={{
                  fontSize: '15px', fontWeight: 800, color: '#2C2520',
                  border: '1px solid #C4B4A6', borderRadius: '6px', padding: '4px 10px',
                  background: '#FFFFFF', width: isMobile ? '100%' : '320px', outline: 'none', boxSizing: 'border-box'
                }}
              />
            ) : (
              <h4 
                onClick={() => setIsEditingAddress(true)}
                title="Клікніть, щоб змінити назву або адресу угоди"
                style={{ 
                  margin: 0, fontSize: '15px', fontWeight: 800, color: '#2C2520', cursor: 'pointer',
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px'
                }}
              >
                <span style={{ borderBottom: '1px dashed #C4B4A6' }}>
                  {project.address || project.name || 'Нова угода'}
                </span>
                <span style={{ color: '#8B7D73', fontWeight: 400, marginLeft: '4px', fontSize: '12px' }}>ID: #{project.id.slice(0, 8)}</span>
              </h4>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              background: currentStatus === 'Завершено' ? '#E6F4EA' : currentStatus === 'Скасовано' ? '#FEE2E2' : currentStatus === 'До відвантаження' ? '#FFF4E5' : '#FAF6F0', 
              color: currentStatus === 'Завершено' ? '#137333' : currentStatus === 'Скасовано' ? '#DC2626' : currentStatus === 'До відвантаження' ? '#B06000' : '#8B7D73', 
              border: `1px solid ${currentStatus === 'Завершено' ? '#CEEAD6' : currentStatus === 'Скасовано' ? '#FCA5A5' : currentStatus === 'До відвантаження' ? '#FFE0B2' : '#D4C5B9'}`,
              fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' 
            }}>
              {currentStatus}
            </span>
            
            {currentStatus !== 'Завершено' && currentStatus !== 'Скасовано' && (
              <>
                <button
                  onClick={() => setShowQuickShipment(true)}
                  style={{
                    background: '#C4B4A6',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxShadow: '0 2px 4px rgba(196, 180, 166, 0.15)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#B3A395'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#C4B4A6'; }}
                >
                  🚛 Швидка видача
                </button>
                <button
                  onClick={handleCancelProject}
                  style={{
                    background: 'transparent',
                    border: '1px solid #EF4444',
                    color: '#EF4444',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Скасувати
                </button>
              </>
            )}

            <button
              onClick={handleDeleteProject}
              title="Видалити угоду назавжди (без сліду)"
              style={{
                background: 'transparent', color: '#DC2626', border: '1px solid #FCA5A5', 
                borderRadius: '6px', padding: '5px 7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Interactive Pipeline Bar or Cancelled State Notification */}
        {currentStatus === 'Скасовано' ? (
          <div style={{ 
            borderTop: '1px solid #FCA5A5', paddingTop: '12px', marginTop: '4px',
            display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontSize: '12px', fontWeight: 700 
          }}>
            <span>🚫</span> Угоду було скасовано через відмову клієнта. Всі активні дії призупинено, угоду перенесено в архів.
          </div>
        ) : (
          <div style={{ 
            borderTop: '1px solid #EAE7E2', 
            paddingTop: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            overflowX: isMobile ? 'auto' : 'visible',
            whiteSpace: isMobile ? 'nowrap' : 'normal',
            paddingBottom: isMobile ? '6px' : '0',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}>
            {stages.map((stage, idx) => {
              const isActive = currentStatus === stage;
              const currentIdx = stages.indexOf(currentStatus);
              const isCompleted = currentIdx >= idx;
              
              return (
                <React.Fragment key={stage}>
                  {idx > 0 && <span style={{ color: '#D4C5B9', fontSize: '9px', fontWeight: 900, flexShrink: 0 }}>➔</span>}
                  <button
                    onClick={() => handleStatusChange(stage)}
                    style={{
                      flexShrink: 0,
                      background: isActive ? '#C4B4A6' : isCompleted ? '#FAF6F0' : '#FFFFFF',
                      border: `1px solid ${isActive ? '#C4B4A6' : '#D4C5B9'}`,
                      color: isActive ? '#FFFFFF' : isCompleted ? '#2C2520' : '#8B7D73',
                      padding: '3px 10px',
                      fontSize: '10.5px',
                      fontWeight: isActive ? 800 : 600,
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? '0 1.5px 3px rgba(196, 180, 166, 0.3)' : 'none',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = '#EAE7E2';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = isCompleted ? '#FAF6F0' : '#FFFFFF';
                    }}
                  >
                    {stage}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Sleek, Single-Row Financial & Comment Summary */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          alignItems: isMobile ? 'stretch' : 'center', 
          gap: isMobile ? '12px' : '20px', 
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px dashed #D4C5B9',
          width: '100%',
          boxSizing: 'border-box',
          fontSize: '11.5px',
          color: '#2C2520'
        }}>
          {/* USD Inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '13px' }}>🇺🇸</span>
            <span style={{ fontWeight: 800, color: '#4A607A' }}>USD:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
              <span style={{ color: '#8B7D73' }}>$</span>
              <input 
                type="number" 
                value={agreedSums.usd} 
                onChange={e => setAgreedSums({...agreedSums, usd: parseFloat(e.target.value) || 0})}
                onBlur={() => saveAgreedSums()}
                style={{ 
                  width: '64px', fontSize: '11px', fontWeight: 700, padding: '2px 4px', 
                  border: '1px solid #CAD4DE', borderRadius: '4px', outline: 'none', background: '#FAFDFD', color: '#2C2520', textAlign: 'right',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <span style={{ 
              fontWeight: 800, 
              color: debtUSD < 0 ? '#15803D' : debtUSD > 0 ? '#1D4ED8' : '#2C2520'
            }}>
              ({debtUSD < 0 ? `Переплата: $${Math.abs(Math.round(debtUSD)).toLocaleString('en-US')}` : `Борг: $${Math.round(debtUSD).toLocaleString('en-US')}`})
            </span>
          </div>

          {/* Divider on desktop */}
          {!isMobile && <div style={{ width: '1px', height: '14px', background: '#D4C5B9' }} />}

          {/* UAH Inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '13px' }}>🇺🇦</span>
            <span style={{ fontWeight: 800, color: '#8C7355' }}>UAH:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
              <input 
                type="number" 
                value={agreedSums.uah} 
                onChange={e => setAgreedSums({...agreedSums, uah: parseFloat(e.target.value) || 0})}
                onBlur={() => saveAgreedSums()}
                style={{ 
                  width: '74px', fontSize: '11px', fontWeight: 700, padding: '2px 4px', 
                  border: '1px solid #F2E6C4', borderRadius: '4px', outline: 'none', background: '#FFFDF9', color: '#2C2520', textAlign: 'right',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ color: '#8B7D73', marginLeft: '1px' }}>₴</span>
            </div>
            <span style={{ 
              fontWeight: 800, 
              color: debtUAH < 0 ? '#15803D' : debtUAH > 0 ? '#C2410C' : '#2C2520'
            }}>
              ({debtUAH < 0 ? `Переплата: ${Math.abs(Math.round(debtUAH)).toLocaleString('uk-UA')} ₴` : `Борг: ${Math.round(debtUAH).toLocaleString('uk-UA')} ₴`})
            </span>
          </div>

          {/* Divider on desktop */}
          {!isMobile && <div style={{ width: '1px', height: '14px', background: '#D4C5B9' }} />}

          {/* Comment Inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: isMobile ? '100%' : '180px' }}>
            <span style={{ color: '#8B7D73', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <FileText size={12} />
              <span>Коментар:</span>
            </span>
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onBlur={handleSaveNote}
              placeholder="Коментар менеджера..."
              style={{
                flex: 1,
                padding: '3px 8px',
                fontSize: '11px',
                color: '#2C2520',
                border: '1px solid #D4C5B9',
                borderRadius: '6px',
                background: '#FFFFFF',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#C4B4A6'; }}
            />
          </div>
        </div>

        {/* Aesthetic Dashboard Tabs Switcher */}
        <div style={{ 
          display: 'flex', 
          borderTop: '1px solid #EAE7E2', 
          paddingTop: '12px', 
          marginTop: '8px',
          gap: '4px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <button 
            onClick={() => setActiveTab('finances')}
            style={{
              padding: '10px 16px',
              fontSize: '12.5px',
              fontWeight: 800,
              background: activeTab === 'finances' ? '#FFFFFF' : 'transparent',
              border: activeTab === 'finances' ? '1px solid #D4C5B9' : '1px solid transparent',
              borderRadius: '20px',
              color: activeTab === 'finances' ? '#2C2520' : '#8B7D73',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              outline: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📊</span> Фінанси
          </button>
          <button 
            onClick={() => setActiveTab('unified')}
            style={{
              padding: '10px 16px',
              fontSize: '12.5px',
              fontWeight: 800,
              background: activeTab === 'unified' ? '#FFFFFF' : 'transparent',
              border: activeTab === 'unified' ? '1px solid #D4C5B9' : '1px solid transparent',
              borderRadius: '20px',
              color: activeTab === 'unified' ? '#2C2520' : '#8B7D73',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              outline: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📦</span> Видача матеріалів
          </button>
          <button 
            onClick={() => setActiveTab('reconciliation')}
            style={{
              padding: '10px 16px',
              fontSize: '12.5px',
              fontWeight: 800,
              background: activeTab === 'reconciliation' ? '#FFFFFF' : 'transparent',
              border: activeTab === 'reconciliation' ? '1px solid #D4C5B9' : '1px solid transparent',
              borderRadius: '20px',
              color: activeTab === 'reconciliation' ? '#2C2520' : '#8B7D73',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              outline: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span>⚖️</span> Акт звірки
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{
              padding: '10px 16px',
              fontSize: '12.5px',
              fontWeight: 800,
              background: activeTab === 'history' ? '#FFFFFF' : 'transparent',
              border: activeTab === 'history' ? '1px solid #D4C5B9' : '1px solid transparent',
              borderRadius: '20px',
              color: activeTab === 'history' ? '#2C2520' : '#8B7D73',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              outline: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📜</span> Історія дій ({auditLogs.length})
          </button>
        </div>
      </div>

      {showQuickShipment && (
        <QuickShipmentModal
          clientOverride={client}
          projectOverride={project}
          projectItems={project?.project_items || []}
          onClose={() => setShowQuickShipment(false)}
          onUpdate={async () => {
            await loadExpressMaterials();
            if (onUpdate) onUpdate();
          }}
        />
      )}

      {/* Tab Contents */}
      {activeTab === 'finances' && (
        <div style={{ background: '#FFFFFF', maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Financial Balance Block */}
          <div style={{ padding: '24px', maxWidth: '720px', boxSizing: 'border-box' }}>
            <ProjectFinancesBlock 
              project={project} 
              validPayments={validPayments} 
              debtUSD={debtUSD} 
              debtUAH={debtUAH} 
              onUpdate={onUpdate} 
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      {activeTab === 'unified' && (() => {
        const processedMaterials = (expressMaterials || []).map(m => {
          const shipInfo = parseShipmentInfo(m.note);
          return {
            id: `debt-${m.id}`,
            dbId: m.id,
            name: m.name,
            quantity: parseFloat(m.quantity) || 0,
            unit: m.unit || 'шт.',
            date: m.issued_at ? m.issued_at.split('T')[0] : '—',
            price: m.price || 0,
            currency: m.currency || 'UAH',
            note: m.note || '',
            isPriced: m.is_priced,
            addedToDebt: m.added_to_debt || false,
            shipInfo
          };
        });

        const filteredMaterials = processedMaterials.filter(item => {
          const term = unifiedSearch.toLowerCase().trim();
          if (!term) return true;
          return item.name.toLowerCase().includes(term) || 
                 item.note.toLowerCase().includes(term) ||
                 (item.shipInfo.carrier && item.shipInfo.carrier.toLowerCase().includes(term)) ||
                 (item.shipInfo.trackingNumber && item.shipInfo.trackingNumber.toLowerCase().includes(term));
        });

        const grandTotalPos = processedMaterials.length;

        // Calculate Grand Totals in UAH & USD
        const grandTotalUAH = processedMaterials.reduce((acc, item) => {
          if (item.currency === 'UAH') {
            return acc + (item.quantity * (item.price || 0));
          }
          return acc;
        }, 0);

        const grandTotalUSD = processedMaterials.reduce((acc, item) => {
          if (item.currency === 'USD') {
            return acc + (item.quantity * (item.price || 0));
          }
          return acc;
        }, 0);

        // Group ALL filtered materials strictly by date of issuance
        const groupsMap = {};
        filteredMaterials.forEach(item => {
          const dateKey = item.date || '—';
          if (!groupsMap[dateKey]) {
            groupsMap[dateKey] = {
              date: dateKey,
              items: []
            };
          }
          groupsMap[dateKey].items.push(item);
        });

        const dateGroups = Object.values(groupsMap).sort((a, b) => {
          if (a.date === '—') return 1;
          if (b.date === '—') return -1;
          return new Date(b.date) - new Date(a.date);
        });

        const handleCopyMaterialsText = () => {
          try {
            const sorted = [...filteredMaterials].sort((a, b) => {
              if (a.date === '—') return 1;
              if (b.date === '—') return -1;
              return new Date(b.date) - new Date(a.date);
            });
            
            let text = `Відомість видачі матеріалів — ${project.name || ''}\n`;
            text += `Дата | Назва матеріалу | Кількість | Ціна | Сума | Коментар\n`;
            text += `---------------------------------------------------------\n`;
            sorted.forEach(item => {
              const dateStr = item.date !== '—' ? new Date(item.date).toLocaleDateString('uk-UA') : '—';
              const priceStr = item.price ? (item.currency === 'USD' ? `$${item.price}` : `${item.price} ₴`) : 'без ціни';
              const costStr = item.price ? (item.currency === 'USD' ? `$${item.quantity * item.price}` : `${item.quantity * item.price} ₴`) : '—';
              
              let commentStr = item.note || '';
              if (item.shipInfo && item.shipInfo.isShipment) {
                const parts = [];
                if (item.shipInfo.carrier) parts.push(`🚚 ${item.shipInfo.carrier}`);
                if (item.shipInfo.trackingNumber) parts.push(`(${item.shipInfo.trackingNumber})`);
                if (item.shipInfo.cleanNote) parts.push(item.shipInfo.cleanNote);
                commentStr = parts.join(' ');
              }
              if (!commentStr) commentStr = '—';
              
              text += `${dateStr} | ${item.name} | ${item.quantity} ${item.unit} | ${priceStr} | ${costStr} | ${commentStr}\n`;
            });
            
            text += `---------------------------------------------------------\n`;
            text += `Загалом позицій: ${grandTotalPos}\n`;
            text += `Сума UAH: ${grandTotalUAH.toLocaleString('uk-UA')} ₴\n`;
            text += `Сума USD: $${grandTotalUSD.toLocaleString('en-US')}\n`;

            navigator.clipboard.writeText(text);
            alert('Дані успішно скопійовано в буфер обміну!');
          } catch (e) {
            alert('Не вдалося скопіювати дані: ' + e.message);
          }
        };

        const renderMaterialsTable = (group) => {
          const itemsList = group.items;
          const totalUAH = itemsList.reduce((acc, item) => item.currency === 'UAH' ? acc + (item.quantity * (item.price || 0)) : acc, 0);
          const totalUSD = itemsList.reduce((acc, item) => item.currency === 'USD' ? acc + (item.quantity * (item.price || 0)) : acc, 0);

          const isGrouped = materialsViewMode === 'grouped';
          const isClient = materialsViewMode === 'client';

          return (
            <div style={{ 
              border: '1px solid #D4C5B9', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              marginBottom: '24px',
              boxShadow: '0 2px 6px rgba(139, 125, 112, 0.04)'
            }}>
              {/* Group Header */}
              <div style={{ 
                background: '#FAF6F0', 
                borderBottom: '1px solid #D4C5B9', 
                padding: '10px 16px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, color: '#2C2520' }}>
                  <span style={{ fontSize: '16px' }}>{isClient ? '👁️' : '📅'}</span>
                  <span>
                    {isClient 
                      ? 'Зведена відомість видачі матеріалів для замовника' 
                      : !isGrouped 
                        ? 'Загальний список виданих матеріалів' 
                        : `Видача від ${group.date !== '—' ? new Date(group.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}`}
                  </span>
                  <span style={{ height: '12px', width: '1px', background: '#D4C5B9', margin: '0 4px' }} />
                  <span style={{ color: '#8B7D73', fontWeight: 650 }}>{group.items.length} поз.</span>
                </div>
                
                {isGrouped && (
                  <button
                    onClick={() => handleDeleteDateGroup(group)}
                    style={{
                      background: '#FCE8E6',
                      color: '#C5221F',
                      border: '1px solid #FAD2CF',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FAD2CF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FCE8E6'; }}
                  >
                    <Trash2 size={12} /> Видалити видачу за день
                  </button>
                )}
                
                {!isClient && (() => {
                  const pricedItems = itemsList.filter(i => (parseFloat(i.price) || 0) > 0);
                  const allInDebt = pricedItems.length > 0 && pricedItems.every(i => i.addedToDebt);
                  const noneInDebt = pricedItems.every(i => !i.addedToDebt);
                  if (pricedItems.length === 0) return null;
                  return (
                    <button
                      onClick={() => handleToggleAllDebtInGroup(itemsList, !allInDebt)}
                      style={{
                        background: allInDebt ? '#F0FDF4' : '#EFF6FF',
                        color: allInDebt ? '#15803D' : '#1D4ED8',
                        border: `1px solid ${allInDebt ? '#DCFCE7' : '#DBEAFE'}`,
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                      {allInDebt 
                        ? (isGrouped ? '✓ Зняти з боргу' : '✓ Зняти весь список з боргу') 
                        : (isGrouped ? '📋 Все в борг' : '📋 Весь список в борг')}
                    </button>
                  );
                })()}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#FAF8F5', borderBottom: '1px solid #D4C5B9' }}>
                      {!isClient && <th style={{ padding: '8px 12px', width: '70px', textAlign: 'center', fontWeight: 800, color: '#2C2520' }}>В борг</th>}
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520' }}>Матеріал</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '95px', textAlign: 'center' }}>Дата</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '100px', textAlign: 'center' }}>Кількість</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '110px', textAlign: 'center' }}>Ціна за од.</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '110px', textAlign: 'center' }}>Сума</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520' }}>Коментар</th>
                      {!isClient && <th style={{ padding: '8px 12px', width: '150px', textAlign: 'center' }}>Дії</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {itemsList.map(item => {
                      const isEditing = editingUnifiedId === item.id;
                      const cost = isEditing 
                        ? (parseFloat(editingUnifiedData.quantity) || 0) * (parseFloat(editingUnifiedData.price) || 0)
                        : (item.price ? item.quantity * item.price : 0);

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #FAF6F0', transition: 'background 0.15s', background: isEditing ? '#FFFDF5' : 'transparent' }}>
                          {!isClient && (
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              {item.price && item.price > 0 ? (
                                <input 
                                  type="checkbox"
                                  checked={item.addedToDebt}
                                  onChange={() => handleToggleDebtStatus(item)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#C2410C' }}
                                />
                              ) : (
                                <span title="Без ціни — неможливо перенести" style={{ fontSize: '10px', color: '#B3A395', fontStyle: 'italic' }}>—</span>
                              )}
                            </td>
                          )}

                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#2C2520' }}>
                            {isEditing ? (
                              <>
                                <input 
                                  type="text"
                                  value={editingUnifiedData.name}
                                  onChange={e => {
                                    const val = e.target.value;
                                    const updatedData = { ...editingUnifiedData, name: val };
                                    const match = combinedSuggestions.find(s => s.name.toLowerCase().trim() === val.toLowerCase().trim());
                                    if (match) {
                                      updatedData.unit = match.unit;
                                    }
                                    setEditingUnifiedData(updatedData);
                                  }}
                                  list={`suggestions-unified-${item.id}`}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #D4C5B9', borderRadius: '4px', outline: 'none', fontSize: '12px' }}
                                />
                                <datalist id={`suggestions-unified-${item.id}`}>
                                  {getFilteredSuggestions(editingUnifiedData.name).map((s, sIdx) => (
                                    <option key={sIdx} value={s.name}>
                                      {s.source === 'КП' ? 'Проектний кошторис' : 'Каталог товарів'}
                                    </option>
                                  ))}
                                </datalist>
                              </>
                            ) : (
                              item.name
                            )}
                          </td>
                          
                          <td style={{ padding: '8px 12px', textAlign: 'center', color: '#8B7D73' }}>
                            {isEditing ? (
                              <input 
                                type="date"
                                value={editingUnifiedData.date}
                                onChange={e => setEditingUnifiedData({...editingUnifiedData, date: e.target.value})}
                                style={{ width: '100%', padding: '3px', border: '1px solid #D4C5B9', borderRadius: '4px', outline: 'none', fontSize: '11px', textAlign: 'center' }}
                              />
                            ) : (
                              item.date !== '—' ? new Date(item.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
                            )}
                          </td>

                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#2C2520' }}>
                            {isEditing ? (
                              <input 
                                type="number"
                                step="any"
                                value={editingUnifiedData.quantity}
                                onChange={e => setEditingUnifiedData({...editingUnifiedData, quantity: e.target.value})}
                                style={{ width: '60px', padding: '4px', border: '1px solid #D4C5B9', borderRadius: '4px', outline: 'none', fontSize: '12px', textAlign: 'center' }}
                              />
                            ) : (
                              `${item.quantity} ${item.unit}`
                            )}
                          </td>
                          
                          <td style={{ padding: '8px 12px', textAlign: 'center', color: '#8B7D73' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '3px', alignItems: 'center', justifyContent: 'center' }}>
                                <input 
                                  type="number"
                                  step="any"
                                  value={editingUnifiedData.price}
                                  placeholder="0.00"
                                  onChange={e => setEditingUnifiedData({...editingUnifiedData, price: e.target.value})}
                                  style={{ width: '55px', padding: '4px', border: '1px solid #D4C5B9', borderRadius: '4px', outline: 'none', fontSize: '12px', textAlign: 'center' }}
                                />
                                <select 
                                  value={editingUnifiedData.currency}
                                  onChange={e => setEditingUnifiedData({...editingUnifiedData, currency: e.target.value})}
                                  style={{ padding: '4px', border: '1px solid #D4C5B9', borderRadius: '4px', background: '#FFFFFF', fontSize: '11px', outline: 'none' }}
                                >
                                  <option value="UAH">₴</option>
                                  <option value="USD">$</option>
                                </select>
                              </div>
                            ) : (
                              item.price !== null && item.price !== 0 ? (
                                item.currency === 'USD' ? `$${item.price.toLocaleString()}` : `${item.price.toLocaleString()} ₴`
                              ) : (
                                <span style={{ fontStyle: 'italic', fontSize: '11px', color: '#B3A395' }}>без ціни</span>
                              )
                            )}
                          </td>
                          
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, color: (isEditing ? editingUnifiedData.currency : item.currency) === 'USD' ? '#1D4ED8' : '#C2410C' }}>
                            {cost > 0 ? (
                              (isEditing ? editingUnifiedData.currency : item.currency) === 'USD' ? `$${cost.toLocaleString()}` : `${cost.toLocaleString()} ₴`
                            ) : '—'}
                          </td>
                          
                          <td style={{ padding: '8px 12px', color: '#8B7D73', fontSize: '11.5px' }}>
                            {isEditing ? (
                              <input 
                                type="text"
                                value={editingUnifiedData.note}
                                onChange={e => setEditingUnifiedData({...editingUnifiedData, note: e.target.value})}
                                style={{ width: '100%', padding: '4px', border: '1px solid #D4C5B9', borderRadius: '4px', outline: 'none', fontSize: '12px' }}
                              />
                            ) : (
                              item.shipInfo && item.shipInfo.isShipment ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  {item.shipInfo.carrier && (
                                    <span style={{ 
                                      background: '#FAF6F0', 
                                      border: '1px solid #D4C5B9', 
                                      borderRadius: '4px', 
                                      padding: '1px 6px', 
                                      fontSize: '9.5px', 
                                      color: '#8B7D73',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      🚚 {item.shipInfo.carrier}
                                      {item.shipInfo.trackingNumber ? ` (${item.shipInfo.trackingNumber})` : ''}
                                    </span>
                                  )}
                                  <span>{item.shipInfo.cleanNote || '—'}</span>
                                </div>
                              ) : (
                                item.note || '—'
                              )
                            )}
                          </td>

                          {!isClient && (
                            <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {isEditing ? (
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button 
                                    onClick={() => handleSaveUnifiedRow(item)}
                                    style={{
                                      background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6',
                                      borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '3px'
                                    }}
                                  >
                                    <Check size={12} /> Зберегти
                                  </button>
                                  <button 
                                    onClick={() => setEditingUnifiedId(null)}
                                    style={{
                                      background: '#FCE8E6', color: '#C5221F', border: '1px solid #FAD2CF',
                                      borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '3px'
                                    }}
                                  >
                                    <X size={12} /> Скасувати
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                  <button 
                                    onClick={() => handleEditUnifiedRow(item)}
                                    disabled={item.addedToDebt}
                                    title={item.addedToDebt ? "Позиція перенесена в борг. Вилучіть її з боргу, щоб редагувати" : ""}
                                    style={{
                                      background: '#FAF6F0', color: '#8B7D73', border: '1px solid #D4C5B9',
                                      borderRadius: '4px', padding: '4px 6px', fontSize: '11px', fontWeight: 600, cursor: item.addedToDebt ? 'not-allowed' : 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '3px', opacity: item.addedToDebt ? 0.5 : 1
                                    }}
                                  >
                                    <Pencil size={11} /> Редагувати
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUnifiedRow(item)}
                                    disabled={item.addedToDebt}
                                    title={item.addedToDebt ? "Позиція перенесена в борг. Вилучіть її з боргу, щоб видалити" : ""}
                                    style={{
                                      background: '#FCE8E6', color: '#C5221F', border: '1px solid #FAD2CF',
                                      borderRadius: '4px', padding: '4px 6px', fontSize: '11px', fontWeight: 600, cursor: item.addedToDebt ? 'not-allowed' : 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '3px', opacity: item.addedToDebt ? 0.5 : 1
                                    }}
                                  >
                                    <Trash2 size={11} /> Видалити
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#FAF8F5', borderTop: '2px solid #D4C5B9', fontWeight: 800 }}>
                      <td colSpan={isClient ? "4" : "5"} style={{ padding: '10px 12px', color: '#2C2520', textAlign: 'right', textTransform: 'uppercase' }}>
                        Підсумок:
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#2C2520' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                          {totalUAH > 0 && <span style={{ color: '#C2410C' }}>{totalUAH.toLocaleString('uk-UA')} ₴</span>}
                          {totalUSD > 0 && <span style={{ color: '#1D4ED8' }}>${totalUSD.toLocaleString('en-US')}</span>}
                          {totalUAH === 0 && totalUSD === 0 && <span>—</span>}
                        </div>
                      </td>
                      <td colSpan={isClient ? "1" : "2"} style={{ padding: '10px 12px' }}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        };

        return (
          <div style={{ background: '#FFFFFF', padding: '24px', maxWidth: '100%', boxSizing: 'border-box' }}>
            {/* Combined compact stats bar */}
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              alignItems: isMobile ? 'stretch' : 'center', 
              gap: isMobile ? '10px' : '24px', 
              background: '#FAF6F0', 
              border: '1px solid #D4C5B9', 
              padding: '8px 16px', 
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '12px',
              fontWeight: 650,
              color: '#2C2520'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px' }}>📦</span>
                <span style={{ color: '#8B7D73' }}>Видано матеріалів:</span>
                <span style={{ fontWeight: 800 }}>{grandTotalPos} поз.</span>
              </div>
              
              {!isMobile && <div style={{ width: '1px', height: '14px', background: '#D4C5B9' }} />}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px' }}>🇺🇦</span>
                <span style={{ color: '#8C7355' }}>Сума UAH:</span>
                <span style={{ fontWeight: 800, color: '#C2410C' }}>{grandTotalUAH.toLocaleString('uk-UA')} ₴</span>
              </div>
              
              {!isMobile && <div style={{ width: '1px', height: '14px', background: '#D4C5B9' }} />}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px' }}>🇺🇸</span>
                <span style={{ color: '#4A607A' }}>Сума USD:</span>
                <span style={{ fontWeight: 800, color: '#1D4ED8' }}>${grandTotalUSD.toLocaleString('en-US')}</span>
              </div>
            </div>

            {/* Title & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📋</span>
                  <h5 style={{ margin: 0, fontSize: '13.5px', fontWeight: 850, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Зведена відомість видачі матеріалів
                  </h5>
                </div>
                
                {/* View Mode Toggle */}
                <div style={{ display: 'flex', border: '1px solid #D4C5B9', borderRadius: '6px', overflow: 'hidden' }}>
                  {[
                    { id: 'grouped', label: '📅 По датах' },
                    { id: 'list', label: '📋 Список' },
                    { id: 'client', label: '👁️ Для замовника' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setMaterialsViewMode(mode.id)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: materialsViewMode === mode.id ? 800 : 600,
                        border: `1px solid ${materialsViewMode === mode.id ? '#8B7D73' : '#D4C5B9'}`,
                        borderWidth: '0 1px 0 0',
                        background: materialsViewMode === mode.id ? '#2C2520' : '#FAF8F5',
                        color: materialsViewMode === mode.id ? '#FFFFFF' : '#8B7D73',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: isMobile ? '100%' : 'auto', flexWrap: 'wrap' }}>
                {materialsViewMode !== 'client' && (
                  <button
                    onClick={() => setShowKPImportModal(true)}
                    style={{
                      background: '#FAF6F0', color: '#8B7D73', border: '1px solid #D4C5B9', borderRadius: '6px',
                      padding: '5px 12px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
                      height: '28px', transition: 'background 0.2s', boxSizing: 'border-box'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#EAE7E2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FAF6F0'}
                  >
                    <FileText size={12} /> Імпорт з КП
                  </button>
                )}
                
                <div style={{ position: 'relative', width: isMobile ? '100%' : '250px' }}>
                  <input 
                    type="text"
                    placeholder="Швидкий пошук за назвою, ТТН, перевізником..."
                    value={unifiedSearch}
                    onChange={e => setUnifiedSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #D4C5B9',
                      borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {materialsViewMode !== 'client' ? (
                  <button 
                    onClick={() => setShowQuickShipment(true)}
                    style={{
                      background: '#C4B4A6', color: '#FFFFFF', border: 'none', borderRadius: '6px',
                      padding: '6px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', outline: 'none', whiteSpace: 'nowrap'
                    }}
                  >
                    <span>🚛</span> Швидка видача
                  </button>
                ) : (
                  <button 
                    onClick={handleCopyMaterialsText}
                    style={{
                      background: '#8B7D73', color: '#FFFFFF', border: 'none', borderRadius: '6px',
                      padding: '6px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', outline: 'none', whiteSpace: 'nowrap'
                    }}
                  >
                    <span>📋</span> Скопіювати для клієнта
                  </button>
                )}
              </div>
            </div>

            {filteredMaterials.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#8B7D73', fontStyle: 'italic', padding: '20px 0', textAlign: 'center', border: '1px dashed #D4C5B9', borderRadius: '8px' }}>
                Виданих матеріалів не знайдено.
              </div>
            ) : (
              <div>
                {materialsViewMode === 'grouped' ? (
                  dateGroups.map(group => (
                    <div key={group.date}>
                      {renderMaterialsTable(group)}
                    </div>
                  ))
                ) : (
                  renderMaterialsTable({
                    date: 'all',
                    items: [...filteredMaterials].sort((a, b) => {
                      if (a.date === '—') return 1;
                      if (b.date === '—') return -1;
                      return new Date(b.date) - new Date(a.date);
                    })
                  })
                )}
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'reconciliation' && (() => {
        const displayCurrency = ledgerDisplayCurrency === 'USD' ? 'USD' : 'UAH';
        const sym = displayCurrency === 'USD' ? '$' : '₴';
        const rate = parseFloat(exchangeRateInput) || 44.3;

        const processedMaterials = (expressMaterials || []).map(m => {
          const shipInfo = parseShipmentInfo(m.note);
          return {
            id: `debt-${m.id}`,
            dbId: m.id,
            name: m.name,
            quantity: parseFloat(m.quantity) || 0,
            unit: m.unit || 'шт.',
            date: m.issued_at ? m.issued_at.split('T')[0] : '—',
            price: m.price || 0,
            currency: m.currency || 'UAH',
            note: m.note || '',
            addedToDebt: m.added_to_debt || false,
            shipInfo
          };
        });

        // Calculate materials cost added to debt
        let materialsUSD = 0;
        let materialsUAH = 0;
        processedMaterials.forEach(m => {
          if (m.addedToDebt && m.price > 0) {
            const cost = m.quantity * m.price;
            if (m.currency === 'USD') materialsUSD += cost;
            else if (m.currency === 'UAH') materialsUAH += cost;
          }
        });

        // Base Contract Sum
        const agreedUSD = parseFloat(project.agreed_sum_usd) || 0;
        const agreedUAH = parseFloat(project.agreed_sum_uah) || 0;
        const baseUSD = agreedUSD - materialsUSD;
        const baseUAH = agreedUAH - materialsUAH;

        const events = [];

        // 1. Add Base Contract Sum
        if (baseUSD > 0 || baseUAH > 0 || (agreedUSD === 0 && agreedUAH === 0)) {
          const date = project.created_at ? project.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
          let amount = 0;
          let origDetails = '';
          if (displayCurrency === 'USD') {
            amount = baseUSD + (baseUAH / rate);
            if (baseUSD > 0 && baseUAH > 0) {
              origDetails = ` (ориг. $${Math.round(baseUSD).toLocaleString()} + ${Math.round(baseUAH).toLocaleString()} ₴)`;
            } else if (baseUAH > 0) {
              origDetails = ` (ориг. ${Math.round(baseUAH).toLocaleString()} ₴ за курсом ${rate})`;
            }
          } else {
            amount = baseUAH + (baseUSD * rate);
            if (baseUSD > 0 && baseUAH > 0) {
              origDetails = ` (ориг. ${Math.round(baseUAH).toLocaleString()} ₴ + $${Math.round(baseUSD).toLocaleString()})`;
            } else if (baseUSD > 0) {
              origDetails = ` (ориг. $${Math.round(baseUSD).toLocaleString()} за курсом ${rate})`;
            }
          }
          
          events.push({
            date,
            description: `Угода: ${project.address || project.name || 'Базова вартість'}${origDetails}`,
            debit: amount,
            credit: 0,
            originalCurrency: baseUSD > 0 ? 'USD' : 'UAH',
            type: 'debit'
          });
        }

        // 2. Add materials
        processedMaterials.forEach(m => {
          if (m.addedToDebt && m.price > 0) {
            const cost = m.quantity * m.price;
            let amount = cost;
            let origDetails = '';
            if (displayCurrency === 'USD') {
              if (m.currency === 'UAH') {
                amount = cost / rate;
                origDetails = ` (ориг. ${Math.round(cost).toLocaleString()} ₴ за курсом ${rate})`;
              }
            } else {
              if (m.currency === 'USD') {
                amount = cost * rate;
                origDetails = ` (ориг. $${Math.round(cost).toLocaleString()} за курсом ${rate})`;
              }
            }

            let commentStr = '';
            if (m.shipInfo && m.shipInfo.isShipment) {
              const parts = [];
              if (m.shipInfo.carrier) parts.push(`🚚 ${m.shipInfo.carrier}`);
              if (m.shipInfo.trackingNumber) parts.push(`(${m.shipInfo.trackingNumber})`);
              if (m.shipInfo.cleanNote) parts.push(m.shipInfo.cleanNote);
              commentStr = parts.join(' ');
            } else if (m.note) {
              commentStr = m.note;
            }
            if (commentStr) commentStr = ` [${commentStr}]`;

            events.push({
              date: m.date,
              description: `Видача: ${m.name} (${m.quantity} ${m.unit} × ${m.price.toLocaleString()} ${m.currency === 'USD' ? '$' : '₴'})${commentStr}${origDetails}`,
              debit: amount,
              credit: 0,
              originalCurrency: m.currency,
              type: 'debit'
            });
          }
        });

        // 3. Add payments
        const validPayments = (project.project_payments || []).filter(pay => !pay.status?.toLowerCase().includes('скасовано'));
        validPayments.forEach(pay => {
          const sum = parseFloat(pay.sum) || 0;
          let amount = sum;
          let origDetails = '';
          
          if (displayCurrency === 'USD') {
            if (pay.currency === 'UAH') {
              const payRate = parseFloat(pay.conversion_rate) || rate;
              amount = sum / payRate;
              origDetails = ` (ориг. ${Math.round(sum).toLocaleString()} ₴ за курсом ${payRate})`;
            }
          } else {
            if (pay.currency === 'USD') {
              const payRate = parseFloat(pay.conversion_rate) || rate;
              amount = sum * payRate;
              origDetails = ` (ориг. $${Math.round(sum).toLocaleString()} за курсом ${payRate})`;
            }
          }

          const noteStr = pay.note ? ` [${pay.note}]` : '';

          events.push({
            date: pay.date ? pay.date.split('T')[0] : '—',
            description: `${pay.payment_type || 'Оплата'}${noteStr}${origDetails}`,
            debit: 0,
            credit: amount,
            originalCurrency: pay.currency,
            type: 'credit'
          });
        });

        // Sort events: date ascending, debits first if same date
        events.sort((a, b) => {
          if (a.date === '—') return 1;
          if (b.date === '—') return -1;
          const dateDiff = new Date(a.date) - new Date(b.date);
          if (dateDiff !== 0) return dateDiff;
          if (a.type === 'debit' && b.type === 'credit') return -1;
          if (a.type === 'credit' && b.type === 'debit') return 1;
          return 0;
        });

        // Calculate running balance
        let balance = 0;
        const rows = events.map(ev => {
          if (ev.type === 'debit') {
            balance += ev.debit;
          } else {
            balance -= ev.credit;
          }
          return {
            ...ev,
            balance
          };
        });

        const totalDebit = rows.reduce((acc, r) => acc + r.debit, 0);
        const totalCredit = rows.reduce((acc, r) => acc + r.credit, 0);

        const handleCopyReconciliationText = () => {
          try {
            let text = `АКТ ЗВІРКИ ВЗАЄМОРОЗРАХУНКІВ\n`;
            text += `Контрагент: ${client.name || ''}\n`;
            text += `Угода: ${project.name || project.address || ''}\n`;
            text += `Валюта звірки: ${displayCurrency}\n`;
            text += `Курс конвертації: ${rate} (для операцій без фіксованого курсу)\n`;
            text += `----------------------------------------------------------------------\n`;
            text += `Дата | Опис операції | Нараховано (Дебет) | Сплачено (Кредит) | Залишок боргу\n`;
            text += `----------------------------------------------------------------------\n`;
            
            rows.forEach(r => {
              const dateStr = r.date !== '—' ? new Date(r.date).toLocaleDateString('uk-UA') : '—';
              const debStr = r.debit > 0 ? (displayCurrency === 'USD' ? `$${Math.round(r.debit).toLocaleString()}` : `${Math.round(r.debit).toLocaleString()} ₴`) : '—';
              const credStr = r.credit > 0 ? (displayCurrency === 'USD' ? `$${Math.round(r.credit).toLocaleString()}` : `${Math.round(r.credit).toLocaleString()} ₴`) : '—';
              const balStr = displayCurrency === 'USD'
                ? (r.balance < 0 ? `-$${Math.abs(Math.round(r.balance)).toLocaleString()}` : `$${Math.round(r.balance).toLocaleString()}`)
                : (r.balance < 0 ? `-${Math.abs(Math.round(r.balance)).toLocaleString()} ₴` : `${Math.round(r.balance).toLocaleString()} ₴`);
                
              text += `${dateStr} | ${r.description} | ${debStr} | ${credStr} | ${balStr}\n`;
            });
            
            text += `----------------------------------------------------------------------\n`;
            const fmt = (v) => displayCurrency === 'USD'
              ? (v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString()}` : `$${Math.round(v).toLocaleString()}`)
              : (v < 0 ? `-${Math.abs(Math.round(v)).toLocaleString()} ₴` : `${Math.round(v).toLocaleString()} ₴`);
            const fmtP = (v) => displayCurrency === 'USD' ? `$${Math.round(v).toLocaleString()}` : `${Math.round(v).toLocaleString()} ₴`;

            text += `Всього нараховано: ${fmtP(totalDebit)}\n`;
            text += `Всього сплачено: ${fmtP(totalCredit)}\n`;
            text += `Кінцевий баланс: ${fmt(balance)} (${balance > 0 ? 'Клієнт винен нам' : balance < 0 ? 'Переплата' : 'Розрахунки закриті'})\n`;

            navigator.clipboard.writeText(text);
            alert('Акт звірки успішно скопійовано в буфер обміну!');
          } catch (e) {
            alert('Помилка копіювання: ' + e.message);
          }
        };

        const handlePrintReconciliation = () => {
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            alert('Будь ласка, дозвольте спливаючі вікна для друку.');
            return;
          }
          
          let tableRowsHtml = '';
          rows.forEach(r => {
            const dateStr = r.date !== '—' ? new Date(r.date).toLocaleDateString('uk-UA') : '—';
            const debStr = r.debit > 0 ? (displayCurrency === 'USD' ? `$${Math.round(r.debit).toLocaleString()}` : `${Math.round(r.debit).toLocaleString()} ₴`) : '—';
            const credStr = r.credit > 0 ? (displayCurrency === 'USD' ? `$${Math.round(r.credit).toLocaleString()}` : `${Math.round(r.credit).toLocaleString()} ₴`) : '—';
            
            const balVal = r.balance;
            const balStr = displayCurrency === 'USD'
              ? (balVal < 0 ? `-$${Math.abs(Math.round(balVal)).toLocaleString()}` : `$${Math.round(balVal).toLocaleString()}`)
              : (balVal < 0 ? `-${Math.abs(Math.round(balVal)).toLocaleString()} ₴` : `${Math.round(balVal).toLocaleString()} ₴`);
            const balColor = balVal < 0 ? '#15803D' : balVal > 0 ? (displayCurrency === 'USD' ? '#1D4ED8' : '#C2410C') : '#2C2520';

            tableRowsHtml += `
              <tr style="border-bottom: 1px solid #FAF6F0;">
                <td style="padding: 10px 12px; text-align: center; color: #555;">${dateStr}</td>
                <td style="padding: 10px 12px; color: #2C2520;">${r.description}</td>
                <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #C2410C;">${debStr}</td>
                <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #15803D;">${credStr}</td>
                <td style="padding: 10px 12px; text-align: center; font-weight: 800; color: ${balColor};">${balStr}</td>
              </tr>
            `;
          });

          const fmt = (v) => displayCurrency === 'USD'
            ? (v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString()}` : `$${Math.round(v).toLocaleString()}`)
            : (v < 0 ? `-${Math.abs(Math.round(v)).toLocaleString()} ₴` : `${Math.round(v).toLocaleString()} ₴`);
          const fmtP = (v) => displayCurrency === 'USD' ? `$${Math.round(v).toLocaleString()}` : `${Math.round(v).toLocaleString()} ₴`;

          const htmlContent = `
            <html>
              <head>
                <title>Акт звірки взаєморозрахунків - ${client.name || ''}</title>
                <style>
                  body { font-family: 'Inter', sans-serif; color: #2C2520; padding: 20px; line-height: 1.5; }
                  .header { margin-bottom: 24px; border-bottom: 2px solid #8B7D73; padding-bottom: 12px; }
                  .title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; }
                  .meta { font-size: 12px; color: #555; margin-top: 6px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                  th { background: #FAF6F0; border-bottom: 2px solid #D4C5B9; padding: 10px 12px; font-weight: 800; text-align: left; }
                  td { padding: 10px 12px; border-bottom: 1px solid #EAE7E2; }
                  .footer-row { font-weight: bold; background: #FAF8F5; border-top: 2px solid #D4C5B9; }
                  .balance-box { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: bold; margin-top: 20px; border: 1px solid #D4C5B9; padding: 10px 16px; border-radius: 8px; background: #FAF6F0; }
                  @media print {
                    body { padding: 0; }
                    button { display: none; }
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="title">Акт звірки взаєморозрахунків</div>
                  <div class="meta">
                    <strong>Контрагент:</strong> ${client.name || ''}<br/>
                    <strong>Угода:</strong> ${project.name || project.address || ''}<br/>
                    <strong>Валюта звірки:</strong> ${displayCurrency}<br/>
                    <strong>Курс конвертації:</strong> ${rate} (для операцій без фіксованого курсу)<br/>
                    <strong>Дата формування:</strong> ${new Date().toLocaleDateString('uk-UA')}<br/>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 90px; text-align: center;">Дата</th>
                      <th>Опис операції</th>
                      <th style="width: 120px; text-align: center; color: #C2410C;">Нараховано (+)</th>
                      <th style="width: 120px; text-align: center; color: #15803D;">Сплачено (-)</th>
                      <th style="width: 130px; text-align: center;">Залишок боргу</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRowsHtml}
                    <tr class="footer-row">
                      <td colspan="2" style="text-align: right; text-transform: uppercase;">Всього обороти:</td>
                      <td style="text-align: center; color: #C2410C;">${fmtP(totalDebit)}</td>
                      <td style="text-align: center; color: #15803D;">${fmtP(totalCredit)}</td>
                      <td style="text-align: center;">${fmt(balance)}</td>
                    </tr>
                  </tbody>
                </table>
                <div style="margin-top: 20px;">
                  <div class="balance-box">
                    ⚖️ Кінцевий баланс: 
                    <span style="color: ${balance < 0 ? '#15803D' : balance > 0 ? (displayCurrency === 'USD' ? '#1D4ED8' : '#C2410C') : '#2C2520'}">
                      ${fmt(balance)}
                    </span>
                    <span style="font-weight: normal; font-size: 11px; color: #555;">
                      (${balance > 0 ? 'Клієнт винен нам' : balance < 0 ? 'Переплата (ми винні)' : 'Розрахунки повністю закриті'})
                    </span>
                  </div>
                </div>
                <script>
                  window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                  };
                </script>
              </body>
            </html>
          `;
          
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        };

        const fmtVal = (val, isZeroDash = true) => {
          if (val === 0) return isZeroDash ? '—' : (displayCurrency === 'USD' ? '$0' : '0 ₴');
          return displayCurrency === 'USD' ? `$${Math.round(val).toLocaleString('en-US')}` : `${Math.round(val).toLocaleString('uk-UA')} ₴`;
        };

        const fmtBal = (val) => {
          const formatted = displayCurrency === 'USD'
            ? (val < 0 ? `-$${Math.abs(Math.round(val)).toLocaleString('en-US')}` : `$${Math.round(val).toLocaleString('en-US')}`)
            : (val < 0 ? `-${Math.abs(Math.round(val)).toLocaleString('uk-UA')} ₴` : `${Math.round(val).toLocaleString('uk-UA')} ₴`);
          
          const color = val < 0 ? '#15803D' : val > 0 ? (displayCurrency === 'USD' ? '#1D4ED8' : '#C2410C') : '#2C2520';
          return <span style={{ color, fontWeight: 800 }}>{formatted}</span>;
        };

        return (
          <div style={{ background: '#FFFFFF', padding: '24px', maxWidth: '100%', boxSizing: 'border-box' }}>
            {/* Header & Copy Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚖️</span>
                <h5 style={{ margin: 0, fontSize: '13.5px', fontWeight: 850, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Акт звірки взаєморозрахунків (валюта: {displayCurrency})
                </h5>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={handleCopyReconciliationText}
                  style={{
                    background: '#8B7D73', color: '#FFFFFF', border: 'none', borderRadius: '6px',
                    padding: '6px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', outline: 'none', whiteSpace: 'nowrap'
                  }}
                >
                  <span>📋</span> Скопіювати для клієнта
                </button>
                <button 
                  onClick={handlePrintReconciliation}
                  style={{
                    background: '#C4B4A6', color: '#FFFFFF', border: 'none', borderRadius: '6px',
                    padding: '6px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', outline: 'none', whiteSpace: 'nowrap'
                  }}
                >
                  <span>🖨️</span> Друк
                </button>
              </div>
            </div>

            {rows.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#8B7D73', fontStyle: 'italic', padding: '20px 0', textAlign: 'center', border: '1px dashed #D4C5B9', borderRadius: '8px' }}>
                Немає фінансових операцій для відображення.
              </div>
            ) : (
              <div style={{ border: '1px solid #D4C5B9', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(139, 125, 112, 0.04)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#FAF6F0', borderBottom: '1px solid #D4C5B9' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 800, color: '#2C2520', width: '95px', textAlign: 'center' }}>Дата</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800, color: '#2C2520' }}>Опис операції</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800, color: '#C2410C', width: '120px', textAlign: 'center' }}>Нараховано (+)</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800, color: '#15803D', width: '120px', textAlign: 'center' }}>Сплачено (-)</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800, color: '#2C2520', width: '130px', textAlign: 'center' }}>Залишок боргу</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #FAF6F0', transition: 'background 0.15s' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#8B7D73' }}>
                            {r.date !== '—' ? new Date(r.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#2C2520', fontWeight: r.type === 'debit' && r.description.startsWith('Угода') ? 700 : 500 }}>
                            {r.description}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#C2410C' }}>
                            {r.debit > 0 ? fmtVal(r.debit) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#15803D' }}>
                            {r.credit > 0 ? fmtVal(r.credit) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {fmtBal(r.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#FAF8F5', borderTop: '2px solid #D4C5B9', fontWeight: 800 }}>
                        <td colSpan="2" style={{ padding: '12px', color: '#2C2520', textAlign: 'right', textTransform: 'uppercase' }}>
                          Всього обороти:
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#C2410C' }}>
                          {fmtVal(totalDebit, false)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#15803D' }}>
                          {fmtVal(totalCredit, false)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {fmtBal(balance)}
                        </td>
                      </tr>
                      <tr style={{ background: '#FAF6F0', borderTop: '1px solid #EAE7E2' }}>
                        <td colSpan="5" style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 800 }}>
                            <span>📊</span>
                            <span>Кінцевий баланс:</span>
                            {fmtBal(balance)}
                            <span style={{ fontSize: '11px', color: '#8B7D73', fontWeight: 600 }}>
                              ({balance > 0 ? 'Клієнт винен нам' : balance < 0 ? 'Переплата (ми винні)' : 'Розрахунки повністю закриті'})
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'history' && (
        <div style={{ background: '#FFFFFF', padding: '24px', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <Layers size={15} color="#8B7D73" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📋 Історія дій по угоді
            </span>
          </div>
          
          {auditLogs.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#8B7D73', fontStyle: 'italic', padding: '12px 0', textAlign: 'center', border: '1px dashed #D4C5B9', borderRadius: '8px' }}>
              Історія дій поки що порожня. Дії менеджера будуть записуватись автоматично.
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '6px',
              scrollbarWidth: 'thin'
            }}>
              {auditLogs.map((log) => {
                let actionEmoji = '📝';
                const type = log.action_type || '';
                if (type.includes('Створення')) actionEmoji = '🟢';
                else if (type.includes('Статус') || type.includes('статусу') || type.includes('Зміна')) actionEmoji = '🔄';
                else if (type.includes('Оплата') || type.includes('платежу') || type.includes('договору') || type.includes('суми')) actionEmoji = '💸';
                else if (type.includes('Відвантаження')) actionEmoji = '📦';
                else if (type.includes('товар') || type.includes('Товар') || type.includes('кількості') || type.includes('коментаря')) actionEmoji = '🛠️';
                
                const formattedDate = new Date(log.created_at).toLocaleString('uk-UA', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={log.id} style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    fontSize: '12px',
                    alignItems: 'flex-start',
                    background: '#FFFFFF',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #FAF6F0',
                    boxShadow: '0 1px 2px rgba(139, 125, 112, 0.02)'
                  }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }} role="img" aria-label="action">
                      {actionEmoji}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#2C2520', fontSize: '11.5px' }}>{log.action_type}</span>
                        <span style={{ color: '#8B7D73', fontSize: '10px' }}>{formattedDate}</span>
                      </div>
                      <div style={{ color: '#554A42', lineHeight: '1.4' }}>{log.details}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {showKPImportModal && (
        <KPSelectionModal isOpen={true} onClose={() => setShowKPImportModal(false)} onSelect={handleSelectKPForProject} />
      )}
      </div>
  );
}

// -------------------------------------------------------------
// БЛОК ФІНАНСИ (Side-by-side USD/UAH, payments, add form)
// -------------------------------------------------------------
function ProjectFinancesBlock({ project, validPayments, debtUSD, debtUAH, onUpdate, isMobile }) {
  const sortedPayments = [...validPayments].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    if (dateB - dateA !== 0) return dateB - dateA;
    
    const timeA = new Date(a.created_at || a.id || 0);
    const timeB = new Date(b.created_at || b.id || 0);
    return timeB - timeA;
  });

  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [newPayment, setNewPayment] = useState({ sum: '', currency: 'UAH', date: new Date().toISOString().split('T')[0], payment_type: 'Оплата', note: '', conversion_rate: '' });

  // Mutual Offset (Conversion) Modal States
  const [showMutualOffsetModal, setShowMutualOffsetModal] = useState(false);
  const [mutualOffsetData, setMutualOffsetData] = useState({
    isEdit: false,
    fromCurrency: 'UAH',
    toCurrency: 'USD',
    fromAmount: '',
    toAmount: '',
    rate: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    uahId: null,
    usdId: null,
    uahIsNegative: true,
    usdIsNegative: false
  });

  const handleCancelPayment = async (paymentId) => {
    if (!window.confirm('Ви впевнені, що хочете скасувати цей платіж?')) return;
    setSaving(true);
    try {
      const paymentToCancel = validPayments.find(p => p.id === paymentId);
      const details = paymentToCancel 
        ? `Скасовано платіж: ${paymentToCancel.sum} ${paymentToCancel.currency} (${paymentToCancel.payment_type || 'Оплата'}) від ${paymentToCancel.date}`
        : `Скасовано платіж`;

      await crmApi.cancelPayment(paymentId);
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Скасування платежу',
        details: details
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка скасування платежу: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (payment) => {
    if (payment.is_conversion) {
      // Edit conversion payment using MutualOffsetModal
      const related = validPayments.find(r => r.id === payment.related_payment_id);
      const uahPay = payment.currency === 'UAH' ? payment : related;
      const usdPay = payment.currency === 'USD' ? payment : related;
      
      setMutualOffsetData({
        isEdit: true,
        fromCurrency: uahPay?.sum < 0 ? 'UAH' : 'USD',
        toCurrency: uahPay?.sum < 0 ? 'USD' : 'UAH',
        fromAmount: uahPay ? Math.abs(uahPay.sum) : 0,
        toAmount: usdPay ? Math.abs(usdPay.sum) : 0,
        rate: payment.conversion_rate || '',
        date: payment.date,
        note: payment.note || '',
        uahId: uahPay?.id || null,
        usdId: usdPay?.id || null,
        uahIsNegative: uahPay ? uahPay.sum < 0 : true,
        usdIsNegative: usdPay ? usdPay.sum < 0 : false
      });
      setShowMutualOffsetModal(true);
      return;
    }

    setEditingPaymentId(payment.id);
    setNewPayment({
      sum: payment.sum,
      currency: payment.currency,
      date: payment.date,
      payment_type: payment.payment_type || 'Оплата',
      note: payment.note || '',
      conversion_rate: payment.conversion_rate || ''
    });
    setShowAdd(true);
  };

  const handleCancelForm = () => {
    setShowAdd(false);
    setEditingPaymentId(null);
    setNewPayment({ sum: '', currency: 'UAH', date: new Date().toISOString().split('T')[0], payment_type: 'Оплата', note: '', conversion_rate: '' });
  };

  const handleShowAddForm = () => {
    setEditingPaymentId(null);
    setNewPayment({ sum: '', currency: 'UAH', date: new Date().toISOString().split('T')[0], payment_type: 'Оплата', note: '', conversion_rate: '' });
    setShowAdd(true);
  };

  const handleSavePayment = async () => {
    if (!newPayment.sum) return;
    setSaving(true);
    try {
      const isEdit = !!editingPaymentId;
      await crmApi.savePayment({
        id: editingPaymentId || undefined,
        project_id: project.id,
        sum: parseFloat(newPayment.sum),
        currency: newPayment.currency,
        date: newPayment.date,
        payment_type: newPayment.payment_type,
        note: newPayment.note,
        status: 'Оплачено',
        conversion_rate: newPayment.conversion_rate ? parseFloat(newPayment.conversion_rate) : null
      });
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: isEdit ? 'Редагування платежу' : 'Додавання платежу',
        details: `${isEdit ? 'Відредаговано' : 'Додано'} платіж: ${newPayment.sum} ${newPayment.currency} (${newPayment.payment_type}) від ${newPayment.date} ${newPayment.conversion_rate ? `[курс: ${newPayment.conversion_rate}]` : ''} ${newPayment.note ? `[${newPayment.note}]` : ''}`
      });
      setShowAdd(false);
      setEditingPaymentId(null);
      setNewPayment({ sum: '', currency: 'UAH', date: new Date().toISOString().split('T')[0], payment_type: 'Оплата', note: '', conversion_rate: '' });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка збереження: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasCrossCurrencyImbalance = (debtUAH < -0.01 && debtUSD > 0.01) || (debtUSD < -0.01 && debtUAH > 0.01);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Cross-Currency Imbalance Warning Banner */}
      {hasCrossCurrencyImbalance && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF9F2 0%, #FAF0E6 100%)',
          border: '1px dashed #D4C5B9',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 2px 8px rgba(139, 125, 115, 0.04)',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#5C4A3C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Виявлено крос-валютний баланс
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#5C4A3C', lineHeight: '1.4' }}>
            Клієнт має {debtUSD > 0 ? `борг $${Number(debtUSD.toFixed(2)).toLocaleString()} USD` : `переплату $${Number(Math.abs(debtUSD).toFixed(2)).toLocaleString()} USD`} та {debtUAH > 0 ? `борг ${Number(debtUAH.toFixed(2)).toLocaleString()} UAH` : `переплату ${Number(Math.abs(debtUAH).toFixed(2)).toLocaleString()} UAH`}.
            Ви можете провести взаємозалік (конвертацію), щоб звести баланси.
          </div>
          <button
            onClick={() => {
              const fromCurr = debtUAH < 0 ? 'UAH' : 'USD';
              const toCurr = debtUAH < 0 ? 'USD' : 'UAH';
              const amountVal = fromCurr === 'UAH' ? Math.abs(debtUAH) : Math.abs(debtUSD);
              setMutualOffsetData({
                isEdit: false,
                fromCurrency: fromCurr,
                toCurrency: toCurr,
                fromAmount: amountVal,
                toAmount: '',
                rate: '',
                date: new Date().toISOString().split('T')[0],
                note: `Взаємозалік ${fromCurr} в ${toCurr}`
              });
              setShowMutualOffsetModal(true);
            }}
            style={{
              background: '#C4B4A6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              alignSelf: 'flex-start',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#B3A395'}
            onMouseLeave={e => e.currentTarget.style.background = '#C4B4A6'}
          >
            🔁 Провести взаємозалік
          </button>
        </div>
      )}
      {/* Transaction Journal Section */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        flexWrap: 'wrap',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        gap: isMobile ? '8px' : '12px',
        marginBottom: '12px' 
      }}>
        <h6 style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>📜 Журнал транзакцій</h6>
        {!showAdd && (
          <button 
            onClick={handleShowAddForm} 
            style={{ 
              background: '#C4B4A6', color: 'white', border: 'none', borderRadius: '6px', 
              padding: '4px 10px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
              transition: 'background 0.2s',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#B3A395'}
            onMouseLeave={e => e.currentTarget.style.background = '#C4B4A6'}
          >
            <Plus size={12} /> Додати платіж
          </button>
        )}
      </div>

      {/* Slide-Down Payment Creation Form */}
      {showAdd && (
        <div style={{ background: '#FAF6F0', border: '1px solid #D4C5B9', borderRadius: '8px', padding: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h6 style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase' }}>
            {editingPaymentId ? '📝 Редагування платежу' : '✨ Новий платіж'}
          </h6>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#2C2520', marginBottom: '4px' }}>Сума</label>
              <input 
                type="number" 
                value={newPayment.sum} 
                onChange={e => setNewPayment({...newPayment, sum: e.target.value})} 
                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }} 
                placeholder="0" 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#2C2520', marginBottom: '4px' }}>Валюта</label>
              <select 
                value={newPayment.currency} 
                onChange={e => setNewPayment({...newPayment, currency: e.target.value})} 
                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
              >
                <option value="USD">USD ($)</option>
                <option value="UAH">UAH (₴)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#2C2520', marginBottom: '4px' }}>Дата</label>
              <input 
                type="date" 
                value={newPayment.date} 
                onChange={e => setNewPayment({...newPayment, date: e.target.value})} 
                style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#2C2520', marginBottom: '4px' }}>Тип оплати</label>
              <select 
                value={newPayment.payment_type} 
                onChange={e => setNewPayment({...newPayment, payment_type: e.target.value})} 
                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
              >
                <option value="Оплата">Оплата</option>
                <option value="Передоплата">Передоплата</option>
                <option value="Повернення">Повернення</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#2C2520', marginBottom: '4px' }}>Курс приходу</label>
              <input 
                type="number" 
                step="any"
                value={newPayment.conversion_rate || ''} 
                onChange={e => setNewPayment({...newPayment, conversion_rate: e.target.value})} 
                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }} 
                placeholder="Не вказано" 
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#2C2520', marginBottom: '4px' }}>Коментар до платежу</label>
            <input 
              type="text" 
              value={newPayment.note} 
              onChange={e => setNewPayment({...newPayment, note: e.target.value})} 
              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }} 
              placeholder="Каса ФОП, Готівка офіс, тощо..." 
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button 
              onClick={handleCancelForm} 
              style={{ background: 'transparent', border: '1px solid #D4C5B9', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#8B7D73', cursor: 'pointer' }}
            >
              Скасувати
            </button>
            <button 
              onClick={handleSavePayment} 
              disabled={saving} 
              style={{ background: '#C4B4A6', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              {saving ? '...' : 'Зберегти'}
            </button>
          </div>
        </div>
      )}

      {/* Transaction List */}
      {validPayments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', fontSize: '12px', color: '#8B7D73', border: '1px dashed #D4C5B9', borderRadius: '10px' }}>Оплат по цій угоді ще не надходило</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          {sortedPayments.map(p => {
            const isUSD = p.currency === 'USD';
            return (
              <div 
                key={p.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between', 
                  alignItems: isMobile ? 'stretch' : 'center', 
                  padding: '10px 14px', 
                  border: `1px solid ${isUSD ? '#CAD4DE' : '#F2E6C4'}`, 
                  background: isUSD ? '#F4F7F9' : '#FFFDF5', 
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  gap: isMobile ? '8px' : '10px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: isUSD ? '#1D4ED8' : '#C2410C', minWidth: isMobile ? 'auto' : '76px' }}>
                    {isUSD ? `$${Number(p.sum).toLocaleString()}` : `${Number(p.sum).toLocaleString()} ₴`}
                  </span>
                  {p.is_conversion && (
                    <span style={{ background: '#FAF6F0', color: '#8B7D73', border: '1px solid #D4C5B9', fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                      🔁 Взаємозалік
                    </span>
                  )}
                  {p.conversion_rate && (
                    <span style={{ fontSize: '11px', color: '#8B7D73', fontStyle: 'italic' }}>
                      (курс: {Number(p.conversion_rate).toLocaleString('uk-UA')})
                    </span>
                  )}
                  <span style={{ fontSize: '10px', color: '#8B7D73', background: '#FFFFFF', border: '1px solid #D4C5B9', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {p.date}
                  </span>
                  {p.note && <span style={{ fontSize: '12px', color: '#2C2520', fontStyle: 'italic', wordBreak: 'break-word' }}>{p.note}</span>}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '8px', 
                  width: isMobile ? '100%' : 'auto', 
                  borderTop: isMobile ? '1px dashed #EAE7E2' : 'none', 
                  paddingTop: isMobile ? '6px' : '0' 
                }}>
                  <span style={{ fontSize: '10px', color: '#8B7D73', fontWeight: 700, textTransform: 'uppercase' }}>{p.payment_type}</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Редагування транзакції */}
                    <button 
                      onClick={() => handleStartEdit(p)}
                      disabled={saving}
                      style={{ 
                        background: 'transparent', border: 'none', color: '#8B7D73', cursor: 'pointer', 
                        padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', 
                        transition: 'transform 0.2s, color 0.2s' 
                      }}
                      title="Редагувати платіж"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.color = '#2C2520';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.color = '#8B7D73';
                      }}
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Швидке скасування транзакції */}
                    <button 
                      onClick={() => handleCancelPayment(p.id)}
                      disabled={saving}
                      style={{ 
                        background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', 
                        padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', 
                        transition: 'transform 0.2s' 
                      }}
                      title="Скасувати платіж"
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showMutualOffsetModal && (
        <MutualOffsetModal
          isOpen={true}
          onClose={() => setShowMutualOffsetModal(false)}
          data={mutualOffsetData}
          project={project}
          onSave={() => {
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// МОДАЛЬНЕ ВІКНО КРОСС-ВАЛЮТНОГО ВЗАЄМОЗАЛІКУ
// -------------------------------------------------------------
function MutualOffsetModal({ isOpen, onClose, data, project, onSave }) {
  const [fromCurrency, setFromCurrency] = useState(data.fromCurrency || 'UAH');
  const [toCurrency, setToCurrency] = useState(data.toCurrency || 'USD');
  const [fromAmount, setFromAmount] = useState(data.fromAmount || '');
  const [toAmount, setToAmount] = useState(data.toAmount || '');
  const [rate, setRate] = useState(data.rate || '');
  const [date, setDate] = useState(data.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(data.note || '');
  const [saving, setSaving] = useState(false);

  const handleFromAmountChange = (val) => {
    setFromAmount(val);
    const numVal = parseFloat(val);
    const numRate = parseFloat(rate);
    if (!isNaN(numVal) && !isNaN(numRate) && numRate > 0) {
      if (fromCurrency === 'UAH' && toCurrency === 'USD') {
        setToAmount((numVal / numRate).toFixed(2));
      } else if (fromCurrency === 'USD' && toCurrency === 'UAH') {
        setToAmount((numVal * numRate).toFixed(2));
      }
    }
  };

  const handleToAmountChange = (val) => {
    setToAmount(val);
    const numVal = parseFloat(fromAmount);
    const numTo = parseFloat(val);
    if (!isNaN(numVal) && numVal > 0 && !isNaN(numTo) && numTo > 0) {
      if (fromCurrency === 'UAH' && toCurrency === 'USD') {
        setRate((numVal / numTo).toFixed(4));
      } else if (fromCurrency === 'USD' && toCurrency === 'UAH') {
        setRate((numTo / numVal).toFixed(4));
      }
    }
  };

  const handleRateChange = (val) => {
    setRate(val);
    const numVal = parseFloat(fromAmount);
    const numRate = parseFloat(val);
    if (!isNaN(numVal) && !isNaN(numRate) && numRate > 0) {
      if (fromCurrency === 'UAH' && toCurrency === 'USD') {
        setToAmount((numVal / numRate).toFixed(2));
      } else if (fromCurrency === 'USD' && toCurrency === 'UAH') {
        setToAmount((numVal * numRate).toFixed(2));
      }
    }
  };

  const handleCurrencySwap = () => {
    const tempCurr = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempCurr);
    const tempAmt = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmt);
  };

  useEffect(() => {
    setFromCurrency(data.fromCurrency || 'UAH');
    setToCurrency(data.toCurrency || 'USD');
    setFromAmount(data.fromAmount || '');
    setToAmount(data.toAmount || '');
    setRate(data.rate || '');
    setDate(data.date || new Date().toISOString().split('T')[0]);
    setNote(data.note || '');
  }, [data, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    const numFrom = parseFloat(fromAmount);
    const numTo = parseFloat(toAmount);
    const numRate = parseFloat(rate);

    if (isNaN(numFrom) || numFrom <= 0) return alert('Вкажіть коректну суму списання!');
    if (isNaN(numTo) || numTo <= 0) return alert('Вкажіть коректну суму зарахування!');
    if (isNaN(numRate) || numRate <= 0) return alert('Вкажіть коректний курс!');

    setSaving(true);
    try {
      const uahVal = fromCurrency === 'UAH' ? numFrom : numTo;
      const usdVal = fromCurrency === 'USD' ? numFrom : numTo;
      const uahIsNegative = data.isEdit ? data.uahIsNegative : (fromCurrency === 'UAH');
      const usdIsNegative = data.isEdit ? data.usdIsNegative : (fromCurrency === 'USD');

      const uahSum = uahIsNegative ? -uahVal : uahVal;
      const usdSum = usdIsNegative ? -usdVal : usdVal;

      const finalNote = note.trim() || `Взаємозалік ${fromCurrency} <-> ${toCurrency} за курсом ${numRate}`;

      const uahId = data.isEdit ? data.uahId : `pay_conv_uah_${Date.now()}`;
      const usdId = data.isEdit ? data.usdId : `pay_conv_usd_${Date.now()}`;

      await Promise.all([
        crmApi.savePayment({
          id: uahId,
          project_id: project.id,
          sum: uahSum,
          currency: 'UAH',
          date: date,
          payment_type: 'Оплата',
          note: finalNote,
          status: 'Оплачено',
          is_conversion: true,
          conversion_rate: numRate,
          related_payment_id: usdId
        }),
        crmApi.savePayment({
          id: usdId,
          project_id: project.id,
          sum: usdSum,
          currency: 'USD',
          date: date,
          payment_type: 'Оплата',
          note: finalNote,
          status: 'Оплачено',
          is_conversion: true,
          conversion_rate: numRate,
          related_payment_id: uahId
        })
      ]);

      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: data.isEdit ? 'Редагування взаємозаліку' : 'Взаємозалік',
        details: `${data.isEdit ? 'Відредаговано' : 'Проведено'} крос-валютний взаємозалік: списано ${fromAmount} ${fromCurrency}, зараховано ${toAmount} ${toCurrency} за курсом ${numRate}. Коментар: "${finalNote}"`
      });

      onSave();
      onClose();
    } catch (err) {
      alert('Помилка проведення взаємозаліку: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(44, 37, 32, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#FAF8F5', border: '1px solid #D4C5B9', borderRadius: '12px',
        padding: '24px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 25px rgba(139, 125, 112, 0.15)',
        display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EAE7E2', paddingBottom: '12px' }}>
          <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 850, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {data.isEdit ? '🔁 Редагувати взаємозалік' : '🔁 Провести взаємозалік'}
          </h5>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8B7D73', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* From Currency Block */}
          <div style={{ background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '8px', padding: '10px 12px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 750, color: '#8B7D73', textTransform: 'uppercase', marginBottom: '6px' }}>Віддає (Списання)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                step="any"
                value={fromAmount}
                onChange={e => handleFromAmountChange(e.target.value)}
                style={{ flex: 1, padding: '8px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none' }}
                placeholder="0.00"
              />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#2C2520', width: '45px', textAlign: 'center' }}>{fromCurrency}</span>
            </div>
          </div>

          {/* Swap icon */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '-6px 0' }}>
            <button
              onClick={handleCurrencySwap}
              type="button"
              disabled={data.isEdit}
              style={{
                background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '50%',
                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: data.isEdit ? 'not-allowed' : 'pointer', color: '#8B7D73', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                opacity: data.isEdit ? 0.6 : 1
              }}
              title="Змінити напрямок конвертації"
            >
              🔄
            </button>
          </div>

          {/* To Currency Block */}
          <div style={{ background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '8px', padding: '10px 12px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 750, color: '#8B7D73', textTransform: 'uppercase', marginBottom: '6px' }}>Отримує (Зарахування)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                step="any"
                value={toAmount}
                onChange={e => handleToAmountChange(e.target.value)}
                style={{ flex: 1, padding: '8px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none' }}
                placeholder="0.00"
              />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#2C2520', width: '45px', textAlign: 'center' }}>{toCurrency}</span>
            </div>
          </div>

          {/* Rate & Date Block */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 750, color: '#8B7D73', marginBottom: '4px' }}>Курс конвертації</label>
              <input
                type="number"
                step="any"
                value={rate}
                onChange={e => handleRateChange(e.target.value)}
                style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                placeholder="курс"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 750, color: '#8B7D73', marginBottom: '4px' }}>Дата операції</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '7px 8px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 750, color: '#8B7D73', marginBottom: '4px' }}>Коментар</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Вкажіть коментар..."
            />
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #EAE7E2', paddingTop: '12px', marginTop: '4px' }}>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: '1px solid #D4C5B9', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#8B7D73', cursor: 'pointer' }}
          >
            Скасувати
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            style={{ background: '#C4B4A6', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            {saving ? 'Збереження...' : 'Підтвердити'}
          </button>
        </div>
      </div>
    </div>
  );
}
