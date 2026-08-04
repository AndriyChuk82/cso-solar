const fs = require('fs');

const code = fs.readFileSync('proposals-v2/gas/Code.gs', 'utf8');

try {
  new Function(code);
  console.log("✅ Code.gs syntax is 100% valid!");
} catch (e) {
  console.error("❌ Code.gs syntax error:", e);
}
