
const getCleanManagerName = (name, email) => {
  let raw = name || email || '';
  if (!raw) return 'Оператор';
  if (raw.includes('@')) {
    const prefix = raw.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return raw;
};
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getWarehouses, getCatalog, getBuyers, getBalances, addBuyerTransaction, getBuyerTransactionById, deleteBuyerTransaction, toggleArchiveTransaction, updateBuyerTransaction, getActivityLogs } from '../api/gasApi';
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
  const [originalItemsMap, setOriginalItemsMap] = useState({});
  const [originalStatus, setOriginalStatus] = useState('completed');
  const [isReleaseMode, setIsReleaseMode] = useState(false);

  // Стан для автокомпліту пошуку товарів у рядках
  const [activeRowSearch, setActiveRowSearch] = useState(null); // Індекс рядка, де зараз активний пошук
  const [searchText, setSearchText] = useState('');
  const dropdownRefs = useRef([]);

  // Стан для друку видаткової накладної
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printWithPrices, setPrintWithPrices] = useState(true);

  // Стан для інтеграції з Комерційними пропозиціями (КП)
  const [showKpModal, setShowKpModal] = useState(false);
  const [loadingKp, setLoadingKp] = useState(false);
  const [proposalsList, setProposalsList] = useState([]);
  const [kpSearchQuery, setKpSearchQuery] = useState('');

  // Стан для безпечного підтвердження дій
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '', // 'delete' | 'archive'
    title: '',
    message: '',
    confirmWord: '',
    userTypedWord: '',
    isCheckboxChecked: false,
    onConfirm: null
  });

  const [txHistoryLogs, setTxHistoryLogs] = useState([]);

  useEffect(() => {
    if (txId) {
      getActivityLogs({ entityId: txId }).then(res => {
        if (res.success) setTxHistoryLogs(res.data || []);
      });
    } else {
      setTxHistoryLogs([]);
    }
  }, [txId]);

  const [formData, setFormData] = useState({
    buyerId: queryBuyerId || '',
    warehouseId: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'UAH', // за замовчуванням для нових рядків
    comment: '',
    pickedUpBy: '',
    status: 'completed',
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

            const origMap = {};
            tx.items.forEach(item => {
              origMap[item.productId] = (origMap[item.productId] || 0) + (parseFloat(item.quantity) || 0);
            });
            setOriginalItemsMap(origMap);
            setOriginalStatus(tx.status || 'completed');
            setIsReleaseMode(tx.status === 'reserved');

            setFormData({
              buyerId: tx.buyerId,
              warehouseId: tx.items[0]?.warehouseId || '',
              date: tx.date,
              currency: tx.currency || 'UAH',
              comment: tx.comment || '',
              pickedUpBy: tx.pickedUpBy || '',
              status: tx.status || 'completed',
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
          const saved = localStorage.getItem('cso_last_warehouse');
          if (saved && loadedWhList.some(w => w.id === saved)) {
            setFormData(prev => ({ ...prev, warehouseId: saved }));
          } else {
            const ternopil = loadedWhList.find(w => w.name.toLowerCase().includes('тернопіль'));
            if (ternopil) {
              setFormData(prev => ({ ...prev, warehouseId: ternopil.id }));
            } else if (loadedWhList.length > 0) {
              setFormData(prev => ({ ...prev, warehouseId: loadedWhList[0].id }));
            }
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

  // Завантаження КП з Google Apps Script
  const openKpImport = async () => {
    setShowKpModal(true);
    setLoadingKp(true);
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getProposals' })
      });
      const res = await response.json();
      if (res?.success) {
        // Сортуємо від найновіших до найстаріших за датою або номером
        const sorted = (res.proposals || []).sort((a, b) => {
          const dateA = new Date(a.date || a.updatedAt || 0);
          const dateB = new Date(b.date || b.updatedAt || 0);
          return dateB - dateA;
        });
        setProposalsList(sorted);
      } else {
        showToast(res?.error || 'Не вдалося завантажити список КП', 'error');
      }
    } catch (err) {
      console.error('Помилка при завантаженні КП:', err);
      showToast('Не вдалося зв\'язатися з сервером Google Drive', 'error');
    } finally {
      setLoadingKp(false);
    }
  };

  // Фільтрація комерційних пропозицій за назвою/телефоном/номером
  const filteredProposals = proposalsList.filter(kp => {
    if (!kpSearchQuery) return true;
    const query = kpSearchQuery.toLowerCase();
    const nameMatch = kp.clientName?.toLowerCase().includes(query);
    const phoneMatch = kp.clientPhone?.toLowerCase().includes(query);
    const numberMatch = kp.number?.toString().toLowerCase().includes(query);
    return nameMatch || phoneMatch || numberMatch;
  });

  // Імпорт пропозиції
  const importProposalData = (kp) => {
    const kpCurrency = kp.currency === 'USD' ? 'USD' : 'UAH';
    
    // Спробуємо заповнити також дані про покупця
    let matchedBuyerId = formData.buyerId;
    if (!matchedBuyerId && kp.clientName) {
      // Спробуємо зіставити за назвою клієнта
      const matchedBuyer = buyers.find(b => 
        b.name?.toLowerCase().trim() === kp.clientName.toLowerCase().trim()
      );
      if (matchedBuyer) {
        matchedBuyerId = matchedBuyer.id;
      }
    }
    
    const importedItems = (kp.items || []).map(item => {
      const name = item.name || '';
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.price) || '';
      
      const matchedProduct = products.find(p => 
        p.name?.toLowerCase().trim() === name.toLowerCase().trim()
      );
      
      if (matchedProduct) {
        return {
          productId: matchedProduct.id,
          productName: matchedProduct.name,
          productArticle: matchedProduct.article || '',
          unit: matchedProduct.unit || 'шт',
          quantity: qty,
          price: price,
          currency: kpCurrency
        };
      } else {
        return {
          productId: '',
          productName: name,
          productArticle: '',
          unit: item.unit || 'шт',
          quantity: qty,
          price: price,
          currency: kpCurrency
        };
      }
    });

    if (importedItems.length === 0) {
      showToast('Обрана пропозиція не містить товарів для імпорту', 'warning');
      return;
    }

    setFormData(prev => ({
      ...prev,
      buyerId: matchedBuyerId,
      currency: kpCurrency,
      comment: kp.notes ? `${kp.notes} (Імпортовано з КП №${kp.number || 'б/н'})` : `Імпортовано з КП №${kp.number || 'б/н'}`,
      items: importedItems
    }));

    showToast(`Успішно імпортовано ${importedItems.length} поз. з КП №${kp.number || 'б/н'}`, 'success');
    setShowKpModal(false);
  };

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

  async function handleSubmit(e, forcedStatus = null) {
    if (e) e.preventDefault();
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

      // Визначаємо, чи переводимо ми накладну з броні у фактичну видачу
      const targetStatusVal = forcedStatus || formData.status;
      const isReleasing = txId && originalStatus === 'reserved' && targetStatusVal !== 'reserved';

      // Визначаємо новий статус для кожної валюти
      const newStatusUah = targetStatusVal === 'reserved'
        ? 'reserved'
        : (uahItems.some(item => item.price === '' || item.price === null) ? 'pending_price' : 'completed');

      const newStatusUsd = targetStatusVal === 'reserved'
        ? 'reserved'
        : (usdItems.some(item => item.price === '' || item.price === null) ? 'pending_price' : 'completed');

      // Визначаємо, чи є часткова видача (розщеплення броні)
      const remainderItems = [];
      if (isReleasing) {
        filledItems.forEach(item => {
          const origQty = originalItemsMap[item.productId] || 0;
          const newQty = parseFloat(item.quantity) || 0;
          const diff = origQty - newQty;
          if (diff > 0.001) {
            remainderItems.push({
              productId: item.productId,
              warehouseId: formData.warehouseId,
              quantity: diff,
              price: item.price !== '' && item.price !== null ? parseFloat(item.price) : null,
              currency: item.currency
            });
          }
        });
      }

      // 1. Якщо є гривневі товари, формуємо гривневу накладну
      if (uahItems.length > 0) {
        let finalComment = formData.comment || '';
        if (isReleasing && remainderItems.length > 0) {
          finalComment = `${finalComment.trim()} [Часткова видача. Залишок перенесено в нову накладну]`.trim();
        }

        const amount = uahItems.reduce((sum, item) => {
          const price = item.price !== '' && item.price !== null ? parseFloat(item.price) : 0;
          return sum + (price * (parseFloat(item.quantity) || 0));
        }, 0);

        const payload = {
          buyerId: formData.buyerId,
          buyerName: selectedBuyer?.name,
          date: formData.date,
          type: 'issue',
          amount,
          currency: 'UAH',
          status: newStatusUah,
          comment: finalComment,
          pickedUpBy: formData.pickedUpBy,
          user: user?.name || user?.email, userName: user?.name, userEmail: user?.email,
          items: uahItems.map(item => ({
            productId: item.productId,
            productName: products.find(p => p.id === item.productId)?.name || item.productId,
            warehouseId: formData.warehouseId,
            quantity: parseFloat(item.quantity) || 0,
            price: item.price !== '' && item.price !== null ? parseFloat(item.price) : null,
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
        let finalComment = formData.comment || '';
        if (isReleasing && remainderItems.length > 0) {
          finalComment = `${finalComment.trim()} [Часткова видача. Залишок перенесено в нову накладну]`.trim();
        }

        const amount = usdItems.reduce((sum, item) => {
          const price = item.price !== '' && item.price !== null ? parseFloat(item.price) : 0;
          return sum + (price * (parseFloat(item.quantity) || 0));
        }, 0);

        const payload = {
          buyerId: formData.buyerId,
          buyerName: selectedBuyer?.name,
          date: formData.date,
          type: 'issue',
          amount,
          currency: 'USD',
          status: newStatusUsd,
          comment: finalComment,
          pickedUpBy: formData.pickedUpBy,
          user: user?.name || user?.email, userName: user?.name, userEmail: user?.email,
          items: usdItems.map(item => ({
            productId: item.productId,
            productName: products.find(p => p.id === item.productId)?.name || item.productId,
            warehouseId: formData.warehouseId,
            quantity: parseFloat(item.quantity) || 0,
            price: item.price !== '' && item.price !== null ? parseFloat(item.price) : null,
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

      // 4. Якщо це був переклад з резерву у видачу і є залишок, створюємо нову накладну броні
      if (isReleasing && remainderItems.length > 0) {
        const remainderComment = `[Залишок броні від накладної від ${formData.date}] ${formData.comment || ''}`.trim();
        const remainderPayload = {
          buyerId: formData.buyerId,
          buyerName: selectedBuyer?.name,
          parentId: txId,
          date: formData.date,
          type: 'issue',
          amount: remainderItems.reduce((sum, item) => {
            const price = item.price !== '' && item.price !== null ? parseFloat(item.price) : 0;
            return sum + (price * item.quantity);
          }, 0),
          currency: formData.currency,
          status: 'reserved',
          comment: remainderComment,
          pickedUpBy: formData.pickedUpBy,
          user: user?.name || user?.email, userName: user?.name, userEmail: user?.email,
          items: remainderItems
        };
        submitPromises.push(addBuyerTransaction(remainderPayload));
      }

      const results = await Promise.all(submitPromises);
      const failed = results.find(r => !r?.success);
      
      if (!failed) {
        showToast(isReleasing && remainderItems.length > 0 ? 'Часткову видачу проведено. Залишок зарезервовано.' : 'Видачу товарів успішно проведено', 'success');
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

  function closeConfirmModal() {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  }

  function triggerArchiveToggle() {
    if (!txId) return;
    const targetState = !isArchived;
    setConfirmModal({
      isOpen: true,
      type: 'archive',
      title: targetState ? '🗄️ Закриття накладної' : '🔄 Розархівування накладної',
      message: targetState 
        ? 'Ви дійсно хочете закрити цю накладну та перемістити її в архів? Архівні накладні фіксуються для обліку і не підлягають подальшому випадковому редагуванню.'
        : 'Ви дійсно хочете розархівувати та знову відкрити цю накладну для редагування?',
      confirmWord: '',
      userTypedWord: '',
      isCheckboxChecked: false,
      onConfirm: async () => {
        setSaving(true);
        try {
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
          closeConfirmModal();
        }
      }
    });
  }

  function handlePrintAct() {
    if (!txId || !formData.buyerId) return;
    navigate(`/buyers/${formData.buyerId}?tab=reconciliation&act=${txId}`);
  }

  function triggerDelete() {
    if (!txId) return;
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      title: '⚠️ Видалення накладної',
      message: 'УВАГА: Ви збираєтеся остаточно видалити цю накладну. Це автоматично анулює списання товарів на складі, і вони повернуться в загальний залишок. Цю дію неможливо скасувати.',
      confirmWord: 'ВИДАЛИТИ',
      userTypedWord: '',
      isCheckboxChecked: false,
      onConfirm: async () => {
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
          closeConfirmModal();
        }
      }
    });
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
                disabled={txId && isReleaseMode}
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
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, warehouseId: val });
                  localStorage.setItem('cso_last_warehouse', val);
                }}
                required
                disabled={txId && isReleaseMode}
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
                disabled={txId && isReleaseMode}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[var(--text-secondary)]">Коментар</label>
              <input
                type="text"
                placeholder="напр. під звіт"
                className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                disabled={isReleaseMode}
              />
            </div>

            {!isReleaseMode && (
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[var(--text-secondary)]">Статус документа *</label>
                <select
                  className="h-[32px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none font-semibold text-blue-600 dark:text-blue-400"
                  value={formData.status || 'completed'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="completed">✅ Видано (Списати)</option>
                  <option value="reserved">⏳ Бронь / Резерв</option>
                </select>
              </div>
            )}
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
                  const isLastRows = index >= formData.items.length - 2 && formData.items.length >= 3;
                  const origQty = originalItemsMap[item.productId] || 0;
                  const stock = (balances[item.productId] || 0) + origQty;
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
                                <div className={`absolute left-2 right-2 ${isLastRows ? 'bottom-full mb-1' : 'top-11'} bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl max-h-80 overflow-y-auto z-50 text-xs divide-y divide-[var(--border)]`}>
                                  {filteredProducts.length === 0 ? (
                                    <div className="p-2 text-[var(--text-secondary)] text-center">Нічого не знайдено</div>
                                  ) : (
                                    filteredProducts.map(p => {
                                      const origQty = originalItemsMap[p.id] || 0;
                                      const pStock = (balances[p.id] || 0) + origQty;
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
                                  if (isReleaseMode) return;
                                  setActiveRowSearch(index);
                                  setSearchText(item.productName || '');
                                }}
                                className={`w-full p-1.5 rounded border text-[16px] sm:text-xs min-h-[30px] flex items-center justify-between ${
                                  !item.productId && item.productName 
                                    ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' 
                                    : 'border-[var(--border)] bg-[var(--bg)]'
                                } ${isReleaseMode ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <span className={item.productId ? 'text-[var(--text)] font-medium' : item.productName ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-[var(--text-secondary)] italic'}>
                                  {item.productName || 'Клацніть для вибору товару...'}
                                  {!item.productId && item.productName && ' (⚠️ Не зіставлено)'}
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
                              <span className="text-green-600 font-semibold">
                                {stock} {item.unit}
                              </span>
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
                        {isOver && (
                          <div className="text-[10px] text-red-500 font-semibold mt-1">
                            ⚠️ Недостатньо
                          </div>
                        )}
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
                        {!isReleaseMode && (
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="text-red-500 hover:bg-red-500/10 font-bold w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                            title="Видалити рядок"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Низ таблиці: додати рядок та підсумок */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-3 border-t border-[var(--border)] pt-3 no-print">
            {!isReleaseMode && (
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={addRow}
                  className="btn btn-ghost btn-sm text-blue-500 border border-blue-500/30 hover:bg-blue-500/5 flex items-center gap-1"
                >
                  ➕ Додати рядок
                </button>
                <button
                  type="button"
                  onClick={openKpImport}
                  className="btn btn-ghost btn-sm text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/5 flex items-center gap-1 font-semibold dark:text-emerald-400 dark:border-emerald-500/20"
                >
                  📥 Імпортувати з КП
                </button>
              </div>
            )}

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
          {txId && !isReleaseMode && (
            <div className="flex gap-2 mr-auto">
              <button
                type="button"
                onClick={triggerArchiveToggle}
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
                  navigate(`/buyers/payment?buyerId=${formData.buyerId}&amount=${invoiceAmount}&currency=${formData.currency}&comment=${encodeURIComponent(commentPrefill)}&invoiceId=${txId}`);
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
                onClick={triggerDelete}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
              >
                ❌ Видалити
              </button>
            </div>
          )}

          {txId && isReleaseMode && (
            <div className="flex gap-2 mr-auto">
              <button
                type="button"
                onClick={() => setIsReleaseMode(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/20 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5"
              >
                ✏️ Редагувати бронь
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

          {isReleaseMode ? (
            <Button
              type="button"
              variant="primary"
              disabled={saving}
              loading={saving}
              onClick={() => handleSubmit(null, 'completed')}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 font-bold"
            >
              📦 Видати бронь
            </Button>
          ) : (
            <Button 
              type="submit" 
              variant="primary" 
              disabled={saving} 
              loading={saving}
            >
              {saving ? 'Збереження...' : 'Провести документ'}
            </Button>
          )}
        </div>
      </form>

      {/* Секція історії дій по цій накладній */}
      {txId && (
        <div className="card mt-4 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              📜 Історія змін цієї накладної
            </h3>
            {txHistoryLogs.length > 0 && (
              <span className="text-[10px] text-[var(--text-secondary)] font-semibold">
                Записів: {txHistoryLogs.length}
              </span>
            )}
          </div>
          {txHistoryLogs.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] italic">
              Історія змін для цієї накладної відсутня (або накладна була створена раніше). Всі подальші зміни відображатимуться тут.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {txHistoryLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-[var(--bg)] rounded border border-[var(--border)] text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[var(--text)]">👤 {getCleanManagerName(log.user_name, log.user_email)}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">⏱️ {new Date(log.created_at).toLocaleString('uk-UA')}</span>
                  </div>
                  <div className="text-[var(--text-secondary)] whitespace-pre-line leading-relaxed text-[11px]">
                    {log.details?.changesSummary || log.entity_title || log.action_type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
      {/* Модальне вікно безпеки підтвердження (видалення / закриття) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
            <div className={`p-4 text-white flex items-center justify-between ${
              confirmModal.type === 'delete' ? 'bg-red-600' : 'bg-amber-600'
            }`}>
              <h3 className="font-bold text-sm">{confirmModal.title}</h3>
              <button 
                type="button"
                onClick={closeConfirmModal}
                className="text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-xs text-[var(--text)] leading-relaxed">
                {confirmModal.message}
              </p>

              {confirmModal.type === 'delete' && (
                <div className="space-y-2">
                  <label className="block text-[10px] text-[var(--text-secondary)] font-semibold uppercase">
                    Введіть слово <span className="text-red-500 font-bold font-mono">ВИДАЛИТИ</span> для підтвердження:
                  </label>
                  <input 
                    type="text"
                    className="w-full p-2 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Введіть слово великими літерами"
                    value={confirmModal.userTypedWord}
                    onChange={(e) => setConfirmModal(prev => ({ ...prev, userTypedWord: e.target.value }))}
                  />
                </div>
              )}

              {confirmModal.type === 'archive' && (
                <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--border-light)] transition-colors">
                  <input 
                    type="checkbox"
                    checked={confirmModal.isCheckboxChecked}
                    onChange={(e) => setConfirmModal(prev => ({ ...prev, isCheckboxChecked: e.target.checked }))}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4 mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-[var(--text)]">Я підтверджую виконання дії</span>
                    <span className="text-[9px] text-[var(--text-secondary)]">Змінити статус архівування документа</span>
                  </div>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-3 bg-[var(--bg)] border-t border-[var(--border)]">
              <button 
                type="button" 
                onClick={closeConfirmModal}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--border-light)] border border-[var(--border)] transition-colors"
              >
                Скасувати
              </button>
              <button 
                type="button"
                disabled={
                  confirmModal.type === 'delete' 
                    ? confirmModal.userTypedWord !== 'ВИДАЛИТИ'
                    : !confirmModal.isCheckboxChecked
                }
                onClick={confirmModal.onConfirm}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModal.type === 'delete' ? '🗑️ Остаточно видалити' : '✔️ Підтвердити'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно вибору параметрів імпорту з КП */}
      {showKpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Імпорт товарів з Комерційної Пропозиції (КП)</h3>
              <button 
                type="button"
                onClick={() => setShowKpModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Рядок пошуку */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--bg)] flex gap-2">
              <input 
                type="text" 
                placeholder="Пошук за ім'ям покупця, телефоном або номером КП..."
                value={kpSearchQuery}
                onChange={(e) => setKpSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Вміст списку */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[var(--bg-card)]">
              {loadingKp ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  <span className="text-xs text-[var(--text-secondary)]">Завантаження комерційних пропозицій з Google Drive...</span>
                </div>
              ) : filteredProposals.length === 0 ? (
                <div className="text-center py-10 text-xs text-[var(--text-secondary)]">
                  {kpSearchQuery ? 'Нічого не знайдено за вашим запитом' : 'Немає доступних комерційних пропозицій'}
                </div>
              ) : (
                filteredProposals.map((kp) => (
                  <div 
                    key={kp.id} 
                    onClick={() => importProposalData(kp)}
                    className="p-3 border border-[var(--border)] rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer flex flex-col gap-1 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        КП №{kp.number || 'б/н'}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                        📅 {kp.date ? new Date(kp.date).toLocaleDateString('uk-UA') : 'без дати'}
                      </span>
                    </div>
                    <div className="font-semibold text-[var(--text)] mt-0.5">
                      👤 {kp.clientName || 'Шановний Клієнт'}
                    </div>
                    {kp.clientPhone && (
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        📞 {kp.clientPhone}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-1 border-t border-[var(--border)]/50 pt-1 text-[10px] text-[var(--text-secondary)]">
                      <span>Товарів: {kp.items?.length || 0}</span>
                      <span className="font-bold text-[var(--text)] text-xs">
                        Сума: {parseFloat(kp.total || 0).toLocaleString('uk-UA')} {kp.currency === 'USD' ? '$' : 'грн'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-3 bg-[var(--bg)] border-t border-[var(--border)]">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => setShowKpModal(false)}
              >
                Скасувати
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
