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

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getClients();
      setClients(data || []);
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

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  if (selectedClient) {
    return <CrmClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} onUpdate={loadClients} />;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar - Список Клієнтів */}
      <div style={{ width: '380px', borderRight: '1px solid #E5E7EB', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={18} color="#2563EB" /> 
              Контрагенти
            </h1>
            <button 
              onClick={() => setShowModal(true)}
              style={{ 
                background: '#111827', color: 'white', border: 'none', borderRadius: '4px', 
                padding: '6px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Новий
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#6B7280" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input 
              type="text" 
              placeholder="Пошук клієнта..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                width: '100%', padding: '6px 10px 6px 30px', fontSize: '13px', 
                border: '1px solid #D1D5DB', borderRadius: '4px', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280', fontSize: '13px' }}>Завантаження...</div>
          ) : filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280', fontSize: '13px' }}>Нічого не знайдено</div>
          ) : (
            filteredClients.map(client => {
              const projectCount = client.projects?.length || 0;
              return (
                <div 
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  style={{ 
                    padding: '12px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', 
                    borderRadius: '6px', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>{client.name}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{client.phone || 'Немає телефону'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#4B5563', background: '#E5E7EB', padding: '2px 6px', borderRadius: '10px' }}>
                      {projectCount} угод
                    </span>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area - Empty State */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <Briefcase size={32} color="#9CA3AF" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px 0' }}>CRM Модуль CSO Solar</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '400px', textAlign: 'center' }}>
          Виберіть контрагента зліва, щоб переглянути інформацію про проєкти, фінансові розрахунки та відвантаження.
        </p>
      </div>

      <NewClientModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSave={handleCreateClient} 
      />
    </div>
  );
}
