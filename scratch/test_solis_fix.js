async function testSolisFix() {
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

  function extractProductInfoForPrimary(name) {
    if (!name) return null;
    const s = name.trim();
    const low = s.toLowerCase();

    // Solis inverters
    if (low.includes('solis')) {
      if (low.includes('30k') || low.includes('30')) {
        return { type: 'inverter', key: 'solis_30k' };
      }
      return { type: 'inverter', key: 'solis_' + cleanStrForPrimary(s) };
    }

    return { type: 'other', key: cleanStrForPrimary(s) };
  }

  // Fetch PE catalog
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
      if (model && price) {
        const info = extractProductInfoForPrimary(model);
        if (info) peProducts.push({ model, price, info });
      }
    }
  }

  // Fetch Helius catalog
  const urlH = `https://docs.google.com/spreadsheets/d/${sidHelius}/gviz/tq?tqx=out:csv&sheet=_Прайс_Хеліус`;
  const resH = await fetch(urlH);
  const textH = await resH.text();
  const rowsH = parseCSVText(textH);
  const heliusProducts = [];
  for (let i = 0; i < rowsH.length; i++) {
    const row = rowsH[i];
    if (!row || row.length < 2) continue;
    const colA = String(row[0] || '').trim();
    const colB = String(row[1] || '').trim();
    const model = (colA + ' ' + colB).trim();
    let price = parsePriceValueForPrimary(row[5]) || parsePriceValueForPrimary(row[4]) || parsePriceValueForPrimary(row[6]);
    if (model && price) {
      const info = extractProductInfoForPrimary(model);
      if (info) heliusProducts.push({ model, price, info });
    }
  }

  function findBestMatchForPrimary(targetInfo, catalog) {
    if (!targetInfo) return null;
    return catalog.find(item => item.info.type === targetInfo.type && item.info.key === targetInfo.key) || null;
  }

  const targetName = "Solis S5-GC30K + Wi-Fi";
  const targetInfo = extractProductInfoForPrimary(targetName);
  const peMatch = findBestMatchForPrimary(targetInfo, peProducts);
  const hMatch = findBestMatchForPrimary(targetInfo, heliusProducts);

  console.log("Target:", targetName, targetInfo);
  console.log("PE Match:", peMatch ? `${peMatch.model} -> ${peMatch.price} $` : 'None');
  console.log("Helius Match:", hMatch ? `${hMatch.model} -> ${hMatch.price} $` : 'None');
}

testSolisFix().catch(console.error);
