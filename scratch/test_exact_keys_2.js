async function testExactKeys2() {
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

    // 1. Вилучити сонячні панелі
    if (low.includes('longi') || low.includes('ja solar') || low.includes('jasolar') || low.includes('панель') || low.includes('панелі')) {
      return null;
    }

    // 2. Вилучити велику систему 240kWh
    if (low.includes('240kwh') || low.includes('bos-b a3')) {
      return null;
    }

    // 3. Вилучити кабель
    if (low.includes('кабель')) {
      return null;
    }

    if (low.includes('стійка') || low.includes('rack')) {
      if (low.includes('8') || low.includes('lrack')) return { type: 'rack', key: 'rack8' };
      if (low.includes('13') || low.includes('hrack')) return { type: 'rack', key: 'rack13' };
      return { type: 'rack', key: cleanStrForPrimary(s) };
    }
    if (low.includes('pdu2') || low.includes('bms')) return { type: 'bms', key: 'bmspdu2' };

    // SE-F5-PRO-C <-> SE-F 5-PRO-C
    let m = low.match(/se[-_\s]*f[-_\s]*5[-_\s]*pro[-_\s]*c/i);
    if (m) return { type: 'battery', key: 'sef5proc' };

    // Deye SE5.1 PRO-B <-> SE-G5.1 ProВ
    m = low.match(/se[-_\s]*g?5\.?1[-_\s]*pro[-_\s]*[bв]/i);
    if (m) return { type: 'battery', key: 'seg51prob' };

    m = low.match(/se[-_\s]*f12/i);
    if (m) return { type: 'battery', key: 'sef12' };

    m = low.match(/se[-_\s]*f16/i);
    if (m) return { type: 'battery', key: 'sef16' };

    // Deye BOS-G 5.1 PRO <-> DEYE BOS-G PRO LiFePO4 HV / BOS-GPack5.1
    m = low.match(/bos[-_\s]*g(pack)?[-_\s]*5\.?1/i);
    if (m) return { type: 'battery', key: 'bosg51' };

    // Huawei inverters
    if (low.includes('huawei') || low.includes('sun2000') || low.includes('30ktl')) {
      return { type: 'inverter', key: 'huawei_sun2000_30ktl_m3' };
    }

    // Solis inverters
    if (low.includes('solis')) {
      return { type: 'inverter', key: 'solis_s5_gc30k' };
    }

    // Deye SUN inverters - preserve exact kw, sg, and phase/type
    m = low.match(/sun[-_\s]*0?(\d+k?)[-_\s]*(sg\d+)?[-_\s]*([lhb]p\d+)?/i);
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
      if (model) {
        const info = extractProductInfoForPrimary(model);
        if (info) peProducts.push({ model, price, info });
      }
    }
  }

  function findBestMatchForPrimary(targetInfo, catalog) {
    if (!targetInfo) return null;
    // 1. Exact key match
    let match = catalog.find(item => item.info.type === targetInfo.type && item.info.key === targetInfo.key);
    if (match) return match;

    // 2. Fallback match for inverters: same kw and same p (type/phase)
    if (targetInfo.type === 'inverter') {
      match = catalog.find(item => item.info.type === 'inverter' && item.info.key.startsWith('sun_' + targetInfo.kw + 'k') && item.info.p === targetInfo.p);
      if (match) return match;
    }

    return catalog.find(item => {
      if (item.info.type !== targetInfo.type) return false;
      if (targetInfo.key.length > 5 && (item.info.key.includes(targetInfo.key) || targetInfo.key.includes(item.info.key))) return true;
      return false;
    }) || null;
  }

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
    "Deye SUN-30k-SG02HP3-EU",
    "Deye SUN-50k-SG01HP3-EU",
    "Deye SUN-80k-SG02HP3-EU",
    "Deye SUN-100k-SG02HP3-EU",
    "Huawei SUN2000-30KTL-M3",
    "Кабель солярний 6мм",
    "LONGi Solar LR5-72HPH-555M",
    "JA Solar JAM72S30-550/MR"
  ];

  console.log("=== FINAL VERIFIED MATCHES 2 ===");
  primaryNames.forEach((name, idx) => {
    const info = extractProductInfoForPrimary(name);
    if (!info) {
      console.log(`[Row ${idx+2}] ${name} -> EXCLUDED (Manual / Skip)`);
    } else {
      const hMatch = findBestMatchForPrimary(info, heliusProducts);
      const peMatch = findBestMatchForPrimary(info, peProducts);
      const hPrice = hMatch ? `${hMatch.price} $` : '—';
      const pePrice = peMatch && peMatch.price ? `${peMatch.price} $` : '—';
      console.log(`[Row ${idx+2}] ${name} | HELIUS: ${hPrice} | PE: ${pePrice} | (Helius match: "${hMatch ? hMatch.model.substring(0, 35) : 'none'}")`);
    }
  });
}

testExactKeys2().catch(console.error);
