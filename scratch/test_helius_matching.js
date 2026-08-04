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

function findBestMatchForPrimary(targetInfo, catalog) {
  if (!targetInfo) return null;
  return catalog.find(item => {
    if (item.info.type !== targetInfo.type) return false;
    if (item.info.key === targetInfo.key) return true;
    if (targetInfo.key.length > 5 && (item.info.key.includes(targetInfo.key) || targetInfo.key.includes(item.info.key))) return true;
    return false;
  }) || null;
}

async function testHeliusMatching() {
  const url = `https://docs.google.com/spreadsheets/d/${HELIUS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=314286327`;
  const res = await fetch(url);
  const text = await res.text();
  const rows = parseCSVText(text);

  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    const model = String(row[0] || '').trim();
    const priceRaw = String(row[5] || row[4] || row[9] || '').trim();
    const price = parsePriceValueForPrimary(priceRaw);
    if (model && price) {
      const info = extractProductInfoForPrimary(model);
      if (info) products.push({ model, price, info, rawPrice: priceRaw });
    }
  }

  console.log(`Parsed Helius products: ${products.length}`);
  
  const testItems = [
    "Deye SE-F5-PRO-C",
    "Deye SE5.1 PRO-B",
    "Deye SE-F12",
    "Deye SE-F16",
    "Deye BOS-G 5.1 PRO",
    "Deye BMS PDU2",
    "Стійка для 8 батарей DEYE BOS-G (3U-LRACK)",
    "Стійка для 13 батарей DEYE BOS-G(3U-HRACK/3U-HRack-2G)",
    "АКБ Deye BOS-B A3 PRO, 240kWh (стійка + Бмс + 15шт акб)",
    "Deye SUN-6k-SG05LP1-EU"
  ];

  let matched = 0;
  testItems.forEach((item, idx) => {
    const info = extractProductInfoForPrimary(item);
    const m = findBestMatchForPrimary(info, products);
    if (m) matched++;
    console.log(`[${idx+2}] "${item}" -> ${m ? `✅ ${m.price} $ ("${m.model}")` : '❌ Not found'}`);
  });

  console.log(`Matched Helius: ${matched}/${testItems.length}`);
}

testHeliusMatching().catch(console.error);
