import React, { useEffect, useState } from 'react';
import { crmApi } from '../../services/crmApi';
import { Users, Search, Plus, Briefcase, ChevronRight, DollarSign, Package } from 'lucide-react';
import { formatAmount } from '../../lib/utils';
import { CrmClientDetail } from './CrmClientDetail';
import { NewClientModal } from '../../components/NewClientModal';

export default function CrmDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    loadClients();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getClients();
      setClients(data || []);
      
      // Sync selectedClient with fresh data from database
      if (selectedClient) {
        const freshClient = (data || []).find(c => c.id === selectedClient.id);
        if (freshClient) {
          setSelectedClient(freshClient);
        }
      }
    } catch (error) {
      console.error('Failed to load clients', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (formData) => {
    try {
      const newClient = await crmApi.saveClient(formData);
      await loadClients();
      setSelectedClient(newClient);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert('Помилка створення клієнта: ' + error.message);
    }
  };

  const handleBackupData = async () => {
    try {
      if (!window.confirm('Ви бажаєте завантажити резервну копію всіх даних CRM у форматі JSON?')) return;
      const backup = await crmApi.backupCrmData();
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute("download", `cso_solar_crm_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error(error);
      alert('Помилка генерації бекапу: ' + error.message);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  const activeClients = filteredClients.filter(client => {
    const activeCount = client.projects?.filter(p => p.status !== 'Завершено' && p.status !== 'Скасовано').length || 0;
    return activeCount > 0;
  });

  const inactiveClients = filteredClients.filter(client => {
    const activeCount = client.projects?.filter(p => p.status !== 'Завершено' && p.status !== 'Скасовано').length || 0;
    return activeCount === 0;
  });

  const renderClientRow = (client) => {
    const activeCount = client.projects?.filter(p => p.status !== 'Завершено' && p.status !== 'Скасовано').length || 0;
    const totalCount = client.projects?.length || 0;
    const isHovered = hoveredId === client.id;

    return (
      <div 
        key={client.id}
        onClick={() => setSelectedClient(client)}
        onMouseEnter={() => setHoveredId(client.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{ 
          padding: '8px 10px', borderBottom: '1px solid #FAF6F0', cursor: 'pointer', 
          borderRadius: '6px', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: isHovered ? '#EAE7E2' : 'transparent',
          marginBottom: '3px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, marginRight: '6px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#2C2520' }}>{client.name}</div>
          <div style={{ fontSize: '11px', color: '#8B7D73' }}>
            {client.phone || 'Немає телефону'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {activeCount > 0 ? (
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF', background: '#C4B4A6', padding: '1px 6px', borderRadius: '10px' }}>
              {activeCount} акт.
            </span>
          ) : totalCount > 0 ? (
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#8B7D73', background: '#FAF6F0', border: '1px solid #D4C5B9', padding: '0px 4px', borderRadius: '10px' }}>
              архів
            </span>
          ) : null}
          <ChevronRight size={14} color="#8B7D73" />
        </div>
      </div>
    );
  };

  const [mobileView, setMobileView] = useState('clients'); // 'clients' or 'kanban'

  if (selectedClient) {
    return <CrmClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} onUpdate={loadClients} />;
  }

  // Count all projects for mobile count indicator
  const allProjectsCount = clients.reduce((acc, c) => acc + (c.projects?.filter(p => p.status !== 'Скасовано').length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 86px)', background: '#FAF8F5', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      
      {/* Mobile Top View Switcher */}
      {isMobile && (
        <div style={{ 
          display: 'flex', 
          background: '#FAF6F0', 
          borderBottom: '1px solid #D4C5B9', 
          padding: '10px 14px',
          gap: '8px',
          boxSizing: 'border-box',
          width: '100%',
          flexShrink: 0
        }}>
          <button
            onClick={() => setMobileView('clients')}
            style={{
              flex: 1,
              background: mobileView === 'clients' ? '#C4B4A6' : '#FFFFFF',
              color: mobileView === 'clients' ? '#FFFFFF' : '#8B7D73',
              border: `1px solid ${mobileView === 'clients' ? '#C4B4A6' : '#D4C5B9'}`,
              borderRadius: '8px',
              padding: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>📋 Контрагенти</span>
            <span style={{ 
              fontSize: '9.5px', 
              fontWeight: 900, 
              background: mobileView === 'clients' ? '#FFFFFF' : '#C4B4A6', 
              color: mobileView === 'clients' ? '#C4B4A6' : '#FFFFFF', 
              padding: '1px 5px', 
              borderRadius: '10px' 
            }}>
              {filteredClients.length}
            </span>
          </button>
          <button
            onClick={() => setMobileView('kanban')}
            style={{
              flex: 1,
              background: mobileView === 'kanban' ? '#C4B4A6' : '#FFFFFF',
              color: mobileView === 'kanban' ? '#FFFFFF' : '#8B7D73',
              border: `1px solid ${mobileView === 'kanban' ? '#C4B4A6' : '#D4C5B9'}`,
              borderRadius: '8px',
              padding: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>📊 Воронка угод</span>
            <span style={{ 
              fontSize: '9.5px', 
              fontWeight: 900, 
              background: mobileView === 'kanban' ? '#FFFFFF' : '#C4B4A6', 
              color: mobileView === 'kanban' ? '#C4B4A6' : '#FFFFFF', 
              padding: '1px 5px', 
              borderRadius: '10px' 
            }}>
              {allProjectsCount}
            </span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
        {/* Sidebar - Список Клієнтів */}
        {(!isMobile || mobileView === 'clients') && (
          <div style={{ width: isMobile ? '100%' : '380px', borderRight: isMobile ? 'none' : '1px solid #D4C5B9', background: '#FAF6F0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', flexShrink: 0 }}>
            
            {/* Header */}
            <div style={{ padding: '18px', borderBottom: '1px solid #D4C5B9', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#2C2520', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.2px' }}>
                  <Users size={18} color="#C4B4A6" /> 
                  Контрагенти
                </h1>
                <button 
                  onClick={() => setShowModal(true)}
                  style={{ 
                    background: '#C4B4A6', color: 'white', border: 'none', borderRadius: '6px', 
                    padding: '6px 14px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                    transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(139, 125, 112, 0.15)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#B3A395'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#C4B4A6'}
                >
                  <Plus size={14} /> Новий
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#8B7D73" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input 
                  type="text" 
                  placeholder="Пошук клієнта за назвою або телефоном..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ 
                    width: '100%', padding: '8px 10px 8px 32px', fontSize: '13px', 
                    border: '1px solid #D4C5B9', borderRadius: '6px', outline: 'none',
                    background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#C4B4A6'}
                  onBlur={(e) => e.target.style.borderColor = '#D4C5B9'}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#8B7D73', fontSize: '13px', fontWeight: 500 }}>Завантаження контрагентів...</div>
              ) : filteredClients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#8B7D73', fontSize: '13px' }}>Контрагентів не знайдено</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Active Clients */}
                  {activeClients.length > 0 && (
                    <div>
                      <h4 style={{ margin: '2px 8px 6px 8px', fontSize: '11px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🟢</span> Активні контрагенти ({activeClients.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {activeClients.map(client => renderClientRow(client))}
                      </div>
                    </div>
                  )}

                  {/* Inactive Clients */}
                  {inactiveClients.length > 0 && (
                    <div style={{ borderTop: activeClients.length > 0 ? '1px solid #D4C5B9' : 'none', paddingTop: activeClients.length > 0 ? '10px' : '0' }}>
                      <h4 style={{ margin: '2px 8px 6px 8px', fontSize: '11px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📁</span> Неактивні / Архівні ({inactiveClients.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {inactiveClients.map(client => renderClientRow(client))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Footer (Backup Export) */}
            <div style={{ 
              padding: '12px 18px', 
              borderTop: '1px solid #D4C5B9', 
              background: '#FAF6F0', 
              display: 'flex', 
              flexDirection: 'column',
              gap: '6px',
              flexShrink: 0
            }}>
              <button
                onClick={handleBackupData}
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  color: '#8B7D73',
                  border: '1px solid #D4C5B9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.2s, border-color 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#EAE7E2';
                  e.currentTarget.style.borderColor = '#C4B4A6';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#D4C5B9';
                }}
              >
                <span>⚙️ Керування базою:</span>
                <span style={{ fontWeight: 800, color: '#2C2520' }}>📥 Експорт бекапу</span>
              </button>
            </div>
          </div>
        )}

        {/* Right Panel / Kanban Board */}
        {(!isMobile || mobileView === 'kanban') && (
          <CrmKanbanBoard clients={clients} onSelectClient={setSelectedClient} isMobile={isMobile} onUpdate={loadClients} />
        )}
      </div>

      <NewClientModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={handleCreateClient} 
      />
    </div>
  );
}

function CrmKanbanBoard({ clients, onSelectClient, isMobile, onUpdate }) {
  const [draggedOverStage, setDraggedOverStage] = useState(null);

  const allProjects = [];
  clients.forEach(client => {
    if (client.projects) {
      client.projects.forEach(project => {
        if (project.status !== 'Скасовано' && project.status !== 'Завершено') {
          allProjects.push({
            ...project,
            clientName: client.name,
            clientPhone: client.phone,
            clientObject: client
          });
        }
      });
    }
  });

  const STAGES = ['Нова угода', 'Повна оплата / Передоплата', 'До відвантаження'];
  const [activeStageTab, setActiveStageTab] = useState(STAGES[0]);

  const grouped = {};
  STAGES.forEach(stage => {
    grouped[stage] = allProjects.filter(p => {
      let status = (!p.status || p.status === 'В роботі') ? 'Нова угода' : p.status;
      if (status === 'Відвантаження') status = 'До відвантаження';
      return status === stage;
    });
  });

  const handleDragStart = (e, project) => {
    e.dataTransfer.setData('text/plain', project.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    if (draggedOverStage !== stage) {
      setDraggedOverStage(stage);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverStage(null);
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const projectId = e.dataTransfer.getData('text/plain');
    if (!projectId) return;

    const projectObj = allProjects.find(p => p.id === projectId);
    if (!projectObj) return;

    const oldStatus = projectObj.status || 'Нова угода';
    if (oldStatus === targetStage) return;

    try {
      if (targetStage === 'Завершено') {
        // Fetch projects for this client to get the full project object with all relations
        const clientProjects = await crmApi.getProjectsByClient(projectObj.client_id);
        const fullProject = clientProjects.find(p => p.id === projectId);

        if (fullProject) {
          // Calculate remaining debt
          const validPayments = (fullProject.project_payments || []).filter(p => !p.status?.toLowerCase().includes('скасовано'));
          const paidUSD = validPayments.filter(p => p.currency === 'USD').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
          const paidUAH = validPayments.filter(p => p.currency === 'UAH').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
          const agreedUSD = parseFloat(fullProject.agreed_sum_usd) || 0;
          const agreedUAH = parseFloat(fullProject.agreed_sum_uah) || 0;
          const debtUSD = Math.max(0, agreedUSD - paidUSD);
          const debtUAH = Math.max(0, agreedUAH - paidUAH);

          // Calculate remaining items
          const materialItems = (fullProject.project_items || []).filter(i => !i.is_service);
          const shipments = fullProject.project_shipments || [];
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
                currency: mi.currency || 'USD'
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
            await crmApi.autoCloseProject(fullProject);
          }
        }
      }

      await crmApi.updateProjectStatus(projectId, targetStage);
      
      await crmApi.saveAuditLog({
        projectId: projectId,
        clientId: projectObj.client_id,
        actionType: 'Зміна статусу',
        details: `Перенесено угоду "${projectObj.address || projectObj.name || 'Нова угода'}" з етапу "${oldStatus}" на етап "${targetStage}" за допомогою перетягування (Drag-and-Drop).`
      });

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Помилка оновлення статусу угоди: ' + err.message);
    }
  };

  const getFinancialBadges = (project) => {
    const validPayments = (project.project_payments || []).filter(p => !p.status?.toLowerCase().includes('скасовано'));
    const paidUSD = validPayments.filter(p => p.currency === 'USD').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
    const paidUAH = validPayments.filter(p => p.currency === 'UAH').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
    
    const agreedUSD = parseFloat(project.agreed_sum_usd) || 0;
    const agreedUAH = parseFloat(project.agreed_sum_uah) || 0;
    const debtUSD = agreedUSD - paidUSD;
    const debtUAH = agreedUAH - paidUAH;

    const badges = [];

    if (debtUSD > 0) {
      badges.push({ text: `Борг: $${Math.round(debtUSD).toLocaleString()}`, bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' });
    } else if (debtUSD < 0) {
      badges.push({ text: `Переплата: $${Math.abs(Math.round(debtUSD)).toLocaleString()}`, bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' });
    }

    if (debtUAH > 0) {
      badges.push({ text: `Борг: ${Math.round(debtUAH).toLocaleString()} ₴`, bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA' });
    } else if (debtUAH < 0) {
      badges.push({ text: `Переплата: ${Math.abs(Math.round(debtUAH)).toLocaleString()} ₴`, bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' });
    }

    if (agreedUSD > 0 && debtUSD === 0 && agreedUAH > 0 && debtUAH === 0) {
      badges.push({ text: 'Оплачено', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' });
    } else if (agreedUSD === 0 && agreedUAH === 0) {
      badges.push({ text: 'Суму не вказано', bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' });
    }

    return badges;
  };

  const renderColumn = (stage) => {
    const projects = grouped[stage] || [];
    const isDraggedOver = draggedOverStage === stage;
    return (
      <div 
        key={stage} 
        onDragOver={(e) => handleDragOver(e, stage)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, stage)}
        style={{ 
          flex: 1, 
          minWidth: '220px', 
          maxWidth: '280px', 
          background: isDraggedOver ? '#EAE7E2' : '#FAF6F0', 
          borderRadius: '12px', 
          border: isDraggedOver ? '1px dashed #C4B4A6' : '1px solid #D4C5B9', 
          display: 'flex', 
          flexDirection: 'column', 
          maxHeight: '100%',
          boxShadow: '0 2px 4px rgba(139, 125, 112, 0.02)',
          boxSizing: 'border-box',
          transition: 'background 0.2s, border-color 0.2s'
        }}
      >
        {/* Column Header */}
        <div style={{ 
          padding: '12px 14px', 
          borderBottom: '1px solid #D4C5B9', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: '#FAF6F0',
          borderTopLeftRadius: '11px',
          borderTopRightRadius: '11px',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {stage}
          </span>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 800, 
            color: '#FFFFFF', 
            background: '#C4B4A6', 
            padding: '2px 8px', 
            borderRadius: '12px' 
          }}>
            {projects.length}
          </span>
        </div>

        {/* Cards Scrollable Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 10px', color: '#8B7D73', fontSize: '11px', fontStyle: 'italic' }}>
              Немає угод
            </div>
          ) : (
            projects.map(p => {
              const badges = getFinancialBadges(p);
              return (
                <div 
                  key={p.id}
                  onClick={() => onSelectClient(p.clientObject)}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, p)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D4C5B9',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    cursor: 'grab',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#C4B4A6';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(139, 125, 112, 0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#D4C5B9';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                  }}
                >
                  {/* Client name */}
                  <div style={{ fontSize: '10px', color: '#8B7D73', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    👤 {p.clientName}
                  </div>
                  
                  {/* Project address / name */}
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#2C2520', wordBreak: 'break-word', lineHeight: '1.3' }}>
                    {p.address || p.name || 'Нова угода'}
                  </div>

                  {/* Financial Badges */}
                  {badges.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                      {badges.map((b, idx) => (
                        <span 
                          key={idx} 
                          style={{ 
                            fontSize: '9px', 
                            fontWeight: 800, 
                            color: b.color, 
                            background: b.bg, 
                            border: `1px solid ${b.border}`,
                            padding: '1px 5px', 
                            borderRadius: '4px' 
                          }}
                        >
                          {b.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', boxSizing: 'border-box', background: '#FAF8F5', overflow: 'hidden' }}>
        {/* Mobile column selector tabs */}
        <div style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          padding: '10px 8px', 
          gap: '6px', 
          background: '#FAF6F0', 
          borderBottom: '1px solid #D4C5B9',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          flexShrink: 0
        }}>
          {STAGES.map(stage => {
            const projects = grouped[stage] || [];
            const isActive = activeStageTab === stage;
            return (
              <button
                key={stage}
                onClick={() => setActiveStageTab(stage)}
                style={{
                  flexShrink: 0,
                  background: isActive ? '#C4B4A6' : '#FFFFFF',
                  border: `1px solid ${isActive ? '#C4B4A6' : '#D4C5B9'}`,
                  color: isActive ? '#FFFFFF' : '#8B7D73',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: isActive ? 800 : 600,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span>{stage.split(' ')[0]}</span>
                <span style={{ 
                  fontSize: '9px', 
                  fontWeight: 900, 
                  background: isActive ? '#FFFFFF' : '#C4B4A6', 
                  color: isActive ? '#C4B4A6' : '#FFFFFF', 
                  padding: '1px 5px', 
                  borderRadius: '10px' 
                }}>
                  {projects.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected column view */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span>📂 {activeStageTab}</span>
            <span style={{ fontSize: '11px', color: '#8B7D73' }}>Всього: {grouped[activeStageTab]?.length || 0}</span>
          </h5>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {(!grouped[activeStageTab] || grouped[activeStageTab].length === 0) ? (
              <div style={{ background: '#FFFFFF', border: '1px dashed #D4C5B9', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', color: '#8B7D73', fontSize: '13px' }}>
                Немає угод на цьому етапі.
              </div>
            ) : (
              grouped[activeStageTab].map(p => {
                const badges = getFinancialBadges(p);
                return (
                  <div 
                    key={p.id}
                    onClick={() => onSelectClient(p.clientObject)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #D4C5B9',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '10px', color: '#8B7D73', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        👤 {p.clientName}
                      </span>
                      {p.clientPhone && (
                        <span style={{ fontSize: '10px', color: '#C4B4A6', fontWeight: 600 }}>
                          📞 {p.clientPhone}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#2C2520', wordBreak: 'break-word', lineHeight: '1.4' }}>
                      {p.address || p.name || 'Нова угода'}
                    </div>

                    {badges.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                        {badges.map((b, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              fontSize: '9.5px', 
                              fontWeight: 800, 
                              color: b.color, 
                              background: b.bg, 
                              border: `1px solid ${b.border}`,
                              padding: '2px 8px', 
                              borderRadius: '4px' 
                            }}
                          >
                            {b.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FAF8F5', overflow: 'hidden', height: '100%', boxSizing: 'border-box' }}>
      {/* Header for Kanban area */}
      <div style={{ 
        background: '#FAF6F0', 
        borderBottom: '1px solid #D4C5B9', 
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#2C2520', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📊</span> Воронка угод (Канбан)
        </h2>
        <div style={{ fontSize: '12px', color: '#8B7D73', fontWeight: 700 }}>
          Всього активних угод: {allProjects.length}
        </div>
      </div>

      {/* Kanban Columns */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', overflowX: 'auto', padding: '20px', boxSizing: 'border-box', height: '100%' }}>
        {STAGES.map(stage => renderColumn(stage))}
      </div>
    </div>
  );
}
