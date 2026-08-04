async function testRackFix() {
  const sidPE = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';

  function parseCSVText(text) {
    const lines = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cell += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ',') {
          row.push(cell);
          cell = '';
        } else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') {
            i++;
          }
          row.push(cell);
          lines.push(row);
          row = [];
          cell = '';
        } else {
          cell += c;
        }
      }
    }
    if (row.length > 0 || cell) {
      row.push(cell);
      lines.push(row);
    }
    return lines;
  }

  function cleanStrForPrimary(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
  }

  function parsePriceValueForPrimary(str) {
    if (!str) return null;
    let s = String(str).trim();
    if (s.toLowerCase().includes('гот') || s.includes('/')) {
      const match = s.match(/[\d\s,.]+/);
      if (match) s = match[0];
    }
    s = s.replace(/[$€₴]|грн/gi, '').trim();
    s = s.replace(/\s/g, '').replace(',', '.');
    const val = parseFloat(s);
    return (isNaN(val) || val <= 0) ? null : val;
  }

  function extractProductInfoForPrimary(name) {
    if (!name) return null;
    const s = name.trim();
    const low = s.toLowerCase();

    // Skip комплекти (full system kits) from being recognized as simple racks
    if (low.includes('комплект')) return null;

    if (low.includes('стійка') || low.includes('rack')) {
      if (low.includes('8') || low.includes('lrack')) return { type: 'rack', key: 'rack8' };
      if (low.includes('12') || low.includes('13') || low.includes('hrack')) return { type: 'rack', key: 'rack13' };
      return { type: 'rack', key: cleanStrForPrimary(s) };
    }

    return { type: 'other', key: cleanStrForPrimary(s) };
  }

  const peProducts = [];
  const urlP = `https://docs.google.com/spreadsheets/d/${sidPE}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('АКБ')}`;
  const resP = await fetch(urlP);
  const textP = await resP.text();
  const rowsP = parseCSVText(textP);
  for (let i = 1; i < rowsP.length; i++) {
    const row = rowsP[i];
    if (!row || row.length < 2) continue;
    let model = String(row[0] || '').trim();
    let priceRaw = String(row[1] || row[2] || row[3] || row[4] || '').trim();
    const price = parsePriceValueForPrimary(priceRaw);
    if (model) {
      const info = extractProductInfoForPrimary(model);
      if (info) peProducts.push({ rowIdx: i+1, model, price, info });
    }
  }

  function findBestMatchForPrimary(targetInfo, catalog) {
    if (!targetInfo) return null;
    return catalog.find(item => item.info.type === targetInfo.type && item.info.key === targetInfo.key) || null;
  }

  const targetName = "Стійка для 8 батарей DEYE BOS-G (3U-LRACK)";
  const targetInfo = extractProductInfoForPrimary(targetName);
  const match = findBestMatchForPrimary(targetInfo, peProducts);

  console.log("Target:", targetName, targetInfo);
  console.log("PE Match:", match ? `Row ${match.rowIdx}: "${match.model}" -> ${match.price} $` : 'None');
}

testRackFix().catch(console.error);
