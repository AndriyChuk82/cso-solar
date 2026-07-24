// ===== CSO Solar — Green Tariff v2 Project List (Sidebar) =====

import React, { useState, useMemo, useEffect } from 'react';
import { useGTStore } from '../store/useGTStore';
import type { SemanticProject } from '../types';
import { Search, Plus, RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';

const STATUS_TABS = [
  { label: 'Всі', value: 'all' },
  { label: 'В процесі', value: 'В процесі' },
  { label: 'Готові', value: 'Готовий' },
  { label: 'Відкладені', value: 'Відкладено' },
  { label: 'Неоплачені', value: 'unpaid' },
];

const COLOR_TAG_CONFIG: Record<string, { border: string; bg: string; badge: string; label: string }> = {
  purple: {
    border: 'border-l-[5px] border-l-purple-500',
    bg: 'bg-purple-50/50 dark:bg-purple-950/30',
    badge: 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-300/60',
    label: '🟣 Сторонній',
  },
  blue: {
    border: 'border-l-[5px] border-l-blue-500',
    bg: 'bg-blue-50/50 dark:bg-blue-950/30',
    badge: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300/60',
    label: '🔵 Основний',
  },
  emerald: {
    border: 'border-l-[5px] border-l-emerald-500',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/30',
    badge: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300/60',
    label: '🟢 Власний',
  },
  amber: {
    border: 'border-l-[5px] border-l-amber-500',
    bg: 'bg-amber-50/50 dark:bg-amber-950/30',
    badge: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300/60',
    label: '🟠 Уточнення',
  },
  rose: {
    border: 'border-l-[5px] border-l-rose-500',
    bg: 'bg-rose-50/50 dark:bg-rose-950/30',
    badge: 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300/60',
    label: '🔴 Пріоритет',
  },
};

export function ProjectList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'load' | 'new'; projectId?: string } | null>(null);

  const {
    projects,
    currentProject,
    activeStatusFilter,
    setStatusFilter,
    loadProject,
    resetForm,
    fetchProjects,
    isLoading,
    unsavedChanges,
  } = useGTStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  // Calculate counts for each status filter
  const filterCounts = useMemo(() => {
    const counts = {
      'all': 0,
      'В процесі': 0,
      'Готовий': 0,
      'Відкладено': 0,
      'unpaid': 0,
    };
    
    projects.forEach((p) => {
      const name = p.fullName || '';
      const num = p.projectNumber || '';
      if (!p.id && !name && !num) return;

      counts.all++;
      
      const stat = p.status || 'В процесі';
      if (stat === 'В процесі') counts['В процесі']++;
      else if (stat === 'Готовий') counts['Готовий']++;
      else if (stat === 'Відкладено') counts['Відкладено']++;

      const pStr = (p.paymentStatus || '').toLowerCase().trim();
      if (pStr === 'не оплачено' || pStr === 'неоплачено') {
        counts.unpaid++;
      }
    });

    return counts;
  }, [projects]);

  // Filter projects by active tab, color tag and search query
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const name = p.fullName || '';
      const num = p.projectNumber || '';
      const stat = p.status || 'В процесі';
      const paymentStatus = p.paymentStatus || '';
      const colorTag = p.colorTag || 'none';

      if (!p.id && !name && !num) return false;

      // Color filter
      if (colorFilter !== 'all' && colorTag !== colorFilter) {
        return false;
      }

      // Status filters
      if (activeStatusFilter === 'unpaid') {
        const pStr = paymentStatus.toLowerCase().trim();
        if (pStr !== 'не оплачено' && pStr !== 'неоплачено') {
          return false;
        }
      } else if (activeStatusFilter !== 'all' && stat !== activeStatusFilter) {
        return false;
      }

      // Search filters
      const searchStr = `${name} ${num}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
  }, [projects, activeStatusFilter, colorFilter, searchQuery]);

  // Handle clicking a project in the list
  const handleProjectClick = (projectId: string) => {
    if (currentProject && currentProject.id === projectId) return;

    if (unsavedChanges) {
      setPendingAction({ type: 'load', projectId });
      setShowConfirm(true);
    } else {
      loadProject(projectId);
    }
  };

  // Handle clicking the "+ Новий" button
  const handleNewProjectClick = () => {
    if (unsavedChanges) {
      setPendingAction({ type: 'new' });
      setShowConfirm(true);
    } else {
      resetForm();
    }
  };

  // User confirmed to discard changes
  const handleConfirmDiscard = () => {
    setShowConfirm(false);
    if (pendingAction) {
      if (pendingAction.type === 'load' && pendingAction.projectId) {
        loadProject(pendingAction.projectId);
      } else if (pendingAction.type === 'new') {
        resetForm();
      }
    }
    setPendingAction(null);
  };

  return (
    <>
      <aside className="w-80 bg-[#f4f1e1] dark:bg-[#1e293b]/70 backdrop-blur-md border-r border-gray-200/50 dark:border-slate-800/50 flex flex-col h-[calc(100vh-4rem)] flex-shrink-0 transition-colors duration-300">
        
        {/* Header section with Create New Project & Search */}
        <div className="p-4 border-b border-gray-200/60 dark:border-slate-800/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Проєкти Зеленого Тарифу</h2>
            <button
              onClick={handleNewProjectClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#f59e0b] hover:bg-[#d97706] rounded-lg shadow-sm shadow-[#f59e0b]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Новий
            </button>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук проєкту за ім'ям або №..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300/80 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40 text-gray-900 dark:text-slate-100 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm transition-all"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Color Tag Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pt-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setColorFilter('all')}
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all cursor-pointer ${
                colorFilter === 'all'
                  ? 'bg-gray-800 text-white border-gray-800 dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-white/60 dark:bg-slate-800/40 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100'
              }`}
            >
              Всі
            </button>

            <button
              type="button"
              onClick={() => setColorFilter(colorFilter === 'purple' ? 'all' : 'purple')}
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                colorFilter === 'purple'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50 hover:bg-purple-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Сторонні
            </button>

            <button
              type="button"
              onClick={() => setColorFilter(colorFilter === 'blue' ? 'all' : 'blue')}
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                colorFilter === 'blue'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50 hover:bg-blue-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Основні
            </button>
          </div>
        </div>

        {/* Tab filters */}
        <div className="grid grid-cols-2 gap-1.5 p-3 border-b border-gray-200/60 dark:border-slate-800/60 bg-gray-50/50 dark:bg-slate-900/30">
          {STATUS_TABS.map((tab) => {
            const isUnpaid = tab.value === 'unpaid';
            const isActive = activeStatusFilter === tab.value;
            const count = filterCounts[tab.value as keyof typeof filterCounts] || 0;
            
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer select-none ${
                  isActive
                    ? isUnpaid
                      ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/10'
                      : 'bg-[#f59e0b] text-white border-[#f59e0b] shadow-sm shadow-[#f59e0b]/10'
                    : isUnpaid && count > 0
                      ? 'bg-red-50/40 hover:bg-red-50/85 dark:bg-red-950/10 dark:hover:bg-red-950/20 border-red-200/20 dark:border-red-900/30 text-red-600 dark:text-red-400'
                      : 'bg-white/40 dark:bg-slate-800/40 border-gray-200/40 dark:border-slate-800/40 text-gray-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-slate-100'
                } ${tab.value === 'all' ? 'col-span-2' : ''}`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isUnpaid && count > 0
                      ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                      : tab.value === 'all'
                        ? 'bg-gray-200/80 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                        : tab.value === 'В процесі'
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                          : tab.value === 'Готовий'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Project cards scroll area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2 text-gray-400 dark:text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin text-[#f59e0b]" />
              <span className="text-xs font-semibold">Отримання даних...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 dark:text-slate-500 italic">
              Проєктів не знайдено
            </div>
          ) : (
            filteredProjects.map((project, idx) => {
              const name = project.fullName || 'Без імені';
              const num = project.projectNumber || '№ проекту';
              const stat = project.status || 'В процесі';
              const isSelected = currentProject?.id === project.id;
              
              // Unsaved indicators for background offline saving states
              const isTemp = project.id?.startsWith('temp_');
              const tagInfo = COLOR_TAG_CONFIG[project.colorTag || ''];

              // Color badges for statuses
              const statusColors: Record<string, string> = {
                'В процесі': 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/50',
                'Готовий': 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/50',
                'Відкладено': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/50',
              };

              return (
                <button
                  key={project.id || idx}
                  onClick={() => project.id && handleProjectClick(project.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all-base relative flex flex-col gap-1.5 group ${
                    tagInfo ? `${tagInfo.border} ${tagInfo.bg}` : ''
                  } ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 border-[#f59e0b] shadow-md shadow-[#f59e0b]/5'
                      : 'bg-white/60 dark:bg-slate-900/40 border-gray-200/40 dark:border-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 hover:border-gray-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-bold text-xs text-gray-800 dark:text-slate-200 truncate flex-1 group-hover:text-[#f59e0b] transition-colors">
                      {name}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {tagInfo && (
                        <span className={`px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold ${tagInfo.badge}`}>
                          {tagInfo.label}
                        </span>
                      )}
                      {isTemp && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0" title="Фонове збереження..." />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500 font-semibold mt-0.5">
                    <span>{num}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${statusColors[stat] || 'bg-gray-100 dark:bg-slate-800 text-gray-600'}`}>
                      {stat}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Refresh Sync Footer */}
        <div className="p-3 border-t border-gray-200/60 dark:border-slate-800/60 bg-gray-50/20 dark:bg-slate-900/20">
          <button
            onClick={fetchProjects}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 hover:border-[#f59e0b]/40 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Оновлюємо дані...' : 'Оновити список'}
          </button>
        </div>
      </aside>

      {/* Dirty Form Guard Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 flex flex-col gap-4 animate-slide-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Незбережені зміни!</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  У поточному проєкті є незбережені дані у формі. Якщо ви перейдете, ці зміни будуть безповоротно втрачені.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Продовжити редагування
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md shadow-red-500/15 hover:scale-[1.02] transition"
              >
                Скинути та перейти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
