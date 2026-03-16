import { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, getWarehouses } from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import CONFIG from '../config';

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
  const [formData, setFormData] = useState({ 
    email: '', 
    name: '', 
    role: 'storekeeper', 
    warehouse_id: '', 
    active: true,
    password: '' 
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usResult, whResult] = await Promise.all([getUsers(), getWarehouses()]);
      if (usResult?.success) setUsers(usResult.users || []);
      if (whResult?.success) setWarehouses(whResult.warehouses || []);
    } catch (err) {
      console.error('Помилка:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditItem(null);
    setFormData({ email: '', name: '', role: 'storekeeper', warehouse_id: '', active: true, password: '' });
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
      password: '' // Don't show existing hash
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
        <button className="btn btn-primary" onClick={openAdd}>➕ Додати користувача</button>
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
                      <span className={`badge ${u.active ? 'badge-income' : 'badge-expense'}`}>
                        {u.active ? 'Активний' : 'Неактивний'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>✏️</button>
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                    Активний
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Скасувати</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Збереження...' : 'Зберегти'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
