import { Save, FileText, Send, Trash2, Zap, Plus } from 'lucide-react';

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
    <div className="flex flex-wrap gap-1.5 no-print">
      <button
        onClick={onShowSolarWizard}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition font-bold text-xs"
        title="Майстер підбору сонячної станції"
      >
        <Zap className="w-4 h-4" />
        Майстер СЕС
      </button>

      {hasItems && (
        <>
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary dark:bg-blue-600 text-white rounded hover:bg-opacity-90 transition font-semibold text-xs shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Зберегти
          </button>
          <button
            onClick={onShowDocModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition font-bold text-sm shadow-md"
          >
            <FileText className="w-4 h-4" />
            📄 Сформувати документ
          </button>
          <div className="h-8 w-[1px] bg-gray-300 dark:bg-slate-700 mx-1"></div>
          <button
            onClick={onShowTelegram}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded hover:bg-opacity-90 transition font-semibold text-xs"
            style={{ background: '#0088cc' }}
          >
            <Send className="w-3.5 h-3.5" />
            Telegram
          </button>
          <button
            onClick={onShowViber}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded hover:bg-opacity-90 transition font-semibold text-xs"
            style={{ background: '#7360f2' }}
          >
            <Send className="w-3.5 h-3.5" />
            Viber
          </button>
          <button
            onClick={onClear}
            className="ml-auto px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition font-semibold text-xs"
          >
            Очистити
          </button>
        </>
      )}
    </div>
  );
}
