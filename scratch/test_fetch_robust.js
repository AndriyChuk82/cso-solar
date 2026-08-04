function fetchHeliusCatalog() {
  const url = 'https://docs.google.com/spreadsheets/d/1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy/gviz/tq?tqx=out:csv&gid=314286327';
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const csvText = response.getContentText();
  const rows = parseCSVText(csvText);
  
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;
    const model = (row[0] || '').trim();
    const priceRaw = (row[5] || row[4] || row[9] || '').trim();
    const price = parsePriceValueForPrimary(priceRaw);
    if (model && price) {
      const info = extractProductInfoForPrimary(model);
      if (info) products.push({ model, price, info });
    }
  }
  return products;
}

function fetchPECatalog() {
  const gids = [
    { name: 'Гібридні інвертори', gid: '2087142679' },
    { name: 'Мережеві інвертори', gid: '1047165471' },
    { name: 'АКБ', gid: '1248903265' }
  ];
  
  const products = [];
  for (let g = 0; g < gids.length; g++) {
    const url = 'https://docs.google.com/spreadsheets/d/1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g/gviz/tq?tqx=out:csv&gid=' + gids[g].gid;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const csvText = response.getContentText();
    const rows = parseCSVText(csvText);
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue;
      let model = '', priceRaw = '';
      if (gids[g].name === 'АКБ') {
        model = (row[0] || '').trim();
        priceRaw = (row[1] || '').trim();
      } else {
        model = (row[1] || '').trim();
        priceRaw = (row[3] || row[4] || '').trim();
      }
      const price = parsePriceValueForPrimary(priceRaw);
      if (model && price) {
        const info = extractProductInfoForPrimary(model);
        if (info) products.push({ model, price, info });
      }
    }
  }
  return products;
}
