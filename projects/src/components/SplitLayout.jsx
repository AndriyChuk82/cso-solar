import React, { useState, useEffect } from 'react';
import { ProjectList } from '../pages/ProjectList';
import { ProjectDetail } from '../pages/ProjectDetail';
import { AddProjectModal } from './AddProjectModal';
import { useProjectStore } from '../store/useProjectStore';
import { useAuth } from '../hooks/useAuth';
import { Plus } from 'lucide-react';

export function SplitLayout() {
  const { fetchProjects } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Currency state — shared across list and detail
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'UAH'
  const [rate, setRate] = useState(41);            // UAH per 1 USD

  const { user, loading } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'адмін' || user?.role === 'адміністратор';
  const hasAccess = isAdmin || (user?.module_access || '').includes('projects');

  useEffect(() => {
    if (user?.email && hasAccess) {
      fetchProjects(user.email);
    }
  }, [user, hasAccess]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (loading) return null;

  if (!hasAccess) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: 'calc(100vh - 80px)', 
        color: 'var(--text-muted)', 
        gap: 16,
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>Доступ заборонено</h2>
        <p style={{ maxWidth: '400px' }}>У вас немає прав для перегляду модуля Проєкти. Зверніться до адміністратора для отримання доступу.</p>
        <a href="/" style={{
          marginTop: '12px',
          padding: '10px 24px',
          background: 'var(--primary, #f09433)',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600
        }}>🏠 На головну</a>
      </div>
    );
  }

  const handleSelectProject = (id) => setSelectedProjectId(id);
  const handleBack = () => setSelectedProjectId(null);

  const handleProjectCreated = (newId) => {
    fetchProjects(user?.email);
    setSelectedProjectId(newId);
  };

  const handleProjectClosed = () => {
    fetchProjects(user?.email);          // refresh list
    setSelectedProjectId(null);
  };

  const onRefresh = () => {
    fetchProjects(user?.email);
  };

  const showList   = !isMobile || selectedProjectId === null;
  const showDetail = !isMobile || selectedProjectId !== null;

  return (
    <div className="split-layout">
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Left Panel */}
      <div className={`panel-list ${isMobile && !showList ? 'hidden-mobile' : ''}`} style={{ position: 'relative' }}>
        <ProjectList
          selectedId={selectedProjectId}
          onSelect={handleSelectProject}
          onAddNew={() => setIsAddModalOpen(true)}
          currency={currency}
          rate={rate}
        />

        {/* Mobile FAB — floating "+" button */}
        {isMobile && showList && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            title="Новий проект"
            style={{
              position: 'fixed',
              bottom: 24,
              right: 20,
              zIndex: 1000,
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--primary, #f09433)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '24px',
            }}
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Right Panel */}
      <div className={`panel-detail ${isMobile && !showDetail ? 'hidden-mobile' : ''}`}>
        {selectedProjectId ? (
          <ProjectDetail
            projectId={selectedProjectId}
            onBack={handleBack}
            onUpdate={onRefresh}
            isMobile={isMobile}
            onClosed={handleProjectClosed}
            currency={currency}
            setCurrency={setCurrency}
            rate={rate}
            setRate={setRate}
          />
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', color: 'var(--text-muted)', gap: 12,
          }}>
            <div style={{ fontSize: '3rem' }}>📋</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Оберіть проект зі списку</p>
          </div>
        )}
      </div>
    </div>
  );
}
