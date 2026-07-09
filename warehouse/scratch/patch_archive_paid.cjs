const fs = require('fs');

// 1. Patch BuyerPaymentForm.jsx
const pfPath = 'warehouse/src/pages/BuyerPaymentForm.jsx';
if (fs.existsSync(pfPath)) {
  let content = fs.readFileSync(pfPath, 'utf8').replace(/\r\n/g, '\n');

  const pfImportsSearch = `import { getBuyers, addBuyerTransaction } from '../api/gasApi';`;
  const pfImportsReplace = `import { getBuyers, addBuyerTransaction, getBuyerTransactionById, getBuyerTransactions, updateBuyerTransaction } from '../api/gasApi';`;

  const pfSubmitSearch = `      const result = await addBuyerTransaction(payload);
      if (result?.success) {
        showToast('Оплату успішно зареєстровано', 'success');
        navigate('/buyers');
      } else {
        showToast(result?.error || 'Помилка збереження', 'error');
      }`;

  const pfSubmitReplace = `      const result = await addBuyerTransaction(payload);
      if (result?.success) {
        showToast('Оплату успішно зареєстровано', 'success');
        
        if (preInvoiceId) {
          try {
            const [invoiceRes, allTxRes] = await Promise.all([
              getBuyerTransactionById(preInvoiceId),
              getBuyerTransactions(formData.buyerId)
            ]);
            
            if (invoiceRes?.success && invoiceRes.transaction && allTxRes?.success) {
              const invoice = invoiceRes.transaction;
              const invoiceAmt = parseFloat(invoice.amount) || 0;
              
              const linkedPayments = (allTxRes.transactions || []).filter(t => 
                t.type === 'payment' && 
                t.is_archived !== true && 
                t.comment?.includes(\`[invoice_id:\${preInvoiceId}]\`)
              );
              const totalPaid = linkedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
              
              if (totalPaid >= invoiceAmt && !invoice.is_archived) {
                const closeInvoice = window.confirm("Ця накладна повністю оплачена. Бажаєте закрити її (перенести в архів)?");
                if (closeInvoice) {
                  await updateBuyerTransaction({
                    id: preInvoiceId,
                    is_archived: true
                  });
                  showToast('Накладну перенесено в архів', 'success');
                }
              }
            }
          } catch (err) {
            console.error('Помилка при перевірці оплати накладної:', err);
          }
        }
        
        navigate('/buyers');
      } else {
        showToast(result?.error || 'Помилка збереження', 'error');
      }`;

  if (content.indexOf(pfImportsSearch) === -1) {
    console.error("Error: Could not find imports in BuyerPaymentForm.jsx");
    process.exit(1);
  }
  if (content.indexOf(pfSubmitSearch) === -1) {
    console.error("Error: Could not find submit block in BuyerPaymentForm.jsx");
    process.exit(1);
  }

  content = content.replace(pfImportsSearch, pfImportsReplace).replace(pfSubmitSearch, pfSubmitReplace);
  fs.writeFileSync(pfPath, content, 'utf8');
  console.log("SUCCESS: BuyerPaymentForm.jsx successfully patched!");
}

// 2. Patch BuyerDetails.jsx
const detPath = 'warehouse/src/pages/BuyerDetails.jsx';
if (fs.existsSync(detPath)) {
  let content = fs.readFileSync(detPath, 'utf8').replace(/\r\n/g, '\n');

  const detSubmitSearch = `        const res = await updateBuyerTransaction(payload);
        if (res.success) {
          showToast('Оплату оновлено', 'success');
          setEditTx(null);
          loadData();
        }`;

  const detSubmitReplace = `        const res = await updateBuyerTransaction(payload);
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
                    t.comment?.includes(\`[invoice_id:\${invoiceId}]\`)
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
        }`;

  if (content.indexOf(detSubmitSearch) === -1) {
    console.error("Error: Could not find submit block in BuyerDetails.jsx");
    process.exit(1);
  }

  content = content.replace(detSubmitSearch, detSubmitReplace);
  fs.writeFileSync(detPath, content, 'utf8');
  console.log("SUCCESS: BuyerDetails.jsx successfully patched!");
}
