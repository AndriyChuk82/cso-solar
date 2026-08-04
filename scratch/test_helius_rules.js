async function testHeliusRules() {
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

    // 5. Вилучити сонячні панелі
    if (low.includes('longi') || low.includes('ja solar') || low.includes('jasolar') || low.includes('панель') || low.includes('панелі')) {
      return null;
    }

    // 3. Вилучити АКБ Deye BOS-B A3 PRO, 240kWh
    if (low.includes('240kwh') || low.includes('bos-b a3')) {
      return null;
    }

    if (low.includes('кабель')) return { type: 'cable', key: 'кабель6мм' };
    if (low.includes('стійка') || low.includes('rack')) {
      if (low.includes('8') || low.includes('lrack')) return { type: 'rack', key: 'rack8' };
      if (low.includes('13') || low.includes('hrack')) return { type: 'rack', key: 'rack13' };
      return { type: 'rack', key: cleanStrForPrimary(s) };
    }
    if (low.includes('pdu2') || low.includes('bms')) return { type: 'bms', key: 'bmspdu2' };

    let m = low.match(/se[-_\s]*f5[-_\s]*pro[-_\s]*c/i);
    if (m) return { type: 'battery', key: 'sef5proc' };

    // 1. SE-G5.1 Pro-B / SE5.1 PRO-B
    m = low.match(/se[-_\s]*g?5\.?1[-_\s]*pro[-_\s]*b/i);
    if (m) return { type: 'battery', key: 'seg51prob' };

    m = low.match(/se[-_\s]*f12/i);
    if (m) return { type: 'battery', key: 'sef12' };

    m = low.match(/se[-_\s]*f16/i);
    if (m) return { type: 'battery', key: 'sef16' };

    // 2. BOS-G 5.1 PRO / BOS-GPack5.1 Deye
    m = low.match(/bos[-_\s]*g(pack)?[-_\s]*5\.?1/i);
    if (m) return { type: 'battery', key: 'bosg51' };

    // 4. SUN-06K / SUN-6K
    m = low.match(/sun[-_\s]*0?(\d+k?)[-_\s]*(sg\d+)[-_\s]*([lh]p\d+)?/i);
    if (m) {
      const kw = parseInt(m[1], 10);
      const sg = m[2];
      const p = m[3] || '';
      return { type: 'inverter', key: ('sun_' + kw + 'k_' + sg + '_' + p).replace(/_+$/, '') };
    }

    m = low.match(/solis[-_\s]*s5[-_\s]*gc30k/i);
    if (m) return { type: 'inverter', key: 'solis_s5_gc30k' };

    m = low.match(/sun\s*2000[-_\s]*30ktl[-_\s]*m3/i);
    if (m) return { type: 'inverter', key: 'huawei_sun2000_30ktl_m3' };

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
      if (info) products.push({ model, price, info });
    }
  }

  // Now test against our primary equipment names:
  const primaryNames = [
    "Deye SE-F5-PRO-C",
    "Deye SE5.1 PRO-B",
    "Deye SE-F12",
    "Deye SE-F16",
    "Deye BOS-G 5.1 PRO",
    "Deye BMS PDU2",
    "Стійка для 8 батарей DEYE BOS-G (3U-LRACK)",
    "Стійка для 13 батарей DEYE BOS-G(3U-HRACK/3U-HRack-2G)",
    "АКБ Deye BOS-B A3 PRO, 240kWh (стійка + Бмс + 15шт акб)",
    "Deye SUN-6k-SG05LP1-EU",
    "Deye SUN-8k-SG05LP1-EU",
    "Deye SUN-10k-SG02LP1-EU",
    "Deye SUN-12k-SG02LP1-EU",
    "Deye SUN-12k-SG05LP3-EU",
    "Deye SUN-15k-SG05LP3-EU",
    "Deye SUN-16k-SG01LP1-EU",
    "Deye SUN-16k-SG05LP3-EU",
    "Deye SUN-20k-SG05LP3-EU",
    "Deye SUN-30k-SG01HP3-EU",
    "Deye SUN-50k-SG01HP3-EU",
    "Deye SUN-100k-SG02HP3-EU",
    "Кабель солярний 6мм",
    "LONGi Solar LR5-72HPH-555M",
    "JA Solar JAM72S30-550/MR"
  ];

  function findBestMatchForPrimary(targetInfo, catalog) {
    if (!targetInfo) return null;
    return catalog.find(item => {
      if (item.info.type !== targetInfo.type) return false;
      if (item.info.key === targetInfo.key) return true;
      if (targetInfo.key.length > 5 && (item.info.key.includes(targetInfo.key) || targetInfo.key.includes(item.info.key))) return true;
      return false;
    }) || null;
  }

  console.log("=== HELIUS MATCHING RESULTS ===");
  primaryNames.forEach((name, idx) => {
    const info = extractProductInfoForPrimary(name);
    if (!info) {
      console.log(`[Row ${idx+2}] ${name} -> EXCLUDED (Manual / Skip)`);
    } else {
      const match = findBestMatchForPrimary(info, products);
      if (match) {
        console.log(`[Row ${idx+2}] ${name} -> MATCH: ${match.model.substring(0, 50)} | PRICE: ${match.price} $`);
      } else {
        console.log(`[Row ${idx+2}] ${name} -> NOT FOUND IN HELIUS (Key: ${info.key})`);
      }
    }
  });
}

testHeliusRules().catch(console.error);
