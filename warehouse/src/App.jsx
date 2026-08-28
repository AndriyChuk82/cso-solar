import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { useTheme } from '@cso/design-system';
import { canAccess, getDefaultWarehouseRoute } from './utils/permissions';

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
const PriceList = lazy(() => import('./pages/PriceList'));

// Нові сторінки для модуля «Баланси клієнтів»
const BuyersDashboard = lazy(() => import('./pages/BuyersDashboard'));
const BuyerDetails = lazy(() => import('./pages/BuyerDetails'));
const BuyerIssueForm = lazy(() => import('./pages/BuyerIssueForm'));
const BuyerPaymentForm = lazy(() => import('./pages/BuyerPaymentForm'));
const BuyersReport = lazy(() => import('./pages/BuyersReport'));
const AuditLog = lazy(() => import('./pages/AuditLog'));

// Сторінки для модуля «Відправлення»
const ShipmentsDashboard = lazy(() => import('./pages/ShipmentsDashboard'));
const ShipmentForm = lazy(() => import('./pages/ShipmentForm'));
const ShipmentDetails = lazy(() => import('./pages/ShipmentDetails'));

// Сторінки для модуля «Об'єкти будівництва»
const ConstructionObjectsDashboard = lazy(() => import('./pages/ConstructionObjectsDashboard'));
const ConstructionObjectDetails = lazy(() => import('./pages/ConstructionObjectDetails'));

// Обгортка для захисту роутів за правами доступу
function ProtectedRoute({ permission, user, children }) {
  if (canAccess(user, permission)) {
    return children;
  }
  const defaultRoute = getDefaultWarehouseRoute(user);
  return <Navigate to={defaultRoute} replace />;
}

// Стартовий роут: якщо немає прав на Журнал, перенаправляємо на дозволений розділ
function HomeRoute({ user }) {
  if (canAccess(user, 'journal')) {
    return <Journal />;
  }
  const defaultRoute = getDefaultWarehouseRoute(user);
  return <Navigate to={defaultRoute} replace />;
}

function AppContent() {
  const { user, loading, error, isVerifying } = useAuth();
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
    if (isVerifying) {
      return (
        <div className="loading-screen">
          <img src="https://i.ibb.co/32JD4dc/logo.png" alt="CSO Solar" style={{ height: '48px' }} />
          <div className="spinner" />
          <p>Перевірка доступу...</p>
        </div>
      );
    }

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
            {/* Головна сторінка або редирект */}
            <Route path="/" element={<HomeRoute user={user} />} />

            {/* Операції приходу/розходу */}
            <Route path="/income" element={<ProtectedRoute permission="operations" user={user}><OperationForm type="income" /></ProtectedRoute>} />
            <Route path="/expense" element={<ProtectedRoute permission="operations" user={user}><OperationForm type="expense" /></ProtectedRoute>} />
            <Route path="/transfer" element={<ProtectedRoute permission="operations" user={user}><Transfer /></ProtectedRoute>} />
            <Route path="/daily-balance" element={<ProtectedRoute permission="operations" user={user}><DailyBalance /></ProtectedRoute>} />
            <Route path="/catalog" element={<ProtectedRoute permission="operations" user={user}><Catalog /></ProtectedRoute>} />

            {/* Прайс-лист */}
            <Route path="/price-list" element={<ProtectedRoute permission="price_list" user={user}><PriceList /></ProtectedRoute>} />

            {/* Звіти */}
            <Route path="/reports" element={<ProtectedRoute permission="reports" user={user}><Reports /></ProtectedRoute>} />
            <Route path="/buyers/report" element={<ProtectedRoute permission="reports" user={user}><BuyersReport /></ProtectedRoute>} />
            <Route path="/audit-log" element={<ProtectedRoute permission="reports" user={user}><AuditLog /></ProtectedRoute>} />

            {/* Баланси клієнтів */}
            <Route path="/buyers" element={<ProtectedRoute permission="buyers" user={user}><BuyersDashboard /></ProtectedRoute>} />
            <Route path="/buyers/:id" element={<ProtectedRoute permission="buyers" user={user}><BuyerDetails /></ProtectedRoute>} />
            <Route path="/buyers/issue" element={<ProtectedRoute permission="buyers" user={user}><BuyerIssueForm /></ProtectedRoute>} />
            <Route path="/buyers/issue/edit/:txId" element={<ProtectedRoute permission="buyers" user={user}><BuyerIssueForm /></ProtectedRoute>} />
            <Route path="/buyers/payment" element={<ProtectedRoute permission="buyers" user={user}><BuyerPaymentForm /></ProtectedRoute>} />

            {/* Відправлення */}
            <Route path="/shipments" element={<ProtectedRoute permission="shipments" user={user}><ShipmentsDashboard /></ProtectedRoute>} />
            <Route path="/shipments/new" element={<ProtectedRoute permission="shipments" user={user}><ShipmentForm /></ProtectedRoute>} />
            <Route path="/shipments/edit/:id" element={<ProtectedRoute permission="shipments" user={user}><ShipmentForm /></ProtectedRoute>} />
            <Route path="/shipments/:id" element={<ProtectedRoute permission="shipments" user={user}><ShipmentDetails /></ProtectedRoute>} />

            {/* Об'єкти будівництва */}
            <Route path="/construction-objects" element={<ProtectedRoute permission="objects" user={user}><ConstructionObjectsDashboard /></ProtectedRoute>} />
            <Route path="/construction-objects/:id" element={<ProtectedRoute permission="objects" user={user}><ConstructionObjectDetails /></ProtectedRoute>} />

            {/* Лише адміністратор */}
            {user.isAdmin && (
              <>
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/users" element={<Users />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/backups" element={<Backups />} />
              </>
            )}

            {/* Невідомий роут -> редирект на дозволену стартову сторінку */}
            <Route path="*" element={<Navigate to={getDefaultWarehouseRoute(user)} replace />} />
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
