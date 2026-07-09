const fs = require('fs');

const filepath = 'warehouse/src/pages/Reports.jsx';
let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');

const searchStr = '          <div className="data-table-wrap">';
const replaceStr = '          <div className="data-table-wrap" style={{ maxHeight: \'calc(100vh - 320px)\', overflowY: \'auto\' }}>';

if (content.indexOf(searchStr) === -1) {
  console.error(`Error: Could not find searchStr in ${filepath}`);
  process.exit(1);
}

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(filepath, content, 'utf8');
console.log(`SUCCESS: ${filepath} successfully patched for sticky report header!`);
