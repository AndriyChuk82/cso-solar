// ===== CSO Solar — Green Tariff v2 App Entry Point =====

import React, { useEffect } from 'react';
import { useGTStore } from './store/useGTStore';
import { Layout } from './components/Layout';
import { ProjectList } from './components/ProjectList';
import { ProjectWizard } from './components/ProjectWizard';
import { 
  X, CheckCircle, AlertCircle, Info, AlertTriangle, RefreshCw 
} from 'lucide-react';

export default function App() {
  const { toasts, removeToast, unsavedChanges, retrySync } = useGTStore();

  // Browser reload/close dirty form guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
        // Modern browsers require setting returnValue to trigger the warning
        e.returnValue = 'У вас є незбережені зміни в проекті. Ви впевнені, що хочете закрити сторінку?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  // Toast theme mapping
  const toastStyles = {
    success: {
      bg: 'bg-white dark:bg-slate-900 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-white dark:bg-slate-900 border-red-500/30 text-red-500 dark:text-red-400 shadow-red-500/5',
      icon: AlertCircle,
    },
    warning: {
      bg: 'bg-white dark:bg-slate-900 border-amber-500/30 text-amber-500 dark:text-amber-400 shadow-amber-500/5',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-white dark:bg-slate-900 border-blue-500/30 text-blue-500 dark:text-blue-400 shadow-blue-500/5',
      icon: Info,
    },
  };

  return (
    <Layout>
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Project Navigator */}
        <ProjectList />
        
        {/* Master Project Editor Wizard Panel */}
        <div className="flex-1 overflow-hidden relative">
          <ProjectWizard />
        </div>
      </div>

      {/* Floating Stacker Toast Notification System */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const ToastIcon = style.icon;
          
          return (
            <div
              key={toast.id}
              className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex gap-3 items-start animate-slide-in hover:scale-[1.01] transition-transform duration-150 ${style.bg}`}
              role="alert"
            >
              <ToastIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              
              <div className="flex-1 space-y-1.5">
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200 leading-normal">
                  {toast.text}
                </p>
                
                {/* Red Toast custom background sync retry trigger */}
                {toast.type === 'error' && (
                  <button
                    type="button"
                    onClick={async () => {
                      removeToast(toast.id);
                      const current = useGTStore.getState().currentProject;
                      if (current) {
                        await retrySync(current);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm shadow-red-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Повторити спробу 🔄
                  </button>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1"
                aria-label="Close Notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
