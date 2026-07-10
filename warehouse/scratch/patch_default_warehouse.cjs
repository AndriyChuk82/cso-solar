const fs = require('fs');

// 1. Patch OperationForm.jsx
const pathOp = 'warehouse/src/pages/OperationForm.jsx';
if (fs.existsSync(pathOp)) {
  let content = fs.readFileSync(pathOp, 'utf8').replace(/\r\n/g, '\n');
  
  // Update select onChange
  const searchSelect = 'onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}';
  const replaceSelect = `onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, warehouseId: val });
                  localStorage.setItem('cso_last_warehouse', val);
                }}`;
  if (content.indexOf(searchSelect) !== -1) {
    content = content.replace(searchSelect, replaceSelect);
  }

  // Update check in loadData
  const searchCheck = "const defaultWh = user?.isStorekeeper ? user.warehouseId : (saved || '');";
  const replaceCheck = "const defaultWh = user?.isStorekeeper ? user.warehouseId : (loadedWhList.some(w => w.id === saved) ? saved : '');";
  if (content.indexOf(searchCheck) !== -1) {
    content = content.replace(searchCheck, replaceCheck);
  }

  fs.writeFileSync(pathOp, content, 'utf8');
  console.log(`SUCCESS: ${pathOp} successfully patched!`);
}

// 2. Patch BuyerIssueForm.jsx
const pathBuyer = 'warehouse/src/pages/BuyerIssueForm.jsx';
if (fs.existsSync(pathBuyer)) {
  let content = fs.readFileSync(pathBuyer, 'utf8').replace(/\r\n/g, '\n');

  // Update loadData fallback logic
  const searchFallback = `          // Для нової накладної склад за замовчуванням
          const ternopil = loadedWhList.find(w => w.name.toLowerCase().includes('тернопіль'));
          if (ternopil) {
            setFormData(prev => ({ ...prev, warehouseId: ternopil.id }));
          } else if (loadedWhList.length > 0) {
            setFormData(prev => ({ ...prev, warehouseId: loadedWhList[0].id }));
          }`;
  const replaceFallback = `          // Для нової накладної склад за замовчуванням
          const saved = localStorage.getItem('cso_last_warehouse');
          if (saved && loadedWhList.some(w => w.id === saved)) {
            setFormData(prev => ({ ...prev, warehouseId: saved }));
          } else {
            const ternopil = loadedWhList.find(w => w.name.toLowerCase().includes('тернопіль'));
            if (ternopil) {
              setFormData(prev => ({ ...prev, warehouseId: ternopil.id }));
            } else if (loadedWhList.length > 0) {
              setFormData(prev => ({ ...prev, warehouseId: loadedWhList[0].id }));
            }
          }`;
  
  if (content.indexOf(searchFallback) !== -1) {
    content = content.replace(searchFallback, replaceFallback);
  }

  // Update select onChange
  const searchSelect = 'onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}';
  const replaceSelect = `onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, warehouseId: val });
                  localStorage.setItem('cso_last_warehouse', val);
                }}`;
  if (content.indexOf(searchSelect) !== -1) {
    content = content.replace(searchSelect, replaceSelect);
  }

  // Add save to handleSubmit
  const searchSubmit = "showToast('Накладну успішно збережено', 'success');";
  const replaceSubmit = `localStorage.setItem('cso_last_warehouse', formData.warehouseId);\n        showToast('Накладну успішно збережено', 'success');`;
  if (content.indexOf(searchSubmit) !== -1) {
    content = content.replace(searchSubmit, replaceSubmit);
  }

  fs.writeFileSync(pathBuyer, content, 'utf8');
  console.log(`SUCCESS: ${pathBuyer} successfully patched!`);
}

// 3. Patch Transfer.jsx
const pathTransfer = 'warehouse/src/pages/Transfer.jsx';
if (fs.existsSync(pathTransfer)) {
  let content = fs.readFileSync(pathTransfer, 'utf8').replace(/\r\n/g, '\n');

  // Update loadData
  const searchLoad = `        if (whResult?.success) setWarehouses(whResult.warehouses || []);
        if (catResult?.success) setProducts(catResult.products || []);`;
  const replaceLoad = `        let loadedWhList = [];
        if (whResult?.success) {
          loadedWhList = whResult.warehouses || [];
          setWarehouses(loadedWhList);
        }
        if (catResult?.success) setProducts(catResult.products || []);

        const saved = localStorage.getItem('cso_last_warehouse');
        if (saved && loadedWhList.some(w => w.id === saved)) {
          setFormData(prev => ({ ...prev, warehouseFrom: saved }));
        } else if (loadedWhList.length > 0) {
          setFormData(prev => ({ ...prev, warehouseFrom: loadedWhList[0].id }));
        }`;
  
  if (content.indexOf(searchLoad) !== -1) {
    content = content.replace(searchLoad, replaceLoad);
  }

  // Update select onChange
  const searchSelect = 'onChange={(e) => setFormData({ ...formData, warehouseFrom: e.target.value })}';
  const replaceSelect = `onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, warehouseFrom: val });
                  localStorage.setItem('cso_last_warehouse', val);
                }}`;
  if (content.indexOf(searchSelect) !== -1) {
    content = content.replace(searchSelect, replaceSelect);
  }

  // Add save to handleSubmit
  const searchSubmit = "showToast('Переміщення успішно збережено', 'success');";
  const replaceSubmit = `localStorage.setItem('cso_last_warehouse', formData.warehouseFrom);\n        showToast('Переміщення успішно збережено', 'success');`;
  if (content.indexOf(searchSubmit) !== -1) {
    content = content.replace(searchSubmit, replaceSubmit);
  }

  fs.writeFileSync(pathTransfer, content, 'utf8');
  console.log(`SUCCESS: ${pathTransfer} successfully patched!`);
}
