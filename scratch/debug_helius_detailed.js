const HELIUS_SPREADSHEET_ID = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';

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

function cleanStrForPrimary(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
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

  m = low.match(/solis[-_\s]*s5[-_\s]*gc30k/);
  if (m) return { type: 'inverter', key: 'solis_s5_gc30k' };

  m = low.match(/sun\s*2000[-_\s]*30ktl[-_\s]*m3/);
  if (m) return { type: 'inverter', key: 'huawei_sun2000_30ktl_m3' };

  if (low.includes('longi') || low.includes('jasolar') || low.includes('solar')) {
    return { type: 'panel', key: cleanStrForPrimary(s) };
  }

  return { type: 'other', key: cleanStrForPrimary(s) };
}

async function debugHeliusMatchingDetailed() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const gid = '71726164';
  const primaryUrl = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const pRes = await fetch(primaryUrl);
  const pText = await pRes.text();
  const pRows = parseCSVText(pText);

  const heliusUrl = `https://docs.google.com/spreadsheets/d/${HELIUS_SPREADSHEET_ID}/export?format=csv`;
  const hRes = await fetch(heliusUrl);
  const hText = await hRes.text();
  const hRows = parseCSVText(hText);

  const heliusProducts = [];
  for (let i = 0; i < hRows.length; i++) {
    const row = hRows[i];
    if (!row || row.length < 2) continue;
    const colA = String(row[0] || '').trim();
    const colB = String(row[1] || '').trim();
    const model = colA || colB;

    let price = null;
    for (const colIdx of [5, 4, 9, 10, 6, 7]) {
      if (row[colIdx] !== undefined && row[colIdx] !== null && row[colIdx] !== '') {
        const parsed = parsePriceValueForPrimary(row[colIdx]);
        if (parsed && parsed > 0) {
          price = parsed;
          break;
        }
      }
    }
    if (model && price) {
      const info = extractProductInfoForPrimary(model);
      if (info) heliusProducts.push({ model, price, info });
    }
  }

  console.log(`Helius extracted total: ${heliusProducts.length}`);

  pRows.forEach((r, idx) => {
    if (idx === 0 || !r[0]) return;
    const name = r[0].trim();
    const pInfo = extractProductInfoForPrimary(name);
    const match = heliusProducts.find(item => {
      if (item.info.type !== pInfo.type) return false;
      if (item.info.key === pInfo.key) return true;
      if (pInfo.key.length > 5 && (item.info.key.includes(pInfo.key) || pInfo.key.includes(item.info.key))) return true;
      return false;
    });
    console.log(`Row ${idx+1} [${name}] (Type:${pInfo ? pInfo.type : 'none'}, Key:${pInfo ? pInfo.key : 'none'}) -> ${match ? `Matched ${match.price}$ (${match.model})` : 'NOT MATCHED'}`);
  });
}

debugHeliusMatchingDetailed().catch(console.error);
