async function debug1007Mismatch() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=_Прайс_Хеліус`;
  const res = await fetch(url);
  const text = await res.text();

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

    let m = low.match(/sun[-_\s]*0?(\d+k?)[-_\s]*(sg\d+)?[-_\s]*([lhb]p\d+)?/i);
    if (m) {
      const kw = parseInt(m[1], 10);
      const sg = m[2] || '';
      const p = m[3] || '';
      return { type: 'inverter', kw, sg: sg.toLowerCase(), p: p.toLowerCase(), key: ('sun_' + kw + 'k_' + sg + '_' + p).replace(/_+$/, '') };
    }

    return { type: 'other', key: cleanStrForPrimary(s) };
  }

  const rows = parseCSVText(text);
  const catalog = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    const colA = String(row[0] || '').trim();
    const colB = String(row[1] || '').trim();
    const model = (colA + ' ' + colB).trim();
    let price = parsePriceValueForPrimary(row[5]) || parsePriceValueForPrimary(row[4]) || parsePriceValueForPrimary(row[6]);
    if (model && price) {
      const info = extractProductInfoForPrimary(model);
      if (info) catalog.push({ index: i, model, price, info });
    }
  }

  console.log("=== CATALOG HELIUS INVERTERS ===");
  catalog.filter(c => c.info.type === 'inverter').forEach(c => {
    console.log(`[Idx ${c.index}] Price: ${c.price} $ | Key: ${c.info.key} | Model: ${c.model.substring(0, 60)}`);
  });

  const targetName = "Deye SUN-12k-SG05LP3-EU";
  const targetInfo = extractProductInfoForPrimary(targetName);
  console.log("\nTarget Info for Deye SUN-12k-SG05LP3-EU:", targetInfo);

  // Let's test findBestMatchForPrimary
  function findBestMatchForPrimary(targetInfo, catalog) {
    if (!targetInfo) return null;
    return catalog.find(item => {
      if (item.info.type !== targetInfo.type) return false;
      if (item.info.key === targetInfo.key) return true;
      if (targetInfo.key.length > 5 && (item.info.key.includes(targetInfo.key) || targetInfo.key.includes(item.info.key))) return true;
      return false;
    }) || null;
  }

  const match = findBestMatchForPrimary(targetInfo, catalog);
  console.log("\nMatch result:", match);
}

debug1007Mismatch().catch(console.error);
