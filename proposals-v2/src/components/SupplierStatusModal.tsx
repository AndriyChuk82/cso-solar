import { X, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Database, ShieldCheck, Clock } from 'lucide-react';
import { useProposalStore } from '../store';
import { SupplierStatus } from '../types';

interface SupplierStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupplierStatusModal({ isOpen, onClose }: SupplierStatusModalProps) {
  const supplierStatuses = useProposalStore((state: any) => state.supplierStatuses as SupplierStatus[] || []);
  const isRefreshing = useProposalStore((state: any) => state.isRefreshingSuppliers || false);
  const refreshSupplierPrices = useProposalStore((state: any) => state.refreshSupplierPrices);

  if (!isOpen) return null;

  const staleCount = supplierStatuses.filter(s => s.status === 'warning' || s.isStale).length;
  const errorCount = supplierStatuses.filter(s => s.status === 'error').length;
  const isAllOnline = staleCount === 0 && errorCount === 0;

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Невідомо';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isAllOnline 
                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Свіжість та стан прайс-листів
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Моніторинг зв'язку з постачальниками та синхронізація цін
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Summary Banner */}
        <div className="p-6 pb-2">
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            isAllOnline
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300'
              : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300'
          }`}>
            {isAllOnline ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              <div className="font-bold text-sm mb-0.5">
                {isAllOnline ? 'Всі прайси оновлено онлайн' : 'Увага: один або кілька прайсів в автономному режимі'}
              </div>
              <div>
                {isAllOnline
                  ? 'Каталог отримує найсвіжіші ціни та залишки напряму з серверів постачальників.'
                  : 'Якщо зв\'язок з постачальником тимчасово обмежено або посилання закрите, система використовує зафіксовану резервну базу. Ви завжди знаєте, які ціни є онлайн, а які зафіксовані.'}
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers List */}
        <div className="p-6 pt-3 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Постачальники обладнання
          </div>

          <div className="space-y-2.5">
            {supplierStatuses.map((supplier) => {
              const isOnline = supplier.status === 'online';
              const isWarning = supplier.status === 'warning' || supplier.isStale;
              const isError = supplier.status === 'error';

              return (
                <div
                  key={supplier.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isWarning
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/40'
                      : isError
                      ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-800/40'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200">
                        {supplier.code}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                          {supplier.name}
                          {isOnline && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                              <CheckCircle2 className="w-3 h-3" /> Онлайн
                            </span>
                          )}
                          {isWarning && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/60">
                              <AlertTriangle className="w-3 h-3" /> Зафіксована база
                            </span>
                          )}
                          {isError && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/50">
                              <AlertCircle className="w-3 h-3" /> Помилка зв'язку
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Джерело: {supplier.source}</span>
                          {supplier.count > 0 && (
                            <>
                              <span>•</span>
                              <span>{supplier.count} товарів</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(supplier.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>

                  {supplier.message && (
                    <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{supplier.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Оновлення перевіряється автоматично кожні 10 хвилин
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshSupplierPrices}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Оновлюємо прайси...' : 'Оновити всі прайси'}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
