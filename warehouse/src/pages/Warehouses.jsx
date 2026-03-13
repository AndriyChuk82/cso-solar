import { useState, useEffect } from 'react';
import { getWarehouses, addWarehouse, updateWarehouse } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Управління складами. Лише для адміністратора.
 */
export default function Warehouses() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', responsible: '' });

  useEffect(() => { loadWarehouses(); }, []);

  async function loadWarehouses() {
    setLoading(true);
    try {
      const result = await getWarehouses();
      if (result?.success) setWarehouses(result.warehouses || []);
    } catch (err) {
      console.error('Помилка:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditItem(null);
    setFormData({ name: '', address: '', responsible: '' });
    setShowModal(true);
  }

  function openEdit(wh) {
    setEditItem(wh);
    setFormData({ name: wh.name, address: wh.address || '', responsible: wh.responsible || '' });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const data = { ...formData, active: true };
      if (editItem) {
        data.id = editItem.id;
        await updateWarehouse(data);
      } else {
        await addWarehouse(data);
      }
      setShowModal(false);
      showToast(editItem ? 'Склад оновлено' : 'Склад додано', 'success');
      loadWarehouses();
    } catch (err) {
      console.error('Помилка:', err);
      showToast('Помилка збереження', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(wh) {
    const action = wh.active ? 'деактивувати' : 'активувати';
    if (!confirm(`${action} склад "${wh.name}"?`)) return;
    try {
      await updateWarehouse({ ...wh, active: !wh.active });
      showToast(`Склад ${action} успішно`, 'success');
      loadWarehouses();
    } catch (err) {
      console.error('Помилка:', err);
      showToast('Помилка оновлення статусу', 'error');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏭 Склади</h1>
          <p className="page-subtitle">Управління переліком складів</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ Додати склад</button>
      </div>

      <div className="card">
        <div className="data-table-wrap">
          {loading ? (
            <div className="empty-state">
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Адреса</th>
                  <th>Відповідальний</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((wh) => (
                  <tr key={wh.id} style={{ opacity: wh.active ? 1 : 0.5 }}>
                    <td style={{ fontWeight: 600 }}>{wh.name}</td>
                    <td>{wh.address || '—'}</td>
                    <td>{wh.responsible || '—'}</td>
                    <td>
                      <span className={`badge ${wh.active ? 'badge-income' : 'badge-expense'}`}>
                        {wh.active ? 'Активний' : 'Неактивний'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(wh)}>✏️</button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleToggleActive(wh)}
                          style={{ color: wh.active ? 'var(--danger)' : 'var(--income)' }}
                        >
                          {wh.active ? '⏸️' : '▶️'}
                        </button>
                      </div>
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
              <h3>{editItem ? '✏️ Редагувати склад' : '➕ Новий склад'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Назва складу *</label>
                  <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Адреса</label>
                  <input type="text" className="form-input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Відповідальна особа</label>
                  <input type="text" className="form-input" value={formData.responsible} onChange={(e) => setFormData({ ...formData, responsible: e.target.value })} />
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
