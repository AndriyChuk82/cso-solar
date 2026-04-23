import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { useTheme } from '@cso/design-system';

// Lazy load pages
const Journal = lazy(() => import('./pages/Journal'));
const OperationForm = lazy(() => import('./pages/OperationForm'));
const Transfer = lazy(() => import('./pages/Transfer'));
const DailyBalance = lazy(() => import('./pages/DailyBalance'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Warehouses = lazy(() => import('./pages/Warehouses'));
const Users = lazy(() => import('./pages/Users'));
const Categories = lazy(() => import('./pages/Categories'));
const Reports = lazy(() => import('./pages/Reports'));
const Backups = lazy(() => import('./pages/Backups'));


function AppContent() {
  const { user, loading, error } = useAuth();
  useTheme(); // Initialize theme and font scale

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
      <div className="access-denied" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
        <span className="denied-icon">🔒</span>
        <h2 style={{ color: 'var(--text)' }}>Доступ заборонено</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error || 'Ви не авторизовані. Увійдіть через основний сайт CSO Solar.'}</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
          🏠 Перейти на основний сайт
        </a>
      </div>
    );
  }

  const moduleAccess = (user.module_access || '').toLowerCase();
  const hasWarehouseAccess = user.isAdmin || moduleAccess.includes('warehouse') || moduleAccess.includes('склад');

  if (!hasWarehouseAccess) {
    return (
      <div className="access-denied" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
        <span className="denied-icon">🔒</span>
        <h2 style={{ color: 'var(--text)' }}>Доступ заборонено</h2>
        <p style={{ color: 'var(--text-secondary)' }}>У вас немає доступу до модуля Склад.</p>
        <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '10px' }}>Доступні модулі: {user.module_access || 'немає'}</div>
        <a href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
          🏠 Перейти на головну сторінку
        </a>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/warehouse">
      <Suspense fallback={
        <div className="loading-screen" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
          <div className="spinner" />
          <p style={{ fontWeight: 600 }}>Завантаження Складу...</p>
        </div>
      }>
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
                <Route path="/backups" element={<Backups />} />
              </>
            )}
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
