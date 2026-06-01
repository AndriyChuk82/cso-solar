import React, { useEffect, useState } from 'react';
import { crmApi } from '../../services/crmApi';
import { Users, Search, Plus, Briefcase, ChevronRight, DollarSign, Package, Truck, Calendar, Info, Printer, X } from 'lucide-react';
import { formatAmount } from '../../lib/utils';
import { CrmClientDetail } from './CrmClientDetail';
import { CrmSupplierDetail } from './CrmSupplierDetail';
import { NewClientModal } from '../../components/NewClientModal';
import { QuickShipmentModal } from './QuickShipmentModal';

export default function CrmDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showQuickShipment, setShowQuickShipment] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Supplier-specific states
  const [dashboardTab, setDashboardTab] = useState('clients'); // 'clients' or 'suppliers'
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [owedMaterials, setOwedMaterials] = useState([]);

  // New Supplier Form
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supNote, setSupNote] = useState('');

  // Kanban view states
  const [mobileView, setMobileView] = useState('clients'); // 'clients' or 'kanban'
  const [draggedOverStage, setDraggedOverStage] = useState(null);
  const [activeStageTab, setActiveStageTab] = useState('Борг');

  useEffect(() => {
    loadClients();
    loadSuppliers();
    loadOwedMaterials();
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

  const loadSuppliers = async () => {
    try {
      const data = await crmApi.getSuppliers();
      setSuppliers(data || []);
      if (selectedSupplier) {
        const freshSupplier = (data || []).find(s => s.id === selectedSupplier.id);
        if (freshSupplier) {
          setSelectedSupplier(freshSupplier);
        }
      }
    } catch (error) {
      console.error('Failed to load suppliers', error);
    }
  };

  const loadOwedMaterials = async () => {
    try {
      const data = await crmApi.getAllOwedMaterials();
      setOwedMaterials(data || []);
    } catch (error) {
      console.error('Failed to load owed materials', error);
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

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!supName.trim()) return alert('Вкажіть назву постачальника');
    try {
      const newSup = await crmApi.saveSupplier({
        name: supName,
        phone: supPhone,
        email: supEmail,
        note: supNote
      });
      await loadSuppliers();
      setSelectedSupplier(newSup);
      setShowSupplierModal(false);
      
      // Reset
      setSupName('');
      setSupPhone('');
      setSupEmail('');
      setSupNote('');
    } catch (err) {
      console.error(err);
      alert('Помилка створення постачальника: ' + err.message);
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

  // Filters for counterparties
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

  // Filters for suppliers
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone && s.phone.includes(search))
  );

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

  const renderSupplierRow = (supplier) => {
    const isHovered = hoveredId === supplier.id;
    // Calculate unique pending items for badge count
    const pendingCount = owedMaterials
      .filter(item => item.supplier_id === supplier.id)
      .reduce((acc, item) => acc + Math.max(0, item.quantity - item.received_quantity), 0);

    return (
      <div 
        key={supplier.id}
        onClick={() => setSelectedSupplier(supplier)}
        onMouseEnter={() => setHoveredId(supplier.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{ 
          padding: '8px 10px', borderBottom: '1px solid #FAF6F0', cursor: 'pointer', 
          borderRadius: '6px', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: isHovered ? '#EAE7E2' : 'transparent',
          marginBottom: '3px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, marginRight: '6px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#2C2520' }}>{supplier.name}</div>
          <div style={{ fontSize: '11px', color: '#8B7D73' }}>
            {supplier.phone || 'Немає телефону'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {pendingCount > 0 ? (
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF', background: '#8B7D73', padding: '1px 6px', borderRadius: '10px' }}>
              {pendingCount} шт. винен
            </span>
          ) : (
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0px 4px', borderRadius: '10px' }}>
              чисто
            </span>
          )}
          <ChevronRight size={14} color="#8B7D73" />
        </div>
      </div>
    );
  };

  if (dashboardTab === 'clients' && selectedClient) {
    return (
      <>
        <CrmClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} onUpdate={loadClients} />
        {showQuickShipment && (
          <QuickShipmentModal
            onClose={() => setShowQuickShipment(false)}
            onUpdate={loadClients}
          />
        )}
      </>
    );
  }

  if (dashboardTab === 'suppliers' && selectedSupplier) {
    return (
      <CrmSupplierDetail 
        supplier={selectedSupplier} 
        onBack={() => setSelectedSupplier(null)} 
        onUpdate={() => { loadSuppliers(); loadOwedMaterials(); }} 
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 86px)', background: '#FAF8F5', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      
      {/* Sleek Premium Tab Switcher */}
      <div style={{ 
        display: 'flex', 
        background: '#FAF6F0', 
        borderBottom: '1px solid #D4C5B9', 
        padding: '10px 20px',
        gap: '10px',
        boxSizing: 'border-box',
        width: '100%',
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setDashboardTab('clients')}
            style={{
              background: dashboardTab === 'clients' ? '#C4B4A6' : '#FFFFFF',
              color: dashboardTab === 'clients' ? '#FFFFFF' : '#8B7D73',
              border: `1px solid ${dashboardTab === 'clients' ? '#C4B4A6' : '#D4C5B9'}`,
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>👥 Угоди з клієнтами</span>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 900, 
              background: dashboardTab === 'clients' ? '#FFFFFF' : '#C4B4A6', 
              color: dashboardTab === 'clients' ? '#C4B4A6' : '#FFFFFF', 
              padding: '1px 5px', 
              borderRadius: '10px' 
            }}>
              {clients.length}
            </span>
          </button>
          <button
            onClick={() => setDashboardTab('suppliers')}
            style={{
              background: dashboardTab === 'suppliers' ? '#C4B4A6' : '#FFFFFF',
              color: dashboardTab === 'suppliers' ? '#FFFFFF' : '#8B7D73',
              border: `1px solid ${dashboardTab === 'suppliers' ? '#C4B4A6' : '#D4C5B9'}`,
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🚛 Постачальники та закупівлі</span>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 900, 
              background: dashboardTab === 'suppliers' ? '#FFFFFF' : '#C4B4A6', 
              color: dashboardTab === 'suppliers' ? '#C4B4A6' : '#FFFFFF', 
              padding: '1px 5px', 
              borderRadius: '10px' 
            }}>
              {suppliers.length}
            </span>
          </button>
        </div>

        {/* Action Button */}
        {dashboardTab === 'clients' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowQuickShipment(true)}
              style={{
                background: '#C4B4A6', color: '#FFFFFF', border: 'none', borderRadius: '6px',
                padding: '6px 12px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(139, 125, 112, 0.15)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#B3A395'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#C4B4A6'; }}
            >
              🚛 Швидка видача
            </button>
            <button
              onClick={handleBackupData}
              style={{
                background: '#FFFFFF', color: '#8B7D73', border: '1px solid #D4C5B9', borderRadius: '6px',
                padding: '6px 12px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#EAE7E2'; e.currentTarget.style.borderColor = '#C4B4A6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D4C5B9'; }}
            >
              ⚙️ Експорт бекапу
            </button>
          </div>
        ) : null}
      </div>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden' }}>
        
        {/* Left Sidebar */}
        {(!isMobile || mobileView === 'clients') && (
          <div style={{ width: isMobile ? '100%' : '380px', borderRight: isMobile ? 'none' : '1px solid #D4C5B9', background: '#FAF6F0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', flexShrink: 0 }}>
            
            {/* Sidebar Header */}
            <div style={{ padding: '18px', borderBottom: '1px solid #D4C5B9', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#2C2520', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.2px' }}>
                  {dashboardTab === 'clients' ? (
                    <>
                      <Users size={18} color="#C4B4A6" /> Контрагенти
                    </>
                  ) : (
                    <>
                      <Truck size={18} color="#C4B4A6" /> Постачальники
                    </>
                  )}
                </h1>
                <button 
                  onClick={() => dashboardTab === 'clients' ? setShowModal(true) : setShowSupplierModal(true)}
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
                  placeholder={dashboardTab === 'clients' ? "Пошук клієнта..." : "Пошук постачальника..."}
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

            {/* Sidebar List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {dashboardTab === 'clients' ? (
                loading ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#8B7D73', fontSize: '13px', fontWeight: 500 }}>Завантаження контрагентів...</div>
                ) : filteredClients.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#8B7D73', fontSize: '13px' }}>Контрагентів не знайдено</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    {inactiveClients.length > 0 && (
                      <div style={{ borderTop: activeClients.length > 0 ? '1px solid #D4C5B9' : 'none', paddingTop: activeClients.length > 0 ? '10px' : '0' }}>
                        <h4 style={{ margin: '2px 8px 6px 8px', fontSize: '11px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📁</span> Архівні / Неактивні ({inactiveClients.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {inactiveClients.map(client => renderClientRow(client))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                filteredSuppliers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#8B7D73', fontSize: '13px' }}>Постачальників не знайдено</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {filteredSuppliers.map(sup => renderSupplierRow(sup))}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Right Content Area */}
        {dashboardTab === 'clients' ? (
          (!isMobile || mobileView === 'kanban') && (
            <CrmKanbanBoard clients={clients} onSelectClient={setSelectedClient} isMobile={isMobile} onUpdate={loadClients} />
          )
        ) : (
          (!isMobile || mobileView === 'kanban') && (
            <SupplierOwedDashboard 
              owedMaterials={owedMaterials} 
              suppliers={suppliers} 
              onSelectSupplier={setSelectedSupplier}
            />
          )
        )}
      </div>

      {/* New Client Modal */}
      <NewClientModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={handleCreateClient} 
      />

      {/* New Supplier Modal */}
      {showSupplierModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(44, 37, 32, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#FAF8F5', border: '1px solid #D4C5B9', borderRadius: '12px',
            width: '90%', maxWidth: '460px', padding: '24px', boxShadow: '0 8px 32px rgba(139, 125, 112, 0.15)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#2C2520', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={18} color="#C4B4A6" /> Новий постачальник
              </h3>
              <button onClick={() => setShowSupplierModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={18} color="#8B7D73" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#2C2520', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Назва постачальника *
                </label>
                <input 
                  type="text" 
                  value={supName} 
                  onChange={(e) => setSupName(e.target.value)} 
                  required
                  placeholder="Наприклад, SolarTech Group"
                  style={{
                    width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D4C5B9',
                    borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#2C2520', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Телефон
                </label>
                <input 
                  type="text" 
                  value={supPhone} 
                  onChange={(e) => setSupPhone(e.target.value)} 
                  placeholder="+380..."
                  style={{
                    width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D4C5B9',
                    borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#2C2520', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Email
                </label>
                <input 
                  type="email" 
                  value={supEmail} 
                  onChange={(e) => setSupEmail(e.target.value)} 
                  placeholder="info@supplier.com"
                  style={{
                    width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D4C5B9',
                    borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#2C2520', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Примітка
                </label>
                <textarea 
                  value={supNote} 
                  onChange={(e) => setSupNote(e.target.value)} 
                  placeholder="Додаткова інформація..."
                  rows="3"
                  style={{
                    width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #D4C5B9',
                    borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowSupplierModal(false)}
                  style={{
                    flex: 1, padding: '10px', background: '#FFFFFF', color: '#8B7D73',
                    border: '1px solid #D4C5B9', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Скасувати
                </button>
                <button 
                  type="submit"
                  style={{
                    flex: 1, padding: '10px', background: '#C4B4A6', color: '#FFFFFF',
                    border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Створити
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showQuickShipment && (
        <QuickShipmentModal
          onClose={() => setShowQuickShipment(false)}
          onUpdate={loadClients}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// Helper to map old statuses to new pipeline stages
const getMappedStatus = (status) => {
  const raw = status || 'Борг';
  if (raw === 'Нова угода' || raw === 'В роботі' || raw === 'Борг') return 'Борг';
  if (raw === 'Повна оплата / Передоплата' || raw === 'Часткова оплата') return 'Часткова оплата';
  if (raw === 'До відвантаження' || raw === 'Відвантаження' || raw === 'Повна оплата') return 'Повна оплата';
  return raw; // e.g. 'Завершено'
};

// Component: CrmKanbanBoard
// ----------------------------------------------------
function CrmKanbanBoard({ clients, onSelectClient, isMobile, onUpdate }) {
  const [draggedProject, setDraggedProject] = useState(null);
  const [draggedOverStage, setDraggedOverStage] = useState(null);
  const [activeStageTab, setActiveStageTab] = useState('Борг');

  // Collect all projects across all clients
  const allProjects = [];
  clients.forEach(c => {
    if (c.projects) {
      c.projects.forEach(p => {
        if (p.status !== 'Скасовано' && p.status !== 'Завершено') {
          allProjects.push({
            ...p,
            clientName: c.name,
            clientPhone: c.phone,
            clientObject: c
          });
        }
      });
    }
  });

  const STAGES = ['Борг', 'Часткова оплата', 'Повна оплата'];

  const grouped = {};
  STAGES.forEach(stage => {
    grouped[stage] = allProjects.filter(p => {
      return getMappedStatus(p.status) === stage;
    });
  });

  const handleDragStart = (e, project) => {
    e.dataTransfer.setData('text/plain', project.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedProject(project);
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
        const clientProjects = await crmApi.getProjectsByClient(projectObj.client_id);
        const fullProject = clientProjects.find(p => p.id === projectId);

        if (fullProject) {
          const validPayments = (fullProject.project_payments || []).filter(p => !p.status?.toLowerCase().includes('скасовано'));
          const paidUSD = validPayments.filter(p => p.currency === 'USD').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
          const paidUAH = validPayments.filter(p => p.currency === 'UAH').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
          const agreedUSD = parseFloat(fullProject.agreed_sum_usd) || 0;
          const agreedUAH = parseFloat(fullProject.agreed_sum_uah) || 0;
          const debtUSD = Math.max(0, agreedUSD - paidUSD);
          const debtUAH = Math.max(0, agreedUAH - paidUAH);

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
              return; 
            }

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
        <div style={{ 
          padding: '12px 14px', borderBottom: '1px solid #D4C5B9', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', background: '#FAF6F0',
          borderTopLeftRadius: '11px', borderTopRightRadius: '11px', flexShrink: 0
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {stage}
          </span>
          <span style={{ 
            fontSize: '11px', fontWeight: 800, color: '#FFFFFF', background: '#C4B4A6', 
            padding: '2px 8px', borderRadius: '12px' 
          }}>
            {projects.length}
          </span>
        </div>

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
                    background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '10px',
                    padding: '10px 12px', cursor: 'grab', display: 'flex', flexDirection: 'column',
                    gap: '6px', boxShadow: '0 1px 3px rgba(139, 125, 112, 0.05)', transition: 'transform 0.15s, box-shadow 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 3px 6px rgba(139, 125, 112, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(139, 125, 112, 0.05)'; }}
                >
                  <div style={{ fontSize: '9.5px', color: '#8B7D73', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                    👤 {p.clientName}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#2C2520', lineHeight: '1.3', wordBreak: 'break-word' }}>
                    {p.address || p.name || 'Нова угода'}
                  </div>
                  {badges.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                      {badges.map((b, idx) => (
                        <span 
                          key={idx} 
                          style={{ 
                            fontSize: '9px', fontWeight: 800, color: b.color, background: b.bg, 
                            border: `1px solid ${b.border}`, padding: '1px 5px', borderRadius: '4px' 
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
        <div style={{ 
          display: 'flex', overflowX: 'auto', padding: '10px 8px', gap: '6px', background: '#FAF6F0', 
          borderBottom: '1px solid #D4C5B9', msOverflowStyle: 'none', scrollbarWidth: 'none', flexShrink: 0
        }}>
          {STAGES.map(stage => {
            const projects = grouped[stage] || [];
            const isActive = activeStageTab === stage;
            return (
              <button
                key={stage}
                onClick={() => setActiveStageTab(stage)}
                style={{
                  flexShrink: 0, background: isActive ? '#C4B4A6' : '#FFFFFF',
                  border: `1px solid ${isActive ? '#C4B4A6' : '#D4C5B9'}`, color: isActive ? '#FFFFFF' : '#8B7D73',
                  padding: '6px 12px', fontSize: '11px', fontWeight: isActive ? 800 : 600, borderRadius: '16px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', outline: 'none', transition: 'all 0.2s'
                }}
              >
                <span>{stage.split(' ')[0]}</span>
                <span style={{ 
                  fontSize: '9px', fontWeight: 900, background: isActive ? '#FFFFFF' : '#C4B4A6', 
                  color: isActive ? '#C4B4A6' : '#FFFFFF', padding: '1px 5px', borderRadius: '10px' 
                }}>
                  {projects.length}
                </span>
              </button>
            );
          })}
        </div>

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
                      background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '10px',
                      padding: '12px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
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
                              fontSize: '9.5px', fontWeight: 800, color: b.color, background: b.bg, 
                              border: `1px solid ${b.border}`, padding: '2px 8px', borderRadius: '4px' 
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
      <div style={{ 
        background: '#FAF6F0', borderBottom: '1px solid #D4C5B9', padding: '16px 20px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#2C2520', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📊</span> Воронка угод (Канбан)
        </h2>
        <div style={{ fontSize: '12px', color: '#8B7D73', fontWeight: 700 }}>
          Всього активних угод: {allProjects.length}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '16px', overflowX: 'auto', padding: '20px', boxSizing: 'border-box', height: '100%' }}>
        {STAGES.map(stage => renderColumn(stage))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Component: SupplierOwedDashboard
// ----------------------------------------------------
function SupplierOwedDashboard({ owedMaterials, suppliers, onSelectSupplier }) {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSupId, setPrintSupId] = useState('');
  const [printStart, setPrintStart] = useState('');
  const [printEnd, setPrintEnd] = useState('');

  // 1. Math calculation helper
  const getSupplierStats = (supplierId) => {
    const supItems = owedMaterials.filter(item => item.supplier_id === supplierId);
    
    const totalPendingItems = supItems.reduce((acc, item) => {
      const rem = Math.max(0, item.quantity - item.received_quantity);
      return acc + rem;
    }, 0);

    const uniqueDeals = {};
    supItems.forEach(item => {
      if (item.deal_id) {
        uniqueDeals[item.deal_id] = {
          paid_sum: parseFloat(item.paid_sum) || 0,
          currency: item.currency || 'UAH'
        };
      }
    });

    let paidUAH = 0;
    let paidUSD = 0;
    Object.values(uniqueDeals).forEach(d => {
      if (d.currency === 'USD') paidUSD += d.paid_sum;
      else paidUAH += d.paid_sum;
    });

    const itemsMap = {};
    supItems.forEach(item => {
      const rem = Math.max(0, item.quantity - item.received_quantity);
      if (rem > 0) {
        if (!itemsMap[item.name]) {
          itemsMap[item.name] = { qty: 0, unit: item.unit };
        }
        itemsMap[item.name].qty += rem;
      }
    });

    const itemsList = Object.entries(itemsMap).map(([name, val]) => `${name} (${val.qty} ${val.unit})`);

    return {
      totalPendingItems,
      paidUAH,
      paidUSD,
      itemsList
    };
  };

  // 2. Print Window Generator
  const handlePrint = (e) => {
    e.preventDefault();
    let filtered = owedMaterials;
    if (printSupId) {
      filtered = filtered.filter(item => item.supplier_id === printSupId);
    }
    if (printStart) {
      filtered = filtered.filter(item => new Date(item.paid_at) >= new Date(printStart));
    }
    if (printEnd) {
      filtered = filtered.filter(item => new Date(item.paid_at) <= new Date(printEnd));
    }

    const printWindow = window.open('', '_blank');
    const todayStr = new Date().toLocaleDateString('uk-UA');
    const selectedSupName = printSupId ? (suppliers.find(s => s.id === printSupId)?.name || '') : 'Всі постачальники';

    const rowsHtml = filtered.map((item, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.supplier_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.deal_title}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #16A34A;">${item.received_quantity} ${item.unit}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: ${item.quantity - item.received_quantity > 0 ? '#EA580C' : '#6B7280'}; font-weight: bold;">
          ${item.quantity - item.received_quantity} ${item.unit}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.paid_sum.toLocaleString()} ${item.currency}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${new Date(item.paid_at).toLocaleDateString('uk-UA')}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Звіт по заборгованостях</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #2C2520; }
            h1 { font-size: 22px; text-align: center; margin-bottom: 5px; color: #2C2520; }
            .meta { text-align: center; font-size: 13px; color: #666; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #FAF6F0; padding: 10px; border: 1px solid #D4C5B9; font-size: 12px; font-weight: bold; text-align: center; }
            td { padding: 9px 10px; border: 1px solid #EAE7E2; font-size: 12.5px; }
          </style>
        </head>
        <body>
          <h1>Звіт по невиданих товарах та передоплатах постачальників</h1>
          <div class="meta">
            <p><strong>Постачальник:</strong> ${selectedSupName}</p>
            <p><strong>Дата генерації:</strong> ${todayStr}</p>
            ${printStart || printEnd ? `<p><strong>Період оплати:</strong> ${printStart || 'Початок'} - ${printEnd || 'Кінець'}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th style="text-align: left;">Постачальник</th>
                <th style="text-align: left;">Угода</th>
                <th style="text-align: left;">Товар / Матеріал</th>
                <th>Сплачено (всього)</th>
                <th>Отримано</th>
                <th>Залишок (борг)</th>
                <th style="text-align: right;">Сума угоди</th>
                <th>Дата угоди</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="9" style="text-align: center; color: #8B7D73; padding: 20px;">Немає запозичень за вибраними критеріями</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowPrintModal(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FAF8F5', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {/* Top dashboard control panel */}
      <div style={{ 
        background: '#FAF6F0', borderBottom: '1px solid #D4C5B9', padding: '16px 20px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#2C2520', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚛</span> Стан взаєморозрахунків
          </h2>
          
          {/* Switcher Cards / Table */}
          <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '6px', padding: '2px', gap: '2px' }}>
            <button 
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? '#C4B4A6' : 'transparent',
                color: viewMode === 'cards' ? '#FFFFFF' : '#8B7D73',
                border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              Блоки
            </button>
            <button 
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#C4B4A6' : 'transparent',
                color: viewMode === 'table' ? '#FFFFFF' : '#8B7D73',
                border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              Таблиця
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowPrintModal(true)}
          style={{
            background: '#FFFFFF', color: '#2C2520', border: '1px solid #D4C5B9', borderRadius: '6px',
            padding: '6px 14px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
            transition: 'background 0.2s', boxShadow: '0 1px 3px rgba(139,125,112,0.05)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#FAF6F0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
        >
          <Printer size={14} color="#8B7D73" /> Друк звіту
        </button>
      </div>

      {/* Main scrolling dashboard area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', boxSizing: 'border-box' }}>
        
        {viewMode === 'cards' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            maxWidth: '960px',
            margin: '0 auto'
          }}>
            {suppliers.map(sup => {
              const { totalPendingItems, paidUAH, paidUSD, itemsList } = getSupplierStats(sup.id);
              return (
                <div
                  key={sup.id}
                  onClick={() => onSelectSupplier(sup)}
                  style={{
                    background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '12px',
                    padding: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 2px 6px rgba(139,125,112,0.04)', transition: 'all 0.2s',
                    position: 'relative', overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 125, 112, 0.08)';
                    e.currentTarget.style.borderColor = '#C4B4A6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(139, 125, 112, 0.04)';
                    e.currentTarget.style.borderColor = '#D4C5B9';
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#2C2520', margin: 0 }}>
                      {sup.name}
                    </h3>
                    
                    {totalPendingItems > 0 ? (
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#FFFFFF', background: '#8B7D73', padding: '2px 8px', borderRadius: '12px' }}>
                        {totalPendingItems} шт. очікується
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '12px' }}>
                        0 шт.
                      </span>
                    )}
                  </div>

                  {/* Financials details section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#FAF6F0', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#8B7D73', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Проплачено (активні угоди):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {paidUAH > 0 ? (
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#2C2520' }}>
                          {paidUAH.toLocaleString()} ₴
                        </div>
                      ) : null}
                      {paidUSD > 0 ? (
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#2C2520' }}>
                          ${paidUSD.toLocaleString()}
                        </div>
                      ) : null}
                      {paidUAH === 0 && paidUSD === 0 ? (
                        <div style={{ fontSize: '13px', color: '#8B7D73', fontStyle: 'italic' }}>
                          Немає активних оплат
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Materials list preview section */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#8B7D73', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      Очікується товарів:
                    </div>
                    {itemsList.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {itemsList.slice(0, 3).map((item, idx) => (
                          <div key={idx} style={{ fontSize: '12.5px', color: '#2C2520', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#C4B4A6', fontSize: '10px' }}>📦</span>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {item}
                            </span>
                          </div>
                        ))}
                        {itemsList.length > 3 ? (
                          <div style={{ fontSize: '11px', color: '#8B7D73', fontStyle: 'italic', marginTop: '2px', paddingLeft: '16px' }}>
                            та ще {itemsList.length - 3} матеріалів...
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#16A34A', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✨</span> Немає активних запозичень
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table aggregated view */
          <div style={{
            background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '12px',
            overflow: 'hidden', maxWidth: '960px', margin: '0 auto', boxShadow: '0 2px 6px rgba(139,125,112,0.03)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#FAF6F0', borderBottom: '1px solid #D4C5B9' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Постачальник</th>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Проплачено в UAH</th>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Проплачено в USD</th>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Очікується товарів</th>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.3px', textAlign: 'right' }}>Дія</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(sup => {
                  const { totalPendingItems, paidUAH, paidUSD } = getSupplierStats(sup.id);
                  return (
                    <tr 
                      key={sup.id} 
                      style={{ borderBottom: '1px solid #EAE7E2', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FAF8F5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: 700, color: '#2C2520' }}>
                        {sup.name}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#2C2520', fontWeight: paidUAH > 0 ? 700 : 400 }}>
                        {paidUAH > 0 ? `${paidUAH.toLocaleString()} ₴` : '0 ₴'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#2C2520', fontWeight: paidUSD > 0 ? 700 : 400 }}>
                        {paidUSD > 0 ? `$${paidUSD.toLocaleString()}` : '$0'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {totalPendingItems > 0 ? (
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#FFFFFF', background: '#8B7D73', padding: '2px 8px', borderRadius: '12px' }}>
                            {totalPendingItems} шт. очікується
                          </span>
                        ) : (
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '12px' }}>
                            чисто
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => onSelectSupplier(sup)}
                          style={{
                            background: '#FFFFFF', color: '#8B7D73', border: '1px solid #D4C5B9', borderRadius: '6px',
                            padding: '4px 10px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#C4B4A6'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#C4B4A6'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#8B7D73'; e.currentTarget.style.borderColor = '#D4C5B9'; }}
                        >
                          Переглянути
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Report Filters Modal */}
      {showPrintModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(44, 37, 32, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#FAF8F5', border: '1px solid #D4C5B9', borderRadius: '12px',
            width: '90%', maxWidth: '400px', padding: '24px', boxShadow: '0 8px 32px rgba(139, 125, 112, 0.15)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#2C2520', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={16} color="#C4B4A6" /> Налаштування друку звіту
              </h3>
              <button onClick={() => setShowPrintModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={18} color="#8B7D73" />
              </button>
            </div>

            <form onSubmit={handlePrint} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#2C2520', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Постачальник
                </label>
                <select
                  value={printSupId}
                  onChange={(e) => setPrintSupId(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D4C5B9',
                    borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                  }}
                >
                  <option value="">Всі постачальники</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#2C2520', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    З дати
                  </label>
                  <input 
                    type="date"
                    value={printStart}
                    onChange={(e) => setPrintStart(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D4C5B9',
                      borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#2C2520', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    По дату
                  </label>
                  <input 
                    type="date"
                    value={printEnd}
                    onChange={(e) => setPrintEnd(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D4C5B9',
                      borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPrintModal(false)}
                  style={{
                    flex: 1, padding: '10px', background: '#FFFFFF', color: '#8B7D73',
                    border: '1px solid #D4C5B9', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Скасувати
                </button>
                <button 
                  type="submit"
                  style={{
                    flex: 1, padding: '10px', background: '#C4B4A6', color: '#FFFFFF',
                    border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Printer size={14} /> Друкувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
