import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, Truck, FileText, Check, Plus } from 'lucide-react';
import { crmApi } from '../../services/crmApi';

export function CrmShipmentModal({ project, onClose, onUpdate }) {
  const [items, setItems] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Форма нового відвантаження
  const [newShipment, setNewShipment] = useState({
    date: new Date().toISOString().split('T')[0],
    carrier: 'Нова Пошта',
    tracking_number: '',
    note: ''
  });
  
  // Кількість до відвантаження для кожної позиції
  const [shipQtys, setShipQtys] = useState({});

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const pItems = await crmApi.getProjectItems(project.id);
      const sData = await crmApi.getShipments(project.id);
      
      // Filter out services
      const materialItems = (pItems || []).filter(i => !i.is_service);
      setItems(materialItems);
      setShipments(sData || []);
      
      // Initialize shipQtys to 0
      const initialQtys = {};
      materialItems.forEach(i => initialQtys[i.id] = 0);
      setShipQtys(initialQtys);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIssuedQty = (itemId) => {
    let sum = 0;
    shipments.forEach(s => {
      s.shipment_items?.forEach(si => {
        if (si.project_item_id === itemId) {
          sum += parseFloat(si.quantity || 0);
        }
      });
    });
    return sum;
  };

  const handleSave = async () => {
    const itemsToShip = Object.keys(shipQtys)
      .map(id => ({ project_item_id: id, quantity: parseFloat(shipQtys[id]) || 0 }))
      .filter(i => i.quantity > 0);

    if (itemsToShip.length === 0) {
      alert('Вкажіть кількість хоча б для одного товару.');
      return;
    }

    setSaving(true);
    try {
      await crmApi.saveShipment({
        project_id: project.id,
        date: newShipment.date,
        carrier: newShipment.carrier,
        tracking_number: newShipment.tracking_number,
        note: newShipment.note
      }, itemsToShip);
      
      setShowAdd(false);
      setNewShipment({ ...newShipment, tracking_number: '', note: '' });
      await loadData();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Помилка збереження відвантаження');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '8px', width: '90%', maxWidth: '700px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} color="#F59E0B" /> Логістика та Відвантаження
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: '#6B7280' }}>Завантаження...</div>
          ) : (
            <>
              {/* Header section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#374151' }}>
                  Історія відвантажень ({shipments.length})
                </h4>
                {!showAdd && items.length > 0 && (
                  <button onClick={() => setShowAdd(true)} style={{
                    background: '#F59E0B', color: 'white', border: 'none', borderRadius: '4px',
                    padding: '6px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                  }}>
                    <Plus size={14} /> Створити накладну
                  </button>
                )}
              </div>

              {/* Form Create Shipment */}
              {showAdd && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '16px' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#92400E' }}>Нова накладна</h5>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#92400E', marginBottom: '4px' }}>Служба доставки</label>
                      <select 
                        value={newShipment.carrier} onChange={e => setNewShipment({...newShipment, carrier: e.target.value})}
                        style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #FCD34D', borderRadius: '4px', background: 'white' }}
                      >
                        <option value="Нова Пошта">Нова Пошта</option>
                        <option value="Самовивіз">Самовивіз</option>
                        <option value="Кур'єр">Кур'єр</option>
                        <option value="Укрпошта">Укрпошта</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#92400E', marginBottom: '4px' }}>ТТН / Номер</label>
                      <div style={{ position: 'relative' }}>
                        <Truck size={14} color="#D97706" style={{ position: 'absolute', left: '8px', top: '8px' }} />
                        <input 
                          type="text" value={newShipment.tracking_number} onChange={e => setNewShipment({...newShipment, tracking_number: e.target.value})}
                          style={{ width: '100%', padding: '6px 8px 6px 28px', fontSize: '13px', border: '1px solid #FCD34D', borderRadius: '4px', boxSizing: 'border-box' }}
                          placeholder="2045..."
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#92400E', marginBottom: '4px' }}>Дата</label>
                      <input 
                        type="date" value={newShipment.date} onChange={e => setNewShipment({...newShipment, date: e.target.value})}
                        style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #FCD34D', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#92400E', marginBottom: '4px' }}>Що відвантажуємо?</label>
                    <div style={{ background: 'white', border: '1px solid #FCD34D', borderRadius: '6px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead style={{ background: '#FEF3C7' }}>
                          <tr>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#92400E', borderBottom: '1px solid #FDE68A' }}>Товар</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#92400E', borderBottom: '1px solid #FDE68A', width: 60 }}>Залишок</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#92400E', borderBottom: '1px solid #FDE68A', width: 80 }}>Відвантажити</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => {
                            const issued = getIssuedQty(item.id);
                            const ordered = parseFloat(item.quantity) || 0;
                            const left = Math.max(0, ordered - issued);
                            
                            return (
                              <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: '8px 12px', color: '#374151', fontWeight: 500 }}>{item.name}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', color: left > 0 ? '#DC2626' : '#10B981', fontWeight: 700 }}>{left}</td>
                                <td style={{ padding: '4px 12px', textAlign: 'center' }}>
                                  <input 
                                    type="number" min="0" max={left} 
                                    value={shipQtys[item.id] || ''}
                                    onChange={(e) => setShipQtys({...shipQtys, [item.id]: e.target.value})}
                                    style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '12px' }}
                                    placeholder="0"
                                    disabled={left <= 0}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', border: '1px solid #D1D5DB', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Скасувати</button>
                    <button onClick={handleSave} disabled={saving} style={{ background: '#F59E0B', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {saving ? 'Збереження...' : <><Check size={14} /> Зберегти накладну</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Shipments List */}
              {shipments.length === 0 && !showAdd ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #E5E7EB', color: '#6B7280', fontSize: '13px' }}>
                  Ще не було жодного відвантаження
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shipments.map(s => (
                    <div key={s.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ background: '#F9FAFB', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, background: '#E5E7EB', padding: '2px 8px', borderRadius: '12px', color: '#374151' }}>{s.date}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Truck size={14} color="#6B7280" /> {s.carrier}
                          </span>
                          {s.tracking_number && (
                            <span style={{ fontSize: '13px', color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>ТТН: {s.tracking_number}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <tbody>
                            {s.shipment_items?.map(si => {
                              const itemName = items.find(i => i.id === si.project_item_id)?.name || 'Невідомий товар';
                              return (
                                <tr key={si.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                  <td style={{ padding: '8px 16px', color: '#4B5563' }}>{itemName}</td>
                                  <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700, color: '#111827', width: 80 }}>{si.quantity} шт</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </>
          )}

        </div>
      </div>
    </div>
  );
}
