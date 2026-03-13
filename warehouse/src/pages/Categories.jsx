import { useState, useEffect } from 'react';
import { getCategories, addCategory, updateCategory } from '../api/gasApi';
import { useToast } from '../context/ToastContext';

/**
 * Управління категоріями товарів.
 */
export default function Categories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', active: true });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getCategories();
      if (result?.success) {
        setCategories(result.categories || []);
      }
    } catch (err) {
      console.error('Помилка:', err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditItem(null);
    setFormData({ name: '', active: true });
    setShowModal(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setFormData({ name: item.name, active: item.active !== false });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateCategory({ 
          oldName: editItem.name, 
          name: formData.name, 
          active: formData.active 
        });
      } else {
        await addCategory(formData);
      }
      setShowModal(false);
      showToast(editItem ? 'Категорію оновлено' : 'Категорію додано', 'success');
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
          <h1 className="page-title">🏷️ Категорії товарів</h1>
          <p className="page-subtitle">Управління списком категорій для каталогу</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ Додати категорію</button>
      </div>

      <div className="card">
        <div className="data-table-wrap">
          {loading ? (
            <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Назва категорії</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.name} style={{ opacity: c.active ? 1 : 0.5 }}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>
                      <span className={`badge ${c.active ? 'badge-income' : 'badge-expense'}`}>
                        {c.active ? 'Активна' : 'Неактивна'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏️</button>
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
              <h3>{editItem ? '✏️ Редагувати категорію' : '➕ Нова категорія'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Назва *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                    placeholder="Напр.: Кріплення"
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.active} 
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })} 
                    />
                    Активна
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
