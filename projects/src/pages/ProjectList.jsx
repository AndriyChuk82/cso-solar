import React, { useState } from 'react';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { formatAmount } from '../lib/utils';

const FILTERS = [
  { key: 'active', label: 'Активні' },
  { key: 'done',   label: 'Виконані' },
  { key: 'all',    label: 'Всі' },
];

export function ProjectList({ selectedId, onSelect, onAddNew, currency = 'USD', rate = 41 }) {
  const { projects, isLoading, fetchProjects } = useProjectStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');

  const byFilter = projects.filter(p => {
    if (filter === 'active') return p.status !== 'Виконано';
    if (filter === 'done')   return p.status === 'Виконано';
    return true;
  });

  const filtered = byFilter.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.client_name || p.client || '').toLowerCase().includes(q) ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q)
    );
  });

  const getCardClass = (p) => {
    const balance = parseFloat(p.balance) || 0;
    const paid    = parseFloat(p.total_paid) || 0;
    if (p.id === selectedId)       return 'project-card active';
    if (p.status === 'Виконано')   return 'project-card paid';
    if (balance <= 0 && paid > 0)  return 'project-card paid';
    if (balance > 0)               return 'project-card has-debt';
    return 'project-card';
  };

  return (
    <>
      {/* Header */}
      <div className="panel-list-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => fetchProjects()} className="btn btn-ghost btn-sm" title="Оновити">
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onAddNew}
              className="btn btn-sm btn-primary"
              style={{ border: 'none' }}
            >
              <Plus size={15} /> Новий
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`filter-tab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key !== 'all' && (
                <span className="filter-tab-count">
                  {
                    projects.filter(p =>
                      f.key === 'active' ? p.status !== 'Виконано' : p.status === 'Виконано'
                    ).length
                  }
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginTop: 8 }}>
          <Search size={14} style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Пошук клієнта, адреси..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 32, fontSize: '0.82rem', padding: '8px 10px 8px 32px' }}
          />
        </div>
      </div>

      {/* List */}
      <div className="panel-list-body">
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 20px' }}>
            <div className="spinner" />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Завантаження...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Проектів не знайдено</p>
          </div>
        ) : (
          filtered.map(p => {
            const agreedSum = parseFloat(p.agreed_sum) || parseFloat(p.total_cost) || 0;
            const paid      = parseFloat(p.total_paid) || 0;
            const balance   = agreedSum - paid;
            const isDone    = p.status === 'Виконано';
            const isPaid    = balance <= 0 && paid > 0;

            return (
              <div
                key={p.id}
                className={getCardClass(p)}
                onClick={() => onSelect(p.id)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onSelect(p.id)}
              >
                <div className="project-card-indicator" />
                <div className="project-card-body">
                  <div className="project-card-name">
                    {p.client_name || p.client || p.name || 'Без імені'}
                  </div>
                  <div className="project-card-address">
                    {p.address || <span style={{ fontStyle: 'italic' }}>Адреса не вказана</span>}
                  </div>
                  <div className="project-card-footer">
                    <div className="project-card-sum">
                      {formatAmount(agreedSum, currency, rate)}
                    </div>
                    {isDone ? (
                      <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>✓ Виконано</span>
                    ) : isPaid ? (
                      <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>✓ Оплачено</span>
                    ) : balance > 0 ? (
                      <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>
                        Борг: {formatAmount(balance, currency, rate)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
