import { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, getWarehouses, getProjects, verifySession } from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import CONFIG from '../config';
import { Button } from '@cso/design-system';

/**
 * Управління користувачами. Лише для адміністратора.
 */
export default function Users() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({ 
    email: '', 
    name: '', 
    role: 'user', 
    warehouse_id: '', 
    active: true,
    password: '',
    project_access: '',
    module_access: '', // Comma-separated module IDs
    warehouse_access: '' // Comma-separated warehouse permissions
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const userEmail = await verifySession();
      const [usResult, whResult, prResult] = await Promise.all([
        getUsers(), 
        getWarehouses(),
        getProjects(userEmail)
      ]);
      if (usResult?.success) setUsers(usResult.users || []);
      if (whResult?.success) setWarehouses(whResult.warehouses || []);
      if (prResult?.success) setProjects(prResult.projects || []);
    } catch (err) {
      console.error('Помилка:', err);
    } finally {
      setLoading(false);
    }
  }

  function parseInitialWarehousePerms(u) {
    if (!u) return CONFIG.PERMISSION_PRESETS.full.permissions.join(',');
    if (u.warehouse_access) {
      return Array.isArray(u.warehouse_access) ? u.warehouse_access.join(',') : String(u.warehouse_access);
    }
    if (u.module_access) {
      const perms = u.module_access.split(',')
        .map(s => s.trim())
        .filter(s => s.startsWith('wh_perm:') || s.startsWith('warehouse:'))
        .map(s => s.replace(/^(wh_perm:|warehouse:)/, ''));
      if (perms.length > 0) return perms.join(',');
    }
    const role = (u.role || '').toLowerCase();
    if (role === 'installer' || role === 'монтажник') {
      return CONFIG.PERMISSION_PRESETS.installer.permissions.join(',');
    }
    return CONFIG.PERMISSION_PRESETS.full.permissions.join(',');
  }

  function openAdd() {
    setEditItem(null);
    setFormData({ 
      email: '', 
      name: '', 
      role: 'user', 
      warehouse_id: '', 
      active: true, 
      password: '',
      project_access: '',
      module_access: 'warehouse',
      warehouse_access: CONFIG.PERMISSION_PRESETS.full.permissions.join(',')
    });
    setShowModal(true);
  }

  function openEdit(u) {
    setEditItem(u);
    setFormData({ 
      email: u.email, 
      name: u.name, 
      role: u.role, 
      warehouse_id: u.warehouse_id || '', 
      active: u.active,
      password: '',
      project_access: u.project_access || '',
      module_access: u.module_access || '',
      warehouse_access: parseInitialWarehousePerms(u)
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formData.email.trim() || !formData.name.trim()) return;
    setSaving(true);
    try {
      const res = editItem ? await updateUser(formData) : await addUser(formData);
      if (!res || res.success !== true) {
        throw new Error(res?.error || 'Помилка збереження користувача');
      }
      setShowModal(false);
      showToast(editItem ? 'Користувача оновлено' : 'Користувача додано', 'success');
      await loadData();
    } catch (err) {
      console.error('Помилка:', err);
      showToast(err.message || 'Помилка збереження', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Користувачі</h1>
          <p className="page-subtitle">Управління доступом до системи</p>
        </div>
        <Button variant="primary" onClick={openAdd}>➕ Додати користувача</Button>
      </div>

      <div className="card">
        <div className="data-table-wrap">
          {loading ? (
            <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Ім'я</th>
                  <th>Роль</th>
                  <th>Склад</th>
                  <th>Доступні розділи</th>
                  <th>Доступні проєкти</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email} style={{ opacity: u.active ? 1 : 0.5 }}>
                    <td>{u.email}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>
                      <span className="badge badge-transfer">{CONFIG.ROLE_LABELS[u.role] || u.role}</span>
                    </td>
                    <td>{warehouses.find((w) => w.id === u.warehouse_id)?.name || '—'}</td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className="badge badge-income" style={{fontSize: '0.65rem'}}>Всі</span>
                      ) : (
                        <div style={{ fontSize: '0.75rem', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(u.module_access || '').split(',').map(mid => CONFIG.APP_MODULES.find(m => m.id === mid)?.label).filter(Boolean).join(', ') || 'Нічого'}
                        </div>
                      )}
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className="badge badge-income" style={{fontSize: '0.65rem'}}>Всі</span>
                      ) : (
                        <div style={{ fontSize: '0.75rem', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(u.project_access || '').split(',').map(pid => projects.find(p => String(p.id) === String(pid))?.name).filter(Boolean).join(', ') || 'Нічого'}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-income' : 'badge-expense'}`}>
                        {u.active ? 'Активний' : 'Неактивний'}
                      </span>
                    </td>
                    <td>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>✏️</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? '✏️ Редагувати' : '➕ Новий користувач'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={!!editItem} />
                </div>
                <div className="form-group">
                  <label>Ім'я *</label>
                  <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>{editItem ? 'Змінити пароль (залиште порожнім, щоб не змінювати)' : 'Пароль для входу *'}</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    placeholder={editItem ? '••••••••' : 'Мінімум 6 символів'}
                    required={!editItem}
                  />
                  {!editItem && <span className="form-hint">Цей пароль буде використовуватися для входу на Vercel</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Роль</label>
                    <select className="form-select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      {Object.entries(CONFIG.ROLE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Закріплений склад</label>
                    <select className="form-select" value={formData.warehouse_id} onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}>
                      <option value="">Всі склади</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                    <span className="form-hint">Для комірника — обов'язково</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Доступ до розділів (модулів)</label>
                  {(formData.role === 'admin' || formData.role === 'адмін' || formData.role === 'адміністратор') ? (
                    <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px dashed var(--accent)', color: 'var(--accent)', fontSize: '0.85rem' }}>
                      ℹ️ Адміністратор має доступ до всіх розділів автоматично.
                    </div>
                  ) : (
                    <>
                      <div style={{ border: '1px solid var(--border, #ddd)', padding: '8px', borderRadius: '6px', background: 'var(--bg, #f9f9f9)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {CONFIG.APP_MODULES.map(m => {
                          const ids = (formData.module_access || '').split(',').map(s => s.trim()).filter(Boolean);
                          const isChecked = ids.includes(String(m.id));
                          return (
                            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentIds = (formData.module_access || '').split(',').map(s => s.trim()).filter(Boolean);
                                  const newIds = e.target.checked 
                                    ? [...currentIds, String(m.id)] 
                                    : currentIds.filter(id => id !== String(m.id));
                                  setFormData({ ...formData, module_access: newIds.join(',') });
                                }}
                              />
                              {m.label}
                            </label>
                          );
                        })}
                      </div>

                      {/* Гранулярні налаштування операцій Складу */}
                      {(formData.module_access || '').split(',').map(s => s.trim()).includes('warehouse') && (
                        <div style={{ marginTop: '14px', border: '1px solid #3b82f640', borderRadius: '8px', padding: '12px', background: '#3b82f608' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                              📦 Права на операції Складу:
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    role: 'installer',
                                    warehouse_access: CONFIG.PERMISSION_PRESETS.installer.permissions.join(',')
                                  });
                                }}
                                style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid #10b981', background: '#10b98115', color: '#059669', cursor: 'pointer', fontWeight: 600 }}
                              >
                                👷 Монтажник
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    warehouse_access: CONFIG.PERMISSION_PRESETS.full.permissions.join(',')
                                  });
                                }}
                                style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid #3b82f6', background: '#3b82f615', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                              >
                                👑 Всі операції
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {CONFIG.WAREHOUSE_PERMISSIONS.map(p => {
                              const currentPerms = (formData.warehouse_access || '').split(',').map(s => s.trim()).filter(Boolean);
                              const isChecked = currentPerms.includes(p.id);
                              return (
                                <label 
                                  key={p.id} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start', 
                                    gap: '8px', 
                                    cursor: 'pointer', 
                                    fontSize: '0.82rem',
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    background: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                                  }}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    style={{ marginTop: '2px' }}
                                    onChange={(e) => {
                                      const perms = (formData.warehouse_access || '').split(',').map(s => s.trim()).filter(Boolean);
                                      const newPerms = e.target.checked
                                        ? [...perms, p.id]
                                        : perms.filter(id => id !== p.id);
                                      setFormData({ ...formData, warehouse_access: newPerms.join(',') });
                                    }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: 600, color: p.isNegative ? '#dc2626' : 'var(--text)' }}>
                                      {p.label}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #666)' }}>
                                      {p.desc}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {(!['admin', 'адмін', 'адміністратор'].includes(formData.role)) && (formData.module_access || '').split(',').includes('projects') && (
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>Доступ до конкретних проєктів</label>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '4px', background: '#f9f9f9' }}>
                      {projects.map(p => {
                        const ids = (formData.project_access || '').split(',').filter(Boolean);
                        const isChecked = ids.includes(String(p.id));
                        return (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                const currentIds = (formData.project_access || '').split(',').filter(Boolean);
                                const newIds = e.target.checked 
                                  ? [...currentIds, String(p.id)] 
                                  : currentIds.filter(id => id !== String(p.id));
                                setFormData({ ...formData, project_access: newIds.join(',') });
                              }}
                            />
                            {p.name || p.number || p.id}
                          </label>
                        );
                      })}
                      {projects.length === 0 && <div className="text-muted" style={{fontSize: '0.85rem'}}>Немає доступних проєктів для вибору</div>}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                    Активний
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Скасувати</Button>
                <Button type="submit" variant="primary" disabled={saving} loading={saving}>{saving ? 'Збереження...' : 'Зберегти'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
