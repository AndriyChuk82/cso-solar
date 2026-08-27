import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, X, ArrowDownRight, ArrowUpRight, UserCheck, Truck, ArrowLeftRight, SunMedium } from 'lucide-react';

export default function MobileQuickActionFAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const actions = [
    {
      label: 'Новий прихід',
      desc: 'Надходження товарів на склад',
      icon: <ArrowDownRight size={18} className="text-emerald-500" />,
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      onClick: () => navigate('/income')
    },
    {
      label: 'Видача клієнту',
      desc: 'Оформлення відвантаження покупцю',
      icon: <UserCheck size={18} className="text-blue-500" />,
      bg: 'bg-blue-500/10 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-500/20',
      onClick: () => navigate('/buyers/issue')
    },
    {
      label: 'Нове відправлення',
      desc: 'Створити відправку Новою поштою',
      icon: <Truck size={18} className="text-amber-500" />,
      bg: 'bg-amber-500/10 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-500/20',
      onClick: () => navigate('/shipments/new')
    },
    {
      label: 'Об\'єкт будівництва',
      desc: 'Сонячні станції та специфікації',
      icon: <SunMedium size={18} className="text-amber-500" />,
      bg: 'bg-amber-500/10 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-500/20',
      onClick: () => navigate('/construction-objects')
    },
    {
      label: 'Списання зі складу',
      desc: 'Прямий розхід / дефект / брак',
      icon: <ArrowUpRight size={18} className="text-rose-500" />,
      bg: 'bg-rose-500/10 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-500/20',
      onClick: () => navigate('/expense')
    },
    {
      label: 'Переміщення',
      desc: 'Між внутрішніми складами',
      icon: <ArrowLeftRight size={18} className="text-purple-500" />,
      bg: 'bg-purple-500/10 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-500/20',
      onClick: () => navigate('/transfer')
    }
  ];

  return (
    <div className="md:hidden">
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Floating Action Menu Drawer / Speed dial */}
      {open && (
        <div className="fixed bottom-20 right-4 left-4 z-50 bg-white dark:bg-neutral-800 rounded-3xl p-4 border border-gray-200 dark:border-neutral-700 shadow-2xl space-y-2 max-w-sm ml-auto animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-700/60 px-2">
            <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              ⚡ Швидкі дії
            </span>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            {actions.map((act, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  act.onClick();
                  setOpen(false);
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

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`fixed bottom-5 right-4 z-50 p-3.5 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center active:scale-95 ${
          open
            ? 'bg-gray-800 text-white rotate-45 dark:bg-neutral-700'
            : 'bg-primary text-white hover:bg-primary/95 shadow-primary/30 ring-4 ring-primary/20'
        }`}
        aria-label="Швидкі дії"
      >
        <Plus size={24} className="transition-transform" />
      </button>
    </div>
  );
}
