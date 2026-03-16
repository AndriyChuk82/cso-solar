import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Journal from './pages/Journal';
import OperationForm from './pages/OperationForm';
import Transfer from './pages/Transfer';
import DailyBalance from './pages/DailyBalance';
import Catalog from './pages/Catalog';
import Warehouses from './pages/Warehouses';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Proposals from './pages/Proposals';
import ProposalForm from './pages/ProposalForm';
import ProposalView from './pages/ProposalView';

function AppContent() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <img src="https://i.ibb.co/32JD4dc/logo.png" alt="CSO Solar" style={{ height: '48px' }} />
        <div className="spinner" />
        <p>Перевірка авторизації...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="access-denied">
        <span className="denied-icon">🔒</span>
        <h2>Доступ заборонено</h2>
        <p>{error || 'Ви не авторизовані. Увійдіть через основний сайт CSO Solar.'}</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
          🏠 Перейти на основний сайт
        </a>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/warehouse">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Journal />} />
          <Route path="/income" element={<OperationForm type="income" />} />
          <Route path="/expense" element={<OperationForm type="expense" />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/daily-balance" element={<DailyBalance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/catalog" element={<Catalog />} />

          {/* Лише адміністратор */}
          {user.isAdmin && (
            <>
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/users" element={<Users />} />
              <Route path="/categories" element={<Categories />} />
            </>
          )}

          {/* Комерційні пропозиції */}
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/proposals/new" element={<ProposalForm />} />
          <Route path="/proposals/edit/:id" element={<ProposalForm />} />
          <Route path="/proposals/view/:id" element={<ProposalView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
