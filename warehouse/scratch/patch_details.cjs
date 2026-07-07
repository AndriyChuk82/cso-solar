const fs = require('fs');
const filepath = 'warehouse/src/pages/BuyerDetails.jsx';
let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');

// 1. Active transactions block replacement
const activeSearch = `                                  {t.linkedPayments.map((lp, lIdx) => {
                                    const displayComment = (lp.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/, '');
                                    const lpAmt = parseFloat(lp.amount) || 0;
                                    const formattedLpAmt = lp.currency === 'UAH' ? \`\${lpAmt.toLocaleString('uk-UA')} грн\` : \`$\${lpAmt.toLocaleString('uk-UA')}\`;
                                    return (
                                      <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                                        <span>💰 {displayComment} ({lp.date})</span>
                                        <div className="flex gap-1.5 items-center">
                                          <span className="font-semibold">{formattedLpAmt}</span>
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
                                  })}`;

const activeReplace = `                                  {t.linkedPayments.map((lp, lIdx) => {
                                    const displayComment = (lp.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/, '');
                                    const lpAmt = parseFloat(lp.amount) || 0;
                                    const formattedLpAmt = lp.currency === 'UAH' ? \`\${lpAmt.toLocaleString('uk-UA')} грн\` : \`$\${lpAmt.toLocaleString('uk-UA')}\`;
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
                                  })}`;

if (content.indexOf(activeSearch) === -1) {
  console.error("Error: Could not locate Active transactions block in BuyerDetails.jsx!");
  process.exit(1);
}
content = content.replace(activeSearch, activeReplace);
console.log("Active transactions block successfully replaced!");

// 2. Archived transactions block replacement
const archivedSearch = `                                  {t.linkedPayments.map((lp, lIdx) => {
                                    const displayComment = (lp.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/, '');
                                    const lpAmt = parseFloat(lp.amount) || 0;
                                    const formattedLpAmt = lp.currency === 'UAH' ? \`\${lpAmt.toLocaleString('uk-UA')} грн\` : \`$\${lpAmt.toLocaleString('uk-UA')}\`;
                                    return (
                                      <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5 opacity-75" onClick={(e) => e.stopPropagation()}>
                                        <span>💰 {displayComment} ({lp.date})</span>
                                        <span className="font-semibold">{formattedLpAmt}</span>
                                      </div>
                                    );
                                  })}`;

const archivedReplace = `                                  {t.linkedPayments.map((lp, lIdx) => {
                                    const displayComment = (lp.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/, '');
                                    const lpAmt = parseFloat(lp.amount) || 0;
                                    const formattedLpAmt = lp.currency === 'UAH' ? \`\${lpAmt.toLocaleString('uk-UA')} грн\` : \`$\${lpAmt.toLocaleString('uk-UA')}\`;
                                    const showAmt = t.linkedPayments.length > 1;
                                    return (
                                      <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5 opacity-75" onClick={(e) => e.stopPropagation()}>
                                        <span>💰 {displayComment} ({lp.date})</span>
                                        {showAmt && <span className="font-semibold">{formattedLpAmt}</span>}
                                      </div>
                                    );
                                  })}`;

if (content.indexOf(archivedSearch) === -1) {
  console.error("Error: Could not locate Archived transactions block in BuyerDetails.jsx!");
  process.exit(1);
}
content = content.replace(archivedSearch, archivedReplace);
console.log("Archived transactions block successfully replaced!");

// 3. Reconciliation Act block replacement
const reconciliationSearch = `                                      {t.linkedPayments.map((lp, lIdx) => {
                                        const displayComment = (lp.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/, '');
                                        const lpAmt = parseFloat(lp.amount) || 0;
                                        const formattedLpAmt = lp.currency === 'UAH' ? \`\${lpAmt.toLocaleString('uk-UA')} грн\` : \`$\${lpAmt.toLocaleString('uk-UA')}\`;
                                        return (
                                          <div key={lIdx} className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center justify-between gap-1.5 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                                            <span>💰 {displayComment} ({lp.date})</span>
                                            <div className="flex gap-1.5 items-center no-print">
                                              <span className="font-semibold">{formattedLpAmt}</span>
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
                                      })}`;

const reconciliationReplace = `                                      {t.linkedPayments.map((lp, lIdx) => {
                                        const displayComment = (lp.comment || '').replace(/\\s*\\[invoice_id:[\\w-]+\\]/, '');
                                        const lpAmt = parseFloat(lp.amount) || 0;
                                        const formattedLpAmt = lp.currency === 'UAH' ? \`\${lpAmt.toLocaleString('uk-UA')} грн\` : \`$\${lpAmt.toLocaleString('uk-UA')}\`;
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
                                      })}`;

if (content.indexOf(reconciliationSearch) === -1) {
  console.error("Error: Could not locate Reconciliation Act block in BuyerDetails.jsx!");
  process.exit(1);
}
content = content.replace(reconciliationSearch, reconciliationReplace);
console.log("Reconciliation Act block successfully replaced!");

fs.writeFileSync(filepath, content, 'utf8');
console.log("SUCCESS: BuyerDetails.jsx successfully patched!");
