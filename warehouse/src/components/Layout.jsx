import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import CONFIG from '../config';
import { ThemeToggle } from './ThemeToggle';

/**
 * Основний макет додатку: хедер + сайдбар + контент.
 * Дизайн уніфіковано відповідно до модуля КП.
 */
export default function Layout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="app-header bg-white dark:bg-neutral-800 shadow-sm border-b border-gray-200 dark:border-neutral-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-300 transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title="Меню"
              >
                <Menu size={20} />
              </button>
              <img
                src="https://i.ibb.co/32JD4dc/logo.png"
                alt="CSO Solar"
                style={{ height: '40px', width: 'auto', display: 'block' }}
                className="flex-shrink-0"
              />
              <div className="flex flex-col">
                <div className="font-bold text-gray-900 dark:text-white leading-tight text-lg">CSO Solar</div>
                <div className="text-[10px] text-gray-500 dark:text-neutral-400 uppercase tracking-wider font-medium">Складський облік</div>
              </div>
            </div>

            {/* Navigation and Actions */}
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-1.5">
                {(user?.isAdmin || user?.module_access?.includes('proposals') || user?.module_access?.includes('кп') || user?.module_access?.includes('комперційні')) && (
                  <a
                    href="/proposals/"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  >
                    📄 КП
                  </a>
                )}

                {(user?.isAdmin || user?.module_access?.includes('warehouse') || user?.module_access?.includes('склад')) && (
                  <a
                    href="/warehouse/"
                    className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 dark:bg-primary/20 rounded-md"
                  >
                    📦 Склад
                  </a>
                )}
                
                {(user?.isAdmin || user?.module_access?.includes('projects') || user?.module_access?.includes('проєкти') || user?.module_access?.includes('проекти')) && (
                  <a
                    href="/projects/"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  >
                    📊 Проєкти
                  </a>
                )}
                
                {(user?.isAdmin || user?.module_access?.includes('gt') || user?.module_access?.includes('зелений тариф') || user?.module_access?.includes('зт')) && (
                  <a
                    href="/green-tariff/"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  >
                    🌱 Зелений тариф
                  </a>
                )}
              </nav>

              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-neutral-700 pl-4">
                <ThemeToggle />
                {user && (
                    <div className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-neutral-300 rounded-lg" title={`Роль: ${CONFIG.ROLE_LABELS[user.role] || user.role}`}>
                         <User size={18} className="text-gray-400 dark:text-neutral-500" />
                         <span className="hidden lg:inline text-sm font-medium">{user.name}</span>
                    </div>
                )}

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
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </>
  );
}
