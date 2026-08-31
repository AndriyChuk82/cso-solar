// ===== CSO Solar — Green Tariff v2 Layout =====

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '@cso/design-system';
import { Moon, Sun, LogOut, FileText, Package, BarChart2, ShieldAlert } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#fbfaf5] dark:bg-[#0f172a] gap-4 transition-colors duration-300">
        <img
          src="https://i.ibb.co/32JD4dc/logo.png"
          alt="CSO Solar Logo"
          className="h-12 w-auto animate-pulse"
        />
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#f59e0b] rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Перевірка авторизації...</p>
      </div>
    );
  }

  // Helper check for menu links based on module access
  const hasAccess = (keys: string | string[]) => {
    if (!user) return false;
    const role = user.role.toLowerCase();
    if (role.includes('admin') || role.includes('адмін') || role.includes('адміністратор')) return true;
    const access = user.module_access.toLowerCase();
    const keyList = Array.isArray(keys) ? keys : [keys];
    return keyList.some(k => access.includes(k.toLowerCase()));
  };

  return (
    <div className="min-h-screen bg-[#fbfaf5] dark:bg-[#0f172a] flex flex-col transition-colors duration-300">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-[#fbfaf5]/85 dark:bg-[#0f172a]/85 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/50 shadow-sm transition-all">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo and branding */}
            <a
              href="https://cso-solar.vercel.app/dashboard/"
              className="flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer"
              title="Перейти на Головну (Панель керування)"
            >
              <img
                src="https://i.ibb.co/32JD4dc/logo.png"
                alt="CSO Solar"
                className="h-9 w-auto flex-shrink-0"
              />
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">CSO Solar</div>
                <div className="text-[10px] font-semibold text-[#f59e0b] tracking-wider uppercase">Зелений тариф <span className="bg-[#f59e0b]/10 text-[#f59e0b] px-1.5 py-0.5 rounded ml-1 text-[8px] font-bold">V2</span></div>
              </div>
            </a>

            {/* Navigation links */}
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-1.5">
                {hasAccess(['proposals', 'кп', 'комперційні']) && (
                  <a
                    href="/proposals/"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  >
                    📄 КП
                  </a>
                )}

                {hasAccess(['warehouse', 'склад']) && (
                  <a
                    href="/warehouse/"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  >
                    📦 Склад
                  </a>
                )}

                {hasAccess(['projects', 'проєкти', 'проекти']) && (
                  <a
                    href="/projects/"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  >
                    📊 Проєкти
                  </a>
                )}

                {hasAccess(['gt', 'зелений тариф', 'зт']) && (
                  <a
                    href="/green-tariff/"
                    className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 dark:bg-primary/20 rounded-md"
                  >
                    🌱 Зелений тариф
                  </a>
                )}

                <a
                  href="?view=files#files"
                  onClick={(e) => {
                    if (window.location.pathname.includes('/green-tariff')) {
                      e.preventDefault();
                      window.location.hash = '#files';
                      window.dispatchEvent(new Event('hashchange'));
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-md transition flex items-center gap-1"
                >
                  📁 База файлів
                </a>

                {hasAccess(['land-lease', 'оренда', 'оренда землі', 'земля']) && (
                  <a
                    href="/land-lease/"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  >
                    🌾 Оренда
                  </a>
                )}
              </nav>

              {/* User settings / tools */}
              <div className="flex items-center gap-3 border-l border-gray-200/60 dark:border-slate-800 pl-4">
                
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-gray-500 hover:text-[#f59e0b] hover:bg-gray-100/50 dark:hover:bg-slate-800/50 transition-all duration-200"
                  aria-label="Switch Theme"
                  title="Змінити тему"
                >
                  {theme === 'light' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </button>

                {/* User badge */}
                {user && (
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{user.name}</div>
                    <div className="text-[9px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">{user.role}</div>
                  </div>
                )}

                {/* Logout */}
                <a
                  href="/api/logout"
                  className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                  title="Вихід"
                >
                  <LogOut className="w-4 h-4" />
                </a>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      {/* Main Content Space */}
      <main className="flex-1 flex flex-col min-h-0">
        {children}
      </main>
    </div>
  );
}
