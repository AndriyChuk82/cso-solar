import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { LogOut, User, Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from '@cso/design-system'
import Sidebar from './Sidebar'
import CONFIG from '../config'

interface LayoutProps {
  user: {
    name: string
    role: string
    isAdmin: boolean
    module_access: string
  }
}

export default function Layout({ user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const hasAccess = (keys: string[]) => {
    if (user.isAdmin) return true
    return keys.some(k => user.module_access.includes(k))
  }

  return (
    <>
      <header className="app-header bg-white dark:bg-neutral-800 shadow-sm border-b border-gray-200 dark:border-neutral-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-300 transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title="Меню"
              >
                <Menu size={20} />
              </button>
              <a
                href="https://cso-solar.vercel.app/dashboard/"
                className="flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer"
                title="Перейти на Головну (Панель керування)"
              >
                <img
                  src="https://i.ibb.co/32JD4dc/logo.png"
                  alt="CSO Solar"
                  style={{ height: '40px', width: 'auto', display: 'block' }}
                  className="flex-shrink-0"
                />
                <div className="flex flex-col">
                  <div className="font-bold text-gray-900 dark:text-white leading-tight text-lg">CSO Solar</div>
                  <div className="text-[10px] text-gray-500 dark:text-neutral-400 uppercase tracking-wider font-medium">Оренда землі</div>
                </div>
              </a>
            </div>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-1.5">
                {hasAccess(['proposals', 'кп', 'комперційні']) && (
                  <a href="/proposals/" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition">
                    📄 КП
                  </a>
                )}
                {hasAccess(['warehouse', 'склад']) && (
                  <a href="/warehouse/" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition">
                    📦 Склад
                  </a>
                )}
                {hasAccess(['projects', 'проєкти', 'проекти']) && (
                  <a href="/projects/" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition">
                    📊 Проєкти
                  </a>
                )}
                {hasAccess(['gt', 'зелений тариф', 'зт']) && (
                  <a href="/green-tariff/" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition">
                    🌱 Зелений тариф
                  </a>
                )}
                {hasAccess(['land-lease', 'оренда', 'оренда землі', 'земля']) && (
                  <a href="/land-lease/" className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 dark:bg-primary/20 rounded-md">
                    🌾 Оренда
                  </a>
                )}
              </nav>

              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-neutral-700 pl-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-neutral-400 transition-colors"
                  title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <div className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-neutral-300 rounded-lg" title={`Роль: ${CONFIG.ROLE_LABELS[user.role] || user.role}`}>
                  <User size={18} className="text-gray-400 dark:text-neutral-500" />
                  <span className="hidden lg:inline text-sm font-medium">{user.name}</span>
                </div>
                <a
                  href="/api/logout"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-neutral-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition"
                  title="Вихід"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline text-sm font-medium">Вихід</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="app-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </>
  )
}
