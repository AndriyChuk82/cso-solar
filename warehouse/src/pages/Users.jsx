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
    module_access: '' // Comma-separated module IDs
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
      module_access: ''
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
      module_access: u.module_access || ''
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formData.email.trim() || !formData.name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateUser(formData);
      } else {
        await addUser(formData);
      }
      setShowModal(false);
      showToast(editItem ? 'Користувача оновлено' : 'Користувача додано', 'success');
      loadData();
    } catch (err) {
      console.error('Помилка:', err);
      showToast('Помилка збереження', 'error');
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
                    <div style={{ border: '1px solid #ddd', padding: '8px', borderRadius: '4px', background: '#f9f9f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {CONFIG.APP_MODULES.map(m => {
                        const ids = (formData.module_access || '').split(',').filter(Boolean);
                        const isChecked = ids.includes(String(m.id));
                        return (
                          <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                const currentIds = (formData.module_access || '').split(',').filter(Boolean);
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
