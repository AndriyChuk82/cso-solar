import { ReactNode, useEffect, useState } from 'react';
import { Home } from 'lucide-react';
import { SettingsButton } from './Settings';
import { HistoryButton } from './History';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

interface UserAccess {
  isAdmin: boolean;
  modules: string[];
}

export function Layout({ children }: LayoutProps) {
  const [access, setAccess] = useState<UserAccess>({ isAdmin: false, modules: [] });

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const response = await fetch('/api/verify');
        if (response.ok) {
          const data = await response.json();
          const role = (data.role || 'user').toLowerCase();
          const accessStr = (data.module_access || '').toLowerCase();
          const isAdmin = role === 'admin' || role === 'адмін' || role === 'адміністратор';
          
          const mapping: Record<string, string[]> = {
            'proposals': ['proposals', 'кп', 'комперційні'],
            'warehouse': ['warehouse', 'склад'],
            'projects': ['projects', 'проєкти', 'проекти'],
            'gt': ['gt', 'зелений тариф', 'зт']
          };

          const allowed = isAdmin 
            ? ['proposals', 'warehouse', 'projects', 'gt']
            : Object.keys(mapping).filter(key => 
                mapping[key].some(keyword => accessStr.includes(keyword))
              );

          setAccess({ isAdmin, modules: allowed });
        }
      } catch (err) {
        console.error('Failed to fetch access info:', err);
      }
    };
    fetchAccess();
  }, []);

  const hasAccess = (mod: string) => access.isAdmin || access.modules.includes(mod);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 transition-colors">
      <header className="bg-white dark:bg-neutral-800 shadow-sm border-b border-gray-200 dark:border-neutral-700 transition-colors">
        <div className="max-w-[100%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <a href="/dashboard/" className="hover:opacity-80 transition-opacity">
                <img
                  src="https://i.ibb.co/32JD4dc/logo.png"
                  alt="CSO Solar"
                  className="h-9"
                />
              </a>
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-gray-900 dark:text-white leading-tight">CSO Solar</div>
                <div className="text-xs text-gray-500 dark:text-neutral-400">Комерційні пропозиції</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-1">
                <a
                  href="/dashboard/"
                  className="p-2 text-gray-500 hover:text-primary transition-colors mr-1"
                  title="Головна панель"
                >
                  <Home className="w-5 h-5" />
                </a>
                
                {hasAccess('proposals') && (
                  <a
                    href="/proposals/"
                    className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 dark:bg-primary/20 rounded-md"
                  >
                    📄 КП
                  </a>
                )}

                {hasAccess('warehouse') && (
                  <a
                    href="/warehouse/"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  >
                    📦 Склад
                  </a>
                )}
                
                {hasAccess('projects') && (
                  <a
                    href="/projects/"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition"
                  >
                    📊 Проєкти
                  </a>
                )}
                
                {hasAccess('gt') && (
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
                <HistoryButton />
                <SettingsButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[100%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
