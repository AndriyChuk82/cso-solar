import React, { useState, useEffect } from 'react';
import { ProjectList } from '../pages/ProjectList';
import { ProjectDetail } from '../pages/ProjectDetail';
import { AddProjectModal } from './AddProjectModal';
import { useProjectStore } from '../store/useProjectStore';

export function SplitLayout() {
  const { fetchProjects } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Currency state — shared across list and detail
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'UAH'
  const [rate, setRate] = useState(41);            // UAH per 1 USD

  useEffect(() => {
    fetchProjects();
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSelectProject = (id) => setSelectedProjectId(id);
  const handleBack = () => setSelectedProjectId(null);

  const handleProjectCreated = (newId) => {
    fetchProjects();
    setSelectedProjectId(newId);
  };

  const handleProjectClosed = () => {
    fetchProjects();          // refresh list
    setSelectedProjectId(null);
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
      <div className={`panel-list ${isMobile && !showList ? 'hidden-mobile' : ''}`}>
        <ProjectList
          selectedId={selectedProjectId}
          onSelect={handleSelectProject}
          onAddNew={() => setIsAddModalOpen(true)}
          currency={currency}
          rate={rate}
        />
      </div>

      {/* Right Panel */}
      <div className={`panel-detail ${isMobile && !showDetail ? 'hidden-mobile' : ''}`}>
        {selectedProjectId ? (
          <ProjectDetail
            projectId={selectedProjectId}
            onBack={handleBack}
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
