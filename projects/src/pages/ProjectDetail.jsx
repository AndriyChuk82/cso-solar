import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, Save, User, MapPin, Phone,
  Plus, Wallet, X, FileText, Package,
  Trash2, Edit3, AlertTriangle, Check,
  RefreshCw, DollarSign, Lock, Clipboard
} from 'lucide-react';
import { projectService } from '../services/api';
import { formatAmount, formatDate } from '../lib/utils';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../lib/haptic';
import { AddPaymentSheet } from '../components/AddPaymentSheet';
import { MaterialCard } from '../components/MaterialCard';
import { KPSelectionModal } from '../components/KPSelectionModal';

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
      parseFloat(ai.price)    !== parseFloat(bi.price) ||
      parseFloat(ai.issued_qty || 0) !== parseFloat(bi.issued_qty || 0) ||
      String(ai.note || '').trim() !== String(bi.note || '').trim()
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
          placeholder="Назва товару..."
          style={{ padding: '4px 8px', fontSize: '0.82rem', fontWeight: 500 }} />
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
      <td style={{ padding: '7px 6px', width: 70 }}>
        <input type="number" min="0" value={item.issued_qty || ''}
          onChange={e => onUpdate({ ...item, issued_qty: e.target.value })}
          className="form-input"
          placeholder="0"
          style={{ padding: '4px 6px', fontSize: '0.82rem', textAlign: 'center', width: '100%', background: 'var(--success-bg)' }} />
      </td>
      <td style={{ padding: '7px 6px' }}>
        <input type="text" value={item.note || ''}
          onChange={e => onUpdate({ ...item, note: e.target.value })}
          className="form-input"
          style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
          placeholder="Примітка..." />
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
  const [showKPModal, setShowKPModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  /* fetch */
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await projectService.getProjectDetails(projectId);
      if (data.success) {
        const p = data.project;
        
        // MIGRATION: If new fields are empty but old one has data, populate them in state
        if (!p.agreed_sum_usd && !p.agreed_sum_uah) {
          const oldSum = parseFloat(p.agreed_sum || p['погоджена сума']) || 0;
          if (p.currency === 'UAH') p.agreed_sum_uah = oldSum;
          else p.agreed_sum_usd = oldSum;
        }

        setProject(p);
        if (setCurrency) {
          const projectCurr = p.currency || 'USD';
          setCurrency(projectCurr);
          setShowRateInput(projectCurr === 'UAH');
        }
        const loaded = data.items || [];
        setItems(loaded);
        setOrigItems(loaded.map(i => ({ ...i })));
        const loadedPayments = data.payments || [];
        setPayments(loadedPayments);

        return data;
      }
    } finally { setIsLoading(false); }
    return null;
  }, [projectId]);

  useEffect(() => {
    if (projectId) load();
  }, [projectId, load]);

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
      const res = await projectService.saveProject(pToSave);
      if (!res.success) {
        hapticError();
        alert('Помилка збереження: ' + (res.error || ''));
      } else {
        hapticSuccess();
        const savedProject = res.updatedProject || pToSave;
        setProject(savedProject);
        if (savedProject.name) {
          document.title = savedProject.name;
        }
        setIsSaved(true);
        if (onUpdate) {
          onUpdate(savedProject);
        }
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
        // Important: Update local list immediately so it moves to "Done"
        if (onUpdate) onUpdate(updated);
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
      const fresh = await load();
      if (onUpdate && fresh) onUpdate(fresh);
      hapticSuccess();
    } catch (err) {
      hapticError();
    } finally { setIsSavingItems(false); }
  };

  const handleAddItem = () => {
    setPendingItems(p => [...p, {
      id: `new_${Date.now()}`, project_id: projectId,
      name: '', quantity: 1, price: 0, sum: 0, issued_qty: 0, note: ''
    }]);
  };

  const handleSelectKP = async (proposalId) => {
    setShowKPModal(false);
    hapticMedium();
    setIsSavingItems(true);
    try {
      const res = await projectService.importFromProposal(projectId, proposalId);
      if (res.success) {
        hapticSuccess();
        load(); // Refresh items
      } else {
        alert('Помилка імпорту: ' + res.error);
      }
    } catch (err) {
      hapticError();
      alert('Помилка підключення');
    } finally {
      setIsSavingItems(false);
    }
  };

  const handleUpdateItem = (upd) => {
    const q = parseFloat(upd.quantity) || 0;
    const p = parseFloat(upd.price) || 0;
    setPendingItems(prev => prev.map(i => i.id === upd.id ? { ...upd, sum: q * p } : i));
  };

  const handleDeletePending = (item) =>
    setPendingItems(prev => prev.filter(i => i.id !== item.id));

  const handleDeleteItemDirect = async (itemId) => {
    if (!confirm('Видалити цю позицію назавжди?')) return;
    hapticMedium();
    setIsSavingItems(true);
    try {
      const res = await projectService.deleteProjectItem(itemId);
      if (res.success) {
        hapticSuccess();
        load();
      } else {
        alert('Помилка видалення: ' + res.error);
      }
    } catch (err) {
      hapticError();
    } finally {
      setIsSavingItems(false);
    }
  };

  /* cancel payment */
  const handleCancelPayment = async (paymentId) => {
    if (!confirm('Скасувати цей платіж?')) return;
    hapticMedium();
    const res = await projectService.cancelPayment(paymentId);
    if (res.success) {
      hapticSuccess();
      const fresh = await load();
      if (onUpdate && fresh) onUpdate(fresh);
    } else {
      hapticError();
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Видалити цей платіж назавжди?')) return;
    hapticMedium();
    const res = await projectService.deletePayment(paymentId);
    if (res.success) {
      hapticSuccess();
      const fresh = await load();
      if (onUpdate && fresh) onUpdate(fresh);
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
  
  // Independent Agreed Sums
  let agreedUSD = parseFloat(project.agreed_sum_usd) || 0;
  let agreedUAH = parseFloat(project.agreed_sum_uah) || 0;
  
  // Backwards compatibility: If both new sums are 0, use the old agreed_sum field
  if (agreedUSD === 0 && agreedUAH === 0) {
    const oldAgreed = parseFloat(project.agreed_sum) || kpSum;
    if (project.currency === 'UAH') {
      agreedUAH = oldAgreed;
    } else {
      agreedUSD = oldAgreed;
    }
  }
  
  const validPay      = payments.filter(p => !p.status?.toLowerCase().includes('скасовано'));
  
  // Calculate paid amounts separately. Default old payments to project's main currency.
  const paidUSD       = validPay.filter(p => p.currency === 'USD' || (!p.currency && project.currency !== 'UAH'))
                                .reduce((a, p) => a + (parseFloat(p.sum) || 0), 0);
  const paidUAH       = validPay.filter(p => p.currency === 'UAH' || (!p.currency && project.currency === 'UAH'))
                                .reduce((a, p) => a + (parseFloat(p.sum) || 0), 0);
  
  const balances = {
    USD: agreedUSD - paidUSD,
    UAH: agreedUAH - paidUAH
  };

  const isModified    = !editingItems && project.proposal_id && items.length > 0 && itemsModified(items, origItems);
  const isClosed      = project.status === 'Виконано';

  // Project subtitle for display
  const proposalDisplay = project.name
    ? project.name
    : project.created_at
      ? `Створено ${formatDate(project.created_at)}`
      : `Проект #${String(project.id).slice(0, 8)}`;
  /* ================================================================ */
  return (
    <>


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

        {/* Action buttons (Close) */}
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
                <div className="card-body">
                  <FL icon={FileText}>Примітки</FL>
                  <textarea className="form-input" style={{ minHeight:80, fontSize:'0.85rem' }}
                    value={project.note || ''}
                    onChange={e => setProject({ ...project, note: e.target.value })}
                    placeholder="Додайте опис або важливі деталі..." />
                </div>
              </div>
            </div>
          </div>

          {/* ════ FINANCE & PAYMENTS ════ */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-header" style={{ padding: '8px 14px', justifyContent: 'space-between', background: 'rgba(240, 148, 51, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="section-label" style={{ fontSize: '0.85rem' }}>💰 Фінанси та Платежі</span>
              </div>
              <button
                className="btn btn-sm"
                style={{ 
                  background: 'var(--primary)', color: 'white', border: 'none', 
                  padding: '4px 10px', fontSize: '0.7rem', height: 26 
                }}
                onClick={() => setShowPaymentSheet(true)}
              >
                <Plus size={12} /> Додати платіж
              </button>
            </div>
            
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* USD ACCOUNT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <FL style={{ fontSize: '0.62rem', margin: 0 }}>Погоджено в USD ($)</FL>
                    {balances.USD < -1 && (
                      <span style={{ 
                        background: '#ede9fe', color: '#6d28d9', fontSize: '0.55rem', 
                        padding: '1px 5px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase' 
                      }}>
                        Переплата
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type="number" inputMode="numeric" className="form-input"
                      value={project.agreed_sum_usd || ''}
                      onChange={e => setProject({ ...project, agreed_sum_usd: e.target.value })}
                      placeholder="0"
                      style={{ fontSize: '0.9rem', fontWeight: 700, padding: '6px 10px', borderLeft: '3px solid #3b82f6' }} />
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Оплачено: <b>${paidUSD.toLocaleString()}</b>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', paddingTop: 18 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase' }}>
                    {balances.USD < -1 ? 'Наш борг USD' : 'Борг USD'}
                  </div>
                  <div style={{ 
                    fontSize: '1rem', fontWeight: 800, 
                    color: balances.USD < -1 ? '#8b5cf6' : (balances.USD > 1 ? 'var(--danger)' : 'var(--success)') 
                  }}>
                    {balances.USD < -1 ? `$${Math.abs(Math.round(balances.USD)).toLocaleString()}` : (balances.USD > 1 ? `$${Math.round(balances.USD).toLocaleString()}` : '✓')}
                  </div>
                </div>
              </div>

              {/* UAH ACCOUNT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, alignItems: 'flex-start', borderTop: '1px dashed var(--border-light)', paddingTop: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <FL style={{ fontSize: '0.62rem', margin: 0 }}>Погоджено в UAH (₴)</FL>
                    {balances.UAH < -1 && (
                      <span style={{ 
                        background: '#ede9fe', color: '#6d28d9', fontSize: '0.55rem', 
                        padding: '1px 5px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase' 
                      }}>
                        Переплата
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type="number" inputMode="numeric" className="form-input"
                      value={project.agreed_sum_uah || ''}
                      onChange={e => setProject({ ...project, agreed_sum_uah: e.target.value })}
                      placeholder="0"
                      style={{ fontSize: '0.9rem', fontWeight: 700, padding: '6px 10px', borderLeft: '3px solid #f09433' }} />
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Оплачено: <b>{paidUAH.toLocaleString()} ₴</b>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', paddingTop: 18 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase' }}>
                    {balances.UAH < -1 ? 'Наш борг UAH' : 'Борг UAH'}
                  </div>
                  <div style={{ 
                    fontSize: '1rem', fontWeight: 800, 
                    color: balances.UAH < -1 ? '#8b5cf6' : (balances.UAH > 1 ? 'var(--danger)' : 'var(--success)') 
                  }}>
                    {balances.UAH < -1 ? `${Math.abs(Math.round(balances.UAH)).toLocaleString()} ₴` : (balances.UAH > 1 ? `${Math.round(balances.UAH).toLocaleString()} ₴` : '✓')}
                  </div>
                </div>
              </div>

              {/* Payments List (Compact Rows) */}
              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 4, paddingTop: 10 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Історія оплат ({validPay.length})
                </div>
                
                {payments.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
                    Платежів ще немає
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {payments.map(p => {
                      const cancelled = p.status?.toLowerCase().includes('скасовано');
                      const isAdv     = p.payment_type === 'Аванс' || p.type === 'Аванс';
                      return (
                        <div key={p.id} style={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 10px', background: cancelled ? 'transparent' : 'white',
                          border: '1px solid var(--border-light)', borderRadius: 8,
                          opacity: cancelled ? 0.5 : 1,
                          position: 'relative'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ 
                              width: 32, height: 32, borderRadius: '50%', 
                              background: cancelled ? 'var(--border-light)' : (isAdv ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)'),
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAdv ? 'var(--info)' : 'var(--success)',
                              fontSize: '0.8rem', fontWeight: 800
                            }}>
                              {isAdv ? 'A' : 'P'}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                                {p.currency === 'UAH' ? `${Number(p.sum).toLocaleString()} ₴` : `$${Number(p.sum).toLocaleString()}`}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                {formatDate(p.date)} {p.note && `• ${p.note}`}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {!cancelled && (
                              <button onClick={() => handleCancelPayment(p.id)} className="btn btn-ghost btn-sm"
                                style={{ padding: 4, color: 'var(--text-muted)' }} title="Скасувати">
                                <X size={14} />
                              </button>
                            )}
                            <button onClick={() => handleDeletePayment(p.id)} className="btn btn-ghost btn-sm"
                              style={{ padding: 4, color: 'var(--danger)' }} title="Видалити">
                                <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════ MATERIALS ════ */}
        <div className="card" style={{ marginBottom: isMobile ? 80 : 24 }}>
          <div className="card-header" style={{ padding:'10px 14px', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span className="section-label" style={{ gap:6 }}>
                <Package size={13} />
                Матеріали по КП
                {displayItems.length > 0 && (
                  <span style={{ marginLeft:4, background:'var(--border-light)', color:'var(--text-secondary)', fontSize:'0.65rem', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>
                    {displayItems.length}
                  </span>
                )}
              </span>
              {isModified && !editingItems && (
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:3,
                  background:'#FFF3CD', color:'#856404', border:'1px solid #FFE069',
                  fontSize:'0.62rem', padding:'2px 8px', borderRadius:10, fontWeight:700
                }}>
                  <AlertTriangle size={9} /> Змінено відносно КП
                </span>
              )}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {!editingItems ? (
                <>
                  <button onClick={() => setShowKPModal(true)} className="btn btn-ghost btn-sm"
                    style={{ fontSize:'0.7rem', height:28, gap:4, background:'var(--primary-light)', color:'var(--primary)' }}>
                    <Clipboard size={14} /> Імпорт КП
                  </button>
                  <button onClick={handleEditItems} className="btn btn-primary btn-sm"
                    style={{ fontSize:'0.7rem', height:28, gap:4 }}>
                    <Edit3 size={14} /> Редагувати
                  </button>
                </>
              ) : (
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
                      <th style={thStyle('center','6px',60)}>К-сть</th>
                      <th style={thStyle('center','6px',60)}>Видано</th>
                      <th style={thStyle('left','14px')}>Коментар</th>
                      <th style={{ width:36, borderBottom: '1px solid var(--border)' }} />
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
                          </td>
                          <td style={{ padding:'9px 6px', textAlign:'center', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                            {parseFloat(item.quantity) || 0}
                          </td>
                          <td style={{ padding:'9px 6px', textAlign:'center', fontSize:'0.82rem', fontWeight: 700, color: (parseFloat(item.issued_qty) || 0) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                            {parseFloat(item.issued_qty) || 0}
                          </td>
                          <td style={{ padding:'9px 14px', fontSize:'0.75rem', color:'var(--text-muted)', fontStyle: 'italic' }}>
                            {item.note || ''}
                          </td>
                          <td style={{ padding:'0 10px', textAlign:'center' }}>
                            <button onClick={() => handleDeleteItemDirect(item.id)} className="btn btn-ghost btn-sm"
                              style={{ padding:4, color:'var(--danger)', opacity: 0.4 }} title="Видалити">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    {editingItems && (
                      <tr>
                        <td colSpan={4} style={{ padding:'8px 10px' }}>
                          <button onClick={handleAddItem} className="btn btn-ghost btn-sm"
                            style={{ color:'var(--primary)', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4, width:'100%', justifyContent:'center', borderTop:'1px dashed var(--border)' }}>
                            <Plus size={13} /> Додати позицію
                          </button>
                        </td>
                      </tr>
                    )}

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
                    onDelete={editingItems ? handleDeletePending : (it) => handleDeleteItemDirect(it.id)}
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
              boxShadow: '0 4px 166px rgba(0,0,0,0.25)',
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

      <KPSelectionModal 
        isOpen={showKPModal} 
        onClose={() => setShowKPModal(false)} 
        onSelect={handleSelectKP} 
      />

      <AddPaymentSheet
        isOpen={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        projectId={projectId}
        balances={balances}
        currency={currency}
        onSaved={async () => {
          const fresh = await load();
          if (onUpdate && fresh) onUpdate(fresh);
        }}
      />
    </>
  );
}
