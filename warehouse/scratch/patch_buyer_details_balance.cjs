const fs = require('fs');

const filepath = 'warehouse/src/pages/BuyerDetails.jsx';
if (!fs.existsSync(filepath)) {
  console.error(`File not found: ${filepath}`);
  process.exit(1);
}

let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');

// 1. Rename column headers and summary titles
const searchHeaders = `                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">Початковий борг (UAH / USD):</span>
                  <span className="font-semibold block mt-0.5">
                    {formatMoney(Math.abs(uahOpening), 'грн')} / \${formatMoney(Math.abs(usdOpening))}
                  </span>
                </div>`;
const replaceHeaders = `                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">Початковий баланс (UAH / USD):</span>
                  <span className="font-semibold block mt-0.5">
                    <span className={getBalanceClass(uahOpening)}>{formatMoney(uahOpening, 'грн')}</span> / <span className={getBalanceClass(usdOpening)}>\${formatMoney(usdOpening)}</span>
                  </span>
                </div>`;

if (content.indexOf(searchHeaders) === -1) {
  console.error("Error: Could not find searchHeaders");
} else {
  content = content.replace(searchHeaders, replaceHeaders);
}

const searchHeadersClosing = `                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">Кінцевий борг (UAH / USD):</span>
                  <span className="font-semibold block mt-0.5">
                    {formatMoney(Math.abs(uahClosing), 'грн')} / \${formatMoney(Math.abs(usdClosing))}
                  </span>
                </div>`;
const replaceHeadersClosing = `                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">Кінцевий баланс (UAH / USD):</span>
                  <span className="font-semibold block mt-0.5">
                    <span className={getBalanceClass(uahClosing)}>{formatMoney(uahClosing, 'грн')}</span> / <span className={getBalanceClass(usdClosing)}>\${formatMoney(usdClosing)}</span>
                  </span>
                </div>`;

if (content.indexOf(searchHeadersClosing) === -1) {
  console.error("Error: Could not find searchHeadersClosing");
} else {
  content = content.replace(searchHeadersClosing, replaceHeadersClosing);
}

// 2. Table header column rename
const searchTableCol = '<th className="p-2 text-right w-36">Поточний борг</th>';
const replaceTableCol = '<th className="p-2 text-right w-36">Поточний баланс</th>';

if (content.indexOf(searchTableCol) === -1) {
  console.error("Error: Could not find searchTableCol");
} else {
  content = content.replace(searchTableCol, replaceTableCol);
}

// 3. Opening balance row update
const searchOpeningRow = `                      <td className="p-2 text-right">
                        {formatMoney(Math.abs(uahOpening), 'грн')} / \${formatMoney(Math.abs(usdOpening))}
                      </td>`;
const replaceOpeningRow = `                      <td className="p-2 text-right">
                        <span className={getBalanceClass(uahOpening)}>{formatMoney(uahOpening, 'грн')}</span> / <span className={getBalanceClass(usdOpening)}>\${formatMoney(usdOpening)}</span>
                      </td>`;

if (content.indexOf(searchOpeningRow) === -1) {
  console.error("Error: Could not find searchOpeningRow");
} else {
  content = content.replace(searchOpeningRow, replaceOpeningRow);
}

// 4. Running balance columns update (Desktop)
const searchRunningCol = `                            <td className="p-2 text-right text-[var(--text)] font-semibold align-top whitespace-nowrap">
                              {formatMoney(Math.abs(t.uahRunning), 'грн')} / \${formatMoney(Math.abs(t.usdRunning))}
                            </td>`;
const replaceRunningCol = `                            <td className="p-2 text-right align-top whitespace-nowrap text-xs">
                              <span className={getBalanceClass(t.uahRunning)}>{formatMoney(t.uahRunning, 'грн')}</span>
                              <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                              <span className={getBalanceClass(t.usdRunning)}>\${formatMoney(t.usdRunning)}</span>
                            </td>`;

if (content.indexOf(searchRunningCol) === -1) {
  console.error("Error: Could not find searchRunningCol");
} else {
  content = content.replace(searchRunningCol, replaceRunningCol);
}

// 5. Mobile view card balance block update
const searchMobileCol = `                          <span className="font-semibold text-[var(--text)]">
                            Борг: {formatMoney(Math.abs(t.uahRunning), 'грн')} / \${formatMoney(Math.abs(t.usdRunning))}
                          </span>`;
const replaceMobileCol = `                          <span className="font-semibold text-[var(--text)]">
                            Баланс: <span className={getBalanceClass(t.uahRunning)}>{formatMoney(t.uahRunning, 'грн')}</span> / <span className={getBalanceClass(t.usdRunning)}>\${formatMoney(t.usdRunning)}</span>
                          </span>`;

if (content.indexOf(searchMobileCol) === -1) {
  console.error("Error: Could not find searchMobileCol");
} else {
  content = content.replace(searchMobileCol, replaceMobileCol);
}

fs.writeFileSync(filepath, content, 'utf8');
console.log(`SUCCESS: ${filepath} successfully patched for BuyerDetails balance styling!`);
