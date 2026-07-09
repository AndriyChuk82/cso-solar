const fs = require('fs');

// Helper function definition text to insert at top
const helperDef = `
function updateCommentAmount(comment, amount, currency) {
  if (!comment) return comment;
  const num = parseFloat(amount) || 0;
  const formattedAmount = num.toLocaleString('uk-UA');
  const currencyLabel = currency === 'UAH' ? 'UAH' : 'USD';
  
  const regex = /(на суму\\s+)[\\d\\s,.\\u00A0]+(\\s*(?:UAH|USD|грн|\\$))/i;
  if (regex.test(comment)) {
    return comment.replace(regex, \`$1\${formattedAmount} \${currencyLabel}\`);
  }
  return comment;
}
`;

// 1. Patch BuyerPaymentForm.jsx
const pfPath = 'warehouse/src/pages/BuyerPaymentForm.jsx';
if (fs.existsSync(pfPath)) {
  let content = fs.readFileSync(pfPath, 'utf8').replace(/\r\n/g, '\n');

  // Insert helper after imports
  const importEnd = content.indexOf("export default function BuyerPaymentForm()");
  if (importEnd === -1) {
    console.error("Error: Could not locate BuyerPaymentForm definition start");
    process.exit(1);
  }
  content = content.substring(0, importEnd) + helperDef + "\n" + content.substring(importEnd);

  // Add dirty state
  const stateSearch = `  const [buyers, setBuyers] = useState([]);
  const [saving, setSaving] = useState(false);`;
  const stateReplace = `  const [buyers, setBuyers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [isCommentDirty, setIsCommentDirty] = useState(false);`;

  // Update amount input onChange
  const amountSearch = `                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}`;
  const amountReplace = `                value={formData.amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    amount: val,
                    comment: isCommentDirty ? prev.comment : updateCommentAmount(prev.comment, val, prev.currency)
                  }));
                }}`;

  // Update currency select onChange
  const currencySearch = `                value={formData.currency}
                onChange={(e) => {
                  setFormData({ ...formData, currency: e.target.value });
                }}`;
  const currencyReplace = `                value={formData.currency}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    currency: val,
                    comment: isCommentDirty ? prev.comment : updateCommentAmount(prev.comment, prev.amount, val)
                  }));
                }}`;

  // Update comment input onChange
  const commentSearch = `            <input
              type="text"
              className="form-input w-full p-2.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
              placeholder="Наприклад: Готівка на складі, безготівковий переказ..."
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            />`;
  const commentReplace = `            <input
              type="text"
              className="form-input w-full p-2.5 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:border-blue-500"
              placeholder="Наприклад: Готівка на складі, безготівковий переказ..."
              value={formData.comment}
              onChange={(e) => {
                setIsCommentDirty(true);
                setFormData({ ...formData, comment: e.target.value });
              }}
            />`;

  if (content.indexOf(stateSearch) === -1) {
    console.error("Error: Could not find state block in BuyerPaymentForm.jsx");
    process.exit(1);
  }
  if (content.indexOf(amountSearch) === -1) {
    console.error("Error: Could not find amount block in BuyerPaymentForm.jsx");
    process.exit(1);
  }
  if (content.indexOf(currencySearch) === -1) {
    console.error("Error: Could not find currency block in BuyerPaymentForm.jsx");
    process.exit(1);
  }
  if (content.indexOf(commentSearch) === -1) {
    console.error("Error: Could not find comment block in BuyerPaymentForm.jsx");
    process.exit(1);
  }

  content = content
    .replace(stateSearch, stateReplace)
    .replace(amountSearch, amountReplace)
    .replace(currencySearch, currencyReplace)
    .replace(commentSearch, commentReplace);

  fs.writeFileSync(pfPath, content, 'utf8');
  console.log("SUCCESS: BuyerPaymentForm.jsx successfully patched!");
}

// 2. Patch BuyerDetails.jsx
const detPath = 'warehouse/src/pages/BuyerDetails.jsx';
if (fs.existsSync(detPath)) {
  let content = fs.readFileSync(detPath, 'utf8').replace(/\r\n/g, '\n');

  // Insert helper after imports
  const importEnd = content.indexOf("export default function BuyerDetails()");
  if (importEnd === -1) {
    console.error("Error: Could not locate BuyerDetails definition start");
    process.exit(1);
  }
  content = content.substring(0, importEnd) + helperDef + "\n" + content.substring(importEnd);

  // Add dirty state
  const stateSearch = `  const [editTx, setEditTx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);`;
  const stateReplace = `  const [editTx, setEditTx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [isEditCommentDirty, setIsEditCommentDirty] = useState(false);`;

  // Reset dirty state on startEdit
  const startEditSearch = `    setEditTx(tx);
    if (tx.type === 'payment') {
      setEditForm({`;
  const startEditReplace = `    setEditTx(tx);
    if (tx.type === 'payment') {
      setIsEditCommentDirty(false);
      setEditForm({`;

  // Update amount input onChange
  const amountSearch = `                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          required
                        />`;
  const amountReplace = `                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                          value={editForm.amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm(prev => ({
                              ...prev,
                              amount: val,
                              comment: isEditCommentDirty ? prev.comment : updateCommentAmount(prev.comment, val, prev.currency)
                            }));
                          }}
                          required
                        />`;

  // Update currency select onChange
  const currencySearch = `                        <select
                          className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                          value={editForm.currency}
                          onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                        >`;
  const currencyReplace = `                        <select
                          className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                          value={editForm.currency}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm(prev => ({
                              ...prev,
                              currency: val,
                              comment: isEditCommentDirty ? prev.comment : updateCommentAmount(prev.comment, prev.amount, val)
                            }));
                          }}
                        >`;

  // Update comment input onChange
  const commentSearch = `                  <input
                    type="text"
                    className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                    value={editForm.comment}
                    onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  />`;
  const commentReplace = `                  <input
                    type="text"
                    className="p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none"
                    value={editForm.comment}
                    onChange={(e) => {
                      setIsEditCommentDirty(true);
                      setEditForm({ ...editForm, comment: e.target.value });
                    }}
                  />`;

  if (content.indexOf(stateSearch) === -1) {
    console.error("Error: Could not find state block in BuyerDetails.jsx");
    process.exit(1);
  }
  if (content.indexOf(startEditSearch) === -1) {
    console.error("Error: Could not find startEdit block in BuyerDetails.jsx");
    process.exit(1);
  }
  if (content.indexOf(amountSearch) === -1) {
    console.error("Error: Could not find amount block in BuyerDetails.jsx");
    process.exit(1);
  }
  if (content.indexOf(currencySearch) === -1) {
    console.error("Error: Could not find currency block in BuyerDetails.jsx");
    process.exit(1);
  }
  if (content.indexOf(commentSearch) === -1) {
    console.error("Error: Could not find comment block in BuyerDetails.jsx");
    process.exit(1);
  }

  content = content
    .replace(stateSearch, stateReplace)
    .replace(startEditSearch, startEditReplace)
    .replace(amountSearch, amountReplace)
    .replace(currencySearch, currencyReplace)
    .replace(commentSearch, commentReplace);

  fs.writeFileSync(detPath, content, 'utf8');
  console.log("SUCCESS: BuyerDetails.jsx successfully patched!");
}
