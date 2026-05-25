import React, { useEffect, useState } from 'react';
import { crmApi } from '../../services/crmApi';
import { ArrowLeft, Plus, Calendar, DollarSign, Package, Check, X, Clipboard, Truck, AlertCircle, Info } from 'lucide-react';
import { formatAmount } from '../../lib/utils';

export function CrmSupplierDetail({ supplier, onBack, onUpdate }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deals'); // 'deals', 'summary', 'receipts'
  
  // Modals state
  const [showDealModal, setShowDealModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedDealForReceipt, setSelectedDealForReceipt] = useState(null);

  // New Deal form state
  const [dealTitle, setDealTitle] = useState('');
  const [dealSum, setDealSum] = useState('');
  const [dealCurrency, setDealCurrency] = useState('UAH');
  const [dealPaidAt, setDealPaidAt] = useState(new Date().toISOString().substring(0, 16));
  const [dealNote, setDealNote] = useState('');
  const [dealItems, setDealItems] = useState([{ name: '', quantity: '', unit: 'шт.' }]);

  // New Receipt form state
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().substring(0, 16));
  const [receiptNote, setReceiptNote] = useState('');
  const [receiptQuantities, setReceiptQuantities] = useState({}); // { item_id: qty }

  useEffect(() => {
    loadDeals();
  }, [supplier.id]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getSupplierDeals(supplier.id);
      setDeals(data || []);
    } catch (error) {
      console.error('Помилка завантаження угод постачальника:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (!dealSum || parseFloat(dealSum) <= 0) return alert('Вкажіть суму оплати');

    const validItems = dealItems.filter(i => i.name.trim() && parseFloat(i.quantity) > 0);
    if (validItems.length === 0) {
      return alert('Додайте хоча б один товар або матеріал');
    }

    let finalTitle = dealTitle.trim();
    if (!finalTitle) {
      const dateObj = dealPaidAt ? new Date(dealPaidAt) : new Date();
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      finalTitle = `Нова угода від ${day}.${month}.${year}`;
    }

    try {
      const dealData = {
        supplier_id: supplier.id,
        title: finalTitle,
        paid_sum: parseFloat(dealSum),
        currency: dealCurrency,
        paid_at: new Date(dealPaidAt).toISOString(),
        note: dealNote,
        status: 'Активна'
      };

      await crmApi.saveSupplierDeal(dealData, validItems);
      
      // Save Audit Log
      await crmApi.saveAuditLog({
        clientId: null,
        projectId: null,
        actionType: 'Угода з постачальником',
        details: `Створено нову угоду "${finalTitle}" з постачальником "${supplier.name}" на суму ${parseFloat(dealSum).toLocaleString()} ${dealCurrency}.`
      });

      setShowDealModal(false);
      
      // Reset form
      setDealTitle('');
      setDealSum('');
      setDealCurrency('UAH');
      setDealPaidAt(new Date().toISOString().substring(0, 16));
      setDealNote('');
      setDealItems([{ name: '', quantity: '', unit: 'шт.' }]);
      
      loadDeals();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Помилка створення угоди: ' + err.message);
    }
  };

  const openReceiptModal = (deal) => {
    setSelectedDealForReceipt(deal);
    const initialQtys = {};
    deal.supplier_deal_items.forEach(item => {
      const remaining = Math.max(0, item.quantity - item.received_quantity);
      initialQtys[item.id] = remaining > 0 ? remaining : 0;
    });
    setReceiptQuantities(initialQtys);
    setReceiptDate(new Date().toISOString().substring(0, 16));
    setReceiptNote('');
    setShowReceiptModal(true);
  };

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    if (!selectedDealForReceipt) return;

    const itemsToSend = [];
    let hasQuantity = false;

    Object.entries(receiptQuantities).forEach(([itemId, qty]) => {
      const parsedQty = parseFloat(qty) || 0;
      if (parsedQty > 0) {
        itemsToSend.push({
          deal_item_id: itemId,
          quantity: parsedQty
        });
        hasQuantity = true;
      }
    });

    if (!hasQuantity) {
      return alert('Вкажіть отриману кількість хоча б для одного матеріалу');
    }

    try {
      const receiptData = {
        deal_id: selectedDealForReceipt.id,
        received_at: new Date(receiptDate).toISOString(),
        note: receiptNote
      };

      await crmApi.saveSupplierReceipt(receiptData, itemsToSend);

      // Check if all items in the deal are fully delivered
      const updatedDealItems = selectedDealForReceipt.supplier_deal_items.map(item => {
        const addedQty = parseFloat(receiptQuantities[item.id]) || 0;
        return {
          ...item,
          received_quantity: item.received_quantity + addedQty
        };
      });

      const allDelivered = updatedDealItems.every(item => item.received_quantity >= item.quantity);
      if (allDelivered) {
        await crmApi.updateSupplierDealStatus(selectedDealForReceipt.id, 'Завершена');
      }

      await crmApi.saveAuditLog({
        clientId: null,
        projectId: null,
        actionType: 'Надходження товарів',
        details: `Зареєстровано надходження товарів по угоді "${selectedDealForReceipt.title}" постачальника "${supplier.name}".`
      });

      setShowReceiptModal(false);
      setSelectedDealForReceipt(null);
      loadDeals();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Помилка реєстрації надходження: ' + err.message);
    }
  };

  const handleUpdateDealStatus = async (dealId, status, title) => {
    const statusText = status === 'Завершена' ? 'виконаною' : status === 'Скасована' ? 'скасованою' : 'активною';
    if (!window.confirm(`Ви дійсно бажаєте позначити угоду "${title}" як ${statusText}?`)) return;

    try {
      await crmApi.updateSupplierDealStatus(dealId, status);
      await crmApi.saveAuditLog({
        clientId: null,
        projectId: null,
        actionType: 'Статус угоди постачальника',
        details: `Змінено статус угоди "${title}" постачальника "${supplier.name}" на "${status}".`
      });
      loadDeals();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      alert('Помилка оновлення статусу угоди: ' + err.message);
    }
  };

  const handleAddDealItemRow = () => {
    setDealItems([...dealItems, { name: '', quantity: '', unit: 'шт.' }]);
  };

  const handleRemoveDealItemRow = (idx) => {
    if (dealItems.length === 1) return;
    setDealItems(dealItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...dealItems];
    updated[idx][field] = val;
    setDealItems(updated);
  };

  // Financial Metrics
  const activeDeals = deals.filter(d => d.status === 'Активна');
  
  const totalPaidUSD = deals
    .filter(d => d.status !== 'Скасована' && d.currency === 'USD')
    .reduce((acc, d) => acc + (parseFloat(d.paid_sum) || 0), 0);

  const totalPaidUAH = deals
    .filter(d => d.status !== 'Скасована' && d.currency === 'UAH')
    .reduce((acc, d) => acc + (parseFloat(d.paid_sum) || 0), 0);

  // Aggregated items owed
  const aggregatedOwed = {};
  deals.forEach(d => {
    if (d.status === 'Активна') {
      d.supplier_deal_items.forEach(item => {
        const remaining = item.quantity - item.received_quantity;
        if (remaining > 0) {
          if (!aggregatedOwed[item.name]) {
            aggregatedOwed[item.name] = { name: item.name, quantity: 0, received: 0, unit: item.unit };
          }
          aggregatedOwed[item.name].quantity += item.quantity;
          aggregatedOwed[item.name].received += item.received_quantity;
        }
      });
    }
  });

  const owedList = Object.values(aggregatedOwed);

  // Receipts timeline list
  const receiptsList = [];
  deals.forEach(d => {
    if (d.supplier_receipts) {
      d.supplier_receipts.forEach(r => {
        receiptsList.push({
          ...r,
          dealTitle: d.title
        });
      });
    }
  });
  receiptsList.sort((a, b) => new Date(b.received_at) - new Date(a.received_at));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 86px)', background: '#FAF8F5', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ 
        background: '#FAF6F0', 
        borderBottom: '1px solid #D4C5B9', 
        padding: '14px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexShrink: 0 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={onBack}
            style={{
              background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '6px',
              padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8B7D73', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#EAE7E2'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 850, color: '#2C2520', margin: 0 }}>
              🏢 {supplier.name}
            </h1>
            <div style={{ fontSize: '11.5px', color: '#8B7D73', marginTop: '2px', display: 'flex', gap: '14px' }}>
              {supplier.phone && <span>📞 {supplier.phone}</span>}
              {supplier.email && <span>✉️ {supplier.email}</span>}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowDealModal(true)}
          style={{
            background: '#C4B4A6', color: 'white', border: 'none', borderRadius: '6px',
            padding: '8px 14px', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(139, 125, 112, 0.15)'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#B3A395'}
          onMouseLeave={e => e.currentTarget.style.background = '#C4B4A6'}
        >
          <Plus size={14} /> Нова угода
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px', boxSizing: 'border-box', gap: '16px' }}>
        
        {/* Top Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', flexShrink: 0, maxWidth: '850px', margin: '0 auto', width: '100%' }}>
          {/* Widget 1: Paid USD */}
          <div style={{ background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#F0FDF4', color: '#16A34A', borderRadius: '8px', padding: '8px' }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8B7D73', fontWeight: 600, textTransform: 'uppercase' }}>Всього оплачено (USD)</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#2C2520', marginTop: '2px' }}>
                ${totalPaidUSD.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Widget 2: Paid UAH */}
          <div style={{ background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#EFF6FF', color: '#1D4ED8', borderRadius: '8px', padding: '8px' }}>
              <Clipboard size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8B7D73', fontWeight: 600, textTransform: 'uppercase' }}>Всього оплачено (UAH)</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#2C2520', marginTop: '2px' }}>
                {totalPaidUAH.toLocaleString()} ₴
              </div>
            </div>
          </div>

          {/* Widget 3: Active Deals count */}
          <div style={{ background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#FFF7ED', color: '#EA580C', borderRadius: '8px', padding: '8px' }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#8B7D73', fontWeight: 600, textTransform: 'uppercase' }}>Активних угод</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#2C2520', marginTop: '2px' }}>
                {activeDeals.length} угоди
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', borderBottom: '1px solid #D4C5B9', gap: '16px', flexShrink: 0, maxWidth: '850px', margin: '0 auto', width: '100%' }}>
          <button 
            onClick={() => setActiveTab('deals')}
            style={{
              background: 'transparent', border: 'none', borderBottom: activeTab === 'deals' ? '3px solid #C4B4A6' : '3px solid transparent',
              color: activeTab === 'deals' ? '#2C2520' : '#8B7D73', fontWeight: activeTab === 'deals' ? 800 : 600,
              padding: '8px 4px', fontSize: '13px', cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <span>📜 Угоди та товари</span>
            <span style={{ fontSize: '10.5px', background: '#C4B4A6', color: 'white', padding: '1px 5px', borderRadius: '10px' }}>
              {deals.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('summary')}
            style={{
              background: 'transparent', border: 'none', borderBottom: activeTab === 'summary' ? '3px solid #C4B4A6' : '3px solid transparent',
              color: activeTab === 'summary' ? '#2C2520' : '#8B7D73', fontWeight: activeTab === 'summary' ? 800 : 600,
              padding: '8px 4px', fontSize: '13px', cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <span>📊 Що нам винні</span>
            {owedList.length > 0 && (
              <span style={{ fontSize: '10.5px', background: '#EA580C', color: 'white', padding: '1px 5px', borderRadius: '10px' }}>
                {owedList.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('receipts')}
            style={{
              background: 'transparent', border: 'none', borderBottom: activeTab === 'receipts' ? '3px solid #C4B4A6' : '3px solid transparent',
              color: activeTab === 'receipts' ? '#2C2520' : '#8B7D73', fontWeight: activeTab === 'receipts' ? 800 : 600,
              padding: '8px 4px', fontSize: '13px', cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <span>🚚 Історія поставок</span>
            <span style={{ fontSize: '10.5px', background: '#C4B4A6', color: 'white', padding: '1px 5px', borderRadius: '10px' }}>
              {receiptsList.length}
            </span>
          </button>
        </div>

        {/* Tab contents (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%', padding: '4px 0 24px 0' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8B7D73', fontSize: '13px' }}>Завантаження угод...</div>
            ) : activeTab === 'deals' ? (
              /* Tab 1: Deals List */
              deals.length === 0 ? (
                <div style={{ background: '#FFFFFF', border: '1px dashed #D4C5B9', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', color: '#8B7D73' }}>
                  Не знайдено жодної угоди з цим постачальником. Створіть нову угоду, натиснувши кнопку "Нова угода".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {deals.map(deal => {
                    const dealDateStr = new Date(deal.paid_at).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' });
                    
                    return (
                      <div 
                        key={deal.id}
                        style={{
                          background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '12px',
                          padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                        }}
                      >
                        {/* Deal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#2C2520', margin: 0 }}>
                                {deal.title}
                              </h3>
                              <span style={{
                                fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px',
                                background: deal.status === 'Активна' ? '#F0FDF4' : deal.status === 'Завершена' ? '#F3F4F6' : '#FEF2F2',
                                color: deal.status === 'Активна' ? '#16A34A' : deal.status === 'Завершена' ? '#4B5563' : '#DC2626',
                                border: `1px solid ${deal.status === 'Активна' ? '#BBF7D0' : deal.status === 'Завершена' ? '#E5E7EB' : '#FCA5A5'}`
                              }}>
                                {deal.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#8B7D73', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={11} /> Оплачено: {dealDateStr}
                            </div>
                          </div>
  
                          {/* Financial Information & Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '9px', color: '#8B7D73', fontWeight: 700, textTransform: 'uppercase' }}>Сума оплати</div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#2C2520' }}>
                                {deal.currency === 'USD' ? '$' : ''}
                                {deal.paid_sum.toLocaleString()}
                                {deal.currency === 'UAH' ? ' ₴' : ''}
                              </div>
                            </div>
  
                            {deal.status === 'Активна' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button 
                                  onClick={() => openReceiptModal(deal)}
                                  style={{
                                    background: '#C4B4A6', color: '#FFFFFF', border: 'none', borderRadius: '6px',
                                    padding: '5px 10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                  }}
                                >
                                  <Truck size={12} /> Надходження
                                </button>
                                <button 
                                  onClick={() => handleUpdateDealStatus(deal.id, 'Завершена', deal.title)}
                                  style={{
                                    background: '#FFFFFF', color: '#8B7D73', border: '1px solid #D4C5B9', borderRadius: '6px',
                                    padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                                  }}
                                >
                                  Виконано
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
  
                        {/* Deal Note */}
                        {deal.note && (
                          <div style={{ fontSize: '11.5px', color: '#5C524A', background: '#FAF6F0', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #C4B4A6' }}>
                            💡 <strong>Примітка:</strong> {deal.note}
                          </div>
                        )}
  
                        {/* Materials List */}
                        <div style={{ border: '1px solid #FAF6F0', borderRadius: '8px', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: '#FAF6F0', color: '#5C524A', fontWeight: 700 }}>
                                <th style={{ padding: '8px 12px' }}>Матеріал / Товар</th>
                                <th style={{ padding: '8px 12px', width: '90px' }}>Оплачено</th>
                                <th style={{ padding: '8px 12px', width: '90px' }}>Отримано</th>
                                <th style={{ padding: '8px 12px', width: '90px' }}>Залишилось</th>
                                <th style={{ padding: '8px 12px', width: '160px' }}>Прогрес доставки</th>
                              </tr>
                            </thead>
                            <tbody>
                              {deal.supplier_deal_items.map(item => {
                                const remaining = Math.max(0, item.quantity - item.received_quantity);
                                const pct = Math.min(100, Math.round((item.received_quantity / item.quantity) * 100) || 0);
                                
                                return (
                                  <tr key={item.id} style={{ borderBottom: '1px solid #FAF6F0' }}>
                                    <td style={{ padding: '8px 12px', fontWeight: 650, color: '#2C2520' }}>{item.name}</td>
                                    <td style={{ padding: '8px 12px', color: '#2C2520' }}>{item.quantity} {item.unit}</td>
                                    <td style={{ padding: '8px 12px', color: '#16A34A', fontWeight: 600 }}>{item.received_quantity} {item.unit}</td>
                                    <td style={{ padding: '8px 12px', color: remaining > 0 ? '#EA580C' : '#8B7D73', fontWeight: remaining > 0 ? 600 : 400 }}>
                                      {remaining > 0 ? `${remaining} ${item.unit}` : 'Отримано'}
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ flex: 1, height: '6px', background: '#FAF6F0', borderRadius: '3px', overflow: 'hidden' }}>
                                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#16A34A' : '#C4B4A6', borderRadius: '3px' }} />
                                        </div>
                                        <span style={{ fontSize: '10px', color: '#8B7D73', fontWeight: 700, width: '28px', textAlign: 'right' }}>
                                          {pct}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : activeTab === 'summary' ? (
              /* Tab 2: Aggregated Materials Owed */
              owedList.length === 0 ? (
                <div style={{ background: '#FFFFFF', border: '1px dashed #D4C5B9', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', color: '#8B7D73' }}>
                  Постачальник повністю поставив усі матеріали. Немає активних заборгованостей!
                </div>
              ) : (
                <div style={{ background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #D4C5B9', background: '#FAF6F0' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#2C2520', margin: 0, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      📊 Зведений баланс заборгованості матеріалів
                    </h3>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#FAF8F5', color: '#5C524A', fontWeight: 700, borderBottom: '1px solid #D4C5B9' }}>
                        <th style={{ padding: '12px 18px' }}>Назва матеріалу</th>
                        <th style={{ padding: '12px 18px', width: '120px' }}>Всього замовлено</th>
                        <th style={{ padding: '12px 18px', width: '120px' }}>Всього отримано</th>
                        <th style={{ padding: '12px 18px', width: '120px' }}>Вам винні</th>
                      </tr>
                    </thead>
                    <tbody>
                      {owedList.map((item, idx) => {
                        const remaining = item.quantity - item.received;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #FAF6F0' }}>
                            <td style={{ padding: '12px 18px', fontWeight: 700, color: '#2C2520' }}>{item.name}</td>
                            <td style={{ padding: '12px 18px', color: '#5C524A' }}>{item.quantity} {item.unit}</td>
                            <td style={{ padding: '12px 18px', color: '#16A34A', fontWeight: 600 }}>{item.received} {item.unit}</td>
                            <td style={{ padding: '12px 18px', color: '#EA580C', fontWeight: 800 }}>
                              {remaining} {item.unit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* Tab 3: Receipts Timeline */
              receiptsList.length === 0 ? (
                <div style={{ background: '#FFFFFF', border: '1px dashed #D4C5B9', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', color: '#8B7D73' }}>
                  Історія поставок відсутня. Жодного надходження ще не було зареєстровано.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {receiptsList.map(rec => {
                    const receiptDateStr = new Date(rec.received_at).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
                    return (
                      <div 
                        key={rec.id}
                        style={{
                          background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '10px',
                          padding: '14px 16px', display: 'flex', gap: '14px', alignItems: 'flex-start'
                        }}
                      >
                        <div style={{ background: '#F0FDF4', color: '#16A34A', borderRadius: '30px', padding: '6px', display: 'flex', flexShrink: 0 }}>
                          <Truck size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#8B7D73', fontWeight: 700 }}>
                              По угоді: <strong style={{ color: '#2C2520' }}>{rec.dealTitle}</strong>
                            </span>
                            <span style={{ fontSize: '11px', color: '#8B7D73' }}>{receiptDateStr}</span>
                          </div>
                          
                          {rec.note && (
                            <p style={{ fontSize: '12px', color: '#5C524A', margin: '6px 0 8px 0', fontStyle: 'italic' }}>
                              "{rec.note}"
                            </p>
                          )}
                          
                          {/* Receipt Items list */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                            {rec.receipt_items?.map((item, idx) => {
                              // Find item name
                              let itemName = 'Товар';
                              deals.forEach(d => {
                                const match = d.supplier_deal_items.find(i => i.id === item.deal_item_id);
                                if (match) itemName = match.name;
                              });
  
                              return (
                                <span 
                                  key={idx}
                                  style={{
                                    background: '#FAF6F0', border: '1px solid #D4C5B9', color: '#2C2520',
                                    fontSize: '10.5px', padding: '2px 8px', borderRadius: '6px', fontWeight: 650
                                  }}
                                >
                                  {itemName}: <strong>+{item.quantity} шт.</strong>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: New Deal */}
      {showDealModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(44, 37, 32, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '12px', border: '1px solid #D4C5B9',
            width: '100%', maxWidth: '620px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #D4C5B9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF6F0', borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#2C2520', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clipboard size={16} color="#C4B4A6" /> Нова угода з постачальником
              </h3>
              <button onClick={() => setShowDealModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B7D73' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateDeal} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Deal Title */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#8B7D73', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Назва або номер угоди</label>
                  <input 
                    type="text" 
                    placeholder="Наприклад: Закупка сонячних панелей LONGi" 
                    value={dealTitle}
                    onChange={e => setDealTitle(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Sum, Currency, DateTime Row */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#8B7D73', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Сума оплати *</label>
                    <input 
                      type="number" 
                      placeholder="5000" 
                      value={dealSum}
                      onChange={e => setDealSum(e.target.value)}
                      required
                      min="0.01"
                      step="any"
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ width: '90px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#8B7D73', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Валюта</label>
                    <select 
                      value={dealCurrency}
                      onChange={e => setDealCurrency(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', background: 'white' }}
                    >
                      <option value="UAH">UAH (₴)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1.2, minWidth: '180px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#8B7D73', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Час оплати *</label>
                    <input 
                      type="datetime-local" 
                      value={dealPaidAt}
                      onChange={e => setDealPaidAt(e.target.value)}
                      required
                      style={{ width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Deal Note */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#8B7D73', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Примітка / Інвойс</label>
                  <textarea 
                    placeholder="Додаткова інформація про оплату, рахунок тощо..." 
                    value={dealNote}
                    onChange={e => setDealNote(e.target.value)}
                    rows="2"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none' }}
                  />
                </div>

                {/* Items Builder */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#8B7D73', textTransform: 'uppercase' }}>Матеріали, які вони нам винні *</label>
                    <button 
                      type="button" 
                      onClick={handleAddDealItemRow}
                      style={{
                        background: '#FAF6F0', border: '1px solid #D4C5B9', borderRadius: '4px',
                        padding: '2px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#8B7D73'
                      }}
                    >
                      + Додати матеріал
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {dealItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          placeholder="Назва товару (наприклад: Панель Jinko 540W)" 
                          value={item.name}
                          onChange={e => handleItemChange(idx, 'name', e.target.value)}
                          required
                          style={{ flex: 1, padding: '7px 10px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px' }}
                        />
                        <input 
                          type="number" 
                          placeholder="К-сть" 
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                          required
                          min="0.01"
                          step="any"
                          style={{ width: '70px', padding: '7px 10px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px' }}
                        />
                        <input 
                          type="text" 
                          placeholder="Од." 
                          value={item.unit}
                          onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                          required
                          style={{ width: '50px', padding: '7px 10px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', textAlign: 'center' }}
                        />
                        <button 
                          type="button"
                          onClick={() => handleRemoveDealItemRow(idx)}
                          disabled={dealItems.length === 1}
                          style={{
                            background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '6px',
                            color: '#EF4444', padding: '6px', cursor: 'pointer', opacity: dealItems.length === 1 ? 0.4 : 1
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #D4C5B9', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#FAF6F0', borderBottomLeftRadius: '11px', borderBottomRightRadius: '11px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowDealModal(false)}
                  style={{
                    background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '6px',
                    padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', color: '#8B7D73'
                  }}
                >
                  Скасувати
                </button>
                <button 
                  type="submit"
                  style={{
                    background: '#C4B4A6', border: 'none', borderRadius: '6px', color: '#FFFFFF',
                    padding: '8px 16px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Створити угоду
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Receipt / Надходження товарів */}
      {showReceiptModal && selectedDealForReceipt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(44, 37, 32, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: '12px', border: '1px solid #D4C5B9',
            width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #D4C5B9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF6F0', borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#2C2520', margin: 0, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={16} color="#C4B4A6" /> Нове надходження товарів
              </h3>
              <button onClick={() => { setShowReceiptModal(false); setSelectedDealForReceipt(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B7D73' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateReceipt} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div style={{ fontSize: '12px', color: '#8B7D73', background: '#FAF6F0', padding: '10px 12px', borderRadius: '6px' }}>
                  Угода: <strong style={{ color: '#2C2520' }}>{selectedDealForReceipt.title}</strong>
                </div>

                {/* Receipt Date */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#8B7D73', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Дата надходження *</label>
                  <input 
                    type="datetime-local" 
                    value={receiptDate}
                    onChange={e => setReceiptDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Receipt Note */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#8B7D73', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Коментар (номер ТТН, накладної тощо)</label>
                  <input 
                    type="text" 
                    placeholder="Наприклад: Нова Пошта ТТН 59000888999, привіз водій" 
                    value={receiptNote}
                    onChange={e => setReceiptNote(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #D4C5B9', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Receipt Quantities Input */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#8B7D73', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Скільки матеріалів надійшло?</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {selectedDealForReceipt.supplier_deal_items.map(item => {
                      const remaining = Math.max(0, item.quantity - item.received_quantity);
                      return (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF8F5', padding: '6px 10px', borderRadius: '6px', border: '1px solid #FAF6F0' }}>
                          <div style={{ flex: 1, marginRight: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 650, color: '#2C2520' }}>{item.name}</div>
                            <div style={{ fontSize: '10px', color: '#8B7D73' }}>
                              Всього: {item.quantity} {item.unit} (Залишилось: {remaining} {item.unit})
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input 
                              type="number" 
                              value={receiptQuantities[item.id] || ''}
                              onChange={e => setReceiptQuantities({
                                ...receiptQuantities,
                                [item.id]: e.target.value
                              })}
                              placeholder="0"
                              min="0"
                              max={remaining}
                              step="any"
                              style={{ width: '70px', padding: '6px 8px', fontSize: '12px', border: '1px solid #D4C5B9', borderRadius: '6px', textAlign: 'right' }}
                            />
                            <span style={{ fontSize: '11px', color: '#5C524A', width: '22px' }}>{item.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #D4C5B9', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#FAF6F0', borderBottomLeftRadius: '11px', borderBottomRightRadius: '11px' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowReceiptModal(false); setSelectedDealForReceipt(null); }}
                  style={{
                    background: '#FFFFFF', border: '1px solid #D4C5B9', borderRadius: '6px',
                    padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', color: '#8B7D73'
                  }}
                >
                  Скасувати
                </button>
                <button 
                  type="submit"
                  style={{
                    background: '#C4B4A6', border: 'none', borderRadius: '6px', color: '#FFFFFF',
                    padding: '8px 16px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Зареєструвати надходження
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
