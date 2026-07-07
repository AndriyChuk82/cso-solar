import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getWarehouses, getCatalog, getBuyers, getBalances, addBuyerTransaction, getBuyerTransactionById, deleteBuyerTransaction, toggleArchiveTransaction, updateBuyerTransaction } from '../api/gasApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '@cso/design-system';
import { matchesSearch } from '../utils/searchUtils';
import { printDeliveryNote } from '../utils/printUtils';

export default function BuyerIssueForm() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { txId } = useParams();
  const [searchParams] = useSearchParams();
  const queryBuyerId = searchParams.get('buyerId');

  const [buyers, setBuyers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [balances, setBalances] = useState({});
  const [saving, setSaving] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  // Стан для автокомпліту пошуку товарів у рядках
  const [activeRowSearch, setActiveRowSearch] = useState(null); // Індекс рядка, де зараз активний пошук
  const [searchText, setSearchText] = useState('');
  const dropdownRefs = useRef([]);

  // Стан для друку видаткової накладної
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printWithPrices, setPrintWithPrices] = useState(true);

  const [formData, setFormData] = useState({
    buyerId: queryBuyerId || '',
    warehouseId: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'UAH', // за замовчуванням для нових рядків
    comment: '',
    pickedUpBy: '',
    items: [
      // Починаємо з одного порожнього рядка для швидкості роботи (як в 1С)
      { productId: '', productName: '', productArticle: '', unit: '', quantity: 1, price: '', currency: 'UAH' }
    ]
  });

  const [isCustomRepresentative, setIsCustomRepresentative] = useState(false);

  useEffect(() => {
    if (formData.buyerId && buyers.length > 0) {
      const buyer = buyers.find(b => b.id === formData.buyerId);
      const reps = buyer?.representatives
        ? buyer.representatives.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      if (formData.pickedUpBy && reps.length > 0 && !reps.includes(formData.pickedUpBy)) {
        setIsCustomRepresentative(true);
      }
    }
  }, [formData.buyerId, buyers]);

  useEffect(() => {
    async function loadData() {
      try {
        const [whRes, catRes, buyersRes] = await Promise.all([
          getWarehouses(),
          getCatalog(),
          getBuyers()
        ]);

        let loadedWhList = [];
        let loadedBuyerList = [];

        if (whRes?.success) {
          loadedWhList = whRes.warehouses || [];
          setWarehouses(loadedWhList);
        }
        if (catRes?.success) setProducts(catRes.products || []);
        if (buyersRes?.success) {
          loadedBuyerList = buyersRes.buyers || [];
          setBuyers(loadedBuyerList.filter(b => b.active));
        }

        // Якщо це режим редагування
        if (txId) {
          const txRes = await getBuyerTransactionById(txId);
          if (txRes?.success && txRes.transaction) {
            const tx = txRes.transaction;
            
            // Додаємо неактивного покупця в опції вибору, якщо він вибраний у цій накладній
            const currentBuyer = loadedBuyerList.find(b => b.id === tx.buyerId);
            if (currentBuyer) {
              setBuyers(prev => {
                if (prev.some(b => b.id === tx.buyerId)) return prev;
                return [...prev, currentBuyer];
              });
            }

            setFormData({
              buyerId: tx.buyerId,
              warehouseId: tx.items[0]?.warehouseId || '',
              date: tx.date,
              currency: tx.currency || 'UAH',
              comment: tx.comment || '',
              pickedUpBy: tx.pickedUpBy || '',
              items: tx.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                productArticle: item.productArticle,
                unit: item.unit,
                quantity: item.quantity,
                price: item.price !== null && item.price !== undefined ? item.price : '',
                currency: item.currency || 'UAH'
              }))
            });
            setIsArchived(!!tx.is_archived);
          } else {
            showToast('Не вдалося завантажити накладну', 'error');
          }
        } else {
          // Для нової накладної склад за замовчуванням
          const ternopil = loadedWhList.find(w => w.name.toLowerCase().includes('тернопіль'));
          if (ternopil) {
            setFormData(prev => ({ ...prev, warehouseId: ternopil.id }));
          } else if (loadedWhList.length > 0) {
            setFormData(prev => ({ ...prev, warehouseId: loadedWhList[0].id }));
          }
        }
      } catch (err) {
        console.error('Помилка завантаження даних:', err);
        showToast('Помилка завантаження довідників', 'error');
      }
    }
    loadData();
  }, [txId]);

  // Завантаження залишків при зміні складу
  useEffect(() => {
    if (formData.warehouseId) {
      getBalances(formData.warehouseId).then((result) => {
        if (result?.success) {
          const map = {};
          (result.balances || []).forEach((b) => {
            map[b.product_id] = b.quantity;
          });
          setBalances(map);
        }
      });
    }
  }, [formData.warehouseId]);

  // Закриття автокомпліту при кліку ззовні
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeRowSearch !== null) {
        const currentRef = dropdownRefs.current[activeRowSearch];
        if (currentRef && !currentRef.contains(event.target)) {
          setActiveRowSearch(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeRowSearch]);

  // Додавання нового порожнього рядка (як в 1С)
  function addRow() {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: '', productName: '', productArticle: '', unit: '', quantity: 1, price: '', currency: prev.currency }
      ]
    }));
  }

  // Видалення рядка
  function removeRow(index) {
    if (formData.items.length === 1) {
      // Очищуємо єдиний рядок замість видалення
      setFormData(prev => ({
        ...prev,
        items: [{ productId: '', productName: '', productArticle: '', unit: '', quantity: 1, price: '', currency: prev.currency }]
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    if (activeRowSearch === index) setActiveRowSearch(null);
  }

  // Оновлення полів конкретного рядка
  function updateRowField(index, field, value) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  }

  // Вибір товару в автокомпліті
  function handleSelectProduct(index, product) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? {
          ...item,
          productId: product.id,
          productName: product.name,
          productArticle: product.article,
          unit: product.unit,
          price: item.price || '',
          currency: item.currency || prev.currency
        } : item
      )
    }));
    setActiveRowSearch(null);
  }

  // Фільтрація товарів для автокомпліту
  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    return matchesSearch(`${p.name} ${p.article || ''}`, searchText);
  });

  // Розрахунок підсумкової суми окремо для UAH та USD
  const totalUah = formData.items.reduce((acc, item) => {
    if (item.currency !== 'UAH') return acc;
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return acc + (qty * price);
  }, 0);

  const totalUsd = formData.items.reduce((acc, item) => {
    if (item.currency !== 'USD') return acc;
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return acc + (qty * price);
  }, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    if (!formData.buyerId) return showToast('Оберіть покупця', 'error');
    if (!formData.warehouseId) return showToast('Оберіть склад', 'error');
    
    // Фільтруємо незаповнені рядки
    const filledItems = formData.items.filter(item => item.productId !== '');
    if (filledItems.length === 0) return showToast('Додайте хоча б один товар', 'error');

    setSaving(true);
    try {
      const selectedBuyer = buyers.find(b => b.id === formData.buyerId);
      const uahItems = filledItems.filter(item => item.currency === 'UAH');
      const usdItems = filledItems.filter(item => item.currency === 'USD');

      const submitPromises = [];

      // 1. Якщо є гривневі товари, формуємо гривневу накладну
      if (uahItems.length > 0) {
        const hasEmptyPrices = uahItems.some(item => item.price === '' || item.price === null);
        const amount = uahItems.reduce((sum, item) => {
          const price = item.price !== '' && item.price !== null ? parseFloat(item.price) : 0;
          return sum + (price * (parseFloat(item.quantity) || 0));
        }, 0);
        const status = hasEmptyPrices ? 'pending_price' : 'completed';

        const payload = {
          buyerId: formData.buyerId,
          buyerName: selectedBuyer?.name,
          date: formData.date,
          type: 'issue',
          amount,
          currency: 'UAH',
          status,
          comment: formData.comment,
          pickedUpBy: formData.pickedUpBy,
          user: user?.email,
          items: uahItems.map(item => ({
            productId: item.productId,
            warehouseId: formData.warehouseId,
            quantity: parseFloat(item.quantity) || 0,
            price: item.price !== '' ? parseFloat(item.price) : null,
            currency: 'UAH'
          }))
        };

        if (txId && formData.currency === 'UAH') {
          submitPromises.push(updateBuyerTransaction({ ...payload, id: txId }));
        } else {
          submitPromises.push(addBuyerTransaction(payload));
        }
      }

      // 2. Якщо є доларові товари, формуємо доларову накладну
      if (usdItems.length > 0) {
        const hasEmptyPrices = usdItems.some(item => item.price === '' || item.price === null);
        const amount = usdItems.reduce((sum, item) => {
          const price = item.price !== '' && item.price !== null ? parseFloat(item.price) : 0;
          return sum + (price * (parseFloat(item.quantity) || 0));
        }, 0);
        const status = hasEmptyPrices ? 'pending_price' : 'completed';

        const payload = {
          buyerId: formData.buyerId,
          buyerName: selectedBuyer?.name,
          date: formData.date,
          type: 'issue',
          amount,
          currency: 'USD',
          status,
          comment: formData.comment,
          pickedUpBy: formData.pickedUpBy,
          user: user?.email,
          items: usdItems.map(item => ({
            productId: item.productId,
            warehouseId: formData.warehouseId,
            quantity: parseFloat(item.quantity) || 0,
            price: item.price !== '' ? parseFloat(item.price) : null,
            currency: 'USD'
          }))
        };

        if (txId && formData.currency === 'USD') {
          submitPromises.push(updateBuyerTransaction({ ...payload, id: txId }));
        } else {
          submitPromises.push(addBuyerTransaction(payload));
        }
      }

      // 3. Якщо в режимі редагування оригінальна валюта більше не використовується у формі, видаляємо її
      if (txId) {
        const hasOriginalCurrency = filledItems.some(item => item.currency === formData.currency);
        if (!hasOriginalCurrency) {
          submitPromises.push(deleteBuyerTransaction(txId));
        }
      }

      const results = await Promise.all(submitPromises);
      const failed = results.find(r => !r?.success);
      
      if (!failed) {
        showToast('Видачу товарів успішно проведено', 'success');
        navigate(-1);
      } else {
        showToast(failed.error || 'Помилка збереження', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Помилка з\'єднання з сервером', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveToggle() {
    if (!txId) return;
    const msg = isArchived 
      ? 'Ви впевнені, що хочете відкрити цю накладну з архіву?' 
      : 'Ви впевнені, що хочете закрити цю накладну та перемістити її в архів?';
    if (!window.confirm(msg)) return;
    setSaving(true);
    try {
      const targetState = !isArchived;
      const res = await toggleArchiveTransaction(txId, targetState);
      if (res.success) {
        showToast(targetState ? 'Накладну закрито та переміщено в архів' : 'Накладну відновлено з архіву', 'success');
        navigate(-1);
      }
    } catch (err) {
      console.error(err);
      showToast('Не вдалося змінити статус архівування', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handlePrintAct() {
    if (!txId || !formData.buyerId) return;
    navigate(`/buyers/${formData.buyerId}?tab=reconciliation&act=${txId}`);
  }

  async function handleDelete() {
    if (!txId) return;
    if (!window.confirm('Ви впевнені, що хочете видалити цю транзакцію? Це автоматично скасує списання товару на складі.')) return;
    setSaving(true);
    try {
      const res = await deleteBuyerTransaction(txId);
      if (res.success) {
        showToast('Транзакцію успішно видалено', 'success');
        navigate(-1);
      }
    } catch (err) {
      console.error(err);
      showToast('Не вдалося видалити транзакцію', 'error');
    } finally {
      setSaving(false);
    }
  }

  const selectedBuyer = buyers.find(b => b.id === formData.buyerId);
  const selectedBuyerRepresentatives = selectedBuyer?.representatives
    ? selectedBuyer.representatives.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="pb-12 max-w-5xl mx-auto px-2 md:px-4">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-4">
        <button 
          type="button" 
          onClick={() => navigate('/buyers')}
          className="text-xl p-1 text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
        >
          ←
        </button>
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">{txId ? '✏️ Редагування накладної видачі' : '📤 Видача матеріалів (Накладна)'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Компактні поля шапки (1С стиль) */}
        <div className="card p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[var(--text-secondary)]">Покупець *</label>
              <select
                className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none"
                value={formData.buyerId}
                onChange={(e) => {
                  setFormData({ ...formData, buyerId: e.target.value, pickedUpBy: '' });
                  setIsCustomRepresentative(false);
                }}
                required
              >
                <option value="">-- Виберіть клієнта --</option>
                {buyers.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[var(--text-secondary)]">Представник</label>
              {selectedBuyerRepresentatives.length > 0 && !isCustomRepresentative ? (
                <select
                  className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none"
                  value={formData.pickedUpBy || ''}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomRepresentative(true);
                      setFormData({ ...formData, pickedUpBy: '' });
                    } else {
                      setFormData({ ...formData, pickedUpBy: e.target.value });
                    }
                  }}
                >
                  <option value="">-- Оберіть представника --</option>
                  {selectedBuyerRepresentatives.map((name, idx) => (
                    <option key={idx} value={name}>{name}</option>
                  ))}
                  <option value="__custom__">➕ Вписати іншого...</option>
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ПІБ (необов'язково)"
                    className="h-[32px] py-1 pr-10 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none w-full"
                    value={formData.pickedUpBy || ''}
                    onChange={(e) => setFormData({ ...formData, pickedUpBy: e.target.value })}
                  />
                  {selectedBuyerRepresentatives.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomRepresentative(false);
                        setFormData({ ...formData, pickedUpBy: '' });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 hover:underline font-semibold"
                    >
                      список
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[var(--text-secondary)]">Склад *</label>
              <select
                className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none"
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                required
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[var(--text-secondary)]">Дата</label>
              <input
                type="date"
                className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[var(--text-secondary)]">Валюта</label>
              <select
                className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="UAH">грн (UAH)</option>
                <option value="USD">$ (USD)</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
              <label className="font-semibold text-[var(--text-secondary)]">Коментар</label>
              <input
                type="text"
                placeholder="напр. під звіт"
                className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Таблична частина (1С Склад стиль) */}
        <div className="card bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 overflow-visible">
          <div className="overflow-x-auto" style={{ minHeight: '260px' }}>
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[var(--bg)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border)]">
                  <th className="p-2 w-8 text-center">№</th>
                  <th className="p-2">Товар</th>
                  <th className="p-2 w-32">Кількість</th>
                  <th className="p-2 w-44">Ціна</th>
                  <th className="p-2 w-28 text-right">Сума</th>
                  <th className="p-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {formData.items.map((item, index) => {
                  const stock = balances[item.productId] || 0;
                  const isOver = item.productId && parseFloat(item.quantity) > stock;

                  return (
                    <tr key={index} className="hover:bg-[var(--border-light)]/40 transition-colors">
                      {/* Номер рядка */}
                      <td className="p-2 text-center text-[var(--text-secondary)] font-mono">{index + 1}</td>

                      {/* Товар (Пошук/Автокомпліт в один рядок) */}
                      <td className="p-2 relative overflow-visible" ref={el => dropdownRefs.current[index] = el}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                          <div className="flex-1">
                            {activeRowSearch === index ? (
                              <>
                                <input
                                  type="text"
                                  autoFocus
                                  className="w-full p-1.5 rounded border border-blue-500 bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none"
                                  placeholder="Введіть назву або артикул..."
                                  value={searchText}
                                  onChange={(e) => setSearchText(e.target.value)}
                                />
                                {/* Випадаючий список пошуку */}
                                <div className="absolute left-2 right-2 top-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 text-xs divide-y divide-[var(--border)]">
                                  {filteredProducts.length === 0 ? (
                                    <div className="p-2 text-[var(--text-secondary)] text-center">Нічого не знайдено</div>
                                  ) : (
                                    filteredProducts.map(p => {
                                      const pStock = balances[p.id] || 0;
                                      return (
                                        <div
                                          key={p.id}
                                          onClick={() => handleSelectProduct(index, p)}
                                          className="p-2 hover:bg-blue-500 hover:text-white cursor-pointer transition-colors flex justify-between gap-3"
                                        >
                                          <div>
                                            <span className="font-semibold">{p.name}</span>
                                            {p.article && <span className="text-[10px] opacity-75 block font-mono">Арт: {p.article}</span>}
                                          </div>
                                          <span className="font-semibold text-right whitespace-nowrap">
                                            Залишок: {pStock} {p.unit}
                                          </span>
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
                                className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg)] cursor-pointer text-[16px] sm:text-xs min-h-[30px] flex items-center justify-between"
                              >
                                <span className={item.productName ? 'text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] italic'}>
                                  {item.productName || 'Клацніть для вибору товару...'}
                                </span>
                                {item.productArticle && (
                                  <span className="text-[9px] text-[var(--text-secondary)] font-mono bg-[var(--border-light)] px-1 rounded mr-2">
                                    {item.productArticle}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Залишок товару в рядку */}
                          {item.productId && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap bg-[var(--border-light)] px-2 py-1 rounded w-32 shrink-0">
                              <span className="text-[var(--text-secondary)] font-medium">Залишок:</span>
                              <span className={isOver ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}>
                                {stock} {item.unit}
                              </span>
                              {isOver && (
                                <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded ml-1">
                                  ⚠️ Мінус
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Кількість */}
                      <td className="p-2">
                        <div className="flex items-center gap-1 min-w-[100px]">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            required={!!item.productId}
                            disabled={!item.productId}
                            className="w-20 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 text-center font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {item.unit && <span className="text-[10px] text-[var(--text-secondary)] w-8 text-left truncate" title={item.unit}>{item.unit}</span>}
                        </div>
                      </td>

                      {/* Ціна */}
                      <td className="p-2">
                        <div className="flex items-center gap-1 min-w-[140px]">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            disabled={!item.productId}
                            className="w-20 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 text-center font-semibold"
                            placeholder="неоцінено"
                            value={item.price}
                            onChange={(e) => updateRowField(index, 'price', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          <select
                            disabled={!item.productId}
                            className="w-14 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 cursor-pointer"
                            value={item.currency || 'UAH'}
                            onChange={(e) => updateRowField(index, 'currency', e.target.value)}
                          >
                            <option value="UAH">грн</option>
                            <option value="USD">$</option>
                          </select>
                        </div>
                      </td>

                      {/* Сума */}
                      <td className="p-2 text-right font-mono font-semibold text-[var(--text)] whitespace-nowrap">
                        {item.productId && item.price !== '' ? (
                          `${(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ${item.currency === 'UAH' ? 'грн' : '$'}`
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Кнопка видалення рядка */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="text-red-500 hover:bg-red-500/10 font-bold w-6 h-6 rounded-full flex items-center justify-center transition-colors"
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

          {/* Низ таблиці: додати рядок та підсумок */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-3 border-t border-[var(--border)] pt-3 no-print">
            <button
              type="button"
              onClick={addRow}
              className="btn btn-ghost btn-sm text-blue-500 border border-blue-500/30 hover:bg-blue-500/5 flex items-center gap-1"
            >
              ➕ Додати рядок
            </button>

            <div className="text-xs md:text-sm text-[var(--text)] flex flex-col items-end gap-1 font-semibold">
              {totalUah > 0 && (
                <div>Разом UAH: <span className="text-blue-500 text-sm md:text-base font-bold">{totalUah.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} грн</span></div>
              )}
              {totalUsd > 0 && (
                <div>Разом USD: <span className="text-blue-500 text-sm md:text-base font-bold">${totalUsd.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</span></div>
              )}
              {totalUah === 0 && totalUsd === 0 && (
                <div>Разом: <span className="text-blue-500 text-sm md:text-base font-bold">0.00 грн</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Кнопки збереження */}
        <div className="flex justify-end gap-3 pt-2 flex-wrap items-center">
          {txId && (
            <div className="flex gap-2 mr-auto">
              <button
                type="button"
                onClick={handleArchiveToggle}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] hover:bg-[var(--border-light)] transition-colors flex items-center gap-1.5"
              >
                {isArchived ? '🔄 Розархівувати' : '🗄️ Закрити накладну'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const invoiceAmount = formData.items
                    .filter(item => item.currency === formData.currency)
                    .reduce((sum, item) => {
                      const price = item.price !== '' && item.price !== null ? parseFloat(item.price) : 0;
                      return sum + (price * (parseFloat(item.quantity) || 0));
                    }, 0);
                  const commentPrefill = `Оплата за накладну від ${formData.date} на суму ${invoiceAmount.toLocaleString('uk-UA')} ${formData.currency}`;
                  navigate(`/buyers/payment?buyerId=${formData.buyerId}&amount=${invoiceAmount}&currency=${formData.currency}&comment=${encodeURIComponent(commentPrefill)}`);
                }}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-500/20 text-green-600 bg-green-500/5 hover:bg-green-500/10 transition-colors flex items-center gap-1.5"
              >
                📥 Оплатити накладну
              </button>
              <button
                type="button"
                onClick={handlePrintAct}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-500/20 text-blue-600 bg-blue-500/5 hover:bg-blue-500/10 transition-colors flex items-center gap-1.5"
              >
                🖨️ Акт
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/20 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5"
              >
                📄 Видаткова накладна
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
              >
                ❌ Видалити
              </button>
            </div>
          )}
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Скасувати
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={saving} 
            loading={saving}
          >
            {saving ? 'Збереження...' : 'Провести документ'}
          </Button>
        </div>
      </form>

      {/* Модальне вікно вибору параметрів друку видаткової накладної */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Друк видаткової накладної</h3>
              <button 
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-[var(--text-secondary)]">
                Оберіть формат друкованої форми накладної для видачі клієнту:
              </p>
              <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--border-light)] transition-colors">
                <input 
                  type="checkbox"
                  checked={printWithPrices}
                  onChange={(e) => setPrintWithPrices(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[var(--text)]">Показувати ціни та суму</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">Якщо вимкнено — буде надруковано лише кількість товарів</span>
                </div>
              </label>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2.5 text-center">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Накладна буде сформована від імені ФОП Пастушок М. В.
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-3 bg-[var(--bg)] border-t border-[var(--border)]">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPrintModal(false)}
              >
                Скасувати
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                size="sm"
                onClick={() => {
                  const currentBuyer = buyers.find(b => b.id === formData.buyerId);
                  printDeliveryNote(formData, currentBuyer, printWithPrices, txId);
                  setShowPrintModal(false);
                }}
              >
                🖨️ Друкувати
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
