import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getBuyerTransactions, updateBuyerTransaction, deleteBuyerTransaction, getBuyers, toggleArchiveTransaction, addBuyerTransaction } from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@cso/design-system';


function updateCommentAmount(comment, amount, currency) {
  if (!comment) return comment;
  const num = parseFloat(amount) || 0;
  const formattedAmount = num.toLocaleString('uk-UA');
  const currencyLabel = currency === 'UAH' ? 'UAH' : 'USD';
  
  const regex = /(на суму\s+)[\d\s,.\u00A0]+(\s*(?:UAH|USD|грн|\$))/i;
  if (regex.test(comment)) {
    return comment.replace(regex, `$1${formattedAmount} ${currencyLabel}`);
  }
  return comment;
}

export default function BuyerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [buyer, setBuyer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Держава для звіту взаєморозрахунків
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [currencyFilter, setCurrencyFilter] = useState('ALL'); // 'ALL', 'UAH', 'USD'

  // Керування вкладками та фільтром окремого документа
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' або 'reconciliation'
  const [selectedTxFilter, setSelectedTxFilter] = useState('ALL'); // 'ALL' або id конкретної накладної

  // Редагування транзакції
  const [editTx, setEditTx] = useState(null);

  // Видача заброньованих товарів (Резерви)
  const [reserveReleaseTx, setReserveReleaseTx] = useState(null);
  const [reserveReleaseForm, setReserveReleaseForm] = useState(null);

  function startReserveRelease(tx) {
    setReserveReleaseTx(tx);
    setReserveReleaseForm({
      pickedUpBy: tx.pickedUpBy || '',
      comment: tx.comment || '',
      items: tx.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productArticle: item.productArticle,
        unit: item.unit,
        quantityReserved: parseFloat(item.quantity) || 0,
        quantityToIssue: parseFloat(item.quantity) || 0,
        price: item.price !== null && item.price !== undefined ? item.price : '',
        currency: item.currency || tx.currency || 'UAH',
        warehouseId: item.warehouseId
      }))
    });
  }

  async function handleCancelReserve() {
    if (!window.confirm('Ви впевнені, що хочете скасувати це бронювання? Товари повернуться у вільний залишок.')) return;
    setLoading(true);
    try {
      await deleteBuyerTransaction(reserveReleaseTx.id);
      showToast('Бронювання скасовано', 'success');
      setReserveReleaseTx(null);
      setReserveReleaseForm(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Помилка скасування бронювання', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleReserveReleaseSubmit(e) {
    e.preventDefault();
    if (!reserveReleaseTx || !reserveReleaseForm) return;

    setLoading(true);
    try {
      const originalTx = reserveReleaseTx;
      const form = reserveReleaseForm;

      const itemsToIssue = [];
      const itemsRemainder = [];

      form.items.forEach(item => {
        const issueQty = parseFloat(item.quantityToIssue) || 0;
        const reservedQty = parseFloat(item.quantityReserved) || 0;

        if (issueQty > 0) {
          itemsToIssue.push({
            productId: item.productId,
            productName: item.productName,
            productArticle: item.productArticle,
            unit: item.unit,
            quantity: issueQty,
            price: item.price,
            currency: item.currency,
            warehouseId: item.warehouseId
          });
        }

        const remainder = reservedQty - issueQty;
        if (remainder > 0.001) {
          itemsRemainder.push({
            productId: item.productId,
            productName: item.productName,
            productArticle: item.productArticle,
            unit: item.unit,
            quantity: remainder,
            price: item.price,
            currency: item.currency,
            warehouseId: item.warehouseId
          });
        }
      });

      if (itemsToIssue.length === 0) {
        showToast('Вкажіть кількість для видачі', 'error');
        setLoading(false);
        return;
      }

      const userEmail = user?.email;

      // 1. Оновлюємо коментар в оригінальній накладній про спліт
      let finalComment = (form.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '');
      if (itemsRemainder.length > 0) {
        finalComment = `${finalComment.trim()} [Часткова видача. Залишок перенесено в нову накладну]`.trim();
      }

      // 2. Оновлюємо оригінальну накладну: ставимо статус completed/pending та оновлюємо товари
      const updatedTxPayload = {
        id: originalTx.id,
        buyerId: originalTx.buyerId,
        buyerName: buyer.name,
        date: originalTx.date,
        type: 'issue',
        amount: itemsToIssue.reduce((sum, item) => {
          const p = item.price !== '' && item.price !== null ? parseFloat(item.price) : 0;
          return sum + (p * item.quantity);
        }, 0),
        currency: originalTx.currency,
        status: itemsToIssue.some(i => i.price === '' || i.price === null) ? 'pending_price' : 'completed',
        comment: finalComment,
        pickedUpBy: form.pickedUpBy,
        user: userEmail,
        items: itemsToIssue
      };

      // 3. Зберігаємо оновлену накладну (вона автоматично створить списки в operations)
      await updateBuyerTransaction(updatedTxPayload);

      // 4. Якщо є залишок, створюємо нову накладну броні
      if (itemsRemainder.length > 0) {
        const remainderComment = `[Залишок броні від накладної від ${originalTx.date}] ${form.comment || ''}`.trim();
        const remainderTxPayload = {
          buyerId: originalTx.buyerId,
          buyerName: buyer.name,
          parentId: originalTx.id,
          date: originalTx.date,
          type: 'issue',
          amount: itemsRemainder.reduce((sum, item) => {
            const p = item.price !== '' && item.price !== null ? parseFloat(item.price) : 0;
            return sum + (p * item.quantity);
          }, 0),
          currency: originalTx.currency,
          status: 'reserved',
          comment: remainderComment,
          pickedUpBy: originalTx.pickedUpBy,
          user: userEmail,
          items: itemsRemainder
        };
        await addBuyerTransaction(remainderTxPayload);
      }

      showToast(itemsRemainder.length > 0 ? 'Часткову видачу проведено. Залишок зарезервовано.' : 'Товари успішно видано клієнту', 'success');
      setReserveReleaseTx(null);
      setReserveReleaseForm(null);
      await loadData();
    } catch (err) {
      console.error('Помилка видачі:', err);
      showToast('Помилка проведення видачі', 'error');
    } finally {
      setLoading(false);
    }
  }
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [isEditCommentDirty, setIsEditCommentDirty] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (!loading && transactions.length > 0) {
      const params = new URLSearchParams(search);
      const tabParam = params.get('tab');
      const actParam = params.get('act');
      if (tabParam) {
        setActiveTab(tabParam);
      }
      if (actParam) {
        setSelectedTxFilter(actParam);
      }
    }
  }, [search, loading, transactions]);

  async function loadData() {
    setLoading(true);
    try {
      const [buyersRes, txRes] = await Promise.all([
        getBuyers(),
        getBuyerTransactions(id)
      ]);

      if (buyersRes?.success) {
        const found = buyersRes.buyers?.find(b => b.id === id);
        setBuyer(found);
      }
      if (txRes?.success) {
        setTransactions(txRes.transactions || []);
      }
    } catch (err) {
      console.error('Помилка завантаження детальних даних клієнта:', err);
      showToast('Помилка завантаження даних', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Видалення транзакції
  async function handleDeleteTransaction(txId) {
    if (!window.confirm('Ви впевнені, що хочете видалити цю транзакцію? Це автоматично скасує списання товару на складі.')) return;

    try {
      const res = await deleteBuyerTransaction(txId);
      if (res.success) {
        showToast('Транзакцію успішно видалено', 'success');
        loadData();
      }
    } catch (err) {
      console.error('Помилка видалення:', err);
      showToast('Не вдалося видалити транзакцію', 'error');
    }
  }

  // Архівування / розархівування транзакції
  async function handleToggleArchive(txId, archiveState) {
    try {
      const res = await toggleArchiveTransaction(txId, archiveState);
      if (res.success) {
        showToast(archiveState ? 'Документ переміщено в архів' : 'Документ відновлено з архіву', 'success');
        loadData();
      }
    } catch (err) {
      console.error('Помилка архівації:', err);
      showToast('Не вдалося змінити статус архівування', 'error');
    }
  }

  // Початок редагування транзакції
  function startEdit(tx) {
    if (tx.type === 'issue') {
      navigate(`/buyers/issue/edit/${tx.id}`);
      return;
    }
    setEditTx(tx);
    if (tx.type === 'payment') {
      setIsEditCommentDirty(false);
      setEditForm({
        date: tx.date,
        amount: tx.converted_amount || tx.amount, // збережена сума отримання
        currency: tx.converted_amount ? (tx.currency === 'UAH' ? 'USD' : 'UAH') : tx.currency, // валюта отримання
        comment: (tx.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, ''),
        useConversion: !!tx.converted_amount,
        conversionRate: tx.conversion_rate || '',
      });
    } else if (tx.type === 'adjustment') {
      setEditForm({
        date: tx.date,
        amount: tx.amount,
        currency: tx.currency,
        comment: tx.comment
      });
    }
  }

  // Збереження редагованої транзакції
  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      if (editTx.type === 'payment') {
        const receivedAmount = parseFloat(editForm.amount) || 0;
        const rate = parseFloat(editForm.conversionRate) || 0;
        const targetCurrency = editForm.currency === 'UAH' ? 'USD' : 'UAH';
        
        let creditedAmount = receivedAmount;
        if (editForm.useConversion && rate > 0) {
          creditedAmount = editForm.currency === 'UAH' ? (receivedAmount / rate) : (receivedAmount * rate);
        }

        const match = editTx.comment?.match(/\[invoice_id:([\w-]+)\]/);
        const tag = match ? ` [invoice_id:${match[1]}]` : '';
        const cleanComment = editForm.comment || '';
        const commentWithTag = tag ? `${cleanComment}${tag}` : cleanComment;

        const payload = {
          id: editTx.id,
          date: editForm.date,
          type: 'payment',
          amount: editForm.useConversion ? parseFloat(creditedAmount.toFixed(2)) : receivedAmount,
          currency: editForm.useConversion ? targetCurrency : editForm.currency,
          convertedAmount: editForm.useConversion ? receivedAmount : null,
          conversionRate: editForm.useConversion ? rate : null,
          status: 'completed',
          comment: commentWithTag,
          user: user?.email
        };

        const res = await updateBuyerTransaction(payload);
        if (res.success) {
          showToast('Оплату оновлено', 'success');
          
          if (invoiceId) {
            try {
              const allTxRes = await getBuyerTransactions(id);
              if (allTxRes?.success) {
                const txs = allTxRes.transactions || [];
                const invoice = txs.find(t => t.id === invoiceId);
                if (invoice) {
                  const invoiceAmt = parseFloat(invoice.amount) || 0;
                  const linkedPayments = txs.filter(t => 
                    t.type === 'payment' && 
                    t.is_archived !== true && 
                    t.comment?.includes(`[invoice_id:${invoiceId}]`)
                  );
                  const totalPaid = linkedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                  
                  if (totalPaid >= invoiceAmt && !invoice.is_archived) {
                    const closeInvoice = window.confirm("Ця накладна повністю оплачена. Бажаєте закрити її (перенести в архів)?");
                    if (closeInvoice) {
                      await updateBuyerTransaction({
                        id: invoiceId,
                        is_archived: true
                      });
                      showToast('Накладну перенесено в архів', 'success');
                    }
                  }
                }
              }
            } catch (err) {
              console.error('Помилка при перевірці оплати накладної:', err);
            }
          }
          
          setEditTx(null);
          loadData();
        }
      } else {
        // Видача або коригування
        const hasEmptyPrices = editForm.items?.some(item => item.price === '' || item.price === null);
        let amount = null;
        let status = 'pending_price';

        if (!hasEmptyPrices && editForm.items?.length > 0) {
          amount = editForm.items.reduce((sum, item) => sum + (parseFloat(item.price) * parseFloat(item.quantity)), 0);
          status = 'completed';
        }

        const payload = {
          id: editTx.id,
          date: editForm.date,
          type: editTx.type,
          amount: editTx.type === 'adjustment' ? parseFloat(editForm.amount) : amount,
          currency: editForm.currency,
          status: editTx.type === 'adjustment' ? 'completed' : status,
          comment: editForm.comment,
          user: user?.email,
          buyerId: editTx.buyer_id,
          buyerName: buyer?.name,
          items: editForm.items?.map(item => ({
            productId: item.product_id,
            warehouseId: item.warehouse_id,
            quantity: parseFloat(item.quantity) || 0,
            price: item.price !== '' ? parseFloat(item.price) : null,
            currency: editForm.currency
          }))
        };

        const res = await updateBuyerTransaction(payload);
        if (res.success) {
          showToast('Операцію оновлено', 'success');
          setEditTx(null);
          loadData();
        }
      }
    } catch (err) {
      console.error('Помилка збереження:', err);
      showToast('Не вдалося зберегти зміни', 'error');
    } finally {
      setSavingEdit(false);
    }
  }

  // 1. Попередній аналіз та групування пов'язаних платежів
  const processedTransactions = [];
  const linkedPaymentsMap = {}; // invoiceId -> array of payments

  // Спочатку збираємо всі пов'язані платежі (які не архівні)
  transactions.forEach(t => {
    if (t.is_archived === true) return;
    if (t.type === 'payment') {
      const match = t.comment?.match(/\[invoice_id:([\w-]+)\]/);
      if (match) {
        const invoiceId = match[1];
        linkedPaymentsMap[invoiceId] = linkedPaymentsMap[invoiceId] || [];
        linkedPaymentsMap[invoiceId].push(t);
      }
    }
  });

  // Будуємо список оброблених транзакцій (виключаючи зв'язані платежі як окремі документи)
  transactions.forEach(t => {
    if (t.type === 'payment') {
      const match = t.comment?.match(/\[invoice_id:([\w-]+)\]/);
      if (match) {
        const invoiceId = match[1];
        // Перевіряємо, чи існує накладна (вона має бути не архівна)
        const invoiceExists = transactions.some(inv => inv.id === invoiceId && inv.is_archived !== true);
        if (invoiceExists) {
          // Якщо накладна існує, не додаємо цей платіж як окремий рядок
          return;
        }
      }
    }
    
    // Якщо це накладна (issue), додаємо до неї зв'язані платежі
    if (t.type === 'issue') {
      const linked = linkedPaymentsMap[t.id] || [];
      processedTransactions.push({
        ...t,
        linkedPayments: linked,
        paidAmount: linked.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      });
    } else {
      processedTransactions.push({ ...t, linkedPayments: [], paidAmount: 0 });
    }
  });

  const activeTransactions = processedTransactions.filter(t => t.is_archived !== true);
  const archivedTransactions = processedTransactions.filter(t => t.is_archived === true);

  // Обчислення початкового та кінцевого балансу для звіту
  let uahOpening = 0;
  let usdOpening = 0;
  let uahPeriodIssue = 0;
  let uahPeriodPayment = 0;
  let usdPeriodIssue = 0;
  let usdPeriodPayment = 0;
  const isSingleDoc = selectedTxFilter !== 'ALL';

  processedTransactions.forEach(t => {
    if (t.is_archived === true) return;
    
    const isReservedIssue = t.type === 'issue' && t.status === 'reserved';
    const amt = isReservedIssue ? 0 : (parseFloat(t.amount) || 0);
    const cur = t.currency;

    if (isSingleDoc) {
      if (t.id === selectedTxFilter) {
        if (t.type === 'issue') {
          if (cur === 'UAH') uahPeriodIssue += amt;
          if (cur === 'USD') usdPeriodIssue += amt;
        } else {
          if (cur === 'UAH') uahPeriodPayment += amt;
          if (cur === 'USD') usdPeriodPayment += amt;
        }
      }
      
      // Враховуємо лінковані платежі для вибраної накладної
      if (t.type === 'issue' && t.id === selectedTxFilter && t.linkedPayments) {
        t.linkedPayments.forEach(lp => {
          const lpAmt = parseFloat(lp.amount) || 0;
          if (lp.currency === 'UAH') uahPeriodPayment += lpAmt;
          if (lp.currency === 'USD') usdPeriodPayment += lpAmt;
        });
      }
    } else {
      if (t.date < dateFrom) {
        if (t.type === 'issue') {
          if (cur === 'UAH') uahOpening -= amt;
          if (cur === 'USD') usdOpening -= amt;
        } else {
          if (cur === 'UAH') uahOpening += amt;
          if (cur === 'USD') usdOpening += amt;
        }
        
        // Враховуємо лінковані платежі до періоду
        if (t.type === 'issue' && t.linkedPayments) {
          t.linkedPayments.forEach(lp => {
            const lpAmt = parseFloat(lp.amount) || 0;
            if (lp.date < dateFrom) {
              if (lp.currency === 'UAH') uahOpening += lpAmt;
              if (lp.currency === 'USD') usdOpening += lpAmt;
            } else if (lp.date >= dateFrom && lp.date <= dateTo) {
              if (lp.currency === 'UAH') uahPeriodPayment += lpAmt;
              if (lp.currency === 'USD') usdPeriodPayment += lpAmt;
            }
          });
        }
      } else if (t.date >= dateFrom && t.date <= dateTo) {
        if (t.type === 'issue') {
          if (cur === 'UAH') uahPeriodIssue += amt;
          if (cur === 'USD') usdPeriodIssue += amt;
        } else {
          if (cur === 'UAH') uahPeriodPayment += amt;
          if (cur === 'USD') usdPeriodPayment += amt;
        }
        
        // Враховуємо лінковані платежі в період
        if (t.type === 'issue' && t.linkedPayments) {
          t.linkedPayments.forEach(lp => {
            const lpAmt = parseFloat(lp.amount) || 0;
            if (lp.date < dateFrom) {
              if (lp.currency === 'UAH') uahOpening += lpAmt;
              if (lp.currency === 'USD') usdOpening += lpAmt;
            } else if (lp.date >= dateFrom && lp.date <= dateTo) {
              if (lp.currency === 'UAH') uahPeriodPayment += lpAmt;
              if (lp.currency === 'USD') usdPeriodPayment += lpAmt;
            }
          });
        }
      }
    }
  });

  const uahClosing = uahOpening - uahPeriodIssue + uahPeriodPayment;
  const usdClosing = usdOpening - usdPeriodIssue + usdPeriodPayment;

  // Формування записів таблиці звіту (сортуємо хронологічно від старіших)
  let currentUahRunning = uahOpening;
  let currentUsdRunning = usdOpening;

  const reportItems = [...processedTransactions]
    .filter(t => {
      if (t.is_archived === true && selectedTxFilter === 'ALL') return false;
      return !isSingleDoc ? (t.date >= dateFrom && t.date <= dateTo) : t.id === selectedTxFilter;
    })
    .map(t => {
      const isReservedIssue = t.type === 'issue' && t.status === 'reserved';
      const amt = isReservedIssue ? 0 : (parseFloat(t.amount) || 0);
      const cur = t.currency;
      
      let uahDeb = 0, uahCred = 0, usdDeb = 0, usdCred = 0;

      if (t.type === 'issue') {
        if (!isReservedIssue) {
          if (cur === 'UAH') { uahDeb = amt; currentUahRunning -= amt; }
          if (cur === 'USD') { usdDeb = amt; currentUsdRunning -= amt; }
        }
        
        // Додаємо суми зв'язаних платежів до кредиту накладної
        if (t.linkedPayments) {
          t.linkedPayments.forEach(lp => {
            const lpAmt = parseFloat(lp.amount) || 0;
            if (lp.currency === 'UAH') { uahCred += lpAmt; currentUahRunning += lpAmt; }
            if (lp.currency === 'USD') { usdCred += lpAmt; currentUsdRunning += lpAmt; }
          });
        }
      } else {
        if (cur === 'UAH') { uahCred = amt; currentUahRunning += amt; }
        if (cur === 'USD') { usdCred = amt; currentUsdRunning += amt; }
      }

      // Генерація текстового опису опеарції
      let desc = '';
      if (t.type === 'issue') {
        const itemDescs = t.items.map(item => {
          const priceTxt = item.price !== null && item.price !== undefined && item.price !== '' ? ` × ${item.price} ${item.currency}` : '';
          return `${item.product_name} — ${item.quantity} ${item.unit}${priceTxt}`;
        });
        desc = `Видача матеріалу: ${itemDescs.join(', ')}`;
        if (t.status === 'pending_price') {
          desc += ' ⚠️ (Ціна очікується)';
        }
      } else if (t.type === 'payment') {
        desc = (t.comment || 'Оплата від покупця').replace(/\s*\[invoice_id:[\w-]+\]/g, '');
      } else if (t.type === 'adjustment') {
        desc = `Коригування: ${(t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}`;
      }

      return {
        ...t,
        desc,
        uahDeb,
        uahCred,
        usdDeb,
        usdCred,
        uahRunning: currentUahRunning,
        usdRunning: currentUsdRunning
      };
    });

  // Фільтрування за обраною валютою
  const filteredReportItems = reportItems.filter(item => {
    if (isSingleDoc) return true; // для окремої накладної валютний фільтр ігноруємо
    if (currencyFilter !== 'ALL' && item.currency !== currencyFilter) return false;
    return true;
  });



  // Допоміжний колір балансу
  function getBalanceClass(val) {
    if (val < 0) return 'text-red-500 font-bold';
    if (val > 0) return 'text-green-500 font-bold';
    return 'text-gray-400';
  }

  function formatMoney(val, symbol = '') {
    if (val === 0) return `0 ${symbol}`;
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  }

  return (
    <div className="pb-12">
      {/* Спеціальні стилі друку */}
      <style>{`
        @media print {
          .app-sidebar, .sidebar-backdrop, .no-print, header, nav, button, .flex-wrap, input, select {
            display: none !important;
          }
          .app-content, main, body, html {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 6px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      {/* Навігація вгорі (ховається при друку) */}
      <div className="flex items-center justify-between gap-3 mb-6 no-print">
        <div className="flex items-center gap-3">
          <Link 
            to="/buyers" 
            className="text-xl p-1 text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            ←
          </Link>
          {buyer && (
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--text)]">{buyer.name}</h1>
              {buyer.phone && <p className="text-xs md:text-sm text-[var(--text-secondary)]">{buyer.phone}</p>}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => {
              setSelectedTxFilter('ALL');
              setActiveTab('reconciliation');
              setTimeout(() => window.print(), 100);
            }}
          >
            🖨️ Друк Акту звірки
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><div className="spinner" /></div>
      ) : !buyer ? (
        <div className="p-12 text-center text-red-500">Клієнт не знайдений</div>
      ) : (
        <div className="space-y-6">
          
          {/* Перемикач вкладок (ховається при друку) */}
          <div className="flex gap-2 border-b border-[var(--border)] pb-2 no-print">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'documents'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
              }`}
            >
              📄 Накладні та Оплати
            </button>
            <button
              onClick={() => {
                setActiveTab('reconciliation');
                setSelectedTxFilter('ALL');
              }}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'reconciliation'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
              }`}
            >
              📊 Акт звірки
            </button>
            <button
              onClick={() => {
                setActiveTab('archive');
                setSelectedTxFilter('ALL');
              }}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'archive'
                  ? 'bg-blue-500 text-white'
                  : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
              }`}
            >
              🗄️ Архів
            </button>
          </div>



          {/* Таблиця документів (Вкладка 1) */}
          {activeTab === 'documents' && (
            <div className="card border border-[var(--border)] bg-[var(--bg-card)] rounded-xl p-4 no-print space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">Перелік документів покупця</h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">Виберіть потрібну накладну або оплату для перегляду акту, редагування чи видалення.</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/buyers/issue?buyerId=${id}`} className="btn btn-primary btn-sm px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1">
                    📤 Видати товар
                  </Link>
                  <Link to={`/buyers/payment?buyerId=${id}`} className="btn btn-secondary btn-sm px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 border border-[var(--border)]">
                    📥 Прийняти оплату
                  </Link>
                </div>
              </div>

              {/* Таблиця документів (Десктоп) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border)]">
                      <th className="p-2 w-28 whitespace-nowrap">Дата</th>
                      <th className="p-2 w-32">Тип документа</th>
                      <th className="p-2 text-center w-32">Сума боргу</th>
                      <th className="p-2 text-center w-32">Сума сплачено</th>
                      <th className="p-2">Деталі (коментар / товари)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {activeTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-[var(--text-secondary)]">
                          Немає документів
                        </td>
                      </tr>
                    ) : (
                      [...activeTransactions].reverse().map((t) => {
                        const isIssue = t.type === 'issue';
                        const isAdj = t.type === 'adjustment';
                        const amt = parseFloat(t.amount) || 0;
                        
                        let details = (t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '');
                        if (isIssue) {
                          details = (
                            <div className="space-y-0.5">
                              {t.picked_up_by && (
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-0.5">
                                  👤 Отримав: {t.picked_up_by}
                                </div>
                              )}
                              {t.comment && <div className="font-semibold mb-1 text-[var(--text)]">{(t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</div>}
                              <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5">
                                {t.items.map((i, idx) => (
                                  <div key={idx} className="leading-tight">
                                    • {i.product_name} — <span className="font-semibold text-[var(--text)]">{i.quantity} {i.unit}</span>
                                  </div>
                                ))}
                              </div>
                              {/* Відображення пов'язаних оплат */}
                              {t.linkedPayments && t.linkedPayments.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                  {t.linkedPayments.map((lp, lIdx) => {
                                    const displayComment = (lp.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/, '');
                                    const lpAmt = parseFloat(lp.amount) || 0;
                                    const formattedLpAmt = lp.currency === 'UAH' ? `${lpAmt.toLocaleString('uk-UA')} грн` : `${lpAmt.toLocaleString('uk-UA')}`;
                                    const showAmt = t.linkedPayments.length > 1;
                                    return (
                                      <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                                        <span>💰 {displayComment} ({lp.date})</span>
                                        <div className="flex gap-1.5 items-center">
                                          {showAmt && <span className="font-semibold">{formattedLpAmt}</span>}
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); startEdit(lp); }} 
                                            className="text-amber-500 hover:underline text-[9px]"
                                            title="Редагувати платіж"
                                          >
                                            ред.
                                          </button>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(lp.id); }} 
                                            className="text-red-500 hover:underline text-[9px]"
                                            title="Видалити платіж"
                                          >
                                            вид.
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        } else if (t.type === 'payment' && t.converted_amount) {
                          details = (
                            <div>
                              {t.comment && <div className="mb-0.5">{(t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</div>}
                              <div className="text-[10px] text-green-600">
                                Отримано: {t.converted_amount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'USD' : 'UAH'} за курсом {t.conversion_rate}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <tr 
                            key={t.id} 
                            className="hover:bg-[var(--border-light)] transition-colors cursor-pointer"
                            onClick={() => startEdit(t)}
                          >
                            <td className="p-2 align-top whitespace-nowrap">{t.date}</td>
                            <td className="p-2 align-top font-semibold text-[var(--text)]">
                              {isIssue ? (
                                <span className="flex items-center gap-1.5 flex-wrap font-semibold text-[var(--text)]">
                                  {t.status === 'reserved' ? '⏳ Бронь' : '📤 Видача товарів'}
                                </span>
                              ) : t.type === 'payment' ? '📥 Оплата' : '🔧 Коригування'}
                              {t.status === 'pending_price' && (
                                <span className="text-[9px] font-bold text-yellow-600 bg-yellow-500/10 px-1 rounded ml-1">
                                  без ціни
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-center align-top font-medium">
                              {isIssue && t.status !== 'reserved' && amt > 0 ? (
                                <span className="text-red-500">{amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}</span>
                              ) : isIssue && t.status === 'reserved' && amt > 0 ? (
                                <span className="text-gray-400 font-normal italic" title="Резерв не списується в борг до видачі">
                                  ({amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'})
                                </span>
                              ) : isAdj && amt < 0 ? (
                                <span className="text-red-500">{Math.abs(amt).toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}</span>
                              ) : (
                                <span className="text-[var(--text-secondary)] opacity-50">—</span>
                              )}
                            </td>
                            <td className="p-2 text-center align-top font-medium">
                              {t.type === 'payment' && amt > 0 ? (
                                <span className="text-green-600">{amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}</span>
                              ) : isAdj && amt > 0 ? (
                                <span className="text-green-600">{amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}</span>
                              ) : isIssue && t.paidAmount > 0 ? (
                                <span className="text-green-600">{t.paidAmount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}</span>
                              ) : (
                                <span className="text-[var(--text-secondary)] opacity-50">—</span>
                              )}
                            </td>
                            <td className="p-2 align-top text-[var(--text-secondary)]">{details}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Картки документів (Мобільний) */}
              <div className="block sm:hidden space-y-3 mt-2">
                {activeTransactions.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-secondary)] bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                    Немає документів
                  </div>
                ) : (
                  [...activeTransactions].reverse().map((t) => {
                    const isIssue = t.type === 'issue';
                    const isAdj = t.type === 'adjustment';
                    const amt = parseFloat(t.amount) || 0;

                    return (
                      <div 
                        key={t.id} 
                        className="p-3 border border-[var(--border)] bg-[var(--bg)] rounded-lg space-y-2 text-xs cursor-pointer hover:border-[var(--border-light)] transition-colors"
                        onClick={() => startEdit(t)}
                      >
                        <div className="flex justify-between items-start text-[10px] text-[var(--text-secondary)] font-mono">
                          <span>📅 {t.date}</span>
                          <span className="font-semibold text-[var(--text)]">
                            {isIssue ? (
                              <span className="flex items-center gap-1.5">
                                {t.status === 'reserved' ? '⏳ Бронь' : '📤 Видача'}
                              </span>
                            ) : t.type === 'payment' ? '📥 Оплата' : '🔧 Коригування'}
                            {t.status === 'pending_price' && ' (без ціни)'}
                          </span>
                        </div>
                        <div>
                          {t.picked_up_by && (
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-1">
                              👤 Отримав: {t.picked_up_by}
                            </div>
                          )}
                          {isIssue ? (
                            <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5 mt-1">
                              {t.items.map((i, idx) => (
                                <div key={idx} className="leading-tight">
                                  • {i.product_name} — <span className="font-semibold text-[var(--text)]">{i.quantity} {i.unit}</span>
                                </div>
                              ))}
                              {t.comment && <div className="mt-1 italic">{t.comment}</div>}
                            </div>
                          ) : (
                            <span className="block text-[var(--text-secondary)]">{t.comment || '—'}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                          <div>
                            {isIssue || (isAdj && amt < 0) ? (
                              <span className="text-red-500 font-semibold">
                                Сума: {t.status === 'reserved' ? (
                                  <span className="text-gray-400 font-normal italic">
                                    ({amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'})
                                  </span>
                                ) : (
                                  `${amt.toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}`
                                )}
                              </span>
                            ) : (
                              <span className="text-green-600 font-semibold">
                                Сума: ${amt.toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}
                              </span>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Архів документів (Вкладка 3) */}
          {activeTab === 'archive' && (
            <div className="card border border-[var(--border)] bg-[var(--bg-card)] rounded-xl p-4 no-print space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)]">Архів документів</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">Тут відображаються закриті (архівовані) накладні та оплати покупця.</p>
              </div>

              {/* Таблиця архівних документів (Десктоп) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg)] text-[var(--text-secondary)] font-semibold border-b border-[var(--border)]">
                      <th className="p-2 w-28 whitespace-nowrap">Дата</th>
                      <th className="p-2 w-32">Тип документа</th>
                      <th className="p-2 text-center w-32">Сума боргу</th>
                      <th className="p-2 text-center w-32">Сума сплачено</th>
                      <th className="p-2">Деталі (коментар / товари)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {archivedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-[var(--text-secondary)]">
                          Архів порожній
                        </td>
                      </tr>
                    ) : (
                      [...archivedTransactions].reverse().map((t) => {
                        const isIssue = t.type === 'issue';
                        const isAdj = t.type === 'adjustment';
                        const amt = parseFloat(t.amount) || 0;
                        
                        let details = (t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '');
                        if (isIssue) {
                          details = (
                            <div className="space-y-0.5">
                              {t.picked_up_by && (
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-0.5">
                                  👤 Отримав: {t.picked_up_by}
                                </div>
                              )}
                              {t.comment && <div className="font-semibold mb-1 text-[var(--text)]">{(t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</div>}
                              <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5">
                                {t.items.map((i, idx) => (
                                  <div key={idx} className="leading-tight">
                                    • {i.product_name} — <span className="font-semibold text-[var(--text)]">{i.quantity} {i.unit}</span>
                                  </div>
                                ))}
                              </div>
                              {/* Відображення пов'язаних оплат в архіві */}
                              {t.linkedPayments && t.linkedPayments.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                  {t.linkedPayments.map((lp, lIdx) => {
                                    const displayComment = (lp.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/, '');
                                    const lpAmt = parseFloat(lp.amount) || 0;
                                    const formattedLpAmt = lp.currency === 'UAH' ? `${lpAmt.toLocaleString('uk-UA')} грн` : `${lpAmt.toLocaleString('uk-UA')}`;
                                    const showAmt = t.linkedPayments.length > 1;
                                    return (
                                      <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5 opacity-75" onClick={(e) => e.stopPropagation()}>
                                        <span>💰 {displayComment} ({lp.date})</span>
                                        {showAmt && <span className="font-semibold">{formattedLpAmt}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        } else if (t.type === 'payment' && t.converted_amount) {
                          details = (
                            <div>
                              {t.comment && <div className="mb-0.5">{(t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</div>}
                              <div className="text-[10px] text-green-600">
                                Отримано: {t.converted_amount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'USD' : 'UAH'} за курсом {t.conversion_rate}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <tr 
                            key={t.id} 
                            className="hover:bg-[var(--border-light)] transition-colors opacity-75 cursor-pointer"
                            onClick={() => startEdit(t)}
                          >
                            <td className="p-2 align-top whitespace-nowrap">{t.date}</td>
                            <td className="p-2 align-top font-semibold text-[var(--text)]">
                              {isIssue ? (t.status === 'reserved' ? '⏳ Бронь' : '📤 Видача товарів') : t.type === 'payment' ? '📥 Оплата' : '🔧 Коригування'}
                              {t.status === 'pending_price' && (
                                <span className="text-[9px] font-bold text-yellow-600 bg-yellow-500/10 px-1 rounded ml-1">
                                  без ціни
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-center align-top font-medium">
                              {isIssue && t.status !== 'reserved' && amt > 0 ? (
                                <span className="text-red-500">{amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}</span>
                              ) : isIssue && t.status === 'reserved' && amt > 0 ? (
                                <span className="text-gray-400 font-normal italic" title="Резерв не списується в борг до видачі">
                                  ({amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'})
                                </span>
                              ) : isAdj && amt < 0 ? (
                                <span className="text-red-500">{Math.abs(amt).toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}</span>
                              ) : (
                                <span className="text-[var(--text-secondary)] opacity-50">—</span>
                              )}
                            </td>
                            <td className="p-2 text-center align-top font-medium">
                              {t.type === 'payment' && amt > 0 ? (
                                <span className="text-green-600">{amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}</span>
                              ) : isAdj && amt > 0 ? (
                                <span className="text-green-600">{amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}</span>
                              ) : isIssue && t.paidAmount > 0 ? (
                                <span className="text-green-600">{t.paidAmount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}</span>
                              ) : (
                                <span className="text-[var(--text-secondary)] opacity-50">—</span>
                              )}
                            </td>
                            <td className="p-2 align-top text-[var(--text-secondary)]">{details}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Картки архівних документів (Мобільний) */}
              <div className="block sm:hidden space-y-3 mt-2">
                {archivedTransactions.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-secondary)] bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                    Архів порожній
                  </div>
                ) : (
                  [...archivedTransactions].reverse().map((t) => {
                    const isIssue = t.type === 'issue';
                    const isAdj = t.type === 'adjustment';
                    const amt = parseFloat(t.amount) || 0;

                    return (
                      <div 
                        key={t.id} 
                        className="p-3 border border-[var(--border)] bg-[var(--bg)] rounded-lg space-y-2 text-xs opacity-75 cursor-pointer hover:border-[var(--border-light)] transition-colors"
                        onClick={() => startEdit(t)}
                      >
                        <div className="flex justify-between items-start text-[10px] text-[var(--text-secondary)] font-mono">
                          <span>📅 {t.date}</span>
                          <span className="font-semibold text-[var(--text)]">
                            {isIssue ? (t.status === 'reserved' ? '⏳ Бронь' : '📤 Видача') : t.type === 'payment' ? '📥 Оплата' : '🔧 Коригування'}
                            {t.status === 'pending_price' && ' (без ціни)'}
                          </span>
                        </div>
                        <div>
                          {t.picked_up_by && (
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-1">
                              👤 Отримав: {t.picked_up_by}
                            </div>
                          )}
                          {isIssue ? (
                            <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5 mt-1">
                              {t.items.map((i, idx) => (
                                <div key={idx} className="leading-tight">
                                  • {i.product_name} — <span className="font-semibold text-[var(--text)]">{i.quantity} {i.unit}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="block text-[var(--text-secondary)]">{t.comment || '—'}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                          <div>
                            {isIssue || (isAdj && amt < 0) ? (
                              <span className="text-red-500 font-semibold">
                                Сума: {amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}
                              </span>
                            ) : (
                              <span className="text-green-600 font-semibold">
                                Сума: {amt.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'грн' : '$'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Вкладка 2: Акт звірки */}
          {activeTab === 'reconciliation' && (
            <div className="print-container space-y-6">
            
            {/* Фінансові підсумки (картки) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl flex flex-col">
                <span className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase tracking-wider">Баланс UAH</span>
                <span className={`text-base md:text-lg ${getBalanceClass(uahClosing)} mt-1`}>
                  {formatMoney(uahClosing, 'грн')}
                </span>
                {uahClosing < 0 && <span className="text-[10px] text-red-400 mt-0.5">борг клієнта</span>}
                {uahClosing > 0 && <span className="text-[10px] text-green-400 mt-0.5">переплата клієнта</span>}
              </div>
              <div className="card p-4 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl flex flex-col">
                <span className="text-[10px] md:text-xs text-[var(--text-secondary)] uppercase tracking-wider">Баланс USD</span>
                <span className={`text-base md:text-lg ${getBalanceClass(usdClosing)} mt-1`}>
                  {formatMoney(usdClosing, '$')}
                </span>
                {usdClosing < 0 && <span className="text-[10px] text-red-400 mt-0.5">борг клієнта</span>}
                {usdClosing > 0 && <span className="text-[10px] text-green-400 mt-0.5">переплата клієнта</span>}
              </div>
            </div>

            {/* Фільтри (ховаються при друку) */}
            <div className="card p-4 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl space-y-4 no-print">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Параметри Акту звірки</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--text-secondary)]">Дата з</label>
                  <input
                    type="date"
                    className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--text-secondary)]">Дата по</label>
                  <input
                    type="date"
                    className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--text-secondary)]">Валюта</label>
                  <select
                    className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                    value={currencyFilter}
                    onChange={(e) => setCurrencyFilter(e.target.value)}
                  >
                    <option value="ALL">Всі операції (UAH та USD)</option>
                    <option value="UAH">Лише UAH (Гривня)</option>
                    <option value="USD">Лише USD (Долар)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--text-secondary)] font-semibold">Фільтр по накладній</label>
                  <select
                    className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                    value={selectedTxFilter}
                    onChange={(e) => setSelectedTxFilter(e.target.value)}
                  >
                    <option value="ALL">Всі накладні та оплати</option>
                    {transactions
                      .filter(t => t.type === 'issue')
                      .map(t => {
                        const amtStr = t.amount !== null ? `${parseFloat(t.amount).toLocaleString('uk-UA')} ${t.currency === 'UAH' ? 'грн' : '$'}` : '(без ціни)';
                        return (
                          <option key={t.id} value={t.id}>
                            Видача {t.date} на {amtStr} ({t.comment || 'без коментаря'})
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>
            </div>

            {/* Акт звірки */}
            <div className="card border border-[var(--border)] bg-[var(--bg-card)] rounded-xl overflow-hidden p-4">
              <div className="flex justify-end mb-2 no-print">
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 font-semibold text-xs px-3 py-1.5 rounded-lg"
                >
                  🖨️ Друкувати звіт
                </Button>
              </div>
              <div className="text-center mb-6">
                <h2 className="text-base md:text-lg font-bold text-[var(--text)] uppercase">
                  {isSingleDoc ? 'Акт звірки по накладній' : 'Акт звірки взаєморозрахунків'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Клієнт: <b>{buyer.name}</b> {isSingleDoc ? (
                    `за накладною від ${transactions.find(t => t.id === selectedTxFilter)?.date} на суму ${
                      transactions.find(t => t.id === selectedTxFilter)?.amount !== null
                        ? `${parseFloat(transactions.find(t => t.id === selectedTxFilter)?.amount || 0).toLocaleString('uk-UA')} ${
                            transactions.find(t => t.id === selectedTxFilter)?.currency === 'UAH' ? 'грн' : '$'
                          }`
                        : '(без ціни)'
                    }`
                  ) : (
                    `за період з ${dateFrom} по ${dateTo}`
                  )}
                </p>
              </div>

              {/* Зведені показники періоду */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-4 border-b border-[var(--border)] pb-4">
                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">Початковий баланс (UAH / USD):</span>
                  <span className="font-semibold block mt-0.5">
                    <span className={getBalanceClass(uahOpening)}>{formatMoney(uahOpening, 'грн')}</span> / <span className={getBalanceClass(usdOpening)}>${formatMoney(usdOpening)}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">Видано товарів за період (UAH / USD):</span>
                  <span className="font-semibold block mt-0.5">
                    {formatMoney(uahPeriodIssue, 'грн')} / ${formatMoney(usdPeriodIssue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">Сплачено за період (UAH / USD):</span>
                  <span className="font-semibold block mt-0.5">
                    {formatMoney(uahPeriodPayment, 'грн')} / ${formatMoney(usdPeriodPayment)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">Кінцевий баланс (UAH / USD):</span>
                  <span className="font-semibold block mt-0.5">
                    <span className={getBalanceClass(uahClosing)}>{formatMoney(uahClosing, 'грн')}</span> / <span className={getBalanceClass(usdClosing)}>${formatMoney(usdClosing)}</span>
                  </span>
                </div>
              </div>

              {/* Таблиця транзакцій */}
              {/* Таблиця транзакцій (Десктоп) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-bottom border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] font-semibold">
                      <th className="p-2 w-28 whitespace-nowrap">Дата</th>
                      <th className="p-2">Документ / Деталі операції</th>
                      <th className="p-2 text-center w-24">Нараховано борг</th>
                      <th className="p-2 text-center w-24">Сплачено</th>
                      <th className="p-2 text-right w-36">Поточний баланс</th>
                      <th className="p-2 text-right w-24 no-print">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {/* Рядок початкового балансу */}
                    <tr className="bg-[var(--border-light)] font-semibold text-[var(--text-secondary)]">
                      <td className="p-2 whitespace-nowrap">{dateFrom}</td>
                      <td className="p-2">Сальдо на початок періоду</td>
                      <td className="p-2 text-center">—</td>
                      <td className="p-2 text-center">—</td>
                      <td className="p-2 text-right">
                        <span className={getBalanceClass(uahOpening)}>{formatMoney(uahOpening, 'грн')}</span> / <span className={getBalanceClass(usdOpening)}>${formatMoney(usdOpening)}</span>
                      </td>
                      <td className="p-2 text-right no-print">—</td>
                    </tr>

                    {filteredReportItems.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-[var(--text-secondary)]">
                          Немає операцій за вказаний період
                        </td>
                      </tr>
                    ) : (
                      filteredReportItems.map((t) => {
                        const hasUah = t.uahDeb > 0 || t.uahCred > 0 || t.currency === 'UAH';
                        const hasUsd = t.usdDeb > 0 || t.usdCred > 0 || t.currency === 'USD';

                        return (
                          <tr key={t.id} className="hover:bg-[var(--border-light)] transition-colors">
                            <td className="p-2 align-top whitespace-nowrap">{t.date}</td>
                            <td className="p-2 align-top">
                              {t.type === 'issue' ? (
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-[var(--text)] flex items-center gap-1.5 flex-wrap">
                                    {t.status === 'reserved' ? '⏳ Бронь матеріалів:' : 'Видача матеріалів:'}
                                  </span>
                                  <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5 pl-1.5">
                                    {t.items?.map((item, idx) => {
                                      const priceTxt = item.price !== null && item.price !== undefined && item.price !== ''
                                        ? ` × ${item.price} ${item.currency || t.currency}`
                                        : '';
                                      return (
                                        <div key={idx} className="leading-tight">
                                          • {item.product_name} — <span className="font-semibold text-[var(--text)]">{item.quantity} {item.unit}</span>{priceTxt}
                                        </div>
                                      );
                                    })}
                                    {t.status === 'pending_price' && (
                                      <div className="text-yellow-600 font-semibold mt-1">⚠️ (Ціна очікується)</div>
                                    )}
                                  </div>
                                  {/* Відображення пов'язаних оплат в акті звірки */}
                                  {t.linkedPayments && t.linkedPayments.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                      {t.linkedPayments.map((lp, lIdx) => {
                                        const displayComment = (lp.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/, '');
                                        const lpAmt = parseFloat(lp.amount) || 0;
                                        const formattedLpAmt = lp.currency === 'UAH' ? `${lpAmt.toLocaleString('uk-UA')} грн` : `${lpAmt.toLocaleString('uk-UA')}`;
                                        const showAmt = t.linkedPayments.length > 1;
                                        return (
                                          <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                                            <span>💰 {displayComment} ({lp.date})</span>
                                            <div className="flex gap-1.5 items-center no-print">
                                              {showAmt && <span className="font-semibold">{formattedLpAmt}</span>}
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); startEdit(lp); }} 
                                                className="text-amber-500 hover:underline text-[9px]"
                                                title="Редагувати платіж"
                                              >
                                                ред.
                                              </button>
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(lp.id); }} 
                                                className="text-red-500 hover:underline text-[9px]"
                                                title="Видалити платіж"
                                              >
                                                вид.
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="font-medium text-[var(--text)] block">{t.desc}</span>
                              )}
                              {t.picked_up_by && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block mt-0.5">👤 Отримав: {t.picked_up_by}</span>
                              )}
                              {t.comment && t.type !== 'payment' && (
                                <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">{(t.comment || '').replace(/\s*\[invoice_id:[\w-]+\]/g, '')}</span>
                              )}
                              {t.user_email && (
                                <span className="text-[9px] text-[var(--text-secondary)] opacity-60 block mt-0.5">Вніс: {t.user_email}</span>
                              )}
                            </td>
                            <td className="p-2 text-center text-red-500 font-medium align-top">
                              {t.uahDeb > 0 && `${t.uahDeb.toLocaleString('uk-UA')} грн`}
                              {t.usdDeb > 0 && `$${t.usdDeb.toLocaleString('uk-UA')}`}
                              {t.uahDeb === 0 && t.usdDeb === 0 && '—'}
                            </td>
                            <td className="p-2 text-center text-green-500 font-medium align-top">
                              {t.uahCred > 0 && `${t.uahCred.toLocaleString('uk-UA')} грн`}
                              {t.usdCred > 0 && `$${t.usdCred.toLocaleString('uk-UA')}`}
                              {t.uahCred === 0 && t.usdCred === 0 && '—'}
                            </td>
                            <td className="p-2 text-right align-top whitespace-nowrap text-xs">
                              <span className={getBalanceClass(t.uahRunning)}>{formatMoney(t.uahRunning, 'грн')}</span>
                              <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                              <span className={getBalanceClass(t.usdRunning)}>${formatMoney(t.usdRunning)}</span>
                            </td>
                            <td className="p-2 text-right align-top no-print">
                              <div className="flex justify-end gap-1.5 items-center">
                                
                                <button 
                                  onClick={() => startEdit(t)} 
                                  className="text-amber-500 hover:bg-amber-500/10 px-1 py-0.5 rounded text-[10px]"
                                  title="Редагувати"
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={() => handleDeleteTransaction(t.id)} 
                                  className="text-red-500 hover:bg-red-500/10 px-1 py-0.5 rounded text-[10px]"
                                  title="Видалити"
                                >
                                  ❌
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Мобільний вигляд списку операцій (Картки) */}
              <div className="block sm:hidden space-y-3 mt-2 no-print">
                {filteredReportItems.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-secondary)] bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                    Немає операцій за вказаний період
                  </div>
                ) : (
                  filteredReportItems.map((t) => {
                    const isIssue = t.type === 'issue';
                    return (
                      <div key={t.id} className="p-3 border border-[var(--border)] bg-[var(--bg)] rounded-lg space-y-2 text-xs">
                        <div className="flex justify-between items-start text-[10px] text-[var(--text-secondary)] font-mono">
                          <span>📅 {t.date}</span>
                          <span className="font-semibold text-[var(--text)]">
                            Баланс: <span className={getBalanceClass(t.uahRunning)}>{formatMoney(t.uahRunning, 'грн')}</span> / <span className={getBalanceClass(t.usdRunning)}>${formatMoney(t.usdRunning)}</span>
                          </span>
                        </div>
                        <div>
                          {isIssue ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                                {t.status === 'reserved' ? '⏳ Бронь матеріалів:' : 'Видача матеріалів:'}
                              </span>
                              <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5 pl-1.5">
                                {t.items?.map((item, idx) => {
                                  const priceTxt = item.price !== null && item.price !== undefined && item.price !== ''
                                    ? ` × ${item.price} ${item.currency || t.currency}`
                                    : '';
                                  return (
                                    <div key={idx} className="leading-tight">
                                      • {item.product_name} — <span className="font-semibold text-[var(--text)]">{item.quantity} {item.unit}</span>{priceTxt}
                                    </div>
                                  );
                                })}
                                {t.status === 'pending_price' && (
                                  <div className="text-yellow-600 font-semibold mt-1">⚠️ (Ціна очікується)</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="font-semibold text-[var(--text)] block">{t.desc}</span>
                          )}
                          {t.picked_up_by && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block mt-0.5">👤 Отримав: {t.picked_up_by}</span>
                          )}
                          {t.comment && t.type !== 'payment' && (
                            <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">{t.comment}</span>
                          )}
                          {t.user_email && (
                            <span className="text-[9px] text-[var(--text-secondary)] opacity-60 block mt-0.5">Вніс: {t.user_email}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                          <div>
                            {isIssue ? (
                              <span className="text-red-500 font-semibold">
                                Видано: {t.uahDeb > 0 ? `${t.uahDeb.toLocaleString('uk-UA')} грн` : t.usdDeb > 0 ? `$${t.usdDeb.toLocaleString('uk-UA')}` : '—'}
                              </span>
                            ) : (
                              <span className="text-green-600 font-semibold">
                                Сплачено: {t.uahCred > 0 ? `${t.uahCred.toLocaleString('uk-UA')} грн` : t.usdCred > 0 ? `$${t.usdCred.toLocaleString('uk-UA')}` : '—'}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 items-center">

                            <button 
                              onClick={() => startEdit(t)} 
                              className="px-2 py-1 rounded border border-amber-500/20 text-amber-600 hover:bg-amber-500/5 text-[10px] flex items-center gap-1 font-semibold"
                            >
                              ✏️ Редагувати
                            </button>
                            <button 
                              onClick={() => handleDeleteTransaction(t.id)} 
                              className="px-2 py-1 rounded border border-red-500/20 text-red-500 hover:bg-red-500/5 text-[10px] flex items-center gap-1 font-semibold"
                            >
                              ❌ Видалити
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )}

      {/* Модалка видачі резерву */}
      {reserveReleaseTx && reserveReleaseForm && (
        <div className="modal-overlay no-print" onClick={() => setReserveReleaseTx(null)}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-[var(--text)]">📦 Видача заброньованих товарів</h3>
              <button className="modal-close" onClick={() => setReserveReleaseTx(null)}>×</button>
            </div>
            <form onSubmit={handleReserveReleaseSubmit}>
              <div className="modal-body space-y-4 text-xs">
                
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg space-y-1">
                  <div className="font-semibold text-[var(--text)]">Оригінальна бронь від {reserveReleaseTx.date}</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Загальна сума: {reserveReleaseTx.amount !== null ? `${reserveReleaseTx.amount.toLocaleString('uk-UA')} ${reserveReleaseTx.currency === 'UAH' ? 'грн' : '$'}` : '(без ціни)'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-[var(--text-secondary)]">Отримувач (водій/представник)</label>
                    <input
                      type="text"
                      placeholder="ПІБ отримувача"
                      className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                      value={reserveReleaseForm.pickedUpBy}
                      onChange={(e) => setReserveReleaseForm({ ...reserveReleaseForm, pickedUpBy: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-[var(--text-secondary)]">Коментар до видачі</label>
                    <input
                      type="text"
                      placeholder="напр. часткове відвантаження"
                      className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                      value={reserveReleaseForm.comment}
                      onChange={(e) => setReserveReleaseForm({ ...reserveReleaseForm, comment: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-[var(--text-secondary)] block">Товари для відвантаження</label>
                  <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)] overflow-hidden max-h-60 overflow-y-auto">
                    {reserveReleaseForm.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-[var(--bg-card)] flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[var(--text)] truncate">{item.productName}</div>
                          {item.productArticle && <div className="text-[10px] text-[var(--text-secondary)] font-mono">{item.productArticle}</div>}
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Всього в броні: {item.quantityReserved} {item.unit}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-[var(--text-secondary)] font-medium">К-сть видачі:</label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max={item.quantityReserved}
                            required
                            className="w-20 p-1 text-center rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] font-bold focus:outline-none"
                            value={item.quantityToIssue}
                            onChange={(e) => {
                              const newItems = [...reserveReleaseForm.items];
                              newItems[idx].quantityToIssue = e.target.value;
                              setReserveReleaseForm({ ...reserveReleaseForm, items: newItems });
                            }}
                          />
                          <span className="text-[10px] text-[var(--text-secondary)] font-medium w-6">{item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              <div className="modal-footer flex flex-wrap justify-between gap-2 p-3 bg-[var(--bg)] border-t border-[var(--border)] w-full">
                <button
                  type="button"
                  onClick={handleCancelReserve}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  ❌ Скасувати бронь
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReserveReleaseTx(null)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--border-light)] border border-[var(--border)] transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                  >
                    📦 Провести видачу
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка редагування транзакції */}
      {editTx && editForm && (
        <div className="modal-overlay no-print" onClick={() => setEditTx(null)}>
          <div className={`modal ${editForm?.items ? 'max-w-xl' : 'max-w-sm'}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-[var(--text)]">✏️ Редагування операції ({editTx.type === 'payment' ? 'Оплата' : 'Видача'})</h3>
              <button className="modal-close" onClick={() => setEditTx(null)}>×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body space-y-4">
                
                <div className="form-group flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Дата операції</label>
                  <input
                    type="date"
                    className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    required
                  />
                </div>

                {editTx.type === 'payment' ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-secondary)]">Сума отримання</label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                          value={editForm.amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm(prev => ({
                              ...prev,
                              amount: val,
                              comment: isEditCommentDirty ? prev.comment : updateCommentAmount(prev.comment, val, prev.currency)
                            }));
                          }}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-[var(--text-secondary)]">Валюта</label>
                        <select
                          className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                          value={editForm.currency}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm(prev => ({
                              ...prev,
                              currency: val,
                              comment: isEditCommentDirty ? prev.comment : updateCommentAmount(prev.comment, prev.amount, val)
                            }));
                          }}
                        >
                          <option value="UAH">UAH</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border)]">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editForm.useConversion}
                          onChange={(e) => setEditForm({ ...editForm, useConversion: e.target.checked })}
                          className="rounded border-[var(--border)]"
                        />
                        <span className="text-xs font-semibold text-[var(--text)]">Конвертація в іншу валюту</span>
                      </label>
                    </div>

                    {editForm.useConversion && (
                      <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg space-y-2">
                        <div className="form-group flex flex-col gap-1">
                          <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Курс обміну</label>
                          <input
                            type="number"
                            step="any"
                            min="0.0001"
                            className="p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text)] focus:outline-none"
                            value={editForm.conversionRate}
                            onChange={(e) => setEditForm({ ...editForm, conversionRate: e.target.value })}
                            required={editForm.useConversion}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : editTx.type === 'adjustment' ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Сума коригування</label>
                      <input
                        type="number"
                        step="any"
                        className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">Валюта</label>
                      <select
                        className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                        value={editForm.currency}
                        onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      >
                        <option value="UAH">UAH</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  // Видача товарів (редагування цін та кількості)
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">Товари у видачі</label>
                    {editForm.items?.map((item, idx) => (
                      <div key={item.id} className="p-2 border border-[var(--border)] rounded bg-[var(--bg)] space-y-2 text-xs">
                        <div className="font-bold text-[var(--text)] truncate">{item.product_name}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-[var(--text-secondary)]">К-сть</label>
                            <input
                              type="number"
                              step="any"
                              required
                              className="p-1 rounded border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text)]"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                newItems[idx].quantity = e.target.value;
                                setEditForm({ ...editForm, items: newItems });
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] text-[var(--text-secondary)]">Ціна ({editForm.currency})</label>
                            <input
                              type="number"
                              step="any"
                              className="p-1 rounded border border-[var(--border)] bg-[var(--bg-card)] text-xs text-[var(--text)]"
                              placeholder="неоцінено"
                              value={item.price}
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                newItems[idx].price = e.target.value;
                                setEditForm({ ...editForm, items: newItems });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-group flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Коментар</label>
                  <input
                    type="text"
                    className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                    value={editForm.comment}
                    onChange={(e) => {
                      setIsEditCommentDirty(true);
                      setEditForm({ ...editForm, comment: e.target.value });
                    }}
                  />
                </div>

              </div>
              <div className="modal-footer flex justify-between items-center w-full">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Ви впевнені, що хочете видалити цю операцію?')) {
                        handleDeleteTransaction(editTx.id);
                        setEditTx(null);
                      }
                    }}
                    className="px-3 py-1.5 rounded border border-red-500/20 text-red-500 hover:bg-red-500/5 text-xs font-semibold"
                  >
                    🗑️ Видалити
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleArchive(editTx.id, !editTx.is_archived);
                      setEditTx(null);
                    }}
                    className="px-3 py-1.5 rounded border border-gray-500/25 text-gray-500 hover:bg-gray-500/5 text-xs font-semibold"
                  >
                    {editTx.is_archived ? '🔄 Розархівувати' : '🗄️ В Архів'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditTx(null)}>Скасувати</Button>
                  <Button type="submit" variant="primary" disabled={savingEdit} loading={savingEdit}>
                    Зберегти
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
