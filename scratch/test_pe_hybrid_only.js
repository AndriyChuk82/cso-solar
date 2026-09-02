async function testPEHybridOnly() {
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
    const low = s.toLowerCase();
    if (low.includes('рок') || low.includes('рік') || low.includes('гарант')) return null;
    if (low.includes('гот') || s.includes('/')) {
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

    let m = low.match(/sun[-_\s]*0?(\d+k?)[-_\s]*(sg\d+)?[-_\s]*([lhb]p\d+)?/i);
    if (m) {
      const kw = parseInt(m[1], 10);
      const sg = (m[2] || '').toLowerCase();
      const p = (m[3] || '').toLowerCase();
      let keyParts = ['sun', kw + 'k'];
      if (sg) keyParts.push(sg);
      if (p) keyParts.push(p);
      return { type: 'inverter', kw, sg, p, key: keyParts.join('_') };
    }
    return { type: 'other', key: cleanStrForPrimary(s) };
  }

  // Fetch PE catalog ONLY from 'Гібридні інвертори' and 'АКБ'
  const peProducts = [];
  const targetSheets = ['Гібридні інвертори', 'АКБ']; // Excluded 'Мережеві інвертори'
  for (let sheetName of targetSheets) {
    const urlP = `https://docs.google.com/spreadsheets/d/${sidPE}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const resP = await fetch(urlP);
    const textP = await resP.text();
    const rowsP = parseCSVText(textP);
    for (let i = 1; i < rowsP.length; i++) {
      const row = rowsP[i];
      if (!row || row.length < 2) continue;
      let model = '', priceRaw = '';
      if (sheetName === 'АКБ') {
        model = String(row[0] || '').trim();
        priceRaw = String(row[1] || '').trim();
      } else {
        model = String(row[1] || '').trim();
        priceRaw = String(row[3] || row[4] || '').trim();
      }
      const price = parsePriceValueForPrimary(priceRaw);
      if (model && price) {
        const info = extractProductInfoForPrimary(model);
        if (info) peProducts.push({ sheetName, rowIdx: i+1, model, price, info });
      }
    }
  }

  function findBestMatchForPrimary(targetInfo, catalog) {
    if (!targetInfo) return null;
    let match = catalog.find(item => item.info.type === targetInfo.type && item.info.key === targetInfo.key);
    if (match) return match;
    return null;
  }

  const targetName = "Deye SUN-10K-SG05LP3-EU";
  const targetInfo = extractProductInfoForPrimary(targetName);
  const peMatch = findBestMatchForPrimary(targetInfo, peProducts);

  console.log("Target:", targetName, targetInfo);
  console.log("PE Match (Hybrid only):", peMatch ? `Sheet "${peMatch.sheetName}" Model "${peMatch.model}" -> ${peMatch.price} $` : 'Not Found in PE (Out of stock)');
}

testPEHybridOnly().catch(console.error);
