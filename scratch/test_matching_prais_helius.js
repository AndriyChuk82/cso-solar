async function testMatchingFromPraisHelius() {
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

    if (low.includes('кабель')) return { type: 'cable', key: 'кабель6мм' };
    if (low.includes('стійка') || low.includes('rack')) {
      if (low.includes('8') || low.includes('lrack')) return { type: 'rack', key: 'rack8' };
      if (low.includes('13') || low.includes('hrack')) return { type: 'rack', key: 'rack13' };
      return { type: 'rack', key: cleanStrForPrimary(s) };
    }
    if (low.includes('pdu2') || low.includes('bms')) return { type: 'bms', key: 'bmspdu2' };

    let m = low.match(/se[-_\s]*f5[-_\s]*pro[-_\s]*c/);
    if (m) return { type: 'battery', key: 'sef5proc' };

    m = low.match(/se[-_\s]*5\.?1[-_\s]*pro[-_\s]*b/);
    if (m) return { type: 'battery', key: 'seg51prob' };

    m = low.match(/se[-_\s]*f12/);
    if (m) return { type: 'battery', key: 'sef12' };

    m = low.match(/se[-_\s]*f16/);
    if (m) return { type: 'battery', key: 'sef16' };

    m = low.match(/bos[-_\s]*g[-_\s]*5\.?1/);
    if (m) return { type: 'battery', key: 'bosg51' };

    m = low.match(/bos[-_\s]*b[-_\s]*a3/);
    if (m) return { type: 'battery', key: 'bosba3' };

    m = low.match(/sun[-_\s]*(\d+k?)[-_\s]*(sg\d+)[-_\s]*([lh]p\d+)?/);
    if (m) {
      const kw = m[1].replace('k', '');
      const sg = m[2];
      const p = m[3] || '';
      return { type: 'inverter', key: ('sun_' + kw + 'k_' + sg + '_' + p).replace(/_+$/, '') };
    }

    return { type: 'other', key: cleanStrForPrimary(s) };
  }

  const rows = parseCSVText(text);
  const products = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    const colA = String(row[0] || '').trim();
    const colB = String(row[1] || '').trim();
    const model = (colA + ' ' + colB).trim();
    let price = parsePriceValueForPrimary(row[5]) || parsePriceValueForPrimary(row[4]) || parsePriceValueForPrimary(row[6]);
    if (model && price) {
      const info = extractProductInfoForPrimary(model);
      if (info) products.push({ model, price, info, rawRow: row });
    }
  }

  console.log("Total Helius products extracted from _Прайс_Хеліус:", products.length);
  if (products.length > 0) {
    console.log("Sample 1:", products[0]);
    console.log("Sample SE-F5:", products.find(p => p.info.key === 'sef5proc'));
  }
}

testMatchingFromPraisHelius().catch(console.error);
