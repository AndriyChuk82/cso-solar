import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getShipmentSenders,
  addShipmentSender,
  getShipmentClients,
  getWarehouses,
  getCatalog,
  getBalances,
  createShipment,
  updateShipment,
  getShipmentById
} from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { matchesSearch } from '../utils/searchUtils';
import { Plus, Trash2, ArrowLeft, UserPlus } from 'lucide-react';

export default function ShipmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // References Data
  const [senders, setSenders] = useState([]);
  const [clients, setClients] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouseStockMap, setWarehouseStockMap] = useState({});

  // Inline Add Sender Modal
  const [showAddSenderModal, setShowAddSenderModal] = useState(false);
  const [newSenderName, setNewSenderName] = useState('');
  const [addingSender, setAddingSender] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [senderId, setSenderId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [carrier, setCarrier] = useState('Нова Пошта');
  const [ttn, setTtn] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [currency, setCurrency] = useState('UAH');
  const [advanceAmount, setAdvanceAmount] = useState('0');
  const [comment, setComment] = useState('');
  const [notes, setNotes] = useState('');
  const [immediatelyShipped, setImmediatelyShipped] = useState(false);

  // Selected default warehouse for items
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

  // Items State: [{ productId, productName, productArticle, unit, warehouseId, quantity, price, currency }]
  const [items, setItems] = useState([]);

  // Active product search row index
  const [activeRowSearch, setActiveRowSearch] = useState(null);
  const [searchText, setSearchText] = useState('');
  const dropdownRefs = useRef([]);

  // Client suggestions
  const [filteredClientSuggestions, setFilteredClientSuggestions] = useState([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Click outside to close product dropdown
    function handleClickOutside(e) {
      if (activeRowSearch !== null && dropdownRefs.current[activeRowSearch]) {
        if (!dropdownRefs.current[activeRowSearch].contains(e.target)) {
          setActiveRowSearch(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeRowSearch]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [sendersRes, clientsRes, whRes, prodRes] = await Promise.all([
        getShipmentSenders(),
        getShipmentClients(),
        getWarehouses(),
        getCatalog()
      ]);

      if (sendersRes.success) setSenders(sendersRes.senders || []);
      if (clientsRes.success) setClients(clientsRes.clients || []);
      if (whRes.success) setWarehouses(whRes.warehouses || []);
      if (prodRes.success) setProducts(prodRes.products || prodRes.catalog || []);

      // Default sender (пам'ятаємо останнього з localStorage)
      const savedSenderId = localStorage.getItem('cso_shipment_sender_id');
      if (savedSenderId && sendersRes.senders && sendersRes.senders.some(s => s.id === savedSenderId)) {
        setSenderId(savedSenderId);
        const found = sendersRes.senders.find(s => s.id === savedSenderId);
        if (found) setSenderName(found.name);
      } else if (sendersRes.senders && sendersRes.senders.length > 0) {
        setSenderId(sendersRes.senders[0].id);
        setSenderName(sendersRes.senders[0].name);
      }

      // Default warehouse (пам'ятаємо останній з localStorage)
      const savedWhId = localStorage.getItem('cso_shipment_warehouse_id');
      const defaultWh = (savedWhId && whRes.warehouses?.some(w => w.id === savedWhId))
        ? savedWhId
        : (whRes.warehouses?.[0]?.id || '');

      setSelectedWarehouseId(defaultWh);

      if (id) {
        // Завантаження для редагування
        const editRes = await getShipmentById(id);
        if (editRes.success && editRes.shipment) {
          const s = editRes.shipment;
          setClientName(s.client_name || '');
          setClientPhone(s.client_phone || '');
          setShippingAddress(s.shipping_address || '');
          setSenderId(s.sender_id || '');
          setSenderName(s.sender_name || '');
          setCarrier(s.carrier || 'Нова Пошта');
          setTtn(s.ttn || '');
          setPaymentMethod(s.payment_method || 'cod');
          setCurrency(s.currency || 'UAH');
          setAdvanceAmount((s.advance_amount || 0).toString());
          setComment(s.comment || '');

          const allProds = prodRes.products || prodRes.catalog || [];
          if (editRes.items && editRes.items.length > 0) {
            const mappedItems = editRes.items.map(it => {
              const matchedProd = allProds.find(p => p.id === it.product_id);
              return {
                productId: it.product_id,
                productName: matchedProd ? matchedProd.name : it.product_id,
                productArticle: matchedProd ? matchedProd.article : '',
                unit: matchedProd ? matchedProd.unit : 'шт',
                warehouseId: it.warehouse_id || defaultWh,
                quantity: it.quantity.toString(),
                price: it.price.toString(),
                currency: s.currency || 'UAH'
              };
            });
            setItems(mappedItems);
            if (mappedItems[0]?.warehouseId) {
              setSelectedWarehouseId(mappedItems[0].warehouseId);
              fetchWarehouseStock(mappedItems[0].warehouseId);
            }
          } else {
            setItems([{
              productId: '',
              productName: '',
              productArticle: '',
              unit: 'шт',
              warehouseId: defaultWh,
              quantity: '1',
              price: '0',
              currency: s.currency || 'UAH'
            }]);
            if (defaultWh) {
              fetchWarehouseStock(defaultWh);
            }
          }
        }
      } else {
        setItems([{
          productId: '',
          productName: '',
          productArticle: '',
          unit: 'шт',
          warehouseId: defaultWh,
          quantity: '1',
          price: '0',
          currency: 'UAH'
        }]);

        if (defaultWh) {
          fetchWarehouseStock(defaultWh);
        }
      }

    } catch (err) {
      console.error("Failed to load reference data:", err);
      showToast("Помилка завантаження довідників", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchWarehouseStock(warehouseId) {
    if (!warehouseId || warehouseStockMap[warehouseId]) return;
    try {
      const res = await getBalances(warehouseId);
      if (res.success) {
        const map = {};
        (res.items || []).forEach(item => {
          map[item.product_id] = {
            quantity: item.quantity,
            reserved: item.reserved
          };
        });
        setWarehouseStockMap(prev => ({ ...prev, [warehouseId]: map }));
      }
    } catch (err) {
      console.warn(`Could not load stock for warehouse ${warehouseId}:`, err);
    }
  }

  // Handle warehouse change
  function handleDefaultWarehouseChange(whId) {
    setSelectedWarehouseId(whId);
    localStorage.setItem('cso_shipment_warehouse_id', whId);
    fetchWarehouseStock(whId);
    setItems(prev => prev.map(item => ({ ...item, warehouseId: whId })));
  }

  // Client Autocomplete handling
  function handleClientNameChange(val) {
    setClientName(val);
    if (val.trim().length > 0) {
      const q = val.toLowerCase();
      const matched = clients.filter(c => 
        (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q)
      );
      setFilteredClientSuggestions(matched);
      setShowClientSuggestions(true);
    } else {
      setShowClientSuggestions(false);
    }
  }

  function selectClientSuggestion(client) {
    setClientName(client.name);
    setClientPhone(client.phone || '');
    setShippingAddress(client.address || '');
    setShowClientSuggestions(false);
  }

  // Sender select change
  function handleSenderChange(e) {
    const val = e.target.value;
    if (val === 'ADD_NEW') {
      setShowAddSenderModal(true);
      return;
    }
    const found = senders.find(s => s.id === val);
    setSenderId(val);
    setSenderName(found ? found.name : '');
    localStorage.setItem('cso_shipment_sender_id', val);
  }

  // Add Sender
  async function handleAddSender(e) {
    e.preventDefault();
    if (!newSenderName.trim()) return;
    setAddingSender(true);
    try {
      const res = await addShipmentSender(newSenderName, user);
      if (res.success && res.sender) {
        showToast('Відправника додано', 'success');
        setSenders(prev => [...prev, res.sender]);
        setSenderId(res.sender.id);
        setSenderName(res.sender.name);
        setShowAddSenderModal(false);
        setNewSenderName('');
      }
    } catch (err) {
      showToast(err.message || 'Помилка додавання відправника', 'error');
    } finally {
      setAddingSender(false);
    }
  }

  // Item list helpers
  function addItemRow() {
    setItems(prev => [
      ...prev,
      {
        productId: '',
        productName: '',
        productArticle: '',
        unit: 'шт',
        warehouseId: selectedWarehouseId,
        quantity: '1',
        price: '0',
        currency: currency
      }
    ]);
  }

  function removeItemRow(index) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  function updateItemRow(index, field, value) {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleSelectProduct(index, product) {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: product.id,
        productName: product.name,
        productArticle: product.article || '',
        unit: product.unit || 'шт',
        price: product.price ? product.price.toString() : updated[index].price || '0'
      };
      return updated;
    });
    setActiveRowSearch(null);
    setSearchText('');
  }

  // Currency change for all items
  function handleCurrencyChange(newCurr) {
    setCurrency(newCurr);
    setItems(prev => prev.map(item => ({ ...item, currency: newCurr })));
  }

  // Calculate totals
  const totalAmount = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const p = parseFloat(item.price) || 0;
    return sum + (q * p);
  }, 0);

  const advVal = parseFloat(advanceAmount) || 0;
  const remainingDebt = Math.max(0, totalAmount - advVal);

  // Search filtered products for active row (використовуємо алгоритм з Балансів клієнтів з транслітерацією та розбиттям по словарному слову)
  const filteredProducts = products.filter(p => {
    if (p.active === false) return false;
    return matchesSearch(`${p.name || ''} ${p.article || ''}`, searchText);
  });

  // Submit Form
  async function handleSubmit(e) {
    e.preventDefault();
    if (!clientName.trim()) {
      showToast("Введіть ПІБ клієнта", "error");
      return;
    }
    if (items.length === 0) {
      showToast("Додайте хоча б один товар", "error");
      return;
    }

    const processedItems = items.map((it, idx) => {
      let pName = it.productName;
      let pId = it.productId;
      if (!pId && !pName && activeRowSearch === idx && searchText.trim()) {
        pName = searchText.trim();
        pId = searchText.trim();
      }
      return {
        ...it,
        productId: pId || pName || '',
        productName: pName || pId || ''
      };
    });

    for (let i = 0; i < processedItems.length; i++) {
      const item = processedItems[i];
      if (!item.productName && !item.productId) {
        showToast(`Оберіть товар у позиції №${i + 1}`, "error");
        return;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        showToast(`Вкажіть коректну кількість у позиції №${i + 1}`, "error");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        clientName,
        clientPhone,
        shippingAddress,
        senderId,
        senderName,
        carrier,
        ttn,
        paymentMethod,
        currency,
        advanceAmount: advVal,
        comment,
        notes,
        immediatelyShipped,
        selectedWarehouseId,
        items: processedItems
      };

      if (id) {
        const res = await updateShipment(id, payload, user);
        if (res.success) {
          showToast("Відправлення успішно оновлено!", "success");
          navigate('/shipments');
        } else {
          showToast("Помилка оновлення відправлення", "error");
        }
      } else {
        const res = await createShipment(payload, user);
        if (res.success) {
          showToast(
            immediatelyShipped ? "Відправлення створено та товар списано зі складу!" : "Відправлення створено. Товар переведено в Бронь!",
            "success"
          );
          navigate('/shipments');
        } else {
          showToast("Помилка збереження відправлення", "error");
        }
      }
    } catch (err) {
      console.error("Save shipment failed:", err);
      showToast(err.message || "Помилка при створенні відправлення", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-neutral-400">
        <div className="spinner mx-auto mb-3" />
        Завантаження форми...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/shipments')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
          До списку відправлень
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🚚 Нове Відправлення
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Client & Sender Info */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-neutral-700 pb-3 flex items-center gap-2">
            👤 1. Клієнт та Відправник
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Name with Autocomplete */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                ПІБ Клієнта <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => handleClientNameChange(e.target.value)}
                onFocus={() => clientName && setShowClientSuggestions(true)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Іванов Іван Іванович..."
                required
              />
              {showClientSuggestions && filteredClientSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                  {filteredClientSuggestions.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClientSuggestion(c)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-neutral-700 border-b last:border-0 border-gray-100 dark:border-neutral-700 text-sm flex flex-col"
                    >
                      <strong className="text-gray-900 dark:text-white">{c.name}</strong>
                      <span className="text-xs text-gray-500 dark:text-neutral-400">
                        {c.phone ? `📞 ${c.phone}` : ''} {c.address ? `📍 ${c.address}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Client Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Телефон Клієнта
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="+380..."
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Адреса відправки (довільний текст: Місто, № Нової пошти / адреса)
            </label>
            <input
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="м. Львів, Відділення Нової Пошти №10..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Sender Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Від кого відправлено
              </label>
              <select
                value={senderId}
                onChange={handleSenderChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {senders.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="ADD_NEW">➕ + Додати нового відправника...</option>
              </select>
            </div>

            {/* Carrier */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Перевізник
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Нова Пошта, Укрпошта..."
              />
            </div>
          </div>
        </div>

        {/* Step 2: Items Specification Table (1С/Баланси Клієнтів Style) */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4 overflow-visible">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-neutral-700 pb-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📦 2. Товари для відправки
            </h2>

            <div className="flex items-center gap-4">
              {/* Default Warehouse Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">Склад:</span>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => handleDefaultWarehouseChange(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-xs font-bold"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Currency Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">Валюта:</span>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-xs font-bold"
                >
                  <option value="UAH">UAH (₴)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[220px]">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700/50 text-gray-500 dark:text-neutral-400 font-semibold border-b border-gray-200 dark:border-neutral-700">
                  <th className="p-2.5 w-8 text-center">№</th>
                  <th className="p-2.5">Товар</th>
                  <th className="p-2.5 w-36">Кількість</th>
                  <th className="p-2.5 w-44">Ціна</th>
                  <th className="p-2.5 w-32 text-right">Сума</th>
                  <th className="p-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                {items.map((item, index) => {
                  const isLastRows = index >= items.length - 2 && items.length >= 3;
                  const whStock = warehouseStockMap[item.warehouseId]?.[item.productId];
                  const availableQty = whStock ? (whStock.quantity - whStock.reserved) : null;
                  const itemSum = (parseFloat(item.quantity || 0) * parseFloat(item.price || 0));

                  return (
                    <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-neutral-700/30">
                      {/* № */}
                      <td className="p-2.5 text-center font-bold text-gray-400">
                        {index + 1}
                      </td>

                      {/* Product Selector */}
                      <td className="p-2.5 relative overflow-visible" ref={el => dropdownRefs.current[index] = el}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                          <div className="flex-1">
                            {activeRowSearch === index ? (
                              <>
                                <input
                                  type="text"
                                  autoFocus
                                  className="w-full p-2 rounded-xl border border-primary bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-xs focus:outline-none shadow-sm"
                                  placeholder="Введіть назву або артикул товару..."
                                  value={searchText}
                                  onChange={(e) => setSearchText(e.target.value)}
                                />
                                {/* Dropdown menu */}
                                <div className={`absolute left-2 right-2 ${isLastRows ? 'bottom-full mb-1' : 'top-12'} bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-72 overflow-y-auto z-50 text-xs divide-y divide-gray-100 dark:divide-neutral-700`}>
                                  {filteredProducts.length === 0 ? (
                                    <div className="p-3 text-gray-400 text-center">Нічого не знайдено</div>
                                  ) : (
                                    filteredProducts.map(p => {
                                      const pWh = warehouseStockMap[item.warehouseId]?.[p.id];
                                      const pStock = pWh ? (pWh.quantity - pWh.reserved) : null;
                                      return (
                                        <div
                                          key={p.id}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelectProduct(index, p);
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelectProduct(index, p);
                                          }}
                                          className="p-2.5 hover:bg-primary hover:text-white cursor-pointer transition-colors flex items-center justify-between gap-3"
                                        >
                                          <div>
                                            <div className="font-bold">{p.name}</div>
                                            {p.article && <div className="text-[10px] opacity-80 font-mono">Арт: {p.article}</div>}
                                          </div>
                                          {pStock !== null && (
                                            <span className="text-[11px] font-bold whitespace-nowrap bg-black/10 px-2 py-0.5 rounded-full">
                                              Залишок: {pStock} {p.unit || 'шт'}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </>
                            ) : (
                              <div
                                onClick={() => {
                                  setActiveRowSearch(index);
                                  setSearchText(item.productName || '');
                                }}
                                className="w-full p-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-xs flex items-center justify-between cursor-pointer hover:border-primary transition-colors min-h-[36px]"
                              >
                                <span className={item.productId ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-400 italic'}>
                                  {item.productName || '-- Оберіть товар --'}
                                </span>
                                {item.productArticle && (
                                  <span className="text-[10px] text-gray-500 font-mono bg-gray-100 dark:bg-neutral-600 px-1.5 py-0.5 rounded ml-2">
                                    арт.{item.productArticle}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Stock badge */}
                          {item.productId && (
                            <div className="flex items-center justify-center gap-1 text-[11px] whitespace-nowrap bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-xl shrink-0 font-medium border border-emerald-200 dark:border-emerald-800">
                              <span>Залишок:</span>
                              <strong className="font-bold">
                                {availableQty !== null ? availableQty : '—'} {item.unit || 'шт'}
                              </strong>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            required
                            className="w-20 p-1.5 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-xs text-center font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                            value={item.quantity}
                            onChange={(e) => updateItemRow(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          <span className="text-xs text-gray-500 dark:text-neutral-400 font-medium">{item.unit || 'шт'}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="w-24 p-1.5 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-xs text-center font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                            value={item.price}
                            onChange={(e) => updateItemRow(index, 'price', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                            {currency === 'UAH' ? 'грн' : '$'}
                          </span>
                        </div>
                      </td>

                      {/* Line Sum */}
                      <td className="p-2.5 text-right font-bold text-gray-900 dark:text-white text-sm whitespace-nowrap">
                        {itemSum.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {currency === 'UAH' ? 'грн' : '$'}
                      </td>

                      {/* Delete Button */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-base"
                          title="Видалити рядок"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-3 border-t border-gray-100 dark:border-neutral-700">
            <button
              type="button"
              onClick={addItemRow}
              className="px-4 py-2 text-xs font-bold text-primary border border-primary/30 hover:bg-primary/10 rounded-xl transition-colors flex items-center gap-1.5"
            >
              ➕ Додати рядок
            </button>

            <div className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Разом {currency}:</span>
              <span className="text-base text-primary">
                {currency === 'USD' ? '$' : ''}
                {totalAmount.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}
                {currency === 'UAH' ? ' грн' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Step 3: Payment & Dispatch Details */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-neutral-700 pb-3 flex items-center gap-2">
            💳 3. Фінанси та Спосіб Оплати
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Спосіб оплати
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="cod">📦 Оплата при отриманні</option>
                <option value="kit_group">🐱 КИТ Group</option>
                <option value="cash">💵 Готівка</option>
              </select>
            </div>

            {/* Advance Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Аванс від клієнта ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="0"
              />
            </div>

            {/* TTN */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                № ТТН (якщо вже відомо)
              </label>
              <input
                type="text"
                value={ttn}
                onChange={(e) => setTtn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                placeholder="204500000000..."
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Примітка / Коментар
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Додаткові побажання..."
            />
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-neutral-700/60 flex flex-wrap items-center justify-between gap-4 border border-gray-200 dark:border-neutral-600">
            <div className="space-y-1">
              <div className="text-xs text-gray-500 dark:text-neutral-400">Загальна вартість товару:</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {totalAmount.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {currency}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-500 dark:text-neutral-400">Аванс:</div>
              <div className="text-base font-semibold text-green-600 dark:text-green-400">
                {advVal.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {currency}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-500 dark:text-neutral-400">Залишок боргу до сплати:</div>
              <div className="text-xl font-extrabold text-primary">
                {remainingDebt.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {currency}
              </div>
            </div>
          </div>

          {/* Immediately Shipped Checkbox */}
          <label className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 rounded-xl cursor-pointer border border-amber-200 dark:border-amber-800">
            <input
              type="checkbox"
              checked={immediatelyShipped}
              onChange={(e) => setImmediatelyShipped(e.target.checked)}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
            <div className="text-xs">
              <strong>Списати та відправити товар негайно (статус "Відправлено")</strong>
              <div className="text-amber-700 dark:text-amber-400">
                Якщо прапорець вимкнено — товар перейде в статус <strong>"Бронь"</strong> без фізичного списання зі складу.
              </div>
            </div>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="button"
            onClick={() => navigate('/shipments')}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Збереження...' : (immediatelyShipped ? '🚀 Створити та відправити' : '🔒 Оформити Бронь')}
          </button>
        </div>
      </form>

      {/* Modal: Add New Sender */}
      {showAddSenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-neutral-700 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlus size={20} />
              Додати нового відправника
            </h3>
            <form onSubmit={handleAddSender} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  ПІБ Відправника
                </label>
                <input
                  type="text"
                  value={newSenderName}
                  onChange={(e) => setNewSenderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="Пастушок Олексій..."
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSenderModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={addingSender}
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md"
                >
                  {addingSender ? 'Збереження...' : 'Зберегти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
