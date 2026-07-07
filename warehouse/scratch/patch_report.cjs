const fs = require('fs');
const filepath = 'warehouse/src/pages/BuyersReport.jsx';
let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');

// ==========================================
// 1. Calculations block replacement
// ==========================================
const calcStartMarker = "// Розрахунок оборотної відомості (Trial Balance) по кожному покупцю";
const calcEndMarker = "sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)); // Новіші спочатку";

const calcStart = content.indexOf(calcStartMarker);
const calcEnd = content.indexOf(calcEndMarker);

if (calcStart === -1 || calcEnd === -1) {
  console.error("Error: Could not locate calculation block markers!", { calcStart, calcEnd });
  process.exit(1);
}

const calcEndIndex = calcEnd + calcEndMarker.length;
console.log("Calculations block markers found successfully!");

const newCalcBlock = `// Розрахунок оборотної відомості (Trial Balance) по кожному покупцю
  // 1. Попередній аналіз та групування пов'язаних платежів
  const processedTransactions = [];
  const linkedPaymentsMap = {}; // invoiceId -> array of payments

  // Спочатку збираємо всі пов'язані платежі (які не архівні)
  transactions.forEach(t => {
    if (t.is_archived === true) return;
    if (t.type === 'payment') {
      const match = t.comment?.match(/\\[invoice_id:([\\w-]+)\\]/);
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
      const match = t.comment?.match(/\\[invoice_id:([\\w-]+)\\]/);
      if (match) {
        const invoiceId = match[1];
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

  // Розрахунок оборотної відомості (Trial Balance) по кожному покупцю
  const trialBalanceRows = buyers.map(buyer => {
    // Сортуємо транзакції клієнта хронологічно для правильного розрахунку накопичувального підсумку
    const buyerTx = [...processedTransactions]
      .filter(t => t.buyer_id === buyer.id && t.is_archived !== true)
      .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
    
    let uahOpening = 0, usdOpening = 0;
    let uahIssued = 0, usdIssued = 0;
    let uahPaid = 0, usdPaid = 0;

    // 1. Початковий баланс до початку періоду
    buyerTx.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      const cur = t.currency;

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
              if (lp.currency === 'UAH') uahPaid += lpAmt;
              if (lp.currency === 'USD') usdPaid += lpAmt;
            }
          });
        }
      }
    });

    let currentUahRunning = uahOpening;
    let currentUsdRunning = usdOpening;
    const periodItems = [];

    // 2. Обходимо транзакції періоду та розраховуємо накопичувальний підсумок для кожної операції
    buyerTx.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      const cur = t.currency;

      let uahDeb = 0, uahCred = 0, usdDeb = 0, usdCred = 0;

      if (t.type === 'issue') {
        if (cur === 'UAH') { uahDeb = amt; currentUahRunning -= amt; uahIssued += amt; }
        if (cur === 'USD') { usdDeb = amt; currentUsdRunning -= amt; usdIssued += amt; }
        
        // Враховуємо лінковані платежі в межах періоду
        if (t.linkedPayments) {
          t.linkedPayments.forEach(lp => {
            const lpAmt = parseFloat(lp.amount) || 0;
            if (lp.currency === 'UAH') {
              uahCred += lpAmt;
              currentUahRunning += lpAmt;
              if (lp.date >= dateFrom && lp.date <= dateTo) {
                uahPaid += lpAmt;
              }
            }
            if (lp.currency === 'USD') {
              usdCred += lpAmt;
              currentUsdRunning += lpAmt;
              if (lp.date >= dateFrom && lp.date <= dateTo) {
                usdPaid += lpAmt;
              }
            }
          });
        }
      } else {
        if (cur === 'UAH') { uahCred = amt; currentUahRunning += amt; if (t.date >= dateFrom && t.date <= dateTo) uahPaid += amt; }
        if (cur === 'USD') { usdCred = amt; currentUsdRunning += amt; if (t.date >= dateFrom && t.date <= dateTo) usdPaid += amt; }
      }

      if (t.date >= dateFrom && t.date <= dateTo) {
        periodItems.push({
          ...t,
          uahDeb,
          uahCred,
          usdDeb,
          usdCred,
          uahRunning: currentUahRunning,
          usdRunning: currentUsdRunning
        });
      }
    });

    const uahClosing = uahOpening - uahIssued + uahPaid;
    const usdClosing = usdOpening - usdIssued + usdPaid;

    return {
      id: buyer.id,
      name: buyer.name,
      phone: buyer.phone,
      uahOpening,
      usdOpening,
      uahIssued,
      usdIssued,
      uahPaid,
      usdPaid,
      uahClosing,
      usdClosing,
      items: periodItems
    };
  });

  // Підрахунок загальних сум для підвалу відомості
  let totalUahOpening = 0, totalUsdOpening = 0;
  let totalUahIssued = 0, totalUsdIssued = 0;
  let totalUahPaid = 0, totalUsdPaid = 0;
  let totalUahClosing = 0, totalUsdClosing = 0;

  trialBalanceRows.forEach(row => {
    totalUahOpening += row.uahOpening;
    totalUsdOpening += row.usdOpening;
    totalUahIssued += row.uahIssued;
    totalUsdIssued += row.usdIssued;
    totalUahPaid += row.uahPaid;
    totalUsdPaid += row.usdPaid;
    totalUahClosing += row.uahClosing;
    totalUsdClosing += row.usdClosing;
  });

  // Фільтрування загального журналу операцій (вкладка 2)
  const filteredJournalTransactions = processedTransactions
    .filter(t => t.is_archived !== true)
    .filter(t => t.date >= dateFrom && t.date <= dateTo)
    .filter(t => currencyFilter === 'ALL' || t.currency === currencyFilter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)); // Новіші спочатку`;

