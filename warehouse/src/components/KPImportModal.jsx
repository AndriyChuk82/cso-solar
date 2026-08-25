import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, FileText, ChevronRight } from 'lucide-react';
import { getProposals } from '../api/gasApi';

export default function KPImportModal({ isOpen, onClose, onSelect }) {
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
      const res = await getProposals();
      if (res && res.success) {
        const sorted = (res.proposals || []).sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          if (dateB - dateA !== 0) return dateB - dateA;
          return (b.id || '').toString().localeCompare((a.id || '').toString());
        });
        setProposals(sorted);
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
      String(p.clientName || '').toLowerCase().includes(q) ||
      String(p.number || p.id || '').toLowerCase().includes(q) ||
      String(p.clientPhone || p.phone || '').toLowerCase().includes(q)
    );
  });

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '650px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="sheet-handle" />
        
        <div className="modal-header">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">📋 Вибір Комерційної Пропозиції (КП)</h3>
            <p className="text-[11px] text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-wider mt-1">
              Оберіть КП для імпорту товарів, клієнта та валюти
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-2 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light, #e5e7eb)' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={16} 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} 
            />
            <input
              type="text"
              placeholder="Пошук за ПІБ, телефоном або № КП..."
              className="form-input w-full"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ height: 40, borderRadius: 10, paddingLeft: '36px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="spinner" />
              <span className="text-sm text-gray-500 font-medium">Завантаження комерційних пропозицій...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FileText size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">КП не знайдено</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(p => {
                const currencyBadge = (p.currency || 'USD').toUpperCase();
                const pSymbol = currencyBadge === 'UAH' ? '₴' : '$';
                const pTotal = parseFloat(p.total || p.totalPrice || p.grandTotal || p.amount || 0);

                return (
                  <div
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-neutral-800/60 hover:bg-primary/10 rounded-xl cursor-pointer border border-transparent hover:border-primary/30 transition group"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[0.95rem] text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                          {p.clientName || 'Без імені клієнта'}
                        </span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${currencyBadge === 'UAH' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                          {currencyBadge}
                        </span>
                        {pTotal > 0 && (
                          <span className="text-xs font-extrabold text-gray-900 dark:text-white bg-gray-200/80 dark:bg-neutral-700 px-2 py-0.5 rounded">
                            {pTotal.toLocaleString()} {pSymbol}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[0.75rem] text-gray-500 dark:text-neutral-400">
                        <span className="font-semibold text-primary">
                          #{p.number || p.id}
                        </span>
                        <span>•</span>
                        <span>{p.date ? new Date(p.date).toLocaleDateString('uk-UA') : '---'}</span>
                        {p.items && <span>• {p.items.length} поз.</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
