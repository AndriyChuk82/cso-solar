import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTheme } from '@cso/design-system'
import Layout from './components/Layout'
import CONFIG from './config'

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Landlords = lazy(() => import('./pages/Landlords'))
const LandlordDetails = lazy(() => import('./pages/LandlordDetails'))
const MapView = lazy(() => import('./pages/MapView'))
const Finances = lazy(() => import('./pages/Finances'))

interface User {
  name: string
  role: string
  isAdmin: boolean
  module_access: string
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useTheme()

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(CONFIG.VERIFY_URL, { credentials: 'include' })
        if (!res.ok) {
          if (import.meta.env.DEV) {
            console.log('Dev mode: API error, setting mock user')
            setUser({
              name: 'Адмін (Dev)',
              role: 'admin',
              isAdmin: true,
              module_access: 'land-lease,warehouse,projects,proposals,gt',
            })
            setLoading(false)
            return
          }
          setError('Не вдалося перевірити авторизацію')
          setLoading(false)
          return
        }
        const data = await res.json()
        if (data.token) {
          localStorage.setItem('cso_auth_token', data.token)
        }
        if (!data.authenticated) {
          if (import.meta.env.DEV) {
            console.log('Dev mode: unauthenticated, setting mock user')
            setUser({
              name: 'Адмін (Dev)',
              role: 'admin',
              isAdmin: true,
              module_access: 'land-lease,warehouse,projects,proposals,gt',
            })
            setLoading(false)
            return
          }
          setError('Ви не авторизовані')
          setLoading(false)
          return
        }
        const role = (data.role || 'user').toLowerCase()
        const isAdmin = role === 'admin' || role === 'адмін' || role === 'адміністратор'
        setUser({
          name: data.name || data.user || 'Користувач',
          role,
          isAdmin,
          module_access: (data.module_access || '').toLowerCase(),
        })
      } catch {
        if (import.meta.env.DEV) {
          console.log('Dev mode: fetch exception, setting mock user')
          setUser({
            name: 'Адмін (Dev)',
            role: 'admin',
            isAdmin: true,
            module_access: 'land-lease,warehouse,projects,proposals,gt',
          })
          setLoading(false)
          return
        }
        setError('Помилка з\'єднання з сервером')
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <img src="https://i.ibb.co/32JD4dc/logo.png" alt="CSO Solar" style={{ height: '48px' }} />
        <div className="spinner" />
        <p>Перевірка авторизації...</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="loading-screen">
        <span style={{ fontSize: '48px' }}>🔒</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Доступ заборонено</h2>
        <p className="text-gray-500 dark:text-neutral-400">{error || 'Ви не авторизовані.'}</p>
        <a href="/" className="btn btn-primary mt-4">🏠 На головну</a>
      </div>
    )
  }

  const moduleAccess = user.module_access
  const hasAccess = user.isAdmin || CONFIG.MODULE_ACCESS_KEYS.some(key => moduleAccess.includes(key))

  if (!hasAccess) {
    return (
      <div className="loading-screen">
        <span style={{ fontSize: '48px' }}>🔒</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Доступ заборонено</h2>
        <p className="text-gray-500 dark:text-neutral-400">У вас немає доступу до модуля «Оренда землі».</p>
        <p className="text-xs text-gray-400 mt-2">Доступні модулі: {user.module_access || 'немає'}</p>
        <a href="/" className="btn btn-primary mt-4">🏠 На головну</a>
      </div>
    )
  }

  return (
    <BrowserRouter basename="/land-lease">
      <Suspense fallback={
        <div className="loading-screen">
          <div className="spinner" />
          <p className="font-semibold">Завантаження Оренди землі...</p>
        </div>
      }>
        <Routes>
          <Route element={<Layout user={user} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/landlords" element={<Landlords />} />
            <Route path="/landlords/:id" element={<LandlordDetails />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/finances" element={<Finances />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default function App() {
  return <AppContent />
}