content = content.substring(0, calcStart) + newCalcBlock + content.substring(calcEndIndex);

// ==========================================
// 2. Desktop Journal table columns replacement
// ==========================================
const firstMapIndex = content.indexOf("filteredJournalTransactions.map(t => {");
if (firstMapIndex === -1) {
  console.error("Error: Could not locate desktop table map function!");
  process.exit(1);
}

const tdStartIndex = content.indexOf('<td className="p-2 align-top">', firstMapIndex);
const tdEndIndex = content.indexOf('</td>', content.indexOf('text-green-500 font-medium', tdStartIndex)) + '</td>'.length;

if (tdStartIndex === -1 || tdEndIndex === -1) {
  console.error("Error: Could not locate desktop table column boundaries!", { tdStartIndex, tdEndIndex });
  process.exit(1);
}
console.log("Desktop Journal table columns boundaries found successfully!");

const newDesktopColumns = `<td className="p-2 align-top">
                                  {isIssue ? (
                                    <div className="space-y-0.5">
                                      <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5">
                                        {t.items?.map((item, idx) => {
                                          const priceTxt = item.price !== null && item.price !== undefined && item.price !== ''
                                            ? \` × \${item.price} \${item.currency || t.currency}\`
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
                                      {t.comment && (
                                        <div className="text-[10px] text-[var(--text-secondary)] italic mt-1">Коментар: {(t.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/g, '')}</div>
                                      )}
                                      {/* Вкладені лінковані платежі */}
                                      {t.linkedPayments && t.linkedPayments.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                          {t.linkedPayments.map((lp, lIdx) => {
                                            const displayComment = (lp.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/, '');
                                            const lpAmt = parseFloat(lp.amount) || 0;
                                            const formattedLpAmt = lp.currency === 'UAH' ? \`\${lpAmt.toLocaleString('uk-UA')} грн\` : \`$\${lpAmt.toLocaleString('uk-UA')}\`;
                                            return (
                                              <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5">
                                                <span>💰 {displayComment} ({lp.date})</span>
                                                <span className="font-semibold">{formattedLpAmt}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="font-medium text-[var(--text)] block">{(t.comment || '—').replace(/\\s*\\[invoice_id:[\\w-]+\\]/g, '')}</span>
                                      {t.converted_amount && (
                                        <span className="text-[10px] text-green-600 block mt-0.5">
                                          Зараховано: {t.converted_amount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'USD' : 'UAH'} за курсом {t.conversion_rate}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="p-2 text-center align-top text-red-500 font-medium">
                                  {(isIssue || (isAdj && amt < 0)) && amt > 0 ? (
                                    \`\${Math.abs(amt).toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                  ) : '—'}
                                </td>
                                <td className="p-2 text-center align-top text-green-500 font-medium">
                                  {(!isIssue && !(isAdj && amt < 0)) && amt > 0 ? (
                                    \`\${amt.toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                  ) : isIssue && t.paidAmount > 0 ? (
                                    \`\${t.paidAmount.toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                  ) : '—'}</td>`;

