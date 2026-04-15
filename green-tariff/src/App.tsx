// ===== CSO Solar — Green Tariff Main App =====

import React from 'react';
import { Layout } from './components/Layout';
import { ProjectList } from './components/ProjectList';
import { ProjectForm } from './components/ProjectForm';
import { useGreenTariffStore } from './store/useGreenTariffStore';

function App() {
  const { loadEquipment } = useGreenTariffStore();

  React.useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <ProjectList />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <ProjectForm />
        </main>
      </div>
    </Layout>
  );
}

export default App;
