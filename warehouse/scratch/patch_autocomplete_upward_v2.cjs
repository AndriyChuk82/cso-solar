const fs = require('fs');

const files = [
  'warehouse/src/pages/BuyerIssueForm.jsx',
  'warehouse/src/pages/OperationForm.jsx',
  'warehouse/src/pages/Transfer.jsx'
];

files.forEach(filepath => {
  if (!fs.existsSync(filepath)) {
    console.error(`File not found: ${filepath}`);
    return;
  }
  let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');

  // We want to declare isLastRows inside the items map loop
  // Let's locate "return (" inside the items map loop.
  // In BuyerIssueForm.jsx: "formData.items.map((item, index) => {"
  // In OperationForm.jsx: "formData.items.map((item, index) => {"
  // In Transfer.jsx: "formData.items.map((item, index) => {"
  
  const mapStr = 'formData.items.map((item, index) => {';
  const helperDeclare = '\n                  const isLastRows = index >= formData.items.length - 2 && formData.items.length >= 3;';
  
  if (content.indexOf(mapStr) === -1) {
    console.error(`Error: Could not find items map in ${filepath}`);
    return;
  }

  // Insert helper declare right after the mapping start
  content = content.replace(mapStr, mapStr + helperDeclare);

  // Now, find the dropdown div in the desktop table row td (ref with index)
  // Let's replace the entire className string
  
  const targetDropdown = 'className="absolute left-2 right-2 top-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl max-h-80 overflow-y-auto z-50 text-xs divide-y divide-[var(--border)]"';
  const replacementDropdown = 'className={`absolute left-2 right-2 ${isLastRows ? \'bottom-full mb-1\' : \'top-11\'} bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl max-h-80 overflow-y-auto z-50 text-xs divide-y divide-[var(--border)]`}';

  if (content.indexOf(targetDropdown) === -1) {
    console.error(`Error: Could not find targetDropdown in ${filepath}`);
    return;
  }

  content = content.replace(targetDropdown, replacementDropdown);

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`SUCCESS: ${filepath} successfully patched for upward autocomplete dropdown!`);
});
