const fs = require('fs');

const filepath = 'warehouse/src/pages/BuyerIssueForm.jsx';
let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');

const targets = [
  {
    search: `  const [saving, setSaving] = useState(false);
  const [isArchived, setIsArchived] = useState(false);`,
    replace: `  const [saving, setSaving] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [originalItemsMap, setOriginalItemsMap] = useState({});`
  },
  {
    search: `            // Додаємо неактивного покупця в опції вибору, якщо він вибраний у цій накладній
            const currentBuyer = loadedBuyerList.find(b => b.id === tx.buyerId);
            if (currentBuyer) {
              setBuyers(prev => {
                if (prev.some(b => b.id === tx.buyerId)) return prev;
                return [...prev, currentBuyer];
              });
            }

            setFormData({`,
    replace: `            // Додаємо неактивного покупця в опції вибору, якщо він вибраний у цій накладній
            const currentBuyer = loadedBuyerList.find(b => b.id === tx.buyerId);
            if (currentBuyer) {
              setBuyers(prev => {
                if (prev.some(b => b.id === tx.buyerId)) return prev;
                return [...prev, currentBuyer];
              });
            }

            const origMap = {};
            tx.items.forEach(item => {
              origMap[item.productId] = (origMap[item.productId] || 0) + (parseFloat(item.quantity) || 0);
            });
            setOriginalItemsMap(origMap);

            setFormData({`
  },
  {
    search: `                {formData.items.map((item, index) => {
                  const stock = balances[item.productId] || 0;
                  const isOver = item.productId && parseFloat(item.quantity) > stock;`,
    replace: `                {formData.items.map((item, index) => {
                  const origQty = originalItemsMap[item.productId] || 0;
                  const stock = (balances[item.productId] || 0) + origQty;
                  const isOver = item.productId && parseFloat(item.quantity) > stock;`
  },
  {
    search: `                                    filteredProducts.map(p => {
                                      const pStock = balances[p.id] || 0;`,
    replace: `                                    filteredProducts.map(p => {
                                      const origQty = originalItemsMap[p.id] || 0;
                                      const pStock = (balances[p.id] || 0) + origQty;`
  }
];

targets.forEach((t, i) => {
  if (content.indexOf(t.search) === -1) {
    console.error(`Error: Could not find target ${i} in ${filepath}`);
    process.exit(1);
  }
  content = content.replace(t.search, t.replace);
});

fs.writeFileSync(filepath, content, 'utf8');
console.log(`SUCCESS: ${filepath} successfully patched for edit-mode balances!`);