content = content.substring(0, tdStartIndex) + newDesktopColumns + content.substring(tdEndIndex);

// ==========================================
// 3. Mobile Journal cards replacement
// ==========================================
const newSecondMapIndex = content.indexOf("filteredJournalTransactions.map(t => {", firstMapIndex + 1);
if (newSecondMapIndex === -1) {
  console.error("Error: Could not locate mobile card map function!");
  process.exit(1);
}

const mobileDetailsStartIndex = content.indexOf("{isIssue ? (", newSecondMapIndex);
const splatanoIndex = content.indexOf('text-green-600 font-bold', mobileDetailsStartIndex);
const div1 = content.indexOf('</div>', splatanoIndex) + 6;
const div2 = content.indexOf('</div>', div1) + 6;
const div3 = content.indexOf('</div>', div2) + 6;

if (mobileDetailsStartIndex === -1 || splatanoIndex === -1 || div3 === -1) {
  console.error("Error: Could not locate mobile card boundaries!", { mobileDetailsStartIndex, splatanoIndex, div3 });
  process.exit(1);
}
console.log("Mobile Journal cards boundaries found successfully!");

const newMobileCards = `{isIssue ? (
                                  <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)]/50 p-2 rounded border border-[var(--border)]/40 space-y-1">
                                    {t.items?.map((item, idx) => {
                                      const priceTxt = item.price !== null && item.price !== undefined && item.price !== ''
                                        ? \` × \${item.price} \${item.currency || t.currency}\`
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
                                    {t.comment && (
                                      <div className="text-[10px] text-[var(--text-secondary)] italic border-t border-[var(--border)]/40 pt-1 mt-1">
                                        Коментар: {(t.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/g, '')}
                                      </div>
                                    )}
                                    {/* Вкладені лінковані платежі мобільна версія */}
                                    {t.linkedPayments && t.linkedPayments.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                        {t.linkedPayments.map((lp, lIdx) => {
                                          const displayComment = (lp.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/, '');
                                          const lpAmt = parseFloat(lp.amount) || 0;
                                          const formattedLpAmt = lp.currency === 'UAH' ? \`\${lpAmt.toLocaleString('uk-UA')} грн\` : \`$\${lpAmt.toLocaleString('uk-UA')}\`;
                                          return (
                                            <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5">
                                              <span>💰 {displayComment} ({lp.date})</span>
                                              <span className="font-semibold">{formattedLpAmt}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)]/50 p-2 rounded border border-[var(--border)]/40 space-y-1">
                                    <div className="leading-tight font-medium">{(t.comment || '—').replace(/\\s*\\[invoice_id:[\\w-]+\\]/g, '')}</div>
                                    {t.converted_amount && (
                                      <div className="text-green-600 font-semibold text-[10px]">
                                        Зараховано: {t.converted_amount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'USD' : 'UAH'} за курсом {t.conversion_rate}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Суми та дії */}
                                <div className="flex justify-between items-center pt-1 border-t border-[var(--border)]/40 text-[11px]">
                                  <div className="flex gap-4">
                                    <div>
                                      <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Нараховано</span>
                                      <span className="text-red-500 font-bold">
                                        {(isIssue || (isAdj && amt < 0)) && amt > 0
                                          ? \`\${Math.abs(amt).toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                          : '—'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Сплачено</span>
                                      <span className="text-green-600 font-bold">
                                        {(!isIssue && !(isAdj && amt < 0)) && amt > 0
                                          ? \`\${amt.toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                          : isIssue && t.paidAmount > 0 ? (
                                            \`\${t.paidAmount.toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                          ) : '—'}
                                      </span>
                                    </div>
                                  </div>
                                </div>`;

content = content.substring(0, mobileDetailsStartIndex) + newMobileCards + content.substring(div3);

// ==========================================
// 4. Detailed Statement desktop columns replacement
// ==========================================
// Find first map of trialBalanceRows
const firstTBMapIndex = content.indexOf("trialBalanceRows.map(row => (");
if (firstTBMapIndex === -1) {
  console.error("Error: Could not locate trialBalanceRows map in desktop detailed report!");
  process.exit(1);
}

const desktopItemsMapIndex = content.indexOf("row.items.map(t => {", firstTBMapIndex);
if (desktopItemsMapIndex === -1) {
  console.error("Error: Could not locate row.items map in desktop detailed report!");
  process.exit(1);
}

