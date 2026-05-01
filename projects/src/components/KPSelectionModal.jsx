import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, FileText, Check, ChevronRight } from 'lucide-react';
import { projectService } from '../services/api';
import { Spinner } from './Spinner';

export function KPSelectionModal({ isOpen, onClose, onSelect }) {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProposals();
    }
  }, [isOpen]);

  const loadProposals = async () => {
    setIsLoading(true);
    try {
      const res = await projectService.getProposals();
      if (res.success) {
        // Sort by date descending if possible, or just keep as is
        setProposals(res.proposals || []);
      }
    } catch (err) {
      console.error('Failed to load proposals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = proposals.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      (p.clientName || '').toLowerCase().includes(q) ||
      (p.number || '').toLowerCase().includes(q)
    );
  });

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="sheet-handle" />
        
        <div className="modal-header">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">📋 Вибір КП</h3>
            <p className="text-[11px] text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-wider mt-1">Оберіть комерційну пропозицію для імпорту товарів</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-2 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-transform active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Пошук за клієнтом або номером..."
              className="form-input w-full pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ height: 40, borderRadius: 10 }}
            />
          </div>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Spinner />
              <span className="text-sm text-gray-500">Завантаження списку КП...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p>КП не знайдено</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(p => (
                <div
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 hover:bg-primary-light/10 dark:hover:bg-primary/10 rounded-xl cursor-pointer border border-transparent hover:border-primary/20 transition-all group"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[0.95rem] group-hover:text-primary transition-colors">
                      {p.clientName || 'Без імені'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[0.7rem] font-bold text-gray-400 uppercase tracking-tighter bg-gray-200/50 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
                        #{p.number || '---'}
                      </span>
                      <span className="text-[0.75rem] text-gray-500">
                        {p.date ? new Date(p.date).toLocaleDateString('uk-UA') : '---'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
