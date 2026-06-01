import React, { useState, useEffect } from 'react';
import { X, Clipboard, ArrowRight, Check, Plus, Package, Trash2 } from 'lucide-react';
import { crmApi } from '../../services/crmApi';

export function QuickShipmentModal({ clientOverride = null, projectOverride = null, onClose, onUpdate }) {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Multi-row items list
  const [items, setItems] = useState([
    { name: '', quantity: '', unit: 'шт.', price: '', currency: 'UAH', status: 'Видано', note: '' }
  ]);

  // Fetch all clients if clientOverride is not specified
  useEffect(() => {
    if (!clientOverride) {
      loadClients();
    } else {
      setSelectedClientId(clientOverride.id);
      const filteredProj = (clientOverride.projects || []).filter(p => p.status !== 'Завершено' && p.status !== 'Скасовано');
      setProjects(filteredProj);
      if (projectOverride) {
        setSelectedProjectId(projectOverride.id);
      } else if (filteredProj.length === 1) {
        setSelectedProjectId(filteredProj[0].id);
      }
    }
  }, [clientOverride, projectOverride]);

  // Load clients from API
  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getClients();
      setClients(data || []);
    } catch (err) {
      console.error('Failed to load clients in quick shipment modal:', err);
    } finally {
      setLoading(false);
    }
  };

  // When selected client changes, load projects and apply auto-selection
  useEffect(() => {
    if (clientOverride) return; // Handled by outer useEffect
    if (!selectedClientId) {
      setProjects([]);
      setSelectedProjectId('');
      return;
    }
    const clientObj = clients.find(c => c.id === selectedClientId);
    if (clientObj) {
      const filteredProj = (clientObj.projects || []).filter(p => p.status !== 'Завершено' && p.status !== 'Скасовано');
      setProjects(filteredProj);
      if (filteredProj.length === 1) {
        setSelectedProjectId(filteredProj[0].id);
      } else {
        setSelectedProjectId('');
      }
    }
  }, [selectedClientId, clients, clientOverride]);

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { name: '', quantity: '', unit: 'шт.', price: '', currency: 'UAH', status: 'Видано', note: '' }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItemValue = (index, key, val) => {
    const updated = [...items];
    updated[index][key] = val;
    setItems(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Будь ласка, оберіть об\'єкт будівництва (угоду)');
      return;
    }

    const validItems = items.filter(item => item.name.trim() !== '' && parseFloat(item.quantity) > 0);
    if (validItems.length === 0) {
      alert('Будь ласка, заповніть хоча б один матеріал із правильною назвою та кількістю (> 0)');
      return;
    }

    setSaving(true);
    try {
      for (const item of validItems) {
        await crmApi.saveProjectMaterial({
          project_id: selectedProjectId,
          name: item.name.trim(),
          quantity: parseFloat(item.quantity),
          unit: item.unit || 'шт.',
          price: item.price.trim() !== '' ? parseFloat(item.price) : null,
          currency: item.currency,
          status: item.status,
          issued_by: 'Комірник',
          is_priced: item.price.trim() !== '',
          issued_at: new Date().toISOString(),
          note: item.note ? item.note.trim() : null
        });
      }

      alert('Всі матеріали успішно зареєстровано!');
      setItems([{ name: '', quantity: '', unit: 'шт.', price: '', currency: 'UAH', status: 'Видано', note: '' }]);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Помилка при збереженні матеріалів: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const showProjectSelector = projects.length > 1 && !projectOverride;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(44, 37, 32, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
    }}>
      <div style={{
        background: '#FAF8F5', border: '1px solid #D4C5B9', borderRadius: '12px',
        width: '95%', maxWidth: '780px', padding: '24px', boxShadow: '0 8px 32px rgba(139, 125, 112, 0.15)',
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '90vh'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#2C2520', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} color="#C4B4A6" /> 🚛 Швидка видача матеріалів (Склад)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} color="#8B7D73" />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#8B7D73', fontSize: '13px' }}>Завантаження контрагентів...</div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden', flex: 1 }}>
            
            {/* Selection Block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', flexShrink: 0 }}>
              {/* Counterparty Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#2C2520', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Контрагент
                </label>
                {clientOverride ? (
                  <div style={{
                    padding: '8px 10px', fontSize: '13px', border: '1px solid #EAE7E2', background: '#EAE7E2',
                    borderRadius: '6px', color: '#2C2520', fontWeight: 700
                  }}>
                    {clientOverride.name}
                  </div>
                ) : (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D4C5B9',
                      borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                    }}
                  >
                    <option value="">-- Оберіть контрагента --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Project (Agreement/Site) Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#2C2520', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Об'єкт будівництва (Угода)
                </label>
                {selectedClientId ? (
                  projectOverride ? (
                    <div style={{
                      padding: '8px 10px', fontSize: '13px', border: '1px solid #EAE7E2', background: '#EAE7E2',
                      borderRadius: '6px', color: '#2C2520', fontWeight: 700
                    }}>
                      {projectOverride.address || projectOverride.name || 'Нова угода'}
                    </div>
                  ) : !showProjectSelector ? (
                    projects.length === 1 ? (
                      <div style={{
                        padding: '8px 10px', fontSize: '13px', border: '1px solid #EAE7E2', background: '#FAF6F0',
                        borderRadius: '6px', color: '#2C2520', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: 700 }}>{projects[0].address || projects[0].name || 'Нова угода'}</span>
                        <span style={{ fontSize: '11px', color: '#8B7D73', background: '#FFFFFF', padding: '2px 6px', border: '1px solid #D4C5B9', borderRadius: '4px' }}>автовибір</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 600 }}>Не знайдено активних угод!</div>
                    )
                  ) : (
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D4C5B9',
                        borderRadius: '6px', outline: 'none', background: '#FFFFFF', color: '#2C2520', boxSizing: 'border-box'
                      }}
                    >
                      <option value="">-- Оберіть угоду / об'єкт --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.address || p.name || 'Нова угода'} ({p.status})</option>
                      ))}
                    </select>
                  )
                ) : (
                  <div style={{ fontSize: '12px', color: '#8B7D73', fontStyle: 'italic', padding: '8px 0' }}>Оберіть контрагента спочатку</div>
                )}
              </div>
            </div>

            {/* Materials Table Block */}
            {selectedProjectId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', flex: 1, borderTop: '1px solid #D4C5B9', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#2C2520', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Специфікація матеріалів до видачі
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    style={{
                      background: '#FAF6F0', color: '#8B7D73', border: '1px dashed #D4C5B9', borderRadius: '6px',
                      padding: '4px 10px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                    }}
                  >
                    <Plus size={12} /> Додати рядок
                  </button>
                </div>

                {/* Table Container */}
                <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #D4C5B9', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#FAF6F0', borderBottom: '1px solid #D4C5B9', position: 'sticky', top: 0, zIndex: 5 }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800 }}>Назва матеріалу</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, width: '90px' }}>Кількість</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, width: '60px' }}>Од. вим.</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, width: '100px' }}>Ціна (опц)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, width: '80px' }}>Валюта</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, width: '110px' }}>Статус</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, width: '130px' }}>Примітка</th>
                        <th style={{ padding: '8px 12px', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #FAF6F0' }}>
                          {/* Name */}
                          <td style={{ padding: '4px 8px' }}>
                            <input
                              type="text"
                              required
                              placeholder="Кабель, профіль..."
                              value={item.name}
                              onChange={(e) => handleUpdateItemValue(idx, 'name', e.target.value)}
                              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                          </td>
                          {/* Qty */}
                          <td style={{ padding: '4px 8px' }}>
                            <input
                              type="number"
                              step="any"
                              required
                              placeholder="0.00"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemValue(idx, 'quantity', e.target.value)}
                              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '4px', boxSizing: 'border-box', textAlign: 'center' }}
                            />
                          </td>
                          {/* Unit */}
                          <td style={{ padding: '4px 8px' }}>
                            <input
                              type="text"
                              placeholder="шт."
                              value={item.unit}
                              onChange={(e) => handleUpdateItemValue(idx, 'unit', e.target.value)}
                              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '4px', boxSizing: 'border-box', textAlign: 'center' }}
                            />
                          </td>
                          {/* Price */}
                          <td style={{ padding: '4px 8px' }}>
                            <input
                              type="number"
                              step="any"
                              placeholder="порожньо"
                              value={item.price}
                              onChange={(e) => handleUpdateItemValue(idx, 'price', e.target.value)}
                              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '4px', boxSizing: 'border-box', textAlign: 'center' }}
                            />
                          </td>
                          {/* Currency */}
                          <td style={{ padding: '4px 8px' }}>
                            <select
                              value={item.currency}
                              onChange={(e) => handleUpdateItemValue(idx, 'currency', e.target.value)}
                              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '4px', boxSizing: 'border-box' }}
                            >
                              <option value="UAH">UAH</option>
                              <option value="USD">USD</option>
                            </select>
                          </td>
                          {/* Status */}
                          <td style={{ padding: '4px 8px' }}>
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateItemValue(idx, 'status', e.target.value)}
                              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '4px', boxSizing: 'border-box' }}
                            >
                              <option value="Видано">Видано</option>
                              <option value="Заплановано">Заплановано</option>
                            </select>
                          </td>
                          {/* Note/Comment */}
                          <td style={{ padding: '4px 8px' }}>
                            <input
                              type="text"
                              placeholder="Коментар..."
                              value={item.note || ''}
                              onChange={(e) => handleUpdateItemValue(idx, 'note', e.target.value)}
                              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                          </td>
                          {/* Delete Action */}
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Footer Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      flex: 1, padding: '10px', background: '#FFFFFF', color: '#8B7D73',
                      border: '1px solid #D4C5B9', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 1, padding: '10px', background: '#C4B4A6', color: '#FFFFFF',
                      border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    {saving ? 'Збереження...' : <><Clipboard size={14} /> Зареєструвати видачу</>}
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
}
