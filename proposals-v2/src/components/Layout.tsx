import { ReactNode, useEffect, useState } from 'react';
import { Home, FileText, Package, BarChart2, Zap, Users } from 'lucide-react';
import { SettingsButton } from './Settings';
import { HistoryButton } from './History';
import { ThemeToggle } from './ThemeToggle';
import { ClientsManager } from './ClientsManager';

interface LayoutProps {
  children: ReactNode;
}

interface UserAccess {
  isAdmin: boolean;
  modules: string[];
}

export function Layout({ children }: LayoutProps) {
  const [access, setAccess] = useState<UserAccess>({ isAdmin: false, modules: [] });
  const [showClients, setShowClients] = useState(false);

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
                  className="p-2 text-gray-500 hover:text-[#f59e0b] hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 rounded-lg transition-all duration-150 mr-1"
                  title="Головна панель"
                >
                  <Home className="w-4 h-4" />
                </a>
                
                {hasAccess('proposals') && (
                  <a
                    href="/proposals/"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#f59e0b] bg-[#f59e0b]/10 dark:bg-[#f59e0b]/20 rounded-lg transition-all duration-150"
                  >
                    <FileText className="w-4 h-4" />
                    КП
                  </a>
                )}

                {hasAccess('warehouse') && (
                  <a
                    href="/warehouse/"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-neutral-350 hover:text-[#f59e0b] hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 rounded-lg transition-all duration-150"
                  >
                    <Package className="w-4 h-4" />
                    Склад
                  </a>
                )}
                
                {hasAccess('projects') && (
                  <a
                    href="/projects/"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-neutral-350 hover:text-[#f59e0b] hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 rounded-lg transition-all duration-150"
                  >
                    <BarChart2 className="w-4 h-4" />
                    Проєкти
                  </a>
                )}
                
                {hasAccess('gt') && (
                  <a
                    href="/green-tariff/"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-neutral-350 hover:text-[#f59e0b] hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 rounded-lg transition-all duration-150"
                  >
                    <Zap className="w-4 h-4" />
                    Зелений тариф
                  </a>
                )}
              </nav>

              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-neutral-700 pl-4">
                <button
                  onClick={() => setShowClients(true)}
                  title="Постійні клієнти"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-neutral-350 hover:text-[#f59e0b] hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 rounded-lg transition-all duration-150"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Клієнти</span>
                </button>
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

      {showClients && <ClientsManager onClose={() => setShowClients(false)} />}
    </div>
  );
}
