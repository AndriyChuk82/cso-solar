async function testSg01G04Fix() {
  const sidPE = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';
  const sidHelius = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';

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

    // 1. Вилучити сонячні панелі
    if (low.includes('longi') || low.includes('ja solar') || low.includes('jasolar') || low.includes('панель') || low.includes('панелі')) return null;
    // 2. Вилучити 240kWh
    if (low.includes('240kwh') || low.includes('bos-b a3')) return null;
    // 3. Вилучити кабель
    if (low.includes('кабель')) return null;
    // 4. Вилучити комплекти
    if (low.includes('комплект')) return null;
    // 5. Вилучити мережеві інвертори G04 / G05 (без S)
    if (low.includes('g04') || low.match(/sun[-_\s]*\d+k?[-_\s]*g\d+/i)) return null;

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

  // Fetch PE catalog
  const peProducts = [];
  const targetSheets = ['Гібридні інвертори', 'АКБ'];
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
    // 1. Точний збіг ключа
    let match = catalog.find(item => item.info.type === targetInfo.type && item.info.key === targetInfo.key);
    if (match) return match;

    // 2. Резервний пошук для гібридних інверторів (дозволяє SG01, SG02, SG05 того самого кВт і тип/фаза p)
    if (targetInfo.type === 'inverter') {
      match = catalog.find(item => item.info.type === 'inverter' && item.info.kw === targetInfo.kw && item.info.p === targetInfo.p);
      if (match) return match;
    }

    return catalog.find(item => {
      if (item.info.type !== targetInfo.type) return false;
      if (targetInfo.key.length > 5 && (item.info.key.includes(targetInfo.key) || targetInfo.key.includes(item.info.key))) return true;
      return false;
    }) || null;
  }

  const testTargets = [
    "Deye SUN-10K-SG05LP3-EU",
    "Deye SUN-30k-SG01HP3-EU",
    "Deye SUN-30k-SG02HP3-EU"
  ];

  testTargets.forEach(name => {
    const info = extractProductInfoForPrimary(name);
    const match = findBestMatchForPrimary(info, peProducts);
    console.log(`[Target: ${name}] -> Match:`, match ? `${match.model} (${match.price} $)` : 'Not Found (Out of stock)');
  });
}

testSg01G04Fix().catch(console.error);
