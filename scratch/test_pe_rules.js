async function testPERules() {
  const sid = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';
  const targetSheets = ['Гібридні інвертори', 'Мережеві інвертори', 'АКБ'];
  
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

    // 1. Вилучити сонячні панелі (ручне проставляння)
    if (low.includes('longi') || low.includes('ja solar') || low.includes('jasolar') || low.includes('панель') || low.includes('панелі')) {
      return null;
    }

    // 2. Вилучити велику систему 240kWh (ручне проставляння)
    if (low.includes('240kwh') || low.includes('bos-b a3')) {
      return null;
    }

    // 5. Вилучити кабель (ручне проставляння)
    if (low.includes('кабель')) {
      return null;
    }

    if (low.includes('стійка') || low.includes('rack')) {
      if (low.includes('8') || low.includes('lrack')) return { type: 'rack', key: 'rack8' };
      if (low.includes('13') || low.includes('hrack')) return { type: 'rack', key: 'rack13' };
      return { type: 'rack', key: cleanStrForPrimary(s) };
    }
    if (low.includes('pdu2') || low.includes('bms')) return { type: 'bms', key: 'bmspdu2' };

    // 1. SE-F5-PRO-C <-> SE-F 5-PRO-C
    let m = low.match(/se[-_\s]*f[-_\s]*5[-_\s]*pro[-_\s]*c/i);
    if (m) return { type: 'battery', key: 'sef5proc' };

    // 2. Deye SE5.1 PRO-B <-> SE-G5.1 ProВ (кирилична В чи латинська B)
    m = low.match(/se[-_\s]*g?5\.?1[-_\s]*pro[-_\s]*[bв]/i);
    if (m) return { type: 'battery', key: 'seg51prob' };

    m = low.match(/se[-_\s]*f12/i);
    if (m) return { type: 'battery', key: 'sef12' };

    m = low.match(/se[-_\s]*f16/i);
    if (m) return { type: 'battery', key: 'sef16' };

    // 3. Deye BOS-G 5.1 PRO <-> BOS-G PRO LiFePO4 HV
    m = low.match(/bos[-_\s]*g(pack)?([-_\s]*5\.?1)?[-_\s]*pro/i);
    if (m) return { type: 'battery', key: 'bosg51' };

    // 4. Deye SUN-80k-SG02HP3 <-> SUN-80K-SG01HP3
    m = low.match(/sun[-_\s]*0?(\d+k?)[-_\s]*(sg\d+)?[-_\s]*([lhb]p\d+)?/i);
    if (m) {
      const kw = parseInt(m[1], 10);
      const p = m[3] || '';
      return { type: 'inverter', key: ('sun_' + kw + 'k_' + p).replace(/_+$/, '') };
    }

    m = low.match(/solis[-_\s]*s5[-_\s]*gc30k/i);
    if (m) return { type: 'inverter', key: 'solis_s5_gc30k' };

    m = low.match(/sun\s*2000[-_\s]*30ktl[-_\s]*m3/i);
    if (m) return { type: 'inverter', key: 'huawei_sun2000_30ktl_m3' };

    return { type: 'other', key: cleanStrForPrimary(s) };
  }

  // Fetch PE catalog sheets
  const peProducts = [];
  for (let sheetName of targetSheets) {
    const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split('\n');
    lines.forEach(l => {
      const parts = l.split(',');
      if (parts.length >= 2) {
        let model = '', priceRaw = '';
        if (sheetName === 'АКБ') {
          model = parts[0].replace(/"/g, '').trim();
          priceRaw = parts[1].replace(/"/g, '').trim();
        } else {
          model = parts[1].replace(/"/g, '').trim();
          priceRaw = (parts[3] || parts[4] || '').replace(/"/g, '').trim();
        }
        const price = parsePriceValueForPrimary(priceRaw);
        if (model && price) {
          const info = extractProductInfoForPrimary(model);
          if (info) peProducts.push({ model, price, info });
        }
      }
    });
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
    "Deye SUN-50k-SG01HP3-EU",
    "Deye SUN-80k-SG02HP3-EU",
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

  console.log("=== PE MATCHING RESULTS ===");
  primaryNames.forEach((name, idx) => {
    const info = extractProductInfoForPrimary(name);
    if (!info) {
      console.log(`[Row ${idx+2}] ${name} -> EXCLUDED (Manual / Skip)`);
    } else {
      const match = findBestMatchForPrimary(info, peProducts);
      if (match) {
        console.log(`[Row ${idx+2}] ${name} -> MATCH PE: ${match.model.substring(0, 55)} | PRICE: ${match.price} $`);
      } else {
        console.log(`[Row ${idx+2}] ${name} -> NOT FOUND IN PE (Key: ${info.key})`);
      }
    }
  });
}

testPERules().catch(console.error);
