import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, LogOut, User, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';

export function Layout({ children }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  const navigation = [
    { name: 'Проекти', href: '/', icon: LayoutDashboard },
    { name: 'Комерційні пропозиції', href: '/proposals', icon: ClipboardList },
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px'
      }}>
        <img
          src="https://i.ibb.co/32JD4dc/logo.png"
          alt="CSO Solar"
          style={{ height: '48px' }}
        />
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #f09433',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#666', fontSize: '14px' }}>Перевірка авторизації...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex flex-col transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 shadow-sm border-b border-gray-200 dark:border-neutral-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <img
                src="https://i.ibb.co/32JD4dc/logo.png"
                alt="CSO Solar"
                className="h-8 w-auto flex-shrink-0"
                style={{ maxWidth: '120px' }}
              />
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">CSO Solar</div>
                <div className="text-[10px] text-gray-500 dark:text-neutral-400">Проєктний менеджмент</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
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
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  >
                    📦 Склад
                  </a>
                )}
                
                {(user?.isAdmin || user?.module_access?.includes('projects') || user?.module_access?.includes('проєкти') || user?.module_access?.includes('проекти')) && (
                  <a
                    href="/projects/"
                    className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 dark:bg-primary/20 rounded-md"
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

              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-neutral-700 pl-3">
                <ThemeToggle />
                {user && (
                  <div className="hidden md:block text-right mr-1.5">
                    <div className="text-xs font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-[10px] text-gray-500 dark:text-neutral-400">{user.role}</div>
                  </div>
                )}
                <a href="/api/logout" className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition" title="Вихід">
                  🚪
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="app-layout">
        {/* Main Content */}
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
