import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, Save, User, MapPin, Phone,
  Plus, Wallet, X, FileText, Package,
  Trash2, Edit3, AlertTriangle, Check,
  RefreshCw, DollarSign, Lock
} from 'lucide-react';
import { projectService } from '../services/api';
import { formatAmount, formatDate } from '../lib/utils';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../lib/haptic';
import { AddPaymentSheet } from '../components/AddPaymentSheet';
import { MaterialCard } from '../components/MaterialCard';

/* ---------- helpers ---------- */
function FL({ icon: Icon, children }) {
  return (
    <label style={{
      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.8px', color: 'var(--text-muted)',
      display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4
    }}>
      {Icon && <Icon size={10} />} {children}
    </label>
  );
}

function itemsModified(a, b) {
  if (a.length !== b.length) return true;
  return a.some((ai, i) => {
    const bi = b[i];
    if (!bi) return true;
    return (
      String(ai.name).trim() !== String(bi.name).trim() ||
      parseFloat(ai.quantity) !== parseFloat(bi.quantity) ||
      parseFloat(ai.price)    !== parseFloat(bi.price)
    );
  });
}

function thStyle(align, px, width) {
  return {
    padding: `8px ${px}`, textAlign: align,
    fontSize: '0.68rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.6px',
    color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap', ...(width ? { width } : {})
  };
}

/* Editable material row */
function ItemRow({ item, onUpdate, onDelete, currency, rate }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
      <td style={{ padding: '7px 10px', minWidth: '200px' }}>
        <input type="text" value={item.name || ''}
          onChange={e => onUpdate({ ...item, name: e.target.value })}
          className="form-input"
          style={{ padding: '4px 8px', fontSize: '0.82rem', fontWeight: 500 }} />
        <input type="text" value={item.note || ''}
          onChange={e => onUpdate({ ...item, note: e.target.value })}
          className="form-input"
          style={{ padding: '3px 8px', fontSize: '0.7rem', marginTop: 3, color: 'var(--text-muted)' }}
          placeholder="Примітка..." />
      </td>
      <td style={{ padding: '7px 6px', width: 70 }}>
        <input type="number" min="0" value={item.quantity || ''}
          onChange={e => {
            const q = parseFloat(e.target.value) || 0;
            const p = parseFloat(item.price) || 0;
            onUpdate({ ...item, quantity: e.target.value, sum: q * p });
          }}
          className="form-input"
          style={{ padding: '4px 6px', fontSize: '0.82rem', textAlign: 'center', width: '100%' }} />
      </td>
      <td style={{ padding: '7px 6px', width: 100 }}>
        <input type="number" min="0" value={item.price || ''}
          onChange={e => {
            const p = parseFloat(e.target.value) || 0;
            const q = parseFloat(item.quantity) || 0;
            onUpdate({ ...item, price: e.target.value, sum: q * p });
          }}
          className="form-input"
          style={{ padding: '4px 6px', fontSize: '0.82rem', textAlign: 'right', width: '100%' }} />
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
        {parseFloat(item.sum) > 0 ? formatAmount(item.sum, currency, rate) : '—'}
      </td>
      <td style={{ padding: '7px 6px', textAlign: 'center' }}>
        <button onClick={() => onDelete(item)} className="btn btn-ghost btn-sm"
          style={{ padding: 4, color: 'var(--danger)' }}>
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}

