import React, { useState, useEffect } from 'react';
import { crmApi } from '../../services/crmApi';
import { KPSelectionModal } from '../../components/KPSelectionModal';
import { projectService } from '../../services/api';
import { ChevronLeft, Phone, Plus, DollarSign, Package, Calendar, FileText, Check, Truck, X, Layers, CreditCard, Trash2, Pencil } from 'lucide-react';
import { QuickShipmentModal } from './QuickShipmentModal';

export function CrmClientDetail({ client, onBack, onUpdate }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientName, setClientName] = useState(client.name || '');
  const [clientPhone, setClientPhone] = useState(client.phone || '');
  const [clientNote, setClientNote] = useState(client.note || '');

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

  // Розрахунок загальних показників по всіх угодах клієнта
  let totalAgreedUSD = 0;
  let totalPaidUSD = 0;
  let totalAgreedUAH = 0;
  let totalPaidUAH = 0;

  projects.forEach(p => {
    if (p.status === 'Скасовано') return;
    
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
      <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', boxSizing: 'border-box' }}>
        
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8B7D73', fontSize: '13px', fontWeight: 500 }}>Завантаження інформації про угоди...</div>
        ) : projects.length === 0 ? (
          <div style={{ background: '#FFFFFF', border: '1px dashed #D4C5B9', borderRadius: '12px', padding: '60px 40px', textAlign: 'center', color: '#8B7D73', fontSize: '14px' }}>
            У цього контрагента ще немає активних або завершених угод. Натисніть кнопку вище, щоб створити нову угоду.
          </div>
        ) : (() => {
          const activeProjects = projects.filter(p => p.status !== 'Завершено' && p.status !== 'Скасовано');
          const archivedProjects = projects.filter(p => p.status === 'Завершено' || p.status === 'Скасовано');
          const nonCancelledProjects = projects.filter(p => p.status !== 'Скасовано');

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Зведена відомість по усіх угодах */}
              {nonCancelledProjects.length > 1 && (
                <div style={{ 
                  background: '#FFFFFF', 
                  border: '1px solid #D4C5B9', 
                  borderRadius: '16px', 
                  padding: isMobile ? '16px' : '20px', 
                  boxShadow: '0 8px 16px rgba(139, 125, 112, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📊</span> Зведена фінансова відомість по угодах
                  </h4>
                  <div style={{ overflowX: 'auto', width: '100%', borderRadius: '8px', border: '1px solid #EAE7E2' }}>
                    <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#FAF6F0', borderBottom: '1px solid #D4C5B9', color: '#2C2520' }}>
                          <th style={{ padding: '10px 12px', fontWeight: 800 }}>Назва угоди</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, width: '110px' }}>Статус</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, width: '100px' }}>Погоджено USD</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, width: '100px' }}>Сплачено USD</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, width: '100px' }}>Борг USD</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, width: '110px' }}>Погоджено UAH</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, width: '110px' }}>Сплачено UAH</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, width: '110px' }}>Борг UAH</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nonCancelledProjects.map(p => {
                          const validPayments = (p.project_payments || []).filter(pay => !pay.status?.toLowerCase().includes('скасовано'));
                          const paidUSD = validPayments.filter(pay => pay.currency === 'USD').reduce((acc, pay) => acc + (parseFloat(pay.sum) || 0), 0);
                          const paidUAH = validPayments.filter(pay => pay.currency === 'UAH').reduce((acc, pay) => acc + (parseFloat(pay.sum) || 0), 0);
                          
                          const agreedUSD = parseFloat(p.agreed_sum_usd) || 0;
                          const agreedUAH = parseFloat(p.agreed_sum_uah) || 0;
                          const debtUSD = agreedUSD - paidUSD;
                          const debtUAH = agreedUAH - paidUAH;

                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #EAE7E2', transition: 'background 0.2s' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2C2520' }}>
                                {p.address || p.name || `Угода #${p.id.slice(0, 5)}`}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                {(() => {
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
                                  return (
                                    <span style={{ 
                                      background: bg, color: color, border: `1px solid ${border}`,
                                      fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase', display: 'inline-block'
                                    }}>
                                      {mapped}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#4A607A' }}>
                                ${agreedUSD.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#15803D' }}>
                                ${paidUSD.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                              </td>
                              <td style={{ 
                                padding: '10px 12px', textAlign: 'right', fontWeight: 800, 
                                color: debtUSD < 0 ? '#15803D' : debtUSD > 0 ? '#1D4ED8' : '#2C2520'
                              }}>
                                {debtUSD < 0 ? `-$${Math.abs(Math.round(debtUSD)).toLocaleString('en-US')}` : `$${Math.round(debtUSD).toLocaleString('en-US')}`}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#8C7355' }}>
                                {agreedUAH.toLocaleString('uk-UA')} ₴
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#15803D' }}>
                                {paidUAH.toLocaleString('uk-UA')} ₴
                              </td>
                              <td style={{ 
                                padding: '10px 12px', textAlign: 'right', fontWeight: 800, 
                                color: debtUAH < 0 ? '#15803D' : debtUAH > 0 ? '#C2410C' : '#2C2520'
                              }}>
                                {debtUAH < 0 ? `-${Math.abs(Math.round(debtUAH)).toLocaleString('uk-UA')} ₴` : `${Math.round(debtUAH).toLocaleString('uk-UA')} ₴`}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Підсумковий рядок */}
                        <tr style={{ background: '#FAF6F0', borderTop: '2px solid #D4C5B9', fontWeight: 900, color: '#2C2520' }}>
                          <td colSpan={2} style={{ padding: '12px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>
                            <span>🤝</span> Всього по усіх угодах:
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#4A607A' }}>
                            ${totalAgreedUSD.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#15803D' }}>
                            ${totalPaidUSD.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                          </td>
                          <td style={{ 
                            padding: '12px', textAlign: 'right', fontWeight: 900,
                            color: totalDebtUSD < 0 ? '#15803D' : totalDebtUSD > 0 ? '#1D4ED8' : '#2C2520'
                          }}>
                            {totalDebtUSD < 0 ? `-$${Math.abs(Math.round(totalDebtUSD)).toLocaleString('en-US')}` : `$${Math.round(totalDebtUSD).toLocaleString('en-US')}`}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#8C7355' }}>
                            {totalAgreedUAH.toLocaleString('uk-UA')} ₴
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#15803D' }}>
                            {totalPaidUAH.toLocaleString('uk-UA')} ₴
                          </td>
                          <td style={{ 
                            padding: '12px', textAlign: 'right', fontWeight: 900,
                            color: totalDebtUAH < 0 ? '#15803D' : totalDebtUAH > 0 ? '#C2410C' : '#2C2520'
                          }}>
                            {totalDebtUAH < 0 ? `-${Math.abs(Math.round(totalDebtUAH)).toLocaleString('uk-UA')} ₴` : `${Math.round(totalDebtUAH).toLocaleString('uk-UA')} ₴`}
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
                      <ProjectCRMCard key={project.id} project={project} client={client} onUpdate={loadProjects} isMobile={isMobile} />
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
                        <ProjectCRMCard key={project.id} project={project} client={client} onUpdate={loadProjects} isMobile={isMobile} />
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
  );
}

function ProjectCRMCard({ project, client, onUpdate, isMobile }) {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(project.address || '');
  const [noteInput, setNoteInput] = useState(project.note || '');
  const [auditLogs, setAuditLogs] = useState([]);
  const [showQuickShipment, setShowQuickShipment] = useState(false);
  const [expressMaterials, setExpressMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [pricingMode, setPricingMode] = useState(false);
  const [pricingPrices, setPricingPrices] = useState({});
  const [pricingCurrencies, setPricingCurrencies] = useState({});
  const [savingPrices, setSavingPrices] = useState(false);
  const [activeTab, setActiveTab] = useState('finances');
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineEditingData, setInlineEditingData] = useState({});
  const [unifiedSearch, setUnifiedSearch] = useState('');
  const [agreedSums, setAgreedSums] = useState({
    usd: parseFloat(project.agreed_sum_usd) || 0,
    uah: parseFloat(project.agreed_sum_uah) || 0
  });

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
            paddingTop: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            overflowX: isMobile ? 'auto' : 'visible',
            whiteSpace: isMobile ? 'nowrap' : 'normal',
            paddingBottom: isMobile ? '8px' : '0',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}>
            {stages.map((stage, idx) => {
              const isActive = currentStatus === stage;
              const currentIdx = stages.indexOf(currentStatus);
              const isCompleted = currentIdx >= idx;
              
              return (
                <React.Fragment key={stage}>
                  {idx > 0 && <span style={{ color: '#D4C5B9', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>➔</span>}
                  <button
                    onClick={() => handleStatusChange(stage)}
                    style={{
                      flexShrink: 0,
                      background: isActive ? '#C4B4A6' : isCompleted ? '#FAF6F0' : '#FFFFFF',
                      border: `1px solid ${isActive ? '#C4B4A6' : '#D4C5B9'}`,
                      color: isActive ? '#FFFFFF' : isCompleted ? '#2C2520' : '#8B7D73',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: isActive ? 800 : 600,
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? '0 2px 4px rgba(196, 180, 166, 0.3)' : 'none',
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

        {/* Prominent High-Fidelity Currency Cards - Integrated directly into status block header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
          gap: '12px', 
          marginTop: '12px',
          width: '100%', 
          maxWidth: '480px' 
        }}>
          
          {/* USD Card (Ice Blue Accent) */}
          <div style={{ 
            background: '#F4F7F9', border: '1px solid #CAD4DE', borderRadius: '10px', 
            padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px',
            boxShadow: '0 2px 4px rgba(74,96,122,0.04)',
            minWidth: 0,
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#4A607A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {debtUSD < 0 ? 'Передоплата USD' : 'Борг USD'}
              </span>
              <div style={{ fontSize: '18px', fontWeight: 900, color: debtUSD < 0 ? '#15803D' : debtUSD > 0 ? '#1D4ED8' : '#2C2520' }}>
                ${Math.abs(debtUSD).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ borderTop: '1px dashed #CAD4DE', paddingTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#5C6E82', fontWeight: 500 }}>Погоджено:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: '#2C2520' }}>$</span>
                <input 
                  type="number" 
                  value={agreedSums.usd} 
                  onChange={e => setAgreedSums({...agreedSums, usd: parseFloat(e.target.value) || 0})}
                  onBlur={() => saveAgreedSums()}
                  style={{ 
                    width: '64px', fontSize: '11px', fontWeight: 700, padding: '2px 4px', 
                    border: '1px solid #CAD4DE', borderRadius: '4px', outline: 'none', background: '#FFFFFF', color: '#2C2520', textAlign: 'right',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* UAH Card (Honey Gold Accent) */}
          <div style={{ 
            background: '#FFFDF5', border: '1px solid #F2E6C4', borderRadius: '10px', 
            padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px',
            boxShadow: '0 2px 4px rgba(139,125,112,0.04)',
            minWidth: 0,
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#8C7355', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {debtUAH < 0 ? 'Передоплата UAH' : 'Борг UAH'}
              </span>
              <div style={{ fontSize: '18px', fontWeight: 900, color: debtUAH < 0 ? '#15803D' : debtUAH > 0 ? '#C2410C' : '#2C2520' }}>
                {Math.abs(debtUAH).toLocaleString('uk-UA')} ₴
              </div>
            </div>
            <div style={{ borderTop: '1px dashed #F2E6C4', paddingTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#8B7D73', fontWeight: 500 }}>Погоджено:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <input 
                  type="number" 
                  value={agreedSums.uah} 
                  onChange={e => setAgreedSums({...agreedSums, uah: parseFloat(e.target.value) || 0})}
                  onBlur={() => saveAgreedSums()}
                  style={{ 
                    width: '74px', fontSize: '11px', fontWeight: 700, padding: '2px 4px', 
                    border: '1px solid #F2E6C4', borderRadius: '4px', outline: 'none', background: '#FFFFFF', color: '#2C2520', textAlign: 'right',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#2C2520' }}>₴</span>
              </div>
            </div>
          </div>

        </div>

        {/* Deal Comment Section */}
        <div style={{ borderTop: '1px dashed #D4C5B9', paddingTop: '12px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FileText size={13} color="#8B7D73" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Коментар до угоди</span>
          </div>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onBlur={handleSaveNote}
            placeholder="Введіть важливі деталі по угоді (наприклад: терміни, особливі вимоги клієнта, нюанси монтажу)..."
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '8px 12px',
              fontSize: '12px',
              color: '#2C2520',
              border: '1px solid #D4C5B9',
              borderRadius: '8px',
              background: '#FFFFFF',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#C4B4A6'; }}
          />
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
            <span>📊</span> Фінансовий баланс та Борги
          </button>
          <button 
            onClick={() => setActiveTab('logistics')}
            style={{
              padding: '10px 16px',
              fontSize: '12.5px',
              fontWeight: 800,
              background: activeTab === 'logistics' ? '#FFFFFF' : 'transparent',
              border: activeTab === 'logistics' ? '1px solid #D4C5B9' : '1px solid transparent',
              borderRadius: '20px',
              color: activeTab === 'logistics' ? '#2C2520' : '#8B7D73',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              outline: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📦</span> Логістика та Специфікація
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
            <span>📋</span> Зведена відомість видачі
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
          onClose={() => setShowQuickShipment(false)}
          onUpdate={async () => {
            await loadExpressMaterials();
            if (onUpdate) onUpdate();
          }}
        />
      )}

      {/* Tab Contents */}
      {activeTab === 'finances' && (
        <div style={{ background: '#FFFFFF', maxWidth: '1200px', boxSizing: 'border-box' }}>
          {/* Express Materials Ledger (Debt Materials) Section - Placed at the very top of Finances */}
          <div style={{ borderBottom: '1px solid #FAF6F0', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <h5 style={{ margin: 0, fontSize: '13.5px', fontWeight: 850, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Відомість виданих в борг матеріалів (Склад)
                </h5>
              </div>
              
              {expressMaterials.some(m => !m.is_priced) && (
                <button
                  onClick={() => setPricingMode(!pricingMode)}
                  style={{
                    background: pricingMode ? '#FFFFFF' : '#C4B4A6',
                    color: pricingMode ? '#8B7D73' : '#FFFFFF',
                    border: pricingMode ? '1px solid #D4C5B9' : 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => { if (!pricingMode) e.currentTarget.style.background = '#B3A395'; }}
                  onMouseLeave={(e) => { if (!pricingMode) e.currentTarget.style.background = '#C4B4A6'; }}
                >
                  {pricingMode ? 'Скасувати оцінку' : '💲 Оцінити неціновані товари'}
                </button>
              )}
            </div>

            {loadingMaterials ? (
              <div style={{ fontSize: '12px', color: '#8B7D73', fontStyle: 'italic', padding: '10px 0' }}>Завантаження відомості складу...</div>
            ) : expressMaterials.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#8B7D73', fontStyle: 'italic', padding: '10px 0', textAlign: 'center', border: '1px dashed #D4C5B9', borderRadius: '8px' }}>
                Немає зафіксованих матеріалів швидкої видачі. Скористайтеся кнопкою "Швидка видача", щоб додати матеріали зі складу.
              </div>
            ) : (
              <div style={{ border: '1px solid #D4C5B9', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#FAF6F0', borderBottom: '1px solid #D4C5B9' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520' }}>Матеріал</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '80px', textAlign: 'center' }}>Кількість</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '80px', textAlign: 'center' }}>Од. вим.</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '120px', textAlign: 'center' }}>Ціна</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '90px', textAlign: 'center' }}>Валюта</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '110px', textAlign: 'center' }}>Статус</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '110px', textAlign: 'center' }}>Дата видачі</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '120px', textAlign: 'center' }}>Примітка</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '100px', textAlign: 'center' }}>Сума боргу</th>
                      <th style={{ padding: '8px 12px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expressMaterials.map(m => {
                      const isEditing = inlineEditingId === m.id;
                      const isPriced = isEditing 
                        ? (inlineEditingData.price !== '' && inlineEditingData.price !== undefined && inlineEditingData.price !== null)
                        : m.is_priced;
                        
                      const qtyVal = isEditing ? parseFloat(inlineEditingData.quantity) || 0 : parseFloat(m.quantity) || 0;
                      const prVal = isEditing 
                        ? (inlineEditingData.price !== '' && inlineEditingData.price !== undefined && inlineEditingData.price !== null ? parseFloat(inlineEditingData.price) || 0 : 0)
                        : parseFloat(m.price) || 0;
                        
                      const itemSum = isPriced ? qtyVal * prVal : null;
                      const activeCurrency = isEditing ? inlineEditingData.currency : m.currency;
                      
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid #FAF6F0', background: !isPriced ? '#FFFDF5' : 'transparent' }}>
                          
                          {/* Name Column */}
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2C2520' }}>
                            {isEditing ? (
                              <input 
                                type="text"
                                value={inlineEditingData.name || ''}
                                onChange={e => setInlineEditingData({ ...inlineEditingData, name: e.target.value })}
                                style={{
                                  width: '100%', padding: '4px 6px', fontSize: '11.5px', border: '1px solid #C4B4A6',
                                  borderRadius: '4px', background: '#FFFFFF', color: '#2C2520', outline: 'none'
                                }}
                              />
                            ) : (
                              m.name
                            )}
                          </td>

                          {/* Quantity Column */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#2C2520', fontWeight: 700 }}>
                            {isEditing ? (
                              <input 
                                type="number"
                                step="any"
                                value={inlineEditingData.quantity !== undefined ? inlineEditingData.quantity : ''}
                                onChange={e => setInlineEditingData({ ...inlineEditingData, quantity: e.target.value })}
                                style={{
                                  width: '60px', padding: '4px 6px', fontSize: '11.5px', border: '1px solid #C4B4A6',
                                  borderRadius: '4px', background: '#FFFFFF', color: '#2C2520', outline: 'none', textAlign: 'center'
                                }}
                              />
                            ) : (
                              m.quantity
                            )}
                          </td>

                          {/* Unit Column */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#8B7D73' }}>
                            {isEditing ? (
                              <input 
                                type="text"
                                value={inlineEditingData.unit !== undefined ? inlineEditingData.unit : ''}
                                onChange={e => setInlineEditingData({ ...inlineEditingData, unit: e.target.value })}
                                style={{
                                  width: '50px', padding: '4px 6px', fontSize: '11.5px', border: '1px solid #C4B4A6',
                                  borderRadius: '4px', background: '#FFFFFF', color: '#2C2520', outline: 'none', textAlign: 'center'
                                }}
                              />
                            ) : (
                              m.unit
                            )}
                          </td>
                          
                          {/* Price Column */}
                          <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                            {isEditing ? (
                              <input
                                type="number"
                                step="any"
                                placeholder="Ціна"
                                value={inlineEditingData.price !== undefined && inlineEditingData.price !== null ? inlineEditingData.price : ''}
                                onChange={(e) => setInlineEditingData({ ...inlineEditingData, price: e.target.value })}
                                style={{
                                  width: '70px', padding: '4px 6px', fontSize: '11px', border: '1px solid #C4B4A6',
                                  borderRadius: '4px', background: '#FFFFFF', color: '#2C2520', outline: 'none', textAlign: 'center'
                                }}
                              />
                            ) : pricingMode && !m.is_priced ? (
                              <input
                                type="number"
                                step="any"
                                placeholder="Введіть ціну"
                                value={pricingPrices[m.id] !== undefined ? pricingPrices[m.id] : ''}
                                onChange={(e) => setPricingPrices({ ...pricingPrices, [m.id]: e.target.value })}
                                style={{
                                  width: '80px', padding: '4px 6px', fontSize: '11px', border: '1px solid #C4B4A6',
                                  borderRadius: '4px', background: '#FFFFFF', color: '#2C2520', outline: 'none', textAlign: 'center'
                                }}
                              />
                            ) : (
                              <span style={{ fontWeight: m.is_priced ? 700 : 400, color: m.is_priced ? '#2C2520' : '#8B7D73' }}>
                                {m.is_priced ? parseFloat(m.price).toLocaleString() : 'не вказано'}
                              </span>
                            )}
                          </td>

                          {/* Currency Column */}
                          <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                            {isEditing ? (
                              <select
                                value={inlineEditingData.currency || 'UAH'}
                                onChange={(e) => setInlineEditingData({ ...inlineEditingData, currency: e.target.value })}
                                style={{
                                  width: '60px', padding: '4px', fontSize: '11px', border: '1px solid #C4B4A6',
                                  borderRadius: '4px', background: '#FFFFFF', color: '#2C2520', outline: 'none'
                                }}
                              >
                                <option value="UAH">UAH</option>
                                <option value="USD">USD</option>
                              </select>
                            ) : pricingMode && !m.is_priced ? (
                              <select
                                value={pricingCurrencies[m.id] || 'UAH'}
                                onChange={(e) => setPricingCurrencies({ ...pricingCurrencies, [m.id]: e.target.value })}
                                style={{
                                  width: '60px', padding: '4px', fontSize: '11px', border: '1px solid #C4B4A6',
                                  borderRadius: '4px', background: '#FFFFFF', color: '#2C2520', outline: 'none'
                                }}
                              >
                                <option value="UAH">UAH</option>
                                <option value="USD">USD</option>
                              </select>
                            ) : (
                              <span style={{ fontWeight: 700, color: m.currency === 'USD' ? '#1D4ED8' : '#C2410C' }}>
                                {m.is_priced ? m.currency : '—'}
                              </span>
                            )}
                          </td>

                          {/* Status Badges */}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {!isPriced ? (
                              <span style={{ background: '#FFF3E0', color: '#B06000', border: '1px solid #FFE0B2', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                                Очікує оцінки
                              </span>
                            ) : (
                              <span style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                                Враховано
                              </span>
                            )}
                          </td>

                          {/* Date Column */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#8B7D73', whiteSpace: 'nowrap' }}>
                            {isEditing ? (
                              <input 
                                type="date"
                                value={inlineEditingData.issued_at ? inlineEditingData.issued_at.split('T')[0] : ''}
                                onChange={e => setInlineEditingData({ 
                                  ...inlineEditingData, 
                                  issued_at: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString() 
                                })}
                                style={{
                                  width: '110px', padding: '4px 6px', fontSize: '11px', border: '1px solid #C4B4A6',
                                  borderRadius: '4px', background: '#FFFFFF', color: '#2C2520', outline: 'none', textAlign: 'center'
                                }}
                              />
                            ) : (
                              m.issued_at ? new Date(m.issued_at).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
                            )}
                          </td>

                          {/* Note Column */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#8B7D73' }}>
                            {isEditing ? (
                              <input 
                                type="text"
                                placeholder="Коментар..."
                                value={inlineEditingData.note || ''}
                                onChange={e => setInlineEditingData({ ...inlineEditingData, note: e.target.value })}
                                style={{
                                  width: '100px', padding: '4px 6px', fontSize: '11px', border: '1px solid #C4B4A6',
                                  borderRadius: '4px', background: '#FFFFFF', color: '#2C2520', outline: 'none'
                                }}
                              />
                            ) : (
                              m.note || '—'
                            )}
                          </td>

                          {/* Debt Sum Column */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: activeCurrency === 'USD' ? '#1D4ED8' : '#C2410C' }}>
                            {itemSum !== null ? (
                              activeCurrency === 'USD' ? `$${itemSum.toLocaleString()}` : `${itemSum.toLocaleString()} ₴`
                            ) : '—'}
                          </td>

                          {/* Action Buttons Column */}
                          <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={async () => {
                                      const pQty = parseFloat(inlineEditingData.quantity);
                                      if (isNaN(pQty) || pQty <= 0) {
                                        alert('Кількість матеріалу має бути більшою за 0!');
                                        return;
                                      }
                                      if (!inlineEditingData.name || inlineEditingData.name.trim() === '') {
                                        alert('Назва матеріалу не може бути порожньою!');
                                        return;
                                      }

                                      try {
                                        const pValStr = inlineEditingData.price;
                                        const hasPrice = pValStr !== '' && pValStr !== undefined && pValStr !== null;
                                        const parsedPrice = hasPrice ? parseFloat(pValStr) : null;
                                        
                                        if (hasPrice && (isNaN(parsedPrice) || parsedPrice < 0)) {
                                          alert('Будь ласка, введіть коректну числову ціну!');
                                          return;
                                        }

                                        const payload = {
                                          ...m,
                                          name: inlineEditingData.name.trim(),
                                          quantity: pQty,
                                          unit: inlineEditingData.unit || 'шт.',
                                          price: parsedPrice,
                                          currency: inlineEditingData.currency || 'UAH',
                                          is_priced: parsedPrice !== null,
                                          issued_at: inlineEditingData.issued_at || m.issued_at || new Date().toISOString(),
                                          note: inlineEditingData.note ? inlineEditingData.note.trim() : null
                                        };

                                        await crmApi.saveProjectMaterial(payload);

                                        // Trigger a full recalculation of project debts
                                        await crmApi.priceProjectMaterials(project.id, []);

                                        await crmApi.saveAuditLog({
                                          projectId: project.id,
                                          clientId: project.client_id,
                                          actionType: 'Редагування матеріалу',
                                          details: `Відредаговано матеріал швидкої видачі: "${payload.name}" (${payload.quantity} ${payload.unit}) по ціні ${hasPrice ? `${payload.price} ${payload.currency}` : 'не вказано'}`
                                        });

                                        setInlineEditingId(null);
                                        await loadExpressMaterials();
                                        if (onUpdate) onUpdate();
                                      } catch (err) {
                                        alert('Помилка збереження змін матеріалу: ' + err.message);
                                      }
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#137333', cursor: 'pointer', padding: '4px', fontSize: '13px' }}
                                    title="Зберегти зміни"
                                  >
                                    💾
                                  </button>
                                  <button
                                    onClick={() => setInlineEditingId(null)}
                                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px', fontSize: '13px' }}
                                    title="Скасувати"
                                  >
                                    ❌
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setInlineEditingId(m.id);
                                      setInlineEditingData({
                                        name: m.name,
                                        quantity: m.quantity,
                                        unit: m.unit,
                                        price: m.price !== null ? m.price : '',
                                        currency: m.currency || 'UAH',
                                        issued_at: m.issued_at || new Date().toISOString(),
                                        note: m.note || ''
                                      });
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#8B7D73', cursor: 'pointer', padding: '4px' }}
                                    title="Редагувати запис"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm(`Ви впевнені, що хочете видалити матеріал "${m.name}" з відомості швидкої видачі?`)) return;
                                      try {
                                        await crmApi.deleteProjectMaterial(m.id);
                                        // Trigger recalculation of project debts
                                        await crmApi.priceProjectMaterials(project.id, []);
                                        
                                        await crmApi.saveAuditLog({
                                          projectId: project.id,
                                          clientId: project.client_id,
                                          actionType: 'Видалення матеріалу',
                                          details: `Видалено матеріал швидкої видачі з відомості складу: "${m.name}"`
                                        });
                                        
                                        await loadExpressMaterials();
                                        if (onUpdate) onUpdate();
                                      } catch (err) {
                                        alert('Помилка видалення матеріалу: ' + err.message);
                                      }
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                                    title="Видалити запис швидкої видачі"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pricing Mode Actions Block */}
                {pricingMode && (
                  <div style={{ background: '#FAF6F0', borderTop: '1px solid #D4C5B9', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      onClick={() => setPricingMode(false)}
                      style={{
                        background: '#FFFFFF', color: '#8B7D73', border: '1px solid #D4C5B9', borderRadius: '6px',
                        padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      Скасувати
                    </button>
                    <button
                      onClick={async () => {
                        const itemsToSave = [];
                        let hasInvalid = false;
                        
                        expressMaterials.forEach(m => {
                          if (!m.is_priced) {
                            const prVal = pricingPrices[m.id];
                            if (prVal && prVal.trim() !== '') {
                              const pFloat = parseFloat(prVal);
                              if (isNaN(pFloat) || pFloat < 0) {
                                hasInvalid = true;
                              } else {
                                itemsToSave.push({
                                  ...m,
                                  price: pFloat,
                                  currency: pricingCurrencies[m.id] || 'UAH',
                                  is_priced: true
                                });
                              }
                            }
                          }
                        });

                        if (hasInvalid) {
                          alert('Будь ласка, введіть коректні числові ціни (більше або рівні 0)');
                          return;
                        }

                        if (itemsToSave.length === 0) {
                          alert('Ви не ввели ціни для жодного матеріалу!');
                          return;
                        }

                        setSavingPrices(true);
                        try {
                          await crmApi.priceProjectMaterials(project.id, itemsToSave);
                          await crmApi.saveAuditLog({
                            projectId: project.id,
                            clientId: project.client_id,
                            actionType: 'Оцінка матеріалів',
                            details: `Менеджер затвердив ціни на матеріали у кількості ${itemsToSave.length} шт. Фінансові баланси угоди автоматично оновлено.`
                          });

                          alert('Ціни успішно збережено, баланси угоди перераховано!');
                          setPricingMode(false);
                          await loadExpressMaterials();
                          if (onUpdate) onUpdate();
                        } catch (err) {
                          console.error(err);
                          alert('Помилка при збереженні цін: ' + err.message);
                        } finally {
                          setSavingPrices(false);
                        }
                      }}
                      disabled={savingPrices}
                      style={{
                        background: '#C4B4A6', color: '#FFFFFF', border: 'none', borderRadius: '6px',
                        padding: '6px 16px', fontSize: '12px', fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      {savingPrices ? 'Збереження цін...' : 'Затвердити та перерахувати борг'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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

      {activeTab === 'logistics' && (
        <div style={{ background: '#FFFFFF', padding: '24px', maxWidth: '1200px', boxSizing: 'border-box' }}>
          <ProjectMaterialsBlock 
            project={project} 
            materialItems={materialItems} 
            shipments={project.project_shipments || []} 
            onUpdate={onUpdate} 
            leftToIssue={leftToIssue}
            isMobile={isMobile}
          />
        </div>
      )}

      {activeTab === 'unified' && (() => {
        const regularIssued = [];
        const shipmentsList = project.project_shipments || [];
        shipmentsList.forEach(s => {
          s.shipment_items?.forEach(si => {
            const itemObj = materialItems.find(i => i.id === si.project_item_id);
            regularIssued.push({
              id: `shipment-item-${si.id}`,
              name: itemObj ? itemObj.name : 'Кастомний товар',
              quantity: parseFloat(si.quantity) || 0,
              unit: itemObj ? (itemObj.unit || 'шт.') : 'шт.',
              date: s.date || '—',
              type: 'По контракту',
              source: 'Накладна',
              price: itemObj ? itemObj.price : null,
              currency: itemObj ? itemObj.currency : 'UAH',
              note: s.carrier ? `Доставка: ${s.carrier}${s.tracking_number ? `, ТТН: ${s.tracking_number}` : ''}` : '—',
              isPriced: true
            });
          });
        });

        const debtIssued = expressMaterials.map(m => ({
          id: `debt-${m.id}`,
          name: m.name,
          quantity: parseFloat(m.quantity) || 0,
          unit: m.unit || 'шт.',
          date: m.issued_at ? m.issued_at.split('T')[0] : '—',
          type: 'В борг (Склад)',
          source: 'Відомість боргу',
          price: m.is_priced ? m.price : null,
          currency: m.currency || 'UAH',
          note: m.note || (m.issued_by ? `Видав: ${m.issued_by}` : '—'),
          isPriced: m.is_priced
        }));

        const mergedList = [...regularIssued, ...debtIssued].sort((a, b) => new Date(b.date) - new Date(a.date));

        const filteredList = mergedList.filter(item => 
          item.name.toLowerCase().includes(unifiedSearch.toLowerCase()) || 
          item.type.toLowerCase().includes(unifiedSearch.toLowerCase()) ||
          item.note.toLowerCase().includes(unifiedSearch.toLowerCase())
        );

        const totalContractPos = regularIssued.length;
        const totalDebtPos = debtIssued.length;
        const grandTotalPos = totalContractPos + totalDebtPos;

        return (
          <div style={{ background: '#FFFFFF', padding: '24px', maxWidth: '1200px', boxSizing: 'border-box' }}>
            {/* Cards stats header */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: '#16A34A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Видано за контрактом</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#14532D', marginTop: '4px' }}>{totalContractPos} поз.</div>
              </div>
              <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: '#EA580C', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Видано в борг зі складу</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#7C2D12', marginTop: '4px' }}>{totalDebtPos} поз.</div>
              </div>
              <div style={{ background: '#FAF6F0', border: '1px solid #D4C5B9', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: '#8B7D73', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Загалом видано матеріалів</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#2C2520', marginTop: '4px' }}>{grandTotalPos} поз.</div>
              </div>
            </div>

            {/* Title & Search bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <h5 style={{ margin: 0, fontSize: '13.5px', fontWeight: 850, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Зведена відомість видачі матеріалів
                </h5>
              </div>
              <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
                <input 
                  type="text"
                  placeholder="Швидкий пошук за назвою чи приміткою..."
                  value={unifiedSearch}
                  onChange={e => setUnifiedSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px 6px 12px', fontSize: '12px', border: '1px solid #D4C5B9',
                    borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {filteredList.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#8B7D73', fontStyle: 'italic', padding: '20px 0', textAlign: 'center', border: '1px dashed #D4C5B9', borderRadius: '8px' }}>
                Матеріалів за вказаними критеріями не знайдено.
              </div>
            ) : (
              <div style={{ border: '1px solid #D4C5B9', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#FAF6F0', borderBottom: '1px solid #D4C5B9' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520' }}>Матеріал</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '90px', textAlign: 'center' }}>Кількість</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '95px', textAlign: 'center' }}>Дата видачі</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '130px', textAlign: 'center' }}>Тип походження</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '90px', textAlign: 'center' }}>Ціна</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '100px', textAlign: 'center' }}>Загальна сума</th>
                      <th style={{ padding: '8px 12px', fontWeight: 800, color: '#2C2520', width: '220px' }}>Супровідна інформація / Примітка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map(item => {
                      const cost = item.price ? item.quantity * item.price : null;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #FAF6F0', transition: 'background 0.15s' }}>
                          {/* Name */}
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2C2520' }}>{item.name}</td>
                          
                          {/* Qty & Unit */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#2C2520' }}>
                            {item.quantity} {item.unit}
                          </td>
                          
                          {/* Date */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#8B7D73', whiteSpace: 'nowrap' }}>
                            {item.date !== '—' ? new Date(item.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                          </td>
                          
                          {/* Type badges */}
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {item.type === 'По контракту' ? (
                              <span style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6', fontSize: '9.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', display: 'inline-block', whiteSpace: 'nowrap' }}>
                                📊 ПО КОНТРАКТУ
                              </span>
                            ) : (
                              <span style={{ background: '#FFF3E0', color: '#B06000', border: '1px solid #FFE0B2', fontSize: '9.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', display: 'inline-block', whiteSpace: 'nowrap' }}>
                                📦 В БОРГ (СКЛАД)
                              </span>
                            )}
                          </td>
                          
                          {/* Price */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#8B7D73' }}>
                            {item.price !== null ? (
                              item.currency === 'USD' ? `$${item.price.toLocaleString()}` : `${item.price.toLocaleString()} ₴`
                            ) : (
                              <span style={{ fontStyle: 'italic', fontSize: '11px', color: '#B3A395' }}>неоцінено</span>
                            )}
                          </td>
                          
                          {/* Total Cost */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: item.currency === 'USD' ? '#1D4ED8' : '#C2410C' }}>
                            {cost !== null ? (
                              item.currency === 'USD' ? `$${cost.toLocaleString()}` : `${cost.toLocaleString()} ₴`
                            ) : '—'}
                          </td>
                          
                          {/* Note */}
                          <td style={{ padding: '10px 12px', color: '#8B7D73', fontSize: '11.5px' }}>{item.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'history' && (
        <div style={{ background: '#FFFFFF', padding: '24px', maxWidth: '1200px', boxSizing: 'border-box' }}>
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
      </div>
  );
}

// -------------------------------------------------------------
// БЛОК ФІНАНСИ (Side-by-side USD/UAH, payments, add form)
// -------------------------------------------------------------
function ProjectFinancesBlock({ project, validPayments, debtUSD, debtUAH, onUpdate, isMobile }) {
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [newPayment, setNewPayment] = useState({ sum: '', currency: 'UAH', date: new Date().toISOString().split('T')[0], payment_type: 'Оплата', note: '' });

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
    setEditingPaymentId(payment.id);
    setNewPayment({
      sum: payment.sum,
      currency: payment.currency,
      date: payment.date,
      payment_type: payment.payment_type || 'Оплата',
      note: payment.note || ''
    });
    setShowAdd(true);
  };

  const handleCancelForm = () => {
    setShowAdd(false);
    setEditingPaymentId(null);
    setNewPayment({ sum: '', currency: 'UAH', date: new Date().toISOString().split('T')[0], payment_type: 'Оплата', note: '' });
  };

  const handleShowAddForm = () => {
    setEditingPaymentId(null);
    setNewPayment({ sum: '', currency: 'UAH', date: new Date().toISOString().split('T')[0], payment_type: 'Оплата', note: '' });
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
        status: 'Оплачено'
      });
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: isEdit ? 'Редагування платежу' : 'Додавання платежу',
        details: `${isEdit ? 'Відредаговано' : 'Додано'} платіж: ${newPayment.sum} ${newPayment.currency} (${newPayment.payment_type}) від ${newPayment.date} ${newPayment.note ? `[${newPayment.note}]` : ''}`
      });
      setShowAdd(false);
      setEditingPaymentId(null);
      setNewPayment({ sum: '', currency: 'UAH', date: new Date().toISOString().split('T')[0], payment_type: 'Оплата', note: '' });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
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
          {validPayments.map(p => {
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
    </div>
  );
}

// -------------------------------------------------------------
// БЛОК МАТЕРІАЛИ (Ordered list, shipments timeline, custom builder)
// -------------------------------------------------------------
function ProjectMaterialsBlock({ project, materialItems, shipments, onUpdate, leftToIssue, isMobile }) {
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showKPModal, setShowKPModal] = useState(false);
  
  // Нові стани для додавання позиції матеріалу
  const [showAddNewItem, setShowAddNewItem] = useState(false);
  const [newItemsList, setNewItemsList] = useState([{ name: '', quantity: '', price: '', note: '' }]);
  
  // Нове відвантаження - За замовчуванням Самовивіз
  const [newShipment, setNewShipment] = useState({ date: new Date().toISOString().split('T')[0], carrier: 'Самовивіз', tracking_number: '', note: '' });
  const [shipQtys, setShipQtys] = useState({});
  const [shipPrices, setShipPrices] = useState({});
  const [shipCurrencies, setShipCurrencies] = useState({});
  const [newItems, setNewItems] = useState([]);
  const [addToContract, setAddToContract] = useState(true);

  // Оплата при відвантаженні
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('UAH');
  const [paymentType, setPaymentType] = useState('Готівка');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    const initialQtys = {};
    const initialPrices = {};
    const initialCurrencies = {};
    materialItems.forEach(i => {
      initialQtys[i.id] = 0;
      initialPrices[i.id] = parseFloat(i.price) || 0;
      initialCurrencies[i.id] = 'UAH';
    });
    setShipQtys(initialQtys);
    setShipPrices(initialPrices);
    setShipCurrencies(initialCurrencies);
  }, [materialItems]);

  const getIssuedQty = (itemId) => {
    let sum = 0;
    shipments.forEach(s => s.shipment_items?.forEach(si => { if (si.project_item_id === itemId) sum += parseFloat(si.quantity || 0); }));
    return sum;
  };

  const handleSaveShipment = async () => {
    // 1. Товари
    const itemsToShip = Object.keys(shipQtys)
      .map(id => ({
        project_item_id: id,
        quantity: parseFloat(shipQtys[id]) || 0,
        price: parseFloat(shipPrices[id]) || 0,
        currency: shipCurrencies[id] || 'UAH'
      }))
      .filter(i => i.quantity > 0);

    // 2. Нові товари на льоту
    const customItems = newItems.filter(item => item.name.trim() !== '' && (parseFloat(item.quantity) || 0) > 0);

    if (itemsToShip.length === 0 && customItems.length === 0) {
      return alert('Вкажіть кількість для відвантаження');
    }

    setSaving(true);
    try {
      const savedCustomItems = await crmApi.createProjectItems(project.id, customItems);
      const allShipmentItems = [...itemsToShip, ...savedCustomItems];

      // Вираховуємо загальну вартість
      let totalUSD = 0;
      let totalUAH = 0;
      allShipmentItems.forEach(item => {
        const cost = item.quantity * item.price;
        if (item.currency === 'USD') {
          totalUSD += cost;
        } else {
          totalUAH += cost;
        }
      });

      // Збільшуємо погоджену суму угоди якщо ввімкнено checkbox
      if (addToContract) {
        const currentAgreedUSD = parseFloat(project.agreed_sum_usd) || 0;
        const currentAgreedUAH = parseFloat(project.agreed_sum_uah) || 0;
        await crmApi.updateProjectAgreedSums(project.id, {
          usd: currentAgreedUSD + totalUSD,
          uah: currentAgreedUAH + totalUAH
        });
      }

      // Зберігаємо накладну
      await crmApi.saveShipment({ project_id: project.id, ...newShipment }, allShipmentItems);

      // Audit Log for Shipment
      const itemsCount = allShipmentItems.reduce((acc, item) => acc + item.quantity, 0);
      const itemsDetails = allShipmentItems.map(si => {
        const matchingItem = materialItems.find(mi => mi.id === si.project_item_id) || customItems.find(ci => ci.name === si.name);
        const name = matchingItem ? matchingItem.name : 'Товар';
        return `${name} (${si.quantity} шт по ${si.price} ${si.currency})`;
      }).join(', ');

      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Відвантаження',
        details: `Створено відвантаження: перевізник "${newShipment.carrier}", ТТН: "${newShipment.tracking_number || '-'}", відвантажено ${itemsCount} од. товару [${itemsDetails}]. ${newShipment.note ? `Коментар: ${newShipment.note}` : ''}`
      });

      // Записуємо платіж на місці
      const paidSum = parseFloat(paymentAmount) || 0;
      if (paidSum > 0) {
        await crmApi.savePayment({
          project_id: project.id,
          sum: paidSum,
          currency: paymentCurrency,
          date: newShipment.date || new Date().toISOString().split('T')[0],
          payment_type: paymentType,
          note: paymentNote || `Оплата при відвантаженні (${newShipment.carrier})`,
          status: 'Оплачено'
        });

        await crmApi.saveAuditLog({
          projectId: project.id,
          clientId: project.client_id,
          actionType: 'Додавання платежу',
          details: `Додано платіж (при відвантаженні): ${paidSum} ${paymentCurrency} (${paymentType}) від ${newShipment.date || new Date().toISOString().split('T')[0]}. ${paymentNote ? `Коментар: ${paymentNote}` : ''}`
        });
      }

      // Скидання
      setShowAdd(false);
      setNewShipment({ date: new Date().toISOString().split('T')[0], carrier: 'Самовивіз', tracking_number: '', note: '' });
      setShipQtys({});
      setShipPrices({});
      setShipCurrencies({});
      setNewItems([]);
      setPaymentAmount('');
      setPaymentNote('');

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Помилка збереження відвантаження: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShipment = async (shipmentId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити це відвантаження? Товари будуть повернуті до видачі.')) return;
    setSaving(true);
    try {
      const shipmentToDelete = shipments.find(s => s.id === shipmentId);
      const carrier = shipmentToDelete ? shipmentToDelete.carrier : '';
      const ttn = shipmentToDelete ? shipmentToDelete.tracking_number : '';

      await crmApi.deleteShipment(shipmentId);
      
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Видалення відвантаження',
        details: `Видалено відвантаження (перевізник: "${carrier}"${ttn ? `, ТТН: "${ttn}"` : ''}). Товари повернуто до видачі.`
      });

      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка видалення: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectKP = async (proposalId) => {
    setShowKPModal(false);
    setSaving(true);
    try {
      const res = await projectService.importFromProposal(project.id, proposalId);
      if (res.success) {
        if (onUpdate) onUpdate();
      } else {
        alert('Помилка імпорту з КП: ' + res.error);
      }
    } catch (err) {
      alert('Помилка імпорту');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItemNote = async (item, note) => {
    try {
      const oldNote = item.note || '';
      await crmApi.updateProjectItemNote(item.id, note);
      
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Редагування товару',
        details: `Змінено коментар товару "${item.name}" з "${oldNote}" на "${note}".`
      });

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateItemQty = async (item, qty) => {
    try {
      const oldQty = item.quantity;
      await crmApi.updateProjectItemQuantity(item.id, qty);
      
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Редагування товару',
        details: `Змінено кількість товару "${item.name}" з ${oldQty} шт на ${qty} шт.`
      });

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Помилка оновлення кількості: ' + err.message);
    }
  };

  const handleUpdateItemPrice = async (item, price) => {
    try {
      const oldPrice = item.price || 0;
      await crmApi.updateProjectItemPrice(item.id, price);
      
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Редагування товару',
        details: `Змінено ціну товару "${item.name}" з $${parseFloat(oldPrice).toFixed(2)} на $${parseFloat(price).toFixed(2)}.`
      });

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Помилка оновлення ціни: ' + err.message);
    }
  };

  const handleAddNewItem = async () => {
    const validItems = newItemsList.filter(item => item.name.trim() !== '' && (parseFloat(item.quantity) || 0) > 0);
    if (validItems.length === 0) {
      return alert('Будь ласка, заповніть хоча б одну позицію товару з кількістю більше 0');
    }

    setSaving(true);
    try {
      for (const item of validItems) {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.price) || 0;
        await crmApi.addProjectItem(project.id, {
          name: item.name.trim(),
          quantity: qty,
          price: price,
          note: item.note.trim()
        });

        await crmApi.saveAuditLog({
          projectId: project.id,
          clientId: project.client_id,
          actionType: 'Додавання товару',
          details: `Додано товар "${item.name.trim()}" у кількості ${qty} шт до видачі (Ціна: $${price.toFixed(2)}, Сума: $${(qty * price).toFixed(2)}).${item.note.trim() ? ` Коментар: "${item.note.trim()}"` : ''}`
        });
      }

      setShowAddNewItem(false);
      setNewItemsList([{ name: '', quantity: '', price: '', note: '' }]);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка додавання товару: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    const issued = getIssuedQty(item.id);
    if (issued > 0) {
      return alert('Неможливо видалити товар, який вже був частково або повністю відвантажений.');
    }
    if (!window.confirm(`Ви впевнені, що хочете видалити товар "${item.name}" зі специфікації?`)) return;

    try {
      await crmApi.deleteProjectItem(item.id);
      
      await crmApi.saveAuditLog({
        projectId: project.id,
        clientId: project.client_id,
        actionType: 'Видалення товару',
        details: `Видалено товар "${item.name}" зі специфікації.`
      });

      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка видалення товару: ' + err.message);
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        gap: isMobile ? '10px' : '12px',
        marginBottom: '12px' 
      }}>
        <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#2C2520', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Package size={16} color="#C4B4A6" />
          До видачі (Залишок: {leftToIssue} шт)
        </h5>
        
        <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end', flexShrink: 0 }}>
          <button 
            onClick={() => setShowKPModal(true)} 
            style={{ 
              flex: isMobile ? 1 : 'none',
              background: '#FAF6F0', color: '#8B7D73', border: '1px solid #D4C5B9', borderRadius: '6px', 
              padding: '5px 10px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#EAE7E2'}
            onMouseLeave={e => e.currentTarget.style.background = '#FAF6F0'}
          >
            <FileText size={12} /> Імпорт з КП
          </button>
          <button 
            onClick={() => setShowAddNewItem(true)} 
            style={{ 
              flex: isMobile ? 1 : 'none',
              background: '#FAF6F0', color: '#8B7D73', border: '1px solid #D4C5B9', borderRadius: '6px', 
              padding: '5px 10px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#EAE7E2'}
            onMouseLeave={e => e.currentTarget.style.background = '#FAF6F0'}
          >
            <Plus size={12} /> Додати позицію
          </button>
          {!showAdd && (
            <button 
              onClick={() => setShowAdd(true)} 
              style={{ 
                flex: isMobile ? 1 : 'none',
                background: '#C4B4A6', color: 'white', border: 'none', borderRadius: '6px', 
                padding: '5px 12px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#B3A395'}
              onMouseLeave={e => e.currentTarget.style.background = '#C4B4A6'}
            >
              <Truck size={12} /> Відвантажити
            </button>
          )}
        </div>
      </div>

      {/* Add New Project Item Form */}
      {showAddNewItem && (
        <div style={{ 
          background: '#FAF6F0', 
          border: '1px solid #D4C5B9', 
          borderRadius: '10px', 
          padding: '14px', 
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 8px rgba(139, 125, 112, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h6 style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
              📦 Додавання товарів до видачі
            </h6>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {newItemsList.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ flex: 3 }}>
                  <input 
                    type="text" 
                    placeholder="Найменування товару..." 
                    value={item.name}
                    onChange={e => {
                      const next = [...newItemsList];
                      next[index].name = e.target.value;
                      setNewItemsList(next);
                    }}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '70px' }}>
                  <input 
                    type="number" 
                    placeholder="Кількість..." 
                    value={item.quantity}
                    onChange={e => {
                      const next = [...newItemsList];
                      next[index].quantity = e.target.value;
                      setNewItemsList(next);
                    }}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '80px' }}>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="Ціна ($)..." 
                    value={item.price}
                    onChange={e => {
                      const next = [...newItemsList];
                      next[index].price = e.target.value;
                      setNewItemsList(next);
                    }}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 3 }}>
                  <input 
                    type="text" 
                    placeholder="Коментар специфікації..." 
                    value={item.note}
                    onChange={e => {
                      const next = [...newItemsList];
                      next[index].note = e.target.value;
                      setNewItemsList(next);
                    }}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box' }}
                  />
                </div>
                {newItemsList.length > 1 && (
                  <button 
                    onClick={() => {
                      setNewItemsList(newItemsList.filter((_, i) => i !== index));
                    }}
                    style={{ 
                      background: 'none', border: 'none', color: '#B3A395', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#D9534F'}
                    onMouseLeave={e => e.currentTarget.style.color = '#B3A395'}
                    title="Видалити рядок"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <button 
              onClick={() => setNewItemsList([...newItemsList, { name: '', quantity: '', price: '', note: '' }])}
              style={{ 
                background: '#FAF6F0', color: '#8B7D73', border: '1px dashed #D4C5B9', borderRadius: '6px', 
                padding: '4px 10px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#EAE7E2'}
              onMouseLeave={e => e.currentTarget.style.background = '#FAF6F0'}
            >
              <Plus size={12} /> ➕ Ще один товар
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  setShowAddNewItem(false);
                  setNewItemsList([{ name: '', quantity: '', price: '', note: '' }]);
                }}
                style={{ background: '#FFFFFF', color: '#8B7D73', border: '1px solid #D4C5B9', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                Скасувати
              </button>
              <button 
                onClick={handleAddNewItem}
                disabled={saving}
                style={{ background: '#C4B4A6', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                {saving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Materials specification table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ overflowX: 'auto', width: '100%', webkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: isMobile ? '600px' : 'auto', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#FAF6F0', borderBottom: '1px solid #D4C5B9' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#2C2520' }}>Найменування</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#2C2520', width: '80px' }}>Замовлено</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#2C2520', width: '80px' }}>Ціна ($)</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#2C2520', width: '90px' }}>Сума ($)</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#2C2520', width: '70px' }}>До видачі (шт)</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#2C2520', width: '150px' }}>Коментар специфікації</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#2C2520', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {materialItems.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#8B7D73', fontStyle: 'italic' }}>Немає замовлених матеріалів. Імпортуйте КП або відвантажте позиції на льоту.</td></tr>
            ) : materialItems.map(item => {
              const issued = getIssuedQty(item.id);
              const ordered = parseFloat(item.quantity) || 0;
              const itemPrice = parseFloat(item.price) || 0;
              const itemSum = parseFloat(item.sum) || (ordered * itemPrice);
              const left = Math.max(0, ordered - issued);
              const canDelete = issued === 0;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #FAF6F0' }}>
                  <td style={{ padding: '10px 12px', color: '#2C2520', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                    <input 
                      type="number" 
                      defaultValue={ordered} 
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (val !== ordered) {
                          handleUpdateItemQty(item, val);
                        }
                      }}
                      style={{ 
                        width: '60px', padding: '4px 6px', fontSize: '11px', border: '1px solid transparent', 
                        borderRadius: '6px', background: '#FAF6F0', color: '#2C2520', outline: 'none', textAlign: 'center' 
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid #D4C5B9';
                        e.target.style.background = '#FFFFFF';
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      defaultValue={itemPrice > 0 ? itemPrice : ''} 
                      placeholder="0.00"
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (val !== itemPrice) {
                          handleUpdateItemPrice(item, val);
                        }
                      }}
                      style={{ 
                        width: '70px', padding: '4px 6px', fontSize: '11px', border: '1px solid transparent', 
                        borderRadius: '6px', background: '#FAF6F0', color: '#2C2520', outline: 'none', textAlign: 'center' 
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid #D4C5B9';
                        e.target.style.background = '#FFFFFF';
                      }}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#2C2520', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {itemSum > 0 ? `$${itemSum.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: left > 0 ? '#C2410C' : '#15803D', fontWeight: 850 }}>{left}</td>
                  <td style={{ padding: '6px 12px' }}>
                    <input 
                      type="text" 
                      defaultValue={item.note || ''} 
                      placeholder="Редагувати нотатку..." 
                      onBlur={(e) => {
                        if (e.target.value !== item.note) {
                          handleUpdateItemNote(item, e.target.value);
                        }
                      }}
                      style={{ 
                        width: '100%', padding: '4px 8px', fontSize: '11px', border: '1px solid transparent', 
                        borderRadius: '6px', background: '#FAF6F0', color: '#2C2520', outline: 'none' 
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid #D4C5B9';
                        e.target.style.background = '#FFFFFF';
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDeleteItem(item)}
                      title={canDelete ? "Видалити позицію" : "Неможливо видалити відвантажений товар"}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#EF4444', 
                        cursor: canDelete ? 'pointer' : 'not-allowed', 
                        opacity: canDelete ? 1 : 0.25,
                        transition: 'opacity 0.2s',
                        padding: '4px'
                      }}
                      disabled={!canDelete}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {materialItems.length > 0 && (() => {
            const totalOrdered = materialItems.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0);
            const totalSum = materialItems.reduce((acc, i) => {
              const q = parseFloat(i.quantity) || 0;
              const p = parseFloat(i.price) || 0;
              return acc + (parseFloat(i.sum) || (q * p));
            }, 0);
            const totalLeft = materialItems.reduce((acc, i) => {
              const ordered = parseFloat(i.quantity) || 0;
              const issued = getIssuedQty(i.id);
              return acc + Math.max(0, ordered - issued);
            }, 0);
            return (
              <tfoot>
                <tr style={{ background: 'linear-gradient(135deg, #FAF6F0 0%, #F5EDE4 100%)', borderTop: '2px solid #D4C5B9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 800, color: '#2C2520', fontSize: '12px' }}>
                    Разом ({materialItems.length} поз.)
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#2C2520' }}>
                    {totalOrdered}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#8B7D73' }}>
                    —
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 900, color: '#2C2520', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                    {totalSum > 0 ? `$${totalSum.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 850, color: totalLeft > 0 ? '#C2410C' : '#15803D' }}>
                    {totalLeft}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            );
          })()}
        </table>
      </div>
    </div>

      {/* Complex Shipment Form */}
      {showAdd && (
        <div style={{ background: '#FAF6F0', border: '1px solid #D4C5B9', borderRadius: '10px', padding: '16px', marginBottom: '24px', boxShadow: '0 4px 10px rgba(139,125,112,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #D4C5B9', paddingBottom: '8px' }}>
            <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.2px' }}>📦 Комплексне відвантаження</h5>
            <button 
              onClick={() => {
                const newQtys = { ...shipQtys };
                materialItems.forEach(item => {
                  const left = Math.max(0, (parseFloat(item.quantity) || 0) - getIssuedQty(item.id));
                  if (left > 0) newQtys[item.id] = left;
                });
                setShipQtys(newQtys);
              }}
              style={{ background: '#FFFFFF', color: '#8B7D73', border: '1px solid #D4C5B9', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Все
            </button>
          </div>
          
          {/* Logistics header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#8B7D73', fontWeight: 700, marginBottom: '4px' }}>Служба доставки</label>
              <select 
                value={newShipment.carrier} 
                onChange={e => setNewShipment({...newShipment, carrier: e.target.value})} 
                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', background: '#FFFFFF', color: '#2C2520', outline: 'none' }}
              >
                <option value="Самовивіз">Самовивіз</option>
                <option value="Нова Пошта">Нова Пошта</option>
                <option value="Кур'єр">Кур'єр компанії</option>
                <option value="Делівері">Делівері</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#8B7D73', fontWeight: 700, marginBottom: '4px' }}>ТТН / Супровідний номер</label>
              <input 
                type="text" 
                placeholder="ТТН (за наявності)..." 
                value={newShipment.tracking_number} 
                onChange={e => setNewShipment({...newShipment, tracking_number: e.target.value})} 
                style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', background: '#FFFFFF', color: '#2C2520', outline: 'none', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#8B7D73', fontWeight: 700, marginBottom: '4px' }}>Дата відвантаження</label>
              <input 
                type="date" 
                value={newShipment.date} 
                onChange={e => setNewShipment({...newShipment, date: e.target.value})} 
                style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', background: '#FFFFFF', color: '#2C2520', outline: 'none', boxSizing: 'border-box' }} 
              />
            </div>
          </div>

          {/* List of items to ship */}
          <div style={{ marginBottom: '14px' }}>
            <h6 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase' }}>Товари для накладної</h6>
            <div style={{ overflowX: 'auto', width: '100%', marginBottom: '8px' }}>
              <table style={{ width: '100%', minWidth: isMobile ? '400px' : 'auto', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #D4C5B9', color: '#8B7D73' }}>
                  <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Найменування</th>
                  <th style={{ textAlign: 'center', paddingBottom: '4px', width: '80px' }}>К-ть</th>
                  <th style={{ textAlign: 'center', paddingBottom: '4px', width: '80px' }}>Ціна</th>
                  <th style={{ textAlign: 'center', paddingBottom: '4px', width: '80px' }}>Валюта</th>
                </tr>
              </thead>
              <tbody>
                {materialItems.map(item => {
                  const left = Math.max(0, (parseFloat(item.quantity) || 0) - getIssuedQty(item.id));
                  if (left <= 0) return null;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #EAE7E2' }}>
                      <td style={{ padding: '6px 0', color: '#2C2520', fontWeight: 600 }}>
                        {item.name} <span style={{ color: '#8B7D73', fontSize: '9px', marginLeft: '4px' }}>(до видачі: {left} шт)</span>
                      </td>
                      <td style={{ padding: '6px 0', width: '80px' }}>
                        <input 
                          type="number" 
                          min="0" 
                          max={left} 
                          value={shipQtys[item.id] || ''} 
                          onChange={e => setShipQtys({...shipQtys, [item.id]: e.target.value})} 
                          placeholder={`Макс: ${left}`} 
                          style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #D4C5B9', borderRadius: '4px', outline: 'none' }} 
                        />
                      </td>
                      <td style={{ padding: '6px 4px', width: '80px' }}>
                        <input 
                          type="number" 
                          min="0" 
                          value={shipPrices[item.id] || ''} 
                          onChange={e => setShipPrices({...shipPrices, [item.id]: e.target.value})} 
                          placeholder="Ціна" 
                          style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #D4C5B9', borderRadius: '4px', outline: 'none' }} 
                        />
                      </td>
                      <td style={{ padding: '6px 0', width: '80px' }}>
                        <select 
                          value={shipCurrencies[item.id] || 'UAH'} 
                          onChange={e => setShipCurrencies({...shipCurrencies, [item.id]: e.target.value})}
                          style={{ width: '100%', padding: '4px', border: '1px solid #D4C5B9', borderRadius: '4px', background: '#FFFFFF', color: '#2C2520', outline: 'none' }}
                        >
                          <option value="USD">USD ($)</option>
                          <option value="UAH">UAH (₴)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Dynamically added custom items */}
                {newItems.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #EAE7E2' }}>
                    <td style={{ padding: '6px 0' }}>
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={e => {
                          const next = [...newItems];
                          next[idx].name = e.target.value;
                          setNewItems(next);
                        }} 
                        placeholder="Кастомний товар прямо тут..." 
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid #C4B4A6', borderRadius: '4px', fontSize: '11px', outline: 'none' }} 
                      />
                    </td>
                    <td style={{ padding: '6px 0', width: '80px' }}>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={e => {
                          const next = [...newItems];
                          next[idx].quantity = e.target.value;
                          setNewItems(next);
                        }} 
                        placeholder="К-ть" 
                        style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #C4B4A6', borderRadius: '4px', outline: 'none' }} 
                      />
                    </td>
                    <td style={{ padding: '6px 4px', width: '80px' }}>
                      <input 
                        type="number" 
                        min="0" 
                        value={item.price} 
                        onChange={e => {
                          const next = [...newItems];
                          next[idx].price = e.target.value;
                          setNewItems(next);
                        }} 
                        placeholder="0" 
                        style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #C4B4A6', borderRadius: '4px', outline: 'none' }} 
                      />
                    </td>
                    <td style={{ padding: '6px 0', width: '80px', display: 'flex', gap: '2px', alignItems: 'center' }}>
                      <select 
                        value={item.currency} 
                        onChange={e => {
                          const next = [...newItems];
                          next[idx].currency = e.target.value;
                          setNewItems(next);
                        }}
                        style={{ flex: 1, padding: '4px', border: '1px solid #C4B4A6', borderRadius: '4px', background: '#FFFFFF', fontSize: '10px', outline: 'none' }}
                      >
                        <option value="USD">USD</option>
                        <option value="UAH">UAH</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setNewItems(newItems.filter(x => x.id !== item.id))} 
                        style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          <button 
            type="button"
            onClick={() => setNewItems([...newItems, { id: 'temp_' + Date.now(), name: '', quantity: '1', price: '0', currency: 'UAH', note: 'Додано на льоту' }])}
            style={{ background: '#FFFFFF', color: '#8B7D73', border: '1px dashed #D4C5B9', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', marginBottom: '16px' }}
          >
            + Додати кастомний товар в 1 клік
          </button>

          {/* Instant financial settlement in shipment builder */}
          <div style={{ background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <h6 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CreditCard size={12} color="#C4B4A6" />
              Розрахунок при відвантаженні
            </h6>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <input 
                type="checkbox" 
                id="addToContract" 
                checked={addToContract} 
                onChange={e => setAddToContract(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="addToContract" style={{ fontSize: '11px', color: '#2C2520', cursor: 'pointer', fontWeight: 700 }}>
                Додати вартість відвантаженого товару до погодженої суми угоди
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#8B7D73', display: 'block', marginBottom: '2px', fontWeight: 750 }}>Оплачено зараз (Сума)</label>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  placeholder="0" 
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#8B7D73', display: 'block', marginBottom: '2px', fontWeight: 750 }}>Валюта оплати</label>
                <select 
                  value={paymentCurrency} 
                  onChange={e => setPaymentCurrency(e.target.value)} 
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', background: '#FFFFFF', color: '#2C2520', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="UAH">UAH (₴)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#8B7D73', display: 'block', marginBottom: '2px', fontWeight: 750 }}>Каса / Метод</label>
                <select 
                  value={paymentType} 
                  onChange={e => setPaymentType(e.target.value)} 
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', background: '#FFFFFF', color: '#2C2520', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Готівка">Готівка</option>
                  <option value="Карта">Карта</option>
                  <option value="Рахунок">Рахунок</option>
                </select>
              </div>
            </div>
            
            <input 
              type="text" 
              placeholder="Коментар розрахунку (наприклад: Оплата за самовивіз)..." 
              value={paymentNote} 
              onChange={e => setPaymentNote(e.target.value)} 
              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', marginTop: '4px', boxSizing: 'border-box' }} 
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => setShowAdd(false)} 
              style={{ background: 'transparent', border: '1px solid #D4C5B9', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#8B7D73', cursor: 'pointer' }}
            >
              Скасувати
            </button>
            <button 
              onClick={handleSaveShipment} 
              disabled={saving} 
              style={{ background: '#C4B4A6', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              {saving ? '...' : 'Зафіксувати транзакцію'}
            </button>
          </div>
        </div>
      )}

      {/* Timeline of shipments */}
      <h6 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚚 Історія відвантажень</h6>
      {shipments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', fontSize: '12px', color: '#8B7D73', border: '1px dashed #D4C5B9', borderRadius: '10px' }}>Відвантажень по цій угоді ще не здійснювалось</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {shipments.map(s => (
            <div key={s.id} style={{ border: '1px solid #D4C5B9', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF' }}>
              <div style={{ background: '#FAF6F0', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #D4C5B9', fontSize: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: '#2C2520' }}>{s.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8B7D73', background: '#FFFFFF', border: '1px solid #D4C5B9', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    <Truck size={12} color="#C4B4A6" /> {s.carrier}
                  </span>
                  {s.tracking_number && <span style={{ color: '#1D4ED8', fontWeight: 700 }}>ТТН: {s.tracking_number}</span>}
                </div>
                <button 
                  onClick={() => handleDeleteShipment(s.id)}
                  disabled={saving}
                  style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }}
                  title="Видалити відвантаження"
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ padding: '10px 12px', background: '#FFFFFF' }}>
                {s.shipment_items?.map(si => {
                  const itemName = materialItems.find(i => i.id === si.project_item_id)?.name || 'Кастомний/невідомий товар';
                  return (
                    <div key={si.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#2C2520', marginBottom: '4px', borderBottom: '1px dashed #FAF6F0', paddingBottom: '3px' }}>
                      <span style={{ fontWeight: 500 }}>{itemName}</span>
                      <span style={{ fontWeight: 800, color: '#2C2520' }}>{si.quantity} шт</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showKPModal && (
        <KPSelectionModal isOpen={true} onClose={() => setShowKPModal(false)} onSelect={handleSelectKP} />
      )}
    </div>
  );
}
