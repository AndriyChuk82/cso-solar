import React, { useState, useEffect } from 'react';
import { crmApi } from '../../services/crmApi';
import { ChevronLeft, Phone, Mail, Building, Plus, DollarSign, Package, Calendar, FileText, Check, Truck, X } from 'lucide-react';

export function CrmClientDetail({ client, onBack, onUpdate }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client.id) loadProjects();
  }, [client.id]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getProjectsByClient(client.id);
      setProjects(data || []);
    } catch (error) {
      console.error('Failed to load projects', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../services/supabaseClient');
      const { error } = await supabase.from('projects').insert({
        client_id: client.id,
        name: `Нова угода (${new Date().toLocaleDateString('uk-UA')})`,
        status: 'В роботі',
        currency: 'USD',
        agreed_sum_usd: 0,
        agreed_sum_uah: 0
      });
      if (error) throw error;
      await loadProjects();
    } catch (error) {
      alert('Помилка створення угоди: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F9FAFB', overflowY: 'auto' }}>
      
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <button 
          onClick={onBack}
          style={{ background: 'transparent', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>{client.name}</h2>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: '#6B7280' }}>
            {client.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {client.phone}</span>}
            {client.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {client.email}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F3F4F6', padding: '1px 6px', borderRadius: '10px' }}>
              <Building size={10} /> {client.type}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#374151' }}>Угоди (Проєкти) Клієнта</h3>
          <button 
            onClick={handleCreateProject}
            disabled={loading}
            style={{ 
              background: '#2563EB', color: 'white', border: 'none', borderRadius: '4px', 
              padding: '6px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}>
            <Plus size={14} /> Нова угода
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '13px' }}>Завантаження угод...</div>
        ) : projects.length === 0 ? (
          <div style={{ background: '#FFFFFF', border: '1px dashed #D1D5DB', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
            У цього клієнта ще немає активних угод.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {projects.map(project => (
              <ProjectCRMCard key={project.id} project={project} onUpdate={loadProjects} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCRMCard({ project, onUpdate }) {
  const [activeTab, setActiveTab] = useState('finances'); // 'finances' | 'logistics'

  // Розрахунок Фінансів
  const validPayments = (project.project_payments || []).filter(p => !p.status?.toLowerCase().includes('скасовано'));
  const paidUSD = validPayments.filter(p => p.currency === 'USD').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
  const paidUAH = validPayments.filter(p => p.currency === 'UAH').reduce((acc, p) => acc + (parseFloat(p.sum) || 0), 0);
  
  const agreedUSD = parseFloat(project.agreed_sum_usd) || 0;
  const agreedUAH = parseFloat(project.agreed_sum_uah) || 0;
  const debtUSD = agreedUSD - paidUSD;
  const debtUAH = agreedUAH - paidUAH;

  // Розрахунок Логістики
  const materialItems = (project.project_items || []).filter(i => !i.is_service);
  let totalOrdered = 0;
  materialItems.forEach(i => totalOrdered += (parseFloat(i.quantity) || 0));

  let totalIssued = 0;
  (project.project_shipments || []).forEach(ship => {
    (ship.shipment_items || []).forEach(si => {
      if (materialItems.some(mi => mi.id === si.project_item_id)) {
        totalIssued += parseFloat(si.quantity) || 0;
      }
    });
  });
  const leftToIssue = Math.max(0, totalOrdered - totalIssued);

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Project Header */}
      <div style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>
            {project.address || 'Проєкт без адреси'} <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: '8px' }}>#{project.id.slice(0, 8)}</span>
          </h4>
        </div>
        <span style={{ background: project.status === 'Виконано' ? '#D1FAE5' : '#FEF3C7', color: project.status === 'Виконано' ? '#065F46' : '#92400E', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
          {project.status || 'В роботі'}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
        <button 
          onClick={() => setActiveTab('finances')}
          style={{ 
            flex: 1, padding: '10px', background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'finances' ? '2px solid #10B981' : '2px solid transparent',
            color: activeTab === 'finances' ? '#111827' : '#6B7280',
            fontWeight: activeTab === 'finances' ? 700 : 500, fontSize: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <DollarSign size={14} color={activeTab === 'finances' ? '#10B981' : '#9CA3AF'} /> 
          Фінанси (Борг: {debtUSD < 0 ? '0' : debtUSD}$)
        </button>
        <button 
          onClick={() => setActiveTab('materials')}
          style={{ 
            flex: 1, padding: '10px', background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'materials' ? '2px solid #F59E0B' : '2px solid transparent',
            color: activeTab === 'materials' ? '#111827' : '#6B7280',
            fontWeight: activeTab === 'materials' ? 700 : 500, fontSize: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          <Package size={14} color={activeTab === 'materials' ? '#F59E0B' : '#9CA3AF'} /> 
          Матеріали (Залишок: {leftToIssue} шт)
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '16px', background: '#FFFFFF' }}>
        {activeTab === 'finances' && <ProjectFinancesTab project={project} validPayments={validPayments} debtUSD={debtUSD} debtUAH={debtUAH} onUpdate={onUpdate} />}
        {activeTab === 'materials' && <ProjectMaterialsTab project={project} materialItems={materialItems} shipments={project.project_shipments || []} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Вкладка ФІНАНСИ
// -------------------------------------------------------------
function ProjectFinancesTab({ project, validPayments, debtUSD, debtUAH, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newPayment, setNewPayment] = useState({ sum: '', currency: 'USD', date: new Date().toISOString().split('T')[0], payment_type: 'Оплата', note: '' });

  const [agreedSums, setAgreedSums] = useState({
    usd: parseFloat(project.agreed_sum_usd) || 0,
    uah: parseFloat(project.agreed_sum_uah) || 0
  });

  const saveAgreedSums = async () => {
    setSaving(true);
    try {
      const { supabase } = await import('../../services/supabaseClient');
      await supabase.from('projects').update({
        agreed_sum_usd: agreedSums.usd,
        agreed_sum_uah: agreedSums.uah
      }).eq('id', project.id);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка збереження суми');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPayment = async (paymentId) => {
    if (!window.confirm('Ви впевнені, що хочете скасувати цей платіж?')) return;
    setSaving(true);
    try {
      const { supabase } = await import('../../services/supabaseClient');
      const { error } = await supabase.from('project_payments').update({ status: 'Скасовано' }).eq('id', paymentId);
      if (error) throw error;
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка скасування платежу: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!newPayment.sum) return;
    setSaving(true);
    try {
      await crmApi.savePayment({
        project_id: project.id, sum: parseFloat(newPayment.sum), currency: newPayment.currency,
        date: newPayment.date, payment_type: newPayment.payment_type, note: newPayment.note, status: 'Оплачено'
      });
      setShowAdd(false);
      setNewPayment({ ...newPayment, sum: '', note: '' });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Баланс */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#F9FAFB', padding: '12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {debtUSD < 0 ? 'ПЕРЕПЛАТА USD' : 'БОРГ USD'}
            (Погоджено: 
            <input 
              type="number" 
              value={agreedSums.usd} 
              onChange={e => setAgreedSums({...agreedSums, usd: parseFloat(e.target.value) || 0})}
              onBlur={saveAgreedSums}
              style={{ width: '60px', marginLeft: '4px', fontSize: '11px', padding: '2px 4px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
            /> $)
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: debtUSD < 0 ? '#10B981' : '#111827' }}>${Math.abs(debtUSD).toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {debtUAH < 0 ? 'ПЕРЕПЛАТА UAH' : 'БОРГ UAH'}
            (Погоджено: 
            <input 
              type="number" 
              value={agreedSums.uah} 
              onChange={e => setAgreedSums({...agreedSums, uah: parseFloat(e.target.value) || 0})}
              onBlur={saveAgreedSums}
              style={{ width: '80px', marginLeft: '4px', fontSize: '11px', padding: '2px 4px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
            /> ₴)
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: debtUAH < 0 ? '#10B981' : '#111827' }}>{Math.abs(debtUAH).toLocaleString()} ₴</div>
        </div>
      </div>

      {/* Список платежів */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>Журнал транзакцій</h5>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <Plus size={12} /> Додати платіж
          </button>
        )}
      </div>

      {showAdd && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '12px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#065F46', marginBottom: '4px' }}>Сума</label>
            <input type="number" value={newPayment.sum} onChange={e => setNewPayment({...newPayment, sum: e.target.value})} style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #A7F3D0', borderRadius: '4px' }} placeholder="0" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#065F46', marginBottom: '4px' }}>Валюта</label>
            <select value={newPayment.currency} onChange={e => setNewPayment({...newPayment, currency: e.target.value})} style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #A7F3D0', borderRadius: '4px' }}>
              <option value="USD">USD</option><option value="UAH">UAH</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#065F46', marginBottom: '4px' }}>Дата</label>
            <input type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #A7F3D0', borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#065F46', marginBottom: '4px' }}>Коментар</label>
            <input type="text" value={newPayment.note} onChange={e => setNewPayment({...newPayment, note: e.target.value})} style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #A7F3D0', borderRadius: '4px' }} placeholder="..." />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #A7F3D0', padding: '6px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Скасувати</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#10B981', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{saving ? '...' : 'Зберегти'}</button>
          </div>
        </div>
      )}

      {validPayments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '6px' }}>Оплат ще не було</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {validPayments.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: p.currency === 'UAH' ? '#F59E0B' : '#3B82F6', width: '70px' }}>
                  {p.currency === 'UAH' ? `${Number(p.sum).toLocaleString()} ₴` : `$${Number(p.sum).toLocaleString()}`}
                </span>
                <span style={{ fontSize: '11px', color: '#6B7280', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{p.date}</span>
                {p.note && <span style={{ fontSize: '12px', color: '#4B5563' }}>{p.note}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{p.payment_type}</span>
                <button 
                  onClick={() => handleCancelPayment(p.id)}
                  disabled={saving}
                  style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                  title="Скасувати платіж"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Вкладка МАТЕРІАЛИ
// -------------------------------------------------------------
import { KPSelectionModal } from '../../components/KPSelectionModal';
import { projectService } from '../../services/api';

function ProjectMaterialsTab({ project, materialItems, shipments, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showKPModal, setShowKPModal] = useState(false);
  const [newShipment, setNewShipment] = useState({ date: new Date().toISOString().split('T')[0], carrier: 'Самовивіз', tracking_number: '', note: '' });
  const [shipQtys, setShipQtys] = useState({});

  // Нові стани для швидкої транзакції
  const [shipPrices, setShipPrices] = useState({});
  const [shipCurrencies, setShipCurrencies] = useState({});
  const [newItems, setNewItems] = useState([]);
  const [addToContract, setAddToContract] = useState(true);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('USD');
  const [paymentType, setPaymentType] = useState('Готівка');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    const initialQtys = {};
    const initialPrices = {};
    const initialCurrencies = {};
    materialItems.forEach(i => {
      initialQtys[i.id] = 0;
      initialPrices[i.id] = 0;
      initialCurrencies[i.id] = 'USD';
    });
    setShipQtys(initialQtys);
    setShipPrices(initialPrices);
    setShipCurrencies(initialCurrencies);
  }, [materialItems]);

  const getIssuedQty = (itemId) => {
    let sum = 0;
    shipments.forEach(s => s.shipment_items?.forEach(si => { if (si.project_item_id === itemId) sum += parseFloat(si.quantity || 0); }));
    return sum;
  };

  const handleSaveShipment = async () => {
    // 1. Збираємо існуючі товари для відвантаження
    const itemsToShip = Object.keys(shipQtys)
      .map(id => ({
        project_item_id: id,
        quantity: parseFloat(shipQtys[id]) || 0,
        price: parseFloat(shipPrices[id]) || 0,
        currency: shipCurrencies[id] || 'USD'
      }))
      .filter(i => i.quantity > 0);

    // 2. Збираємо нові кастомні товари
    const customItems = newItems.filter(item => item.name.trim() !== '' && (parseFloat(item.quantity) || 0) > 0);

    if (itemsToShip.length === 0 && customItems.length === 0) {
      return alert('Вкажіть кількість для відвантаження');
    }

    setSaving(true);
    try {
      const { supabase } = await import('../../services/supabaseClient');

      // Крок А: Створюємо кастомні товари у проекті, щоб отримати їх ID
      const savedCustomItems = [];
      for (const item of customItems) {
        const { data, error } = await supabase
          .from('project_items')
          .insert({
            project_id: project.id,
            name: item.name,
            quantity: parseFloat(item.quantity) || 0,
            is_service: false,
            note: item.note || ''
          })
          .select()
          .single();
        if (error) throw error;
        
        savedCustomItems.push({
          project_item_id: data.id,
          quantity: parseFloat(item.quantity) || 0,
          price: parseFloat(item.price) || 0,
          currency: item.currency || 'USD'
        });
      }

      // Об'єднуємо всі товари для накладної
      const allShipmentItems = [...itemsToShip, ...savedCustomItems];

      // Крок B: Вираховуємо загальну вартість відвантаження
      let totalUSD = 0;
      let totalUAH = 0;
      allShipmentItems.forEach(item => {
        const cost = item.quantity * item.price;
        if (item.currency === 'USD') {
          totalUSD += cost;
        } else {
          totalUAH += cost;
        }
      });

      // Крок C: Збільшуємо погоджену суму, якщо обрано відповідну опцію
      if (addToContract) {
        const currentAgreedUSD = parseFloat(project.agreed_sum_usd) || 0;
        const currentAgreedUAH = parseFloat(project.agreed_sum_uah) || 0;
        const { error: projectErr } = await supabase
          .from('projects')
          .update({
            agreed_sum_usd: currentAgreedUSD + totalUSD,
            agreed_sum_uah: currentAgreedUAH + totalUAH
          })
          .eq('id', project.id);
        if (projectErr) throw projectErr;
      }

      // Крок D: Зберігаємо накладну та зв'язані товари
      await crmApi.saveShipment({ project_id: project.id, ...newShipment }, allShipmentItems);

      // Крок E: Записуємо платіж, якщо він вказаний
      const paidSum = parseFloat(paymentAmount) || 0;
      if (paidSum > 0) {
        await crmApi.savePayment({
          project_id: project.id,
          sum: paidSum,
          currency: paymentCurrency,
          date: newShipment.date || new Date().toISOString().split('T')[0],
          payment_type: paymentType,
          note: paymentNote || `Оплата при відвантаженні (${newShipment.carrier})`,
          status: 'Оплачено'
        });
      }

      // Скидання станів
      setShowAdd(false);
      setNewShipment({ date: new Date().toISOString().split('T')[0], carrier: 'Самовивіз', tracking_number: '', note: '' });
      setShipQtys({});
      setShipPrices({});
      setShipCurrencies({});
      setNewItems([]);
      setPaymentAmount('');
      setPaymentNote('');

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Помилка збереження: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShipment = async (shipmentId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити це відвантаження? Матеріальний борг клієнта буде відновлено.')) return;
    setSaving(true);
    try {
      const { supabase } = await import('../../services/supabaseClient');
      await supabase.from('shipment_items').delete().eq('shipment_id', shipmentId);
      const { error } = await supabase.from('project_shipments').delete().eq('id', shipmentId);
      if (error) throw error;
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Помилка видалення: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectKP = async (proposalId) => {
    setShowKPModal(false);
    setSaving(true);
    try {
      const res = await projectService.importFromProposal(project.id, proposalId);
      if (res.success) {
        if (onUpdate) onUpdate();
      } else {
        alert('Помилка імпорту: ' + res.error);
      }
    } catch (err) {
      alert('Помилка підключення');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItemNote = async (item, note) => {
    try {
      const { supabase } = await import('../../services/supabaseClient');
      await supabase.from('project_items').update({ note }).eq('id', item.id);
      if (onUpdate) onUpdate(); // Update local state seamlessly
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Матеріали та Залишки */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>Матеріали по проєкту</h5>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowKPModal(true)} style={{ background: '#E0E7FF', color: '#4338CA', border: '1px solid #C7D2FE', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <FileText size={12} /> Імпорт КП
          </button>
          {!showAdd && (
            <button onClick={() => setShowAdd(true)} style={{ background: '#F59E0B', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Plus size={12} /> Відвантажити
            </button>
          )}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '24px' }}>
        <thead style={{ background: '#F9FAFB' }}>
          <tr>
            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>Найменування</th>
            <th style={{ padding: '8px', textAlign: 'center', fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB', width: '60px' }}>Замовлено</th>
            <th style={{ padding: '8px', textAlign: 'center', fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB', width: '60px' }}>Борг (шт)</th>
            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB', width: '150px' }}>Коментар</th>
          </tr>
        </thead>
        <tbody>
          {materialItems.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>Матеріалів немає</td></tr>
          ) : materialItems.map(item => {
            const issued = getIssuedQty(item.id);
            const ordered = parseFloat(item.quantity) || 0;
            const left = Math.max(0, ordered - issued);
            return (
              <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '8px', color: '#111827', fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: '8px', textAlign: 'center', color: '#6B7280' }}>{ordered}</td>
                <td style={{ padding: '8px', textAlign: 'center', color: left > 0 ? '#DC2626' : '#10B981', fontWeight: 700 }}>{left}</td>
                <td style={{ padding: '4px 8px' }}>
                  <input 
                    type="text" 
                    defaultValue={item.note || ''} 
                    placeholder="..." 
                    onBlur={(e) => {
                      if (e.target.value !== item.note) {
                        handleUpdateItemNote(item, e.target.value);
                      }
                    }}
                    style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid transparent', borderRadius: '4px', background: '#F3F4F6' }}
                    onFocus={(e) => e.target.style.border = '1px solid #D1D5DB'}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {showAdd && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h5 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#92400E' }}>Нова комплексна транзакція</h5>
            <button 
              onClick={() => {
                const newQtys = { ...shipQtys };
                materialItems.forEach(item => {
                  const left = Math.max(0, (parseFloat(item.quantity) || 0) - getIssuedQty(item.id));
                  if (left > 0) newQtys[item.id] = left;
                });
                setShipQtys(newQtys);
              }}
              style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Вибрати всі залишки
            </button>
          </div>
          
          {/* Специфікація доставки */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '16px' }}>
            <select value={newShipment.carrier} onChange={e => setNewShipment({...newShipment, carrier: e.target.value})} style={{ padding: '6px', fontSize: '12px', border: '1px solid #FCD34D', borderRadius: '4px' }}>
              <option value="Самовивіз">Самовивіз</option>
              <option value="Нова Пошта">Нова Пошта</option>
            </select>
            <input type="text" placeholder="ТТН (за наявності)..." value={newShipment.tracking_number} onChange={e => setNewShipment({...newShipment, tracking_number: e.target.value})} style={{ padding: '6px', fontSize: '12px', border: '1px solid #FCD34D', borderRadius: '4px' }} />
            <input type="date" value={newShipment.date} onChange={e => setNewShipment({...newShipment, date: e.target.value})} style={{ padding: '6px', fontSize: '12px', border: '1px solid #FCD34D', borderRadius: '4px' }} />
          </div>

          {/* Список Товарів */}
          <h6 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>📦 Товари для відвантаження</h6>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #FDE68A', color: '#92400E' }}>
                <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Товар</th>
                <th style={{ textAlign: 'center', paddingBottom: '4px', width: '80px' }}>К-ть</th>
                <th style={{ textAlign: 'center', paddingBottom: '4px', width: '80px' }}>Ціна/шт</th>
                <th style={{ textAlign: 'center', paddingBottom: '4px', width: '70px' }}>Валюта</th>
              </tr>
            </thead>
            <tbody>
              {materialItems.map(item => {
                const left = Math.max(0, (parseFloat(item.quantity) || 0) - getIssuedQty(item.id));
                if (left <= 0) return null;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #FEF3C7' }}>
                    <td style={{ padding: '6px 0', color: '#4B5563', fontWeight: 500 }}>
                      {item.name} <span style={{ color: '#9CA3AF', fontSize: '10px' }}>(борг: {left} шт)</span>
                    </td>
                    <td style={{ padding: '6px 0', width: '80px' }}>
                      <input 
                        type="number" 
                        min="0" 
                        max={left} 
                        value={shipQtys[item.id] || ''} 
                        onChange={e => setShipQtys({...shipQtys, [item.id]: e.target.value})} 
                        placeholder={`Макс: ${left}`} 
                        style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #FCD34D', borderRadius: '4px' }} 
                      />
                    </td>
                    <td style={{ padding: '6px 4px', width: '80px' }}>
                      <input 
                        type="number" 
                        min="0" 
                        value={shipPrices[item.id] || ''} 
                        onChange={e => setShipPrices({...shipPrices, [item.id]: e.target.value})} 
                        placeholder="0" 
                        style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #FCD34D', borderRadius: '4px' }} 
                      />
                    </td>
                    <td style={{ padding: '6px 0', width: '70px' }}>
                      <select 
                        value={shipCurrencies[item.id] || 'USD'} 
                        onChange={e => setShipCurrencies({...shipCurrencies, [item.id]: e.target.value})}
                        style={{ width: '100%', padding: '4px', border: '1px solid #FCD34D', borderRadius: '4px', background: '#FFF' }}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="UAH">UAH (₴)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              
              {/* Нові товари, додані на льоту */}
              {newItems.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #FEF3C7' }}>
                  <td style={{ padding: '6px 0' }}>
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={e => {
                        const next = [...newItems];
                        next[idx].name = e.target.value;
                        setNewItems(next);
                      }} 
                      placeholder="Назва товару на льоту..." 
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid #F59E0B', borderRadius: '4px', fontSize: '11px' }} 
                    />
                  </td>
                  <td style={{ padding: '6px 0', width: '80px' }}>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={e => {
                        const next = [...newItems];
                        next[idx].quantity = e.target.value;
                        setNewItems(next);
                      }} 
                      placeholder="К-ть" 
                      style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #F59E0B', borderRadius: '4px' }} 
                    />
                  </td>
                  <td style={{ padding: '6px 4px', width: '80px' }}>
                    <input 
                      type="number" 
                      min="0" 
                      value={item.price} 
                      onChange={e => {
                        const next = [...newItems];
                        next[idx].price = e.target.value;
                        setNewItems(next);
                      }} 
                      placeholder="0" 
                      style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #F59E0B', borderRadius: '4px' }} 
                    />
                  </td>
                  <td style={{ padding: '6px 0', width: '70px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <select 
                      value={item.currency} 
                      onChange={e => {
                        const next = [...newItems];
                        next[idx].currency = e.target.value;
                        setNewItems(next);
                      }}
                      style={{ flex: 1, padding: '4px', border: '1px solid #F59E0B', borderRadius: '4px', background: '#FFF' }}
                    >
                      <option value="USD">USD</option>
                      <option value="UAH">UAH</option>
                    </select>
                    <button 
                      type="button" 
                      onClick={() => setNewItems(newItems.filter(x => x.id !== item.id))} 
                      style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            type="button"
            onClick={() => setNewItems([...newItems, { id: 'temp_' + Date.now(), name: '', quantity: '1', price: '0', currency: 'USD', note: 'Додано на льоту' }])}
            style={{ background: '#FFF', color: '#D97706', border: '1px dashed #FCD34D', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px' }}
          >
            + Додати інший товар на льоту
          </button>

          {/* Фінансовий розрахунок */}
          <div style={{ background: '#FFFFFF', border: '1px solid #FCD34D', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
            <h6 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>💳 Фінансовий розрахунок домовленості</h6>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <input 
                type="checkbox" 
                id="addToContract" 
                checked={addToContract} 
                onChange={e => setAddToContract(e.target.checked)} 
              />
              <label htmlFor="addToContract" style={{ fontSize: '11px', color: '#4B5563', cursor: 'pointer', fontWeight: 600 }}>
                Додати вартість відвантаженого товару до загальної суми боргу
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#6B7280', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Оплачено зараз (Сума)</label>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  placeholder="0" 
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D1D5DB', borderRadius: '4px' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#6B7280', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Валюта оплати</label>
                <select 
                  value={paymentCurrency} 
                  onChange={e => setPaymentCurrency(e.target.value)} 
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#FFF' }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="UAH">UAH (₴)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#6B7280', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Каса / Метод</label>
                <select 
                  value={paymentType} 
                  onChange={e => setPaymentType(e.target.value)} 
                  style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#FFF' }}
                >
                  <option value="Готівка">Готівка</option>
                  <option value="Карта">Карта</option>
                  <option value="Рахунок">Рахунок</option>
                </select>
              </div>
            </div>
            
            <input 
              type="text" 
              placeholder="Коментар до оплати (наприклад: Оплата за 1 інвертор)..." 
              value={paymentNote} 
              onChange={e => setPaymentNote(e.target.value)} 
              style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #D1D5DB', borderRadius: '4px', marginTop: '4px' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAdd(false)} style={{ background: 'transparent', border: '1px solid #D1D5DB', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Скасувати</button>
            <button onClick={handleSaveShipment} disabled={saving} style={{ background: '#F59E0B', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{saving ? '...' : 'Зафіксувати транзакцію'}</button>
          </div>
        </div>
      )}

      {/* Історія відвантажень */}
      <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#374151' }}>Історія відвантажень</h5>
      {shipments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '6px' }}>Відвантажень ще не було</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shipments.map(s => (
            <div key={s.id} style={{ border: '1px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ background: '#F9FAFB', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', fontSize: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#374151' }}>{s.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}><Truck size={12} /> {s.carrier}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {s.tracking_number && <span style={{ color: '#2563EB', fontWeight: 600 }}>ТТН: {s.tracking_number}</span>}
                  <button 
                    onClick={() => handleDeleteShipment(s.id)}
                    disabled={saving}
                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    title="Видалити відвантаження"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '8px 12px' }}>
                {s.shipment_items?.map(si => {
                  const itemName = materialItems.find(i => i.id === si.project_item_id)?.name || 'Невідомий товар';
                  return (
                    <div key={si.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4B5563', marginBottom: '4px' }}>
                      <span>{itemName}</span><span style={{ fontWeight: 700, color: '#111827' }}>{si.quantity} шт</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {showKPModal && (
        <KPSelectionModal isOpen={true} onClose={() => setShowKPModal(false)} onSelect={handleSelectKP} />
      )}
    </div>
  );
}