const tbTdStartIndex = content.indexOf('<td className="p-2 align-top pl-6 text-[var(--text-secondary)]">', desktopItemsMapIndex);
const tbDetailsStartIndex = content.indexOf('<td className="p-2 align-top">', tbTdStartIndex);
const tbDetailsEndIndex = content.indexOf('</td>', content.indexOf('text-green-500 font-medium', tbDetailsStartIndex)) + '</td>'.length;

if (tbDetailsStartIndex === -1 || tbDetailsEndIndex === -1) {
  console.error("Error: Could not locate desktop detailed statement column boundaries!", { tbDetailsStartIndex, tbDetailsEndIndex });
  process.exit(1);
}
console.log("Desktop Detailed Statement columns boundaries found successfully!");

const newTBDesktopColumns = `<td className="p-2 align-top">
                                              {isIssue ? (
                                                <div className="space-y-0.5">
                                                  <span className="font-semibold text-[var(--text)] block">Видача матеріалів:</span>
                                                  <div className="text-[10px] text-[var(--text-secondary)] space-y-0.5 pl-1.5">
                                                    {t.items?.map((item, idx) => {
                                                      const priceTxt = item.price !== null && item.price !== undefined && item.price !== ''
                                                        ? \` × \${item.price} \${item.currency || t.currency}\`
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
                                                  {t.picked_up_by && (
                                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                                                      👤 Отримав: {t.picked_up_by}
                                                    </div>
                                                  )}
                                                  {t.comment && (
                                                    <div className="text-[10px] text-[var(--text-secondary)] italic mt-1">Коментар: {(t.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/g, '')}</div>
                                                  )}
                                                  {/* Вкладені лінковані платежі у відомості взаєморозрахунків */}
                                                  {t.linkedPayments && t.linkedPayments.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                                      {t.linkedPayments.map((lp, lIdx) => {
                                                        const displayComment = (lp.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/, '');
                                                        const lpAmt = parseFloat(lp.amount) || 0;
                                                        const formattedLpAmt = lp.currency === 'UAH' ? \`\${lpAmt.toLocaleString('uk-UA')} грн\` : \`$\${lpAmt.toLocaleString('uk-UA')}\`;
                                                        return (
                                                          <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5 animate-fadeIn">
                                                            <span>💰 {displayComment} ({lp.date})</span>
                                                            <span className="font-semibold">{formattedLpAmt}</span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div>
                                                  <span className="font-semibold text-[var(--text)] block">
                                                    {t.type === 'payment' ? '📥 Оплата' : '🔧 Коригування'}
                                                  </span>
                                                  <span className="text-[var(--text-secondary)] block mt-0.5">{(t.comment || '—').replace(/\\s*\\[invoice_id:[\\w-]+\\]/g, '')}</span>
                                                  {t.converted_amount && (
                                                    <span className="text-[10px] text-green-600 block mt-0.5">
                                                      Зараховано: {t.converted_amount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'USD' : 'UAH'} за курсом {t.conversion_rate}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </td>
                                            <td className="p-2 text-center align-top text-red-500 font-medium">
                                              {(isIssue || (isAdj && amt < 0)) && amt > 0 ? (
                                                \`\${Math.abs(amt).toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                              ) : '—'}
                                            </td>
                                            <td className="p-2 text-center align-top text-green-500 font-medium">
                                              {(!isIssue && !(isAdj && amt < 0)) && amt > 0 ? (
                                                \`\${amt.toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                              ) : isIssue && t.paidAmount > 0 ? (
                                                \`\${t.paidAmount.toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                              ) : '—'}</td>`;

content = content.substring(0, tbDetailsStartIndex) + newTBDesktopColumns + content.substring(tbDetailsEndIndex);

// ==========================================
// 5. Detailed Statement mobile cards replacement
// ==========================================
const secondTBMapIndex = content.indexOf("trialBalanceRows.map(row => (", firstTBMapIndex + 1);
if (secondTBMapIndex === -1) {
  console.error("Error: Could not locate mobile trialBalanceRows map!");
  process.exit(1);
}

const mobileItemsMapIndex = content.indexOf("row.items.map(t => {", secondTBMapIndex);
if (mobileItemsMapIndex === -1) {
  console.error("Error: Could not locate mobile items map!");
  process.exit(1);
}

