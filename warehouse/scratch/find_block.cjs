const fs = require('fs');
const filepath = 'warehouse/src/pages/BuyersReport.jsx';
let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');

const regex = /\/\/\s*Розрахунок оборотної відомості \(Trial Balance\) по кожному покупцю[\s\S]+?\/\/ Новіші спочатку/;
const match = content.match(regex);
if (match) {
  console.log("MATCH FOUND:");
  console.log("================================");
  console.log(match[0]);
  console.log("================================");
  // Write to temp file to inspect
  fs.writeFileSync('warehouse/scratch/matched_calc.txt', match[0], 'utf8');
} else {
  console.log("NO MATCH FOUND FOR REGEX!");
  // Print lines 98 to 205
  const lines = content.split('\n');
  for (let i = 98; i < 205; i++) {
    console.log((i+1) + ': ' + lines[i]);
  }
}
