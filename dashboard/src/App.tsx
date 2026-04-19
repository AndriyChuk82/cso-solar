import { useEffect, useState } from 'react';
import { 
  FileText, 
  Package, 
  Layout, 
  Zap, 
  LogOut, 
  User,
  ArrowRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ElementType;
  permKey: string;
  color: string;
}

const MODULES: ModuleInfo[] = [
  {
    id: 'proposals',
    name: 'Комерційні пропозиції',
    description: 'Створення та керування пропозиціями для клієнтів',
    path: '/proposals',
    icon: FileText,
    permKey: 'proposals',
    color: 'text-amber-500'
  },
  {
    id: 'warehouse',
    name: 'Склад',
    description: 'Облік обладнання та товарних запасів',
    path: '/warehouse',
    icon: Package,
    permKey: 'warehouse',
    color: 'text-blue-500'
  },
  {
    id: 'projects',
    name: 'Проєкти',
    description: 'Керування активними об’єктами та монтажами',
    path: '/projects',
    icon: Layout,
    permKey: 'projects',
    color: 'text-indigo-500'
  },
  {
    id: 'gt',
    name: 'Зелений тариф',
    description: 'Розрахунок та оформлення зеленого тарифу',
    path: '/green-tariff',
    icon: Zap,
    permKey: 'gt',
    color: 'text-green-500'
  }
];

export default function App() {
  const [user, setUser] = useState<{ name: string; role: string; access: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parseUser = () => {
      try {
        const cookies = document.cookie.split(';').reduce((acc: any, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});

        const token = cookies['cso_auth_token'];
        if (!token) {
          window.location.href = '/login.html';
          return;
        }

        // Parse JWT payload without verification (already verified by middleware)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const role = (payload.role || 'user').toLowerCase();
        const accessStr = (payload.module_access || '').toLowerCase();
        
        const moduleMapping: Record<string, string[]> = {
          'proposals': ['proposals', 'кп', 'комперційні'],
          'warehouse': ['warehouse', 'склад'],
          'projects': ['projects', 'проєкти', 'проекти'],
          'gt': ['gt', 'зелений тариф', 'зт']
        };

        const isAdmin = role === 'admin' || role === 'адмін' || role === 'адміністратор';
        const allowedModules = isAdmin 
          ? MODULES.map(m => m.id)
          : MODULES.filter(m => {
              const keywords = moduleMapping[m.permKey] || [m.permKey];
              return keywords.some(k => accessStr.includes(k));
            }).map(m => m.id);

        // Auto-redirect if only one module is allowed
        if (allowedModules.length === 1) {
          const mod = MODULES.find(m => m.id === allowedModules[0]);
          if (mod) {
            window.location.href = mod.path;
            return;
          }
        }

        setUser({
          name: payload.name || payload.email || 'Користувач',
          role: role,
          access: allowedModules
        });
      } catch (err) {
        console.error('Auth error:', err);
        window.location.href = '/login.html';
      } finally {
        setLoading(false);
      }
    };

    parseUser();
  }, []);

  const handleLogout = () => {
    document.cookie = 'cso_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    window.location.href = '/login.html';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const allowedModules = MODULES.filter(m => user?.access.includes(m.id));

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 fixed top-0 left-0 right-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="CSO Solar" className="w-8 h-8" />
            <span className="font-bold text-slate-800 tracking-tight">CSO SOLAR</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <p className="leading-tight text-slate-900">{user?.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{user?.role}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Вийти"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 mt-16">
        <div className="max-w-5xl w-full">
          <div className="mb-12 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Вітаємо у системі!</h1>
            <p className="text-slate-500 max-w-lg">Оберіть необхідний модуль для початку роботи. Доступні модулі залежать від ваших прав.</p>
          </div>

          <div className={cn(
            "grid grid-cols-1 gap-4 w-full",
            allowedModules.length === 2 ? "sm:grid-cols-2 max-w-2xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-4"
          )}>
            {allowedModules.map((module) => (
              <a
                key={module.id}
                href={module.path}
                className="minimal-card group"
              >
                <div className={cn("p-4 rounded-2xl bg-slate-50 mb-6 transition-colors group-hover:bg-white", module.color)}>
                  <module.icon className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{module.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  {module.description}
                </p>
                <div className="flex items-center gap-2 text-amber-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Увійти <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-slate-400 text-xs border-t border-slate-200 bg-white">
        © {new Date().getFullYear()} CSO Solar. Всі права захищено.
      </footer>
    </div>
  );
}
