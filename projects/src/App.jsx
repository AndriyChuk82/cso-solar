import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from '@cso/design-system';
import Migration from './pages/Migration';
import CrmDashboard from './pages/crm/CrmDashboard';

function App() {
  useTheme(); // Initialize theme and font scale
  return (
    <ErrorBoundary>
      <Router basename="/projects">
        <Layout>
          <Routes>
            <Route path="/" element={<CrmDashboard />} />
            <Route path="/migration" element={<Migration />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
