import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, Save, User, MapPin, Phone,
  Plus, Wallet, X, FileText, Package,
  Trash2, Edit3, AlertTriangle, Check,
  RefreshCw, DollarSign, Lock
} from 'lucide-react';
import { projectService } from '../services/api';
import { formatAmount, formatDate } from '../lib/utils';
import { AddPaymentSheet } from '../components/AddPaymentSheet';

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
      <td style={{ padding: '7px 10px' }}>
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
  projectId, onBack, isMobile, onClosed,
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

  /* save project fields */
  const handleSave = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      const res = await projectService.saveProject(project);
      if (!res.success) alert('Помилка збереження: ' + (res.error || ''));
    } finally { setIsSaving(false); }
  };

  /* close project */
  const handleCloseProject = async () => {
    if (!confirm('Перевести проект у статус "Виконано"?')) return;
    setIsClosing(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const updated = { ...project, status: 'Виконано', closed_date: today };
      const res = await projectService.saveProject(updated);
      if (res.success) {
        setProject(updated);
        if (onClosed) onClosed();
      } else {
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
    setIsSavingItems(true);
    try {
      const removedIds = origItems
        .filter(oi => !pendingItems.find(pi => pi.id === oi.id))
        .map(oi => oi.id).filter(Boolean);
      for (const id of removedIds) await projectService.deleteProjectItem(id);
      for (const item of pendingItems)
        await projectService.saveProjectItem({ ...item, project_id: projectId });
      setEditingItems(false);
      await load();
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
    const res = await projectService.cancelPayment(paymentId);
    if (res.success) load();
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
  const kpSum         = parseFloat(project.total_cost) || 0;
  const agreedSum     = parseFloat(project.agreed_sum) || kpSum;
  const validPay      = payments.filter(p => !p.status?.toLowerCase().includes('скасовано'));
  const totalPaid     = validPay.reduce((a, p) => a + (parseFloat(p.sum) || 0), 0);
  const balance       = agreedSum - totalPaid;
  const paidPct       = agreedSum > 0 ? Math.min(100, (totalPaid / agreedSum) * 100) : 0;
  const displayItems  = editingItems ? pendingItems : items;
  const itemsTotal    = displayItems.reduce((a, i) => a + (parseFloat(i.sum) || 0), 0);
  const isModified    = !editingItems && project.proposal_id && items.length > 0 && itemsModified(items, origItems);
  const isClosed      = project.status === 'Виконано';

  // Project "number" for display
  // Prefer: proposal_number (returned from GAS) → proposal_id → created_at date → id
  const proposalDisplay = project.proposal_number
    ? `КП №${project.proposal_number}`
    : project.proposal_id
      ? `КП #${project.proposal_id.slice(0, 8)}`
      : project.created_at
        ? `Пр. від ${formatDate(project.created_at)}`
        : `Пр. #${String(project.id).slice(0, 8)}`;

  /* ================================================================ */
  return (
    <>
      {showPaymentSheet && (
        <AddPaymentSheet
          projectId={projectId}
          onClose={() => setShowPaymentSheet(false)}
          onSaved={load}
        />
      )}

      {/* ---- HEADER ---- */}
      <div className="panel-detail-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding:'6px 8px', marginLeft:-6 }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'0.92rem', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {project.client_name || project.client || project.name || 'Проект'}
          </div>
          <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ color:'var(--primary)', fontWeight:700 }}>{proposalDisplay}</span>
            <span>·</span>
            <span style={{
              fontWeight:600,
              color: isClosed ? 'var(--success)' : 'var(--info)'
            }}>
              {isClosed ? '✓ Виконано' : 'В роботі'}
            </span>
            {isClosed && project.closed_date && (
              <span>{formatDate(project.closed_date)}</span>
            )}
          </div>
        </div>

        {/* Currency switcher */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginRight:6 }}>
          <button
            className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
            onClick={() => { setCurrency('USD'); setShowRateInput(false); }}
          >$</button>
          <button
            className={`currency-btn ${currency === 'UAH' ? 'active' : ''}`}
            onClick={() => { setCurrency('UAH'); setShowRateInput(true); }}
          >₴</button>
          {currency === 'UAH' && showRateInput && (
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <input
                type="number" min="1" value={rate}
                onChange={e => setRate(parseFloat(e.target.value) || 41)}
                className="form-input"
                style={{ width:64, padding:'4px 6px', fontSize:'0.78rem', textAlign:'center' }}
              />
              <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>грн/$</span>
            </div>
          )}
        </div>

        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving} style={{ flexShrink:0 }}>
          <Save size={14} />
          {isSaving ? '...' : 'Зберегти'}
        </button>
      </div>

      {/* ---- BODY ---- */}
      <div className="panel-detail-body">

        {/* ════ TOP: Client + Finance ════ */}
        <div className="detail-top-grid">

          {/* CLIENT */}
          <div className="card">
            <div className="card-header" style={{ padding:'10px 14px' }}>
              <span className="section-label">👤 Клієнт</span>
              <select
                value={project.status || 'В роботі'}
                onChange={e => setProject({ ...project, status: e.target.value })}
                className="badge"
                style={{
                  background: isClosed ? 'var(--success-bg)' : 'var(--primary-bg)',
                  color: isClosed ? 'var(--success)' : 'var(--primary)',
                  cursor:'pointer', border:'none', outline:'none',
                  fontWeight:700, fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.8px',
                }}
              >
                <option value="В роботі">В роботі</option>
                <option value="Виконано">Виконано</option>
              </select>
            </div>
            <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <FL icon={User}>ПІБ</FL>
                <input type="text" className="form-input"
                  value={project.client_name || ''}
                  onChange={e => setProject({ ...project, client_name: e.target.value })}
                  placeholder="Прізвище Ім'я По-батькові"
                  style={{ fontSize:'0.9rem', fontWeight:600 }} />
              </div>
              <div>
                <FL icon={Phone}>Телефон</FL>
                <input type="tel" className="form-input"
                  value={project.client_phone || ''}
                  onChange={e => setProject({ ...project, client_phone: e.target.value })}
                  placeholder="+380..."
                  style={{ fontSize:'0.9rem', fontWeight:600, color: project.client_phone ? 'var(--accent-light)' : 'var(--text)' }} />
                {project.client_phone && (
                  <a href={`tel:${project.client_phone}`}
                    style={{ display:'inline-block', marginTop:4, fontSize:'0.72rem', color:'var(--accent-light)', fontWeight:600, textDecoration:'none' }}>
                    📞 Зателефонувати
                  </a>
                )}
              </div>
              <div>
                <FL icon={MapPin}>Адреса об'єкта</FL>
                <input type="text" className="form-input"
                  value={project.address || ''}
                  onChange={e => setProject({ ...project, address: e.target.value })}
                  placeholder="Вулиця, будинок, місто" />
              </div>
              <div>
                <FL>Примітка</FL>
                <textarea className="form-input"
                  value={project.notes || ''}
                  onChange={e => setProject({ ...project, notes: e.target.value })}
                  placeholder="Додаткова інформація..."
                  rows={2} style={{ resize:'none', fontSize:'0.85rem' }} />
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
                  value={project.agreed_sum || ''}
                  onChange={e => setProject({ ...project, agreed_sum: e.target.value })}
                  placeholder={kpSum ? String(kpSum) : '0'}
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

              {/* CLOSE PROJECT BUTTON */}
              {!isClosed ? (
                <button
                  onClick={handleCloseProject}
                  disabled={isClosing}
                  style={{
                    width:'100%', padding:'10px 14px',
                    background: 'linear-gradient(135deg, #1a3a6b, #2a5298)',
                    color:'white', border:'none', borderRadius:'var(--radius)',
                    fontWeight:700, fontSize:'0.85rem', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    opacity: isClosing ? 0.6 : 1,
                    transition:'opacity 0.2s, transform 0.1s',
                  }}
                  onMouseDown={e => e.currentTarget.style.transform='scale(0.98)'}
                  onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
                >
                  <Lock size={15} />
                  {isClosing ? 'Закриваємо...' : 'Проект закрито'}
                </button>
              ) : (
                <div style={{
                  padding:'10px 14px', background:'var(--success-bg)',
                  border:'1px solid var(--success)', borderRadius:'var(--radius)',
                  color:'var(--success)', fontWeight:700, fontSize:'0.85rem',
                  textAlign:'center'
                }}>
                  ✓ Проект виконано {project.closed_date ? `· ${formatDate(project.closed_date)}` : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════ PAYMENTS ════ */}
        <div className="card" style={{ marginBottom:12 }}>
          <div className="card-header" style={{ padding:'10px 14px' }}>
            <span className="section-label">📋 Платежі ({validPay.length})</span>
            <button
              className="btn btn-sm"
              style={{ background:'var(--success)', color:'white', border:'none' }}
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
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--border-light)' }}>
                    <th style={thStyle('left','14px')}>Назва</th>
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
          )}
        </div>
      </div>

      {isMobile && (
        <button className="fab" onClick={() => setShowPaymentSheet(true)} title="Додати платіж">+</button>
      )}
    </>
  );
}