/* ================================================================ */
export function ProjectDetail({
  projectId, onBack, isMobile, onClosed, onUpdate,
  currency = 'USD', setCurrency, rate = 41, setRate
}) {
  const [project,    setProject]    = useState(null);
  const [items,      setItems]      = useState([]);
  const [origItems,  setOrigItems]  = useState([]);
  const [payments,   setPayments]   = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isSaving,   setIsSaving]   = useState(false);
  const [isClosing,  setIsClosing]  = useState(false);
  const [isSavingItems, setIsSavingItems] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [editingItems, setEditingItems] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);
  const [showRateInput, setShowRateInput] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  /* fetch */
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await projectService.getProjectDetails(projectId);
      if (data.success) {
        setProject(data.project);
        const loaded = data.items || [];
        setItems(loaded);
        setOrigItems(loaded.map(i => ({ ...i })));
        setPayments(data.payments || []);
      }
    } finally { setIsLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (project && project.name) {
      document.title = project.name;
    }
    return () => { document.title = 'Проєкти'; };
  }, [project?.name]);

  /* save project fields */
  const handleSave = async () => {
    if (!project) return;
    hapticLight();
    setIsSaving(true);
    setIsSaved(false);
    try {
      const pToSave = { ...project };
      if ((!pToSave.agreed_sum || pToSave.agreed_sum === '') && kpSum > 0) {
        pToSave.agreed_sum = kpSum;
      }
      const res = await projectService.saveProject(pToSave);
      if (!res.success) {
        hapticError();
        alert('Помилка збереження: ' + (res.error || ''));
      } else {
        hapticSuccess();
        const savedProject = res.updatedProject || pToSave;
        setProject(savedProject);
        // Оновити заголовок вкладки, якщо змінилася назва
        if (savedProject.name) {
          document.title = savedProject.name;
        }
        setIsSaved(true);
        if (onUpdate) onUpdate(); // Refresh the global list
        setTimeout(() => setIsSaved(false), 2500);
      }
    } finally { setIsSaving(false); }
  };

  /* close project */
  const handleCloseProject = async () => {
    if (!confirm('Ви дійсно впевнені щодо завершення проєкту?')) return;
    hapticMedium();
    setIsClosing(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const updated = { ...project, status: 'Виконано', closed_date: today };
      const res = await projectService.saveProject(updated);
      if (res.success) {
        hapticSuccess();
        setProject(updated);
        if (onClosed) onClosed();
      } else {
        hapticError();
        alert('Помилка: ' + (res.error || ''));
      }
    } finally { setIsClosing(false); }
  };

  /* edit materials */
  const handleEditItems = () => {
    setPendingItems(items.map(i => ({ ...i })));
    setEditingItems(true);
  };

  const handleSaveItems = async () => {
    hapticLight();
    setIsSavingItems(true);
    try {
      const removedIds = origItems
        .filter(oi => !pendingItems.find(pi => pi.id === oi.id))
        .map(oi => oi.id).filter(Boolean);
      for (const id of removedIds) await projectService.deleteProjectItem(id);
      for (const item of pendingItems)
        await projectService.saveProjectItem({ ...item, project_id: projectId });
      hapticSuccess();
      setEditingItems(false);
      await load();
    } catch (err) {
      hapticError();
    } finally { setIsSavingItems(false); }
  };

  const handleAddItem = () => {
    setPendingItems(p => [...p, {
      id: `new_${Date.now()}`, project_id: projectId,
      name: '', quantity: 1, price: 0, sum: 0, note: ''
    }]);
  };

  const handleUpdateItem = (upd) => {
    const q = parseFloat(upd.quantity) || 0;
    const p = parseFloat(upd.price) || 0;
    setPendingItems(prev => prev.map(i => i.id === upd.id ? { ...upd, sum: q * p } : i));
  };

  const handleDeletePending = (item) =>
    setPendingItems(prev => prev.filter(i => i.id !== item.id));

  /* cancel payment */
  const handleCancelPayment = async (paymentId) => {
    if (!confirm('Скасувати цей платіж?')) return;
    hapticMedium();
    const res = await projectService.cancelPayment(paymentId);
    if (res.success) {
      hapticSuccess();
      load();
    } else {
      hapticError();
    }
  };

  /* ---- loading states ---- */
  if (isLoading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16 }}>
      <div className="spinner" />
      <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', fontWeight:600 }}>Завантаження проекту...</p>
    </div>
  );
  if (!project) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
      <p style={{ color:'var(--text-muted)' }}>Проект не знайдено</p>
    </div>
  );

  /* ---- derived ---- */
  const displayItems  = editingItems ? pendingItems : items;
  const itemsTotal    = displayItems.reduce((a, i) => a + (parseFloat(i.sum) || 0), 0);
  const kpSum         = parseFloat(project.total_cost) || itemsTotal || 0;
  const agreedSum     = parseFloat(project.agreed_sum) || kpSum;
  const validPay      = payments.filter(p => !p.status?.toLowerCase().includes('скасовано'));
  const totalPaid     = validPay.reduce((a, p) => a + (parseFloat(p.sum) || 0), 0);
  const balance       = agreedSum - totalPaid;
  const paidPct       = agreedSum > 0 ? Math.min(100, (totalPaid / agreedSum) * 100) : 0;
  const isModified    = !editingItems && project.proposal_id && items.length > 0 && itemsModified(items, origItems);
  const isClosed      = project.status === 'Виконано';

  // Project subtitle for display
  // Prefer: project name → created_at date → id
  const proposalDisplay = project.name
    ? project.name
    : project.created_at
      ? `Створено ${formatDate(project.created_at)}`
      : `Проект #${String(project.id).slice(0, 8)}`;
  /* ================================================================ */
  return (
    <>
      {showPaymentSheet && (
        <AddPaymentSheet
          projectId={projectId}
          balance={balance}
          currency={currency}
          rate={rate}
          onSaved={() => { load(); if (onUpdate) onUpdate(); }}
          onClose={() => setShowPaymentSheet(false)}
        />
      )}

      {/* ---- HEADER ---- */}
      <div className="panel-detail-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding:'6px 8px', marginLeft:-6 }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex:1, minWidth:0, paddingRight: '10px' }}>
          <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {project.client_name || project.client || project.name || 'Проєкт'}
          </div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop: '2px' }}>
            <span style={{ color:'var(--primary)', fontWeight:700 }}>{proposalDisplay}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{
              fontWeight:600,
              color: isClosed ? 'var(--success)' : 'var(--info)',
            }}>
              {isClosed ? '✓ Виконано' : 'В роботі'}
            </span>
          </div>
        </div>

        {/* Action buttons (Currency + Close) */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink: 0 }}>
          {!isClosed && (
            <button
              className="btn btn-sm"
              onClick={handleCloseProject}
              disabled={isClosing}
              title="Завершити проєкт"
              style={{ 
                background: 'rgba(34, 197, 94, 0.15)', 
                color: 'var(--success)',
                border: '1px solid var(--success)',
                padding: '6px 12px',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              {isClosing ? '...' : 'Завершити проєкт'}
            </button>
          )}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
              onClick={() => { setCurrency('USD'); setShowRateInput(false); }}
            >$</button>
            <button
              className={`currency-btn ${currency === 'UAH' ? 'active' : ''}`}
              onClick={() => { setCurrency('UAH'); setShowRateInput(true); }}
            >₴</button>
          </div>
          {currency === 'UAH' && showRateInput && (
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <input
                type="number" min="1" value={rate}
                onChange={e => setRate(parseFloat(e.target.value) || 41)}
                className="form-input"
                style={{ width:60, padding:'4px 6px', fontSize:'0.78rem', textAlign:'center' }}
              />
            </div>
          )}
          <button 
            className="btn btn-sm btn-primary" 
            onClick={handleSave} 
            disabled={isSaving} 
            style={{ 
              background: isSaved ? 'var(--success)' : 'var(--primary)',
              borderColor: isSaved ? 'var(--success)' : 'var(--primary)',
              display: isMobile ? 'none' : 'flex',
            }}
          >
            {isSaved ? <Check size={14} /> : <Save size={14} />}
            <span style={{ marginLeft: 6 }}>{isSaving ? '...' : (isSaved ? 'Збережено' : 'Зберегти')}</span>
          </button>
        </div>
      </div>

      {/* ---- BODY ---- */}
      <div className="panel-detail-body">

        {/* ════ TOP: Client + Finance ════ */}
        <div className="detail-top-grid">

          {/* CLIENT */}
          <div className="card">
            <div className="card-header">
              <span className="section-label">👤 Клієнт</span>
              <select
                value={project.status || 'В роботі'}
                onChange={e => setProject({ ...project, status: e.target.value })}
                className="badge"
                style={{
                  background: isClosed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(240, 148, 51, 0.15)',
                  color: isClosed ? 'var(--success)' : 'var(--primary)',
                  cursor:'pointer', border:'none', outline:'none',
                  fontWeight:800, fontSize:'0.7rem', textTransform:'uppercase',
                  padding: '4px 8px', borderRadius: '4px'
                }}
              >
                <option value="В роботі">В роботі</option>
                <option value="Виконано">Виконано</option>
              </select>
            </div>
            <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <FL icon={User}>Клієнт</FL>
                  <input type="text" className="form-input"
                    value={project.client_name || ''}
                    onChange={e => setProject({ ...project, client_name: e.target.value })}
                    placeholder="ПІБ"
                    style={{ fontWeight:600 }} />
                </div>
                <div>
                  <FL icon={Phone}>Телефон</FL>
                  <div style={{ display:'flex', gap:6 }}>
                    <input type="tel" className="form-input"
                      value={project.client_phone || ''}
                      onChange={e => setProject({ ...project, client_phone: e.target.value })}
                      placeholder="+380..."
                      style={{ fontWeight:600, flex:1 }} />
                    {project.client_phone && (
                      <a href={`tel:${project.client_phone}`} className="btn btn-ghost"
                        style={{ padding:'4px 8px', color:'var(--success)' }}>
                        <Phone size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <FL icon={MapPin}>Адреса об'єкта</FL>
                <input type="text" className="form-input"
                  value={project.address || ''}
                  onChange={e => setProject({ ...project, address: e.target.value })}
                  placeholder="Вулиця, будинок, місто" />
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <FL>Примітка</FL>
                <textarea className="form-input"
                  value={project.notes || ''}
                  onChange={e => setProject({ ...project, notes: e.target.value })}
                  placeholder="Коментар..."
                  rows={2} style={{ resize:'none', minHeight: '60px' }} />
              </div>
            </div>
          </div>

          {/* FINANCE */}
          <div className="card">
            <div className="card-header" style={{ padding:'10px 14px' }}>
              <span className="section-label">💰 Фінанси</span>
              {project.proposal_id && (
                <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>
                  <FileText size={10} /> {proposalDisplay}
                </span>
              )}
            </div>
            <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:12 }}>
              {kpSum > 0 && (
                <div style={{ paddingBottom:10, borderBottom:'1px solid var(--border-light)' }}>
                  <div className="stat-label">Сума по КП</div>
                  <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text-secondary)' }}>
                    {formatAmount(kpSum, currency, rate)}
                  </div>
                </div>
              )}
              <div>
                <FL>Погоджена сума з клієнтом ({currency})</FL>
                <input type="number" inputMode="numeric" className="form-input"
                  value={project.agreed_sum !== undefined && project.agreed_sum !== '' ? Number(project.agreed_sum).toFixed(2).replace(/\.00$/, '') : (kpSum > 0 ? Number(kpSum).toFixed(2).replace(/\.00$/, '') : '')}
                  onChange={e => setProject({ ...project, agreed_sum: e.target.value })}
                  placeholder="0"
                  style={{ fontSize:'1.1rem', fontWeight:700 }} />
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:600 }}>Прогрес оплати</span>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color: paidPct >= 100 ? 'var(--success)' : 'var(--primary)' }}>
                    {Math.round(paidPct)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width:`${paidPct}%` }} />
                </div>
              </div>
              <div className="stat-grid">
                <div className="stat-block">
                  <div className="stat-label">Оплачено</div>
                  <div className="stat-value" style={{ color:'var(--success)' }}>
                    {formatAmount(totalPaid, currency, rate)}
                  </div>
                </div>
                <div className="stat-block">
                  <div className="stat-label">Залишок (борг)</div>
                  <div className="stat-value" style={{ color: balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {balance > 0 ? formatAmount(balance, currency, rate) : '✓ Оплачено'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════ PAYMENTS ════ */}
        <div className="card" style={{ marginBottom:12 }}>
          <div className="card-header" style={{ padding:'10px 14px' }}>
            <span className="section-label">📋 Платежі ({validPay.length})</span>
            <button
              className="btn btn-sm"
              style={{ background:'var(--primary)', color:'white', border:'none' }}
              onClick={() => setShowPaymentSheet(true)}
            >
              <Plus size={14} /> Додати
            </button>
          </div>
          {payments.length === 0 ? (
            <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--text-muted)' }}>
              <Wallet size={28} style={{ marginBottom:10, opacity:0.3 }} />
              <p style={{ fontSize:'0.82rem', fontWeight:600 }}>Платежів ще немає</p>
              <p style={{ fontSize:'0.75rem', marginTop:4 }}>Натисніть "Додати" щоб внести перший платіж</p>
            </div>
          ) : (
            payments.map(p => {
              const cancelled = p.status?.toLowerCase().includes('скасовано');
              const isAdv     = p.payment_type === 'Аванс' || p.type === 'Аванс';
              return (
                <div key={p.id} className={`payment-item ${cancelled ? 'cancelled' : ''}`}>
                  <div className={`payment-dot ${isAdv ? 'advance' : 'full'}`} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                      <span style={{ fontWeight:700, fontSize:'0.92rem', color:'var(--text)' }}>
                        {formatAmount(p.sum, currency, rate)}
                      </span>
                      <span className={`badge ${isAdv ? 'badge-info' : 'badge-success'}`} style={{ fontSize:'0.6rem' }}>
                        {p.payment_type || p.type || (isAdv ? 'Аванс' : 'Повна оплата')}
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3 }}>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{formatDate(p.date)}</span>
                      {p.note && <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>· {p.note}</span>}
                    </div>
                  </div>
                  {!cancelled && (
                    <button onClick={() => handleCancelPayment(p.id)} className="btn btn-ghost btn-sm"
                      style={{ padding:6, color:'var(--text-muted)', flexShrink:0 }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ════ MATERIALS ════ */}
        <div className="card" style={{ marginBottom: isMobile ? 80 : 24 }}>
          <div className="card-header" style={{ padding:'10px 14px' }}>
            <span className="section-label" style={{ gap:6 }}>
              <Package size={13} />
              Матеріали по КП
              {displayItems.length > 0 && (
                <span style={{ marginLeft:4, background:'var(--border-light)', color:'var(--text-secondary)', fontSize:'0.65rem', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>
                  {displayItems.length}
                </span>
              )}
              {isModified && !editingItems && (
                <span style={{
                  marginLeft:6, display:'inline-flex', alignItems:'center', gap:3,
                  background:'#FFF3CD', color:'#856404', border:'1px solid #FFE069',
                  fontSize:'0.62rem', padding:'2px 8px', borderRadius:10, fontWeight:700
                }}>
                  <AlertTriangle size={9} /> Змінено відносно КП
                </span>
              )}
            </span>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              {editingItems ? (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingItems(false)} style={{ fontSize:'0.78rem' }}>
                    Скасувати
                  </button>
                  <button className="btn btn-sm"
                    style={{ background:'var(--primary)', color:'white', border:'none', fontSize:'0.78rem' }}
                    onClick={handleSaveItems} disabled={isSavingItems}>
                    {isSavingItems ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                    {isSavingItems ? ' Збереження...' : ' Зберегти'}
                  </button>
                </>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={handleEditItems}
                  style={{ fontSize:'0.78rem', color:'var(--primary)', display:'flex', alignItems:'center', gap:4 }}>
                  <Edit3 size={12} /> Редагувати
                </button>
              )}
            </div>
          </div>

          {displayItems.length === 0 && !editingItems ? (
            <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--text-muted)' }}>
              <Package size={24} style={{ marginBottom:8, opacity:0.25 }} />
              <p style={{ fontSize:'0.82rem', fontWeight:600 }}>Матеріали не вказані</p>
              <button className="btn btn-sm" style={{ marginTop:12, background:'var(--primary)', color:'white', border:'none' }}
                onClick={handleEditItems}>
                <Plus size={13} /> Додати матеріали вручну
              </button>
            </div>
          ) : (
            <>
              {/* Desktop: Table view */}
              <div className="hidden md:block" style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--border-light)' }}>
                      <th style={{ ...thStyle('left','14px'), minWidth: '200px' }}>Назва</th>
                      <th style={thStyle('center','6px',70)}>К-сть</th>
                      <th style={thStyle('right','6px',100)}>Ціна ({currency})</th>
                      <th style={thStyle('right','14px',100)}>Сума</th>
                      {editingItems && <th style={{ width:36 }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {editingItems ? (
                      pendingItems.map((item, i) => (
                        <ItemRow key={item.id || i} item={item}
                          onUpdate={handleUpdateItem} onDelete={handleDeletePending}
                          currency={currency} rate={rate} />
                      ))
                    ) : (
                      displayItems.map((item, i) => (
                        <tr key={item.id || i} style={{ borderBottom:'1px solid var(--border-light)' }}>
                          <td style={{ padding:'9px 14px', fontSize:'0.85rem', color:'var(--text)', fontWeight:500 }}>
                            {item.name}
                            {item.note && <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:1 }}>{item.note}</div>}
                          </td>
                          <td style={{ padding:'9px 6px', textAlign:'center', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                            {parseFloat(item.quantity) || 1}
                          </td>
                          <td style={{ padding:'9px 6px', textAlign:'right', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                            {parseFloat(item.price) > 0 ? formatAmount(item.price, currency, rate) : '—'}
                          </td>
                          <td style={{ padding:'9px 14px', textAlign:'right', fontWeight:700, fontSize:'0.88rem', color:'var(--text)' }}>
                            {parseFloat(item.sum) > 0 ? formatAmount(item.sum, currency, rate) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    {editingItems && (
                      <tr>
                        <td colSpan={5} style={{ padding:'8px 10px' }}>
                          <button onClick={handleAddItem} className="btn btn-ghost btn-sm"
                            style={{ color:'var(--primary)', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4, width:'100%', justifyContent:'center', borderTop:'1px dashed var(--border)' }}>
                            <Plus size={13} /> Додати позицію
                          </button>
                        </td>
                      </tr>
                    )}
                    <tr style={{ background:'var(--primary-bg)' }}>
                      <td colSpan={editingItems ? 4 : 3}
                        style={{ padding:'9px 14px', fontSize:'0.78rem', fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'0.6px' }}>
                        Разом по КП
                      </td>
                      <td style={{ padding:'9px 14px', textAlign:'right', fontSize:'0.95rem', fontWeight:800, color:'var(--primary)' }}>
                        {formatAmount(itemsTotal, currency, rate)}
                      </td>
                      {editingItems && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile: Card view */}
              <div className="md:hidden" style={{ padding:'12px' }}>
                {(editingItems ? pendingItems : displayItems).map((item, i) => (
                  <MaterialCard
                    key={item.id || i}
                    item={item}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeletePending}
                    isEditing={editingItems}
                    currency={currency}
                    rate={rate}
                  />
                ))}

                {editingItems && (
                  <button
                    onClick={handleAddItem}
                    className="btn btn-ghost"
                    style={{
                      width:'100%', marginTop:'8px', padding:'12px',
                      color:'var(--primary)', fontSize:'0.88rem',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      border:'2px dashed var(--border)', borderRadius:'var(--radius-md)'
                    }}
                  >
                    <Plus size={16} /> Додати позицію
                  </button>
                )}

                {/* Total for mobile */}
                <div style={{
                  marginTop:'12px', padding:'14px', background:'var(--primary-bg)',
                  borderRadius:'var(--radius-md)', display:'flex', justifyContent:'space-between', alignItems:'center'
                }}>
                  <span style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'0.6px' }}>
                    Разом по КП
                  </span>
                  <span style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--primary)' }}>
                    {formatAmount(itemsTotal, currency, rate)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 1000,
        }}>
          {/* Save FAB */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            title="Зберегти проект"
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: isSaved ? 'var(--success, #22c55e)' : 'var(--primary, #f09433)',
              color: '#fff', border: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.3s ease',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaved ? <Check size={22} /> : <Save size={22} />}
          </button>

          {/* Add Payment FAB */}
          <button
            onClick={() => setShowPaymentSheet(true)}
            title="Додати платіж"
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--success, #22c55e)',
              color: '#fff', border: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '24px',
            }}
          >
            <Plus size={24} />
          </button>
        </div>
      )}
    </>
  );
}
