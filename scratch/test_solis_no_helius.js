async function testSolisNoHelius() {
  const sidHelius = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
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

  function extractProductInfoForPrimary(name, isHelius = false) {
    if (!name) return null;
    const s = name.trim();
    const low = s.toLowerCase();

    // 1. Вилучити сонячні панелі
    if (low.includes('longi') || low.includes('ja solar') || low.includes('jasolar') || low.includes('панель') || low.includes('панелі')) {
      return null;
    }

    // 2. Вилучити 240kWh
    if (low.includes('240kwh') || low.includes('bos-b a3')) {
      return null;
    }

    // 3. Вилучити кабель
    if (low.includes('кабель')) {
      return null;
    }

    // Solis: do not match for Helius
    if (low.includes('solis')) {
      if (isHelius) return null; // Exclude Solis from Helius search
      return { type: 'inverter', key: 'solis_s5_gc30k' };
    }

    return { type: 'other', key: cleanStrForPrimary(s) };
  }

  // Fetch PE
  const peProducts = [];
  const targetSheets = ['Гібридні інвертори', 'Мережеві інвертори', 'АКБ'];
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
        priceRaw = String(row[1] || row[2] || row[3] || row[4] || '').trim();
      } else {
        model = String(row[1] || '').trim();
        priceRaw = String(row[3] || row[4] || row[5] || '').trim();
      }
      const price = parsePriceValueForPrimary(priceRaw);
      if (model) {
        const info = extractProductInfoForPrimary(model, false);
        if (info) peProducts.push({ model, price, info });
      }
    }
  }

  function findBestMatchForPrimary(targetInfo, catalog) {
    if (!targetInfo) return null;
    return catalog.find(item => item.info.type === targetInfo.type && item.info.key === targetInfo.key) || null;
  }

  const targetName = "Solis S5-GC30K + Wi-Fi";
  const hInfo = extractProductInfoForPrimary(targetName, true); // for Helius
  const peInfo = extractProductInfoForPrimary(targetName, false); // for PE

  console.log("Solis Helius Search Info:", hInfo); // null
  console.log("Solis PE Search Info:", peInfo);
  const peMatch = findBestMatchForPrimary(peInfo, peProducts);
  console.log("Solis PE Match:", peMatch ? `${peMatch.model} -> ${peMatch.price} $` : 'None');
}

testSolisNoHelius().catch(console.error);
