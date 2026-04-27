// ===== CSO Solar — Green Tariff Project List =====

import React from 'react';
import { useGreenTariffStore } from '../store/useGreenTariffStore';
import type { GreenTariffProject } from '../types';

const STATUS_TABS = [
  { label: 'В процесі', value: 'В процесі' },
  { label: 'Готовий', value: 'Готовий' },
  { label: 'Відкл.', value: 'Відкладено' },
  { label: 'Неопл.', value: 'unpaid' },
  { label: '⭐', value: 'starred' },
  { label: 'Всі', value: 'all' },
];

function getProp(obj: Record<string, unknown>, keys: string[]): string {
  if (!obj) return '';

  const normalize = (s: string) =>
    (s || '').toString().toLowerCase().replace(/[\n\r"]/g, '').replace(/\s+/g, '').trim();

  const objKeys = Object.keys(obj);

  for (const k of keys) {
    if (obj[k] !== undefined) return String(obj[k]);
    const normalizedK = normalize(k);
    const exactKey = objKeys.find((ak) => normalize(ak) === normalizedK);
    if (exactKey) return String(obj[exactKey]);
  }

  return '';
}

export function ProjectList() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { projects, activeStatusFilter, setStatusFilter, loadProject, resetForm, fetchProjects, isLoading, toggleStar } = useGreenTariffStore();

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Calculate unpaid projects count
  const unpaidCount = React.useMemo(() => {
    return projects.filter((p) => {
      const obj = p as unknown as Record<string, unknown>;
      const paymentStatus = getProp(obj, ['Розрахунок', 'Оплата']) || p.field2 || '';
      const pStr = paymentStatus.toLowerCase().trim();
      return pStr === 'не оплачено' || pStr === 'неоплачено';
    }).length;
  }, [projects]);

  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      const obj = p as unknown as Record<string, unknown>;
      const id = getProp(obj, ['id', 'ID']);
      const name = getProp(obj, ['ПІБ фізичної особи', 'ПІБ', 'Прізвище']) || p.field4 || '';
      const num = getProp(obj, ['№ проекту']) || p.field3 || '';
      const stat = getProp(obj, ['Стан проєкту', 'Статус', 'Стан']) || p.field1 || '';
      const paymentStatus = getProp(obj, ['Розрахунок', 'Оплата']) || p.field2 || '';

      if (!id && !name && !num) return false;

      if (activeStatusFilter === 'unpaid') {
        const pStr = paymentStatus.toLowerCase().trim();
        if (pStr !== 'не оплачено' && pStr !== 'неоплачено') {
           return false;
        }
      } else if (activeStatusFilter === 'starred') {
        if (!p.isStarred) return false;
      } else if (activeStatusFilter !== 'all' && stat !== activeStatusFilter) {
        return false;
      }

      const searchStr = (name + ' ' + num).toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
  }, [projects, activeStatusFilter, searchQuery]);

  const handleProjectClick = (project: GreenTariffProject, index: number) => {
    const obj = project as unknown as Record<string, unknown>;
    const id = getProp(obj, ['id', 'ID']) || `idx_${index}`;
    loadProject(id);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Проєкти</h2>
          <button
            onClick={resetForm}
            className="px-2 py-1 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition"
          >
            + Новий
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Пошук проєкту..."
          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex-1 px-1 py-1 text-[10px] font-medium rounded transition text-center min-w-[40px] whitespace-nowrap ${
              activeStatusFilter === tab.value
                ? tab.value === 'unpaid' ? 'bg-red-500 text-white' : 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label} {tab.value === 'unpaid' && unpaidCount > 0 && `(${unpaidCount})`}
          </button>
        ))}
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-400 font-medium">Завантаження Зеленого тарифу...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">Проєктів не знайдено</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProjects.map((project) => {
              const obj = project as unknown as Record<string, unknown>;
              const name = getProp(obj, ['ПІБ фізичної особи', 'ПІБ', 'Прізвище']) || project.field4 || 'Без імені';
              const num = getProp(obj, ['№ проекту']) || project.field3 || '---';
              const stat = getProp(obj, ['Стан проєкту', 'Статус', 'Стан']) || project.field1 || '';
              const originalIndex = projects.indexOf(project);

              return (
                <button
                  key={originalIndex}
                  onClick={() => handleProjectClick(project, originalIndex)}
                  className="w-full p-3 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {num} | {stat}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (project.id) toggleStar(project.id);
                      }}
                      className={`p-1 rounded-full transition-colors hover:bg-gray-200 ${
                        project.isStarred ? 'text-amber-400' : 'text-gray-300'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={fetchProjects}
          disabled={isLoading}
          className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition disabled:opacity-50"
        >
          {isLoading ? 'Оновлення...' : '↻ Оновити'}
        </button>
      </div>
    </aside>
  );
}
