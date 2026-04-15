// ===== CSO Solar — Green Tariff Layout =====

import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();

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
          borderTop: '4px solid #E8890A',
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
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-900 flex flex-col transition-colors">
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
                <div className="text-[10px] text-gray-500 dark:text-neutral-400">Зелений тариф</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <nav className="hidden md:flex items-center gap-1.5">
                <a
                  href="/warehouse/"
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                >
                  📦 Склад
                </a>
                <a
                  href="/"
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                >
                  📄 КП
                </a>
                <a
                  href="/projects/"
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                >
                  📊 Проєкти
                </a>
                <a
                  href="/green-tariff/"
                  className="px-2.5 py-1.5 text-xs font-medium text-primary bg-primary/10 dark:bg-primary/20 rounded-md"
                >
                  🌱 Зелений тариф
                </a>
              </nav>

              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-neutral-700 pl-3">
                <ThemeToggle />
                {user && (
                  <div className="hidden md:block text-right mr-1.5">
                    <div className="text-xs font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-[10px] text-gray-500 dark:text-neutral-400">{user.role}</div>
                  </div>
                )}
                <a
                  href="/api/logout"
                  className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  title="Вихід"
                >
                  🚪
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