const tbMobileDetailsStartIndex = content.indexOf("{isIssue ? (", mobileItemsMapIndex);
const tbMobileSplatanoIndex = content.indexOf('text-green-600 font-bold', tbMobileDetailsStartIndex);
const tbMobileDiv1 = content.indexOf('</div>', tbMobileSplatanoIndex) + 6;
const tbMobileDiv2 = content.indexOf('</div>', tbMobileDiv1) + 6;
const tbMobileDiv3 = content.indexOf('</div>', tbMobileDiv2) + 6;

if (tbMobileDetailsStartIndex === -1 || tbMobileSplatanoIndex === -1 || tbMobileDiv3 === -1) {
  console.error("Error: Could not locate mobile detailed statement boundaries!", { tbMobileDetailsStartIndex, tbMobileSplatanoIndex, tbMobileDiv3 });
  process.exit(1);
}
console.log("Mobile Detailed Statement cards boundaries found successfully!");

const newTBMobileCards = `{isIssue ? (
                                                <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)]/50 p-2 rounded border border-[var(--border)]/40 space-y-1">
                                                  {t.items?.map((item, idx) => {
                                                    const priceTxt = item.price !== null && item.price !== undefined && item.price !== ''
                                                      ? \` × \${item.price} \${item.currency || t.currency}\`
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
                                                  {t.picked_up_by && (
                                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                                                      👤 Отримав: {t.picked_up_by}
                                                    </div>
                                                  )}
                                                  {t.comment && (
                                                    <div className="text-[10px] text-[var(--text-secondary)] italic border-t border-[var(--border)]/40 pt-1 mt-1">
                                                      Коментар: {(t.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/g, '')}
                                                    </div>
                                                  )}
                                                  {/* Вкладені лінковані платежі мобільна версія */}
                                                  {t.linkedPayments && t.linkedPayments.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-[var(--border)]/40 space-y-1">
                                                      {t.linkedPayments.map((lp, lIdx) => {
                                                        const displayComment = (lp.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/, '');
                                                        const lpAmt = parseFloat(lp.amount) || 0;
                                                        const formattedLpAmt = lp.currency === 'UAH' ? \`\${lpAmt.toLocaleString('uk-UA')} грн\` : \`$\${lpAmt.toLocaleString('uk-UA')}\`;
                                                        return (
                                                          <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5">
                                                            <span>💰 {displayComment} ({lp.date})</span>
                                                            <span className="font-semibold">{formattedLpAmt}</span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg)]/50 p-2 rounded border border-[var(--border)]/40 space-y-1">
                                                  <div className="leading-tight font-medium">{(t.comment || '—').replace(/\\s*\\[invoice_id:[\\w-]+\\]/g, '')}</div>
                                                  {t.converted_amount && (
                                                    <div className="text-green-600 font-semibold text-[10px]">
                                                      Зараховано: {t.converted_amount.toLocaleString('uk-UA')} {t.currency === 'UAH' ? 'USD' : 'UAH'} за курсом {t.conversion_rate}
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {/* Суми */}
                                              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] items-center">
                                                <div>
                                                  <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Нараховано</span>
                                                  <span className="text-red-500 font-bold">
                                                    {(isIssue || (isAdj && amt < 0)) && amt > 0
                                                      ? \`\${Math.abs(amt).toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                                      : '—'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Сплачено</span>
                                                  <span className="text-green-600 font-bold">
                                                    {(!isIssue && !(isAdj && amt < 0)) && amt > 0
                                                      ? \`\${amt.toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                                      : isIssue && t.paidAmount > 0 ? (
                                                        \`\${t.paidAmount.toLocaleString('uk-UA')} \${t.currency === 'UAH' ? 'грн' : '$'}\`
                                                      ) : '—'}
                                                  </span>
                                                </div>
                                                <div className="text-right">
                                                  <span className="text-[9px] text-[var(--text-secondary)] block uppercase font-semibold">Баланс</span>
                                                  <span className="font-bold text-[var(--text)]">
                                                    {\`\${formatMoney(Math.abs(t.uahRunning), 'грн')} / \${formatMoney(Math.abs(t.usdRunning))}\`}
                                                  </span>
                                                </div>
                                              </div>`;

content = content.substring(0, tbMobileDetailsStartIndex) + newTBMobileCards + content.substring(tbMobileDiv3);

fs.writeFileSync(filepath, content, 'utf8');
console.log("SUCCESS: BuyersReport.jsx successfully patched!");
