const fs = require('fs');

const filepath = 'warehouse/src/pages/BuyersReport.jsx';
let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');

const searchStr = '                                      row.items.map(t => {';
const replaceStr = '                                      [...row.items].reverse().map(t => {';

// Check if there are exactly 2 occurrences
const count = content.split(searchStr).length - 1;
if (count !== 2) {
  console.error(`Error: Found ${count} occurrences of searchStr instead of 2`);
  process.exit(1);
}

// Replace both occurrences
content = content.replace(searchStr, replaceStr);
content = content.replace(searchStr, replaceStr);

fs.writeFileSync(filepath, content, 'utf8');
console.log(`SUCCESS: ${filepath} successfully patched to sort newest items first!`);
