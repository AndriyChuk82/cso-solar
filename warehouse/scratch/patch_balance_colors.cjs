const fs = require('fs');

const filepath = 'warehouse/src/pages/BuyersReport.jsx';
let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');

const targets = [
  {
    name: "Target 1 (Desktop Detailed Header Opening Balance)",
    regex: /<td className="p-2 text-right whitespace-nowrap font-bold text-\[var\(--text\)\]">\s*\{\s*`\s*\$\{\s*formatMoney\(\s*row\.uahOpening\s*,\s*'грн'\s*\)\s*\}\s*\/ \s*\$\{\s*formatMoney\(\s*row\.usdOpening\s*\)\s*\}\s*`\s*\}\s*<\/td>/,
    replace: `<td className="p-2 text-right whitespace-nowrap font-bold text-xs">
                                    <span className={getBalanceClass(row.uahOpening)}>{formatMoney(row.uahOpening, 'грн')}</span>
                                    <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                    <span className={getBalanceClass(row.usdOpening)}>{formatMoney(row.usdOpening)}</span>
                                  </td>`
  },
  {
    name: "Target 2 (Desktop Detailed Running Balance Table Row)",
    regex: /<td className="p-2 text-right align-top text-\[var\(--text\)\] font-semibold whitespace-nowrap">\s*\{\s*`\s*\$\{\s*formatMoney\(\s*Math\.abs\(\s*t\.uahRunning\s*\)\s*,\s*'грн'\s*\)\s*\}\s*\/ \s*\$\{\s*formatMoney\(\s*Math\.abs\(\s*t\.usdRunning\s*\)\s*\)\s*\}\s*`\s*\}\s*<\/td>/,
    replace: `<td className="p-2 text-right align-top font-semibold whitespace-nowrap text-xs">
                                              <span className={getBalanceClass(t.uahRunning)}>{formatMoney(t.uahRunning, 'грн')}</span>
                                              <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                              <span className={getBalanceClass(t.usdRunning)}>{formatMoney(t.usdRunning)}</span>
                                            </td>`
  },
  {
    name: "Target 3 (Desktop Detailed Closing Balance Group Footer)",
    regex: /<td className=\{\`p-2 text-right \${getBalanceClass\(row\.uahClosing\)\}\`\}>\s*\{\s*`\s*\$\{\s*formatMoney\(\s*row\.uahClosing\s*,\s*'грн'\s*\)\s*\}\s*\/ \s*\$\{\s*formatMoney\(\s*row\.usdClosing\s*\)\s*\}\s*`\s*\}\s*<\/td>/,
    replace: `<td className="p-2 text-right font-bold whitespace-nowrap text-xs">
                                         <span className={getBalanceClass(row.uahClosing)}>{formatMoney(row.uahClosing, 'грн')}</span>
                                         <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                         <span className={getBalanceClass(row.usdClosing)}>{formatMoney(row.usdClosing)}</span>
                                       </td>`
  },
  {
    name: "Target 4 (Mobile Detailed Header Opening Balance)",
    regex: /<span className="font-semibold text-\[var\(--text\)\]">\s*\{\s*`\s*\$\{\s*formatMoney\(\s*row\.uahOpening\s*,\s*'грн'\s*\)\s*\}\s*\/ \s*\$\{\s*formatMoney\(\s*row\.usdOpening\s*\)\s*\}\s*`\s*\}\s*<\/span>/,
    replace: `<span className="font-semibold">
                                    <span className={getBalanceClass(row.uahOpening)}>{formatMoney(row.uahOpening, 'грн')}</span>
                                    <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                    <span className={getBalanceClass(row.usdOpening)}>{formatMoney(row.usdOpening)}</span>
                                  </span>`
  },
  {
    name: "Target 5 (Mobile Detailed Running Balance Table Row)",
    regex: /<span className="font-bold text-\[var\(--text\)\]">\s*\{\s*`\s*\$\{\s*formatMoney\(\s*Math\.abs\(\s*t\.uahRunning\s*\)\s*,\s*'грн'\s*\)\s*\}\s*\/ \s*\$\{\s*formatMoney\(\s*Math\.abs\(\s*t\.usdRunning\s*\)\s*\)\s*\}\s*`\s*\}\s*<\/span>/,
    replace: `<span className="font-bold">
                                                    <span className={getBalanceClass(t.uahRunning)}>{formatMoney(t.uahRunning, 'грн')}</span>
                                                    <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                                    <span className={getBalanceClass(t.usdRunning)}>{formatMoney(t.usdRunning)}</span>
                                                  </span>`
  },
  {
    name: "Target 6 (Mobile Detailed Closing Balance Group Footer)",
    regex: /<div className="flex justify-between items-center">\s*<span>Вихідне сальдо:<\/span>\s*<span className=\{getBalanceClass\(row\.uahClosing\)\}>\s*\{\s*`\s*\$\{\s*formatMoney\(\s*row\.uahClosing\s*,\s*'грн'\s*\)\s*\}\s*\/ \s*\$\{\s*formatMoney\(\s*row\.usdClosing\s*\)\s*\}\s*`\s*\}\s*<\/span>\s*<\/div>/,
    replace: `<div className="flex justify-between items-center">
                                       <span>Вихідне сальдо:</span>
                                       <span className="font-semibold text-xs">
                                         <span className={getBalanceClass(row.uahClosing)}>{formatMoney(row.uahClosing, 'грн')}</span>
                                         <span className="text-[var(--text-secondary)] opacity-60"> / </span>
                                         <span className={getBalanceClass(row.usdClosing)}>{formatMoney(row.usdClosing)}</span>
                                       </span>
                                     </div>`
  }
];

let failed = false;
targets.forEach((t) => {
  if (!t.regex.test(content)) {
    console.error(`Error: Could not match ${t.name}`);
    failed = true;
  } else {
    content = content.replace(t.regex, t.replace);
    console.log(`Matched and replaced: ${t.name}`);
  }
});

if (failed) {
  process.exit(1);
}

fs.writeFileSync(filepath, content, 'utf8');
console.log(`SUCCESS: ${filepath} successfully patched for balance colors!`);
