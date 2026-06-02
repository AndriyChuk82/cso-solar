import { Save, FileText, Send, Trash2, Zap } from 'lucide-react';

interface ProposalActionsProps {
  hasItems: boolean;
  onSave: () => void;
  onShowDocModal: () => void;
  onShowTelegram: () => void;
  onShowViber: () => void;
  onShowSolarWizard: () => void;
  onClear: () => void;
}

export function ProposalActions({
  hasItems,
  onSave,
  onShowDocModal,
  onShowTelegram,
  onShowViber,
  onShowSolarWizard,
  onClear,
}: ProposalActionsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-[#c5be9e] dark:border-slate-700 p-2.5 px-4 sm:px-6 rounded-2xl shadow-[0_12px_30px_rgba(138,124,86,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 max-w-[95vw] w-max no-print transition-all duration-300 hover:shadow-[0_14px_35px_rgba(138,124,86,0.22)] hover:dark:shadow-[0_14px_45px_rgba(245,158,11,0.06)] hover:border-[#a89a74] dark:hover:border-slate-600 animate-slide-in">
      <button
        onClick={onShowSolarWizard}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl hover:shadow-[0_4px_12px_rgba(245,158,11,0.25)] dark:hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)] active:scale-95 transition-all font-extrabold text-xs shrink-0"
        title="Майстер підбору сонячної станції"
      >
        <Zap className="w-3.5 h-3.5 animate-pulse text-amber-100" />
        Майстер СЕС
      </button>

      {hasItems && (
        <>
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f4f1e1] dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-[#eae6d1] dark:hover:bg-slate-700/80 active:scale-95 transition-all font-bold text-xs shrink-0 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Зберегти
          </button>
          
          <button
            onClick={onShowDocModal}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-xl hover:shadow-[0_4px_12px_rgba(16,185,129,0.25)] active:scale-95 transition-all font-extrabold text-xs shrink-0 shadow-md"
          >
            <FileText className="w-3.5 h-3.5" />
            Сформувати документ
          </button>
          
          <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>
          
          <button
            onClick={onShowTelegram}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#0088cc]/20 dark:border-[#0088cc]/30 text-[#0088cc] dark:text-[#38bdf8] hover:bg-[#0088cc] hover:text-white dark:hover:text-white rounded-xl active:scale-95 transition-all font-bold text-xs bg-transparent shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Telegram
          </button>
          
          <button
            onClick={onShowViber}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#7360f2]/20 dark:border-[#7360f2]/30 text-[#7360f2] dark:text-[#a78bfa] hover:bg-[#7360f2] hover:text-white dark:hover:text-white rounded-xl active:scale-95 transition-all font-bold text-xs bg-transparent shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Viber
          </button>
          
          <button
            onClick={onClear}
            className="px-3 py-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100/30 dark:hover:border-red-900/20 rounded-xl active:scale-95 transition-all font-bold text-xs shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 inline sm:mr-1 shrink-0" />
            <span className="hidden sm:inline">Очистити</span>
          </button>
        </>
      )}
    </div>
  );
}
