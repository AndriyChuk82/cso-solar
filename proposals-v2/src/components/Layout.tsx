import { ReactNode, useEffect, useState } from 'react';
import { Home, FileText, Package, BarChart2, Zap, Users, Database } from 'lucide-react';
import { SettingsButton } from './Settings';
import { HistoryButton } from './History';
import { ThemeToggle } from './ThemeToggle';
import { ClientsManager } from './ClientsManager';
import { SupplierStatusModal } from './SupplierStatusModal';
import { useProposalStore } from '../store';

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
  const [showSupplierStatus, setShowSupplierStatus] = useState(false);
  const supplierStatuses = useProposalStore((state: any) => state.supplierStatuses || []);
  const staleCount = supplierStatuses.filter((s: any) => s.status === 'warning' || s.isStale).length;
  const errorCount = supplierStatuses.filter((s: any) => s.status === 'error').length;

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const response = await fetch('/api/verify');
        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            localStorage.setItem('cso_auth_token', data.token);
          }
          const role = (data.role || 'user').toLowerCase();
          const accessStr = (data.module_access || '').toLowerCase();
          const isAdmin = role === 'admin' || role === 'адмін' || role === 'адміністратор';
          
          const mapping: Record<string, string[]> = {
            'proposals': ['proposals', 'кп', 'комперційні'],
            'warehouse': ['warehouse', 'склад'],
            'projects': ['projects', 'проєкти', 'проекти'],
            'gt': ['gt', 'зелений тариф', 'зт'],
            'land-lease': ['land-lease', 'оренда', 'оренда землі', 'земля']
          };

          const allowed = isAdmin 
            ? ['proposals', 'warehouse', 'projects', 'gt', 'land-lease']
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
            <a
              href="https://cso-solar.vercel.app/dashboard/"
              className="flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer"
              title="Перейти на Головну (Панель керування)"
            >
              <img
                src="https://i.ibb.co/32JD4dc/logo.png"
                alt="CSO Solar"
                className="h-9"
              />
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-gray-900 dark:text-white leading-tight">CSO Solar</div>
                <div className="text-xs text-gray-500 dark:text-neutral-400">Комерційні пропозиції</div>
              </div>
            </a>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-1.5">
                {hasAccess('proposals') && (
                  <a href="/proposals/" className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 dark:bg-primary/20 rounded-md">
                    📄 КП
                  </a>
                )}

                {hasAccess('warehouse') && (
                  <a href="/warehouse/" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition">
                    📦 Склад
                  </a>
                )}
                
                {hasAccess('projects') && (
                  <a href="/projects/" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition">
                    📊 Проєкти
                  </a>
                )}
                
                {hasAccess('gt') && (
                  <a href="/green-tariff/" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition">
                    🌱 Зелений тариф
                  </a>
                )}

                {hasAccess('land-lease') && (
                  <a href="/land-lease/" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition">
                    🌾 Оренда
                  </a>
                )}
              </nav>

              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-neutral-700 pl-4">
                <button
                  onClick={() => setShowSupplierStatus(true)}
                  title="Стан та свіжість прайс-листів постачальників"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all duration-150 ${
                    errorCount > 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50 hover:bg-rose-100'
                      : staleCount > 0
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      errorCount > 0 ? 'bg-rose-400' : staleCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      errorCount > 0 ? 'bg-rose-500' : staleCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></span>
                  </span>
                  <span className="hidden sm:inline">
                    {errorCount > 0 ? 'Прайси: Помилка' : staleCount > 0 ? `Прайси: ${staleCount} зафіксовано` : 'Прайси онлайн'}
                  </span>
                </button>

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
      <SupplierStatusModal isOpen={showSupplierStatus} onClose={() => setShowSupplierStatus(false)} />
    </div>
  );
}
