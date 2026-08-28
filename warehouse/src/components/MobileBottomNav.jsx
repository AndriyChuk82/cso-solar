import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardList, Users, Truck, SunMedium, MoreHorizontal, 
  X, Package, BarChart3, TrendingUp, History, Tag, 
  Building2, Shield, ArrowDownRight, ArrowUpRight, 
  UserCheck, ArrowLeftRight, FileText, Plus, Sun
} from 'lucide-react';
import CONFIG from '../config';
import { canAccess, canCreateWarehouseOperations } from '../utils/permissions';

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Close menus when route changes
  useEffect(() => {
    setIsMoreOpen(false);
    setIsFabOpen(false);
  }, [location.pathname]);

  const showFab = canCreateWarehouseOperations(user);

  const quickActions = [
    {
      label: 'Новий прихід',
      desc: 'Надходження товарів на склад',
      icon: <ArrowDownRight size={18} className="text-emerald-500" />,
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      permission: 'operations',
      onClick: () => navigate('/income')
    },
    {
      label: 'Видача клієнту',
      desc: 'Оформлення відвантаження покупцю',
      icon: <UserCheck size={18} className="text-blue-500" />,
      bg: 'bg-blue-500/10 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-500/20',
      permission: 'buyers',
      onClick: () => navigate('/buyers/issue')
    },
    {
      label: 'Нове відправлення',
      desc: 'Створити відправку Новою поштою',
      icon: <Truck size={18} className="text-amber-500" />,
      bg: 'bg-amber-500/10 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-500/20',
      permission: 'shipments',
      onClick: () => navigate('/shipments/new')
    },
    {
      label: 'Списання зі складу',
      desc: 'Прямий розхід / дефект / брак',
      icon: <ArrowUpRight size={18} className="text-rose-500" />,
      bg: 'bg-rose-500/10 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-500/20',
      permission: 'operations',
      onClick: () => navigate('/expense')
    },
    {
      label: 'Переміщення',
      desc: 'Між внутрішніми складами',
      icon: <ArrowLeftRight size={18} className="text-purple-500" />,
      bg: 'bg-purple-500/10 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-500/20',
      permission: 'operations',
      onClick: () => navigate('/transfer')
    }
  ].filter(act => canAccess(user, act.permission));

  const moreSections = [
    {
      title: 'Склад та облік',
      items: [
        { path: '/construction-objects', label: 'Об\'єкти будівництва', icon: <SunMedium size={18} className="text-amber-500" />, permission: 'objects' },
        { path: '/price-list', label: 'Прайс-лист', icon: <Tag size={18} className="text-emerald-500" />, permission: 'price_list' },
        { path: '/catalog', label: 'Каталог товарів', icon: <Package size={18} className="text-amber-500" />, permission: 'operations' },
        { path: '/daily-balance', label: 'Підсумок дня', icon: <BarChart3 size={18} className="text-blue-500" />, permission: 'operations' },
        { path: '/reports', label: 'Звіти по залишках', icon: <TrendingUp size={18} className="text-emerald-500" />, permission: 'reports' },
        { path: '/buyers/report', label: 'Звіти по клієнтах', icon: <Users size={18} className="text-indigo-500" />, permission: 'reports' },
        { path: '/audit-log', label: 'Журнал дій (Аудит)', icon: <History size={18} className="text-gray-500" />, permission: 'reports' },
      ].filter(item => !item.permission || canAccess(user, item.permission))
    },
    ...(user?.isAdmin ? [{
      title: 'Адміністрування',
      items: [
        { path: '/categories', label: 'Категорії товарів', icon: <Tag size={18} className="text-purple-500" /> },
        { path: '/warehouses', label: 'Склади', icon: <Building2 size={18} className="text-cyan-500" /> },
        { path: '/users', label: 'Користувачі', icon: <Users size={18} className="text-orange-500" /> },
        { path: '/backups', label: 'Резервні копії', icon: <Shield size={18} className="text-teal-500" /> },
      ]
    }] : []),
    {
      title: 'Інші модулі системи',
      items: [
        { path: '/proposals/', label: '📄 Комерційні пропозиції (КП)', external: true, show: user?.isAdmin || user?.module_access?.includes('proposals') },
        { path: '/projects/', label: '📊 Проєкти', external: true, show: user?.isAdmin || user?.module_access?.includes('projects') },
        { path: '/green-tariff/', label: '🌱 Зелений тариф', external: true, show: user?.isAdmin || user?.module_access?.includes('gt') },
        { path: '/land-lease/', label: '🌾 Оренда землі', external: true, show: user?.isAdmin || user?.module_access?.includes('land-lease') },
      ].filter(item => item.show !== false)
    }
  ].filter(sec => sec.items.length > 0);

  // Визначення головних табів нижньої панелі
  const bottomTabs = [];

  if (canAccess(user, 'objects')) {
    bottomTabs.push({
      path: '/construction-objects',
      label: 'Об\'єкти',
      icon: <SunMedium size={20} />
    });
  }

  if (canAccess(user, 'price_list')) {
    bottomTabs.push({
      path: '/price-list',
      label: 'Прайс',
      icon: <Tag size={20} />
    });
  }

  if (canAccess(user, 'journal')) {
    bottomTabs.push({
      path: '/',
      end: true,
      label: 'Журнал',
      icon: <ClipboardList size={20} />
    });
  }

  if (canAccess(user, 'buyers')) {
    bottomTabs.push({
      path: '/buyers',
      label: 'Клієнти',
      icon: <Users size={20} />
    });
  }

  if (canAccess(user, 'shipments')) {
    bottomTabs.push({
      path: '/shipments',
      label: 'Відправки',
      icon: <Truck size={20} />
    });
  }

  const isMoreActive = ['/catalog', '/daily-balance', '/reports', '/buyers/report', '/audit-log', '/categories', '/warehouses', '/users', '/backups'].some(p => location.pathname === p);

  return (
    <div className="md:hidden">
      {/* Backdrop for More Sheet or FAB Drawer */}
      {(isMoreOpen || isFabOpen) && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => {
            setIsMoreOpen(false);
            setIsFabOpen(false);
          }}
        />
      )}

      {/* FAB Speed Dial Drawer */}
      {showFab && isFabOpen && (
        <div className="fixed bottom-20 right-4 left-4 z-50 bg-white dark:bg-neutral-800 rounded-3xl p-4 border border-gray-200 dark:border-neutral-700 shadow-2xl space-y-2 max-w-sm ml-auto animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-700/60 px-2">
            <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              ⚡ Швидкі дії
            </span>
            <button
              onClick={() => setIsFabOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            {quickActions.map((act, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  act.onClick();
                  setIsFabOpen(false);
                }}
                className={`w-full p-2.5 rounded-2xl border flex items-center gap-3 text-left transition-all active:scale-95 ${act.bg} hover:shadow-sm`}
              >
                <div className="p-2 rounded-xl bg-white dark:bg-neutral-800 shadow-xs shrink-0">
                  {act.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm leading-tight text-gray-900 dark:text-white">
                    {act.label}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-neutral-400 truncate mt-0.5">
                    {act.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* "More" Bottom Sheet Modal */}
      {isMoreOpen && (
        <div className="fixed bottom-16 inset-x-0 z-50 bg-white dark:bg-neutral-800 rounded-t-3xl border-t border-gray-200 dark:border-neutral-700 shadow-2xl p-4 max-h-[80vh] overflow-y-auto space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-gray-900 dark:text-white">Всі розділи складу</span>
            </div>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {moreSections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-400 px-1">
                  {section.title}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {section.items.map((item, i) => {
                    if (item.external) {
                      return (
                        <a
                          key={i}
                          href={item.path}
                          className="col-span-2 p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-900/50 hover:bg-gray-100 dark:hover:bg-neutral-700/60 border border-gray-200/60 dark:border-neutral-700 text-xs font-semibold text-gray-800 dark:text-neutral-200 flex items-center justify-between"
                        >
                          <span>{item.label}</span>
                          <span className="text-gray-400 text-[10px]">↗</span>
                        </a>
                      );
                    }

                    const isActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={i}
                        to={item.path}
                        onClick={() => setIsMoreOpen(false)}
                        className={`p-3 rounded-2xl border flex flex-col gap-1.5 transition-all text-xs font-bold active:scale-95 ${
                          isActive
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-gray-50 dark:bg-neutral-900/40 border-gray-100 dark:border-neutral-800 text-gray-800 dark:text-neutral-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white dark:bg-neutral-800 w-fit shadow-xs">
                          {item.icon}
                        </div>
                        <span className="leading-tight line-clamp-1">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button (placed just above the bottom bar) */}
      {showFab && (
        <button
          type="button"
          onClick={() => {
            setIsMoreOpen(false);
            setIsFabOpen(!isFabOpen);
          }}
          className={`fixed bottom-20 right-4 z-40 p-3.5 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center active:scale-95 ${
            isFabOpen
              ? 'bg-gray-800 text-white rotate-45 dark:bg-neutral-700'
              : 'bg-primary text-white hover:bg-primary/95 shadow-primary/40 ring-4 ring-primary/20'
          }`}
          aria-label="Швидкі дії"
        >
          <Plus size={22} className="transition-transform" />
        </button>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-gray-200 dark:border-neutral-800 h-16 px-2 flex items-center justify-around shadow-lg">
        {bottomTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 font-medium'
              }`
            }
          >
            {tab.icon}
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </NavLink>
        ))}

        {/* Ще (More) */}
        <button
          type="button"
          onClick={() => {
            setIsFabOpen(false);
            setIsMoreOpen(!isMoreOpen);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isMoreOpen || isMoreActive
              ? 'text-primary font-bold'
              : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 font-medium'
          }`}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] mt-0.5 tracking-tight">Ще</span>
        </button>
      </nav>
    </div>
  );
}

