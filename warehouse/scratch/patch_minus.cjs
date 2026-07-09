const fs = require('fs');

const files = [
  'warehouse/src/pages/BuyerIssueForm.jsx',
  'warehouse/src/pages/OperationForm.jsx',
  'warehouse/src/pages/Transfer.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const updated = content.replace(/⚠️ Мінус/g, '⚠️ Недостатньо');
    if (content !== updated) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log(`SUCCESS: ${file} successfully patched!`);
    } else {
      console.log(`INFO: No occurrences of "⚠️ Мінус" found in ${file}`);
    }
  } else {
    console.error(`ERROR: File ${file} does not exist!`);
  }
});
