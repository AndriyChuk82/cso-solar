import React from 'react';
import { Plus, X, FileText } from 'lucide-react';
import { useProposalStore } from '../../store';

export function TabBar() {
  const tabs = useProposalStore((state) => state.tabs);
  const activeTabId = useProposalStore((state) => state.activeTabId);
  const setActiveTab = useProposalStore((state) => state.setActiveTab);
  const closeTab = useProposalStore((state) => state.closeTab);
  const createTab = useProposalStore((state) => state.createTab);

  return (
    <div className="flex items-center justify-between border-b border-[#e8e4d1]/60 dark:border-slate-800/40 pb-2 mb-4 gap-4 no-print select-none">
      {/* Tabs list with horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto flex-1 scrollbar-none pr-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => !isActive && setActiveTab(tab.id)}
              className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer border ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 text-amber-700 dark:text-amber-400 border-amber-500/30 shadow-sm'
                  : 'bg-white/40 border-slate-200/60 text-slate-500 dark:bg-slate-900/30 dark:border-slate-800/40 dark:text-slate-400 hover:bg-[#faf9f3] dark:hover:bg-slate-800/30 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              {/* Proposal icon */}
              <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'}`} />
              
              {/* Title */}
              <span className="truncate max-w-[120px]">{tab.title}</span>
              
              {/* Unsaved changes dot indicator */}
              {tab.isUnsaved && (
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shrink-0" title="Є незбережені зміни" />
              )}
              
              {/* Close button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className={`p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Закрити вкладку"
              >
                <X className="w-3 h-3" />
              </button>
              
              {/* Active Tab Glow Underline */}
              {isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-[0_1px_5px_rgba(245,158,11,0.5)]" />
              )}
            </div>
          );
        })}

        {/* Add Tab Button */}
        <button
          type="button"
          onClick={() => createTab()}
          className="flex items-center justify-center p-2 rounded-xl bg-white/40 border border-slate-200/60 text-slate-500 dark:bg-slate-900/30 dark:border-slate-800/40 dark:text-slate-400 hover:bg-[#faf9f3] dark:hover:bg-slate-800/30 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/20 active:scale-95 transition-all duration-300 shrink-0"
          title="Створити нову чернетку КП"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs count badge / status */}
      <div className="hidden md:flex items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider uppercase select-none shrink-0 bg-[#fbfaf5]/40 dark:bg-slate-900/20 border border-[#e8e4d1]/30 dark:border-slate-800/20 px-2.5 py-1 rounded-lg">
        Вкладок: {tabs.length}
      </div>
    </div>
  );
}
