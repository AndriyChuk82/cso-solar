const CONFIG = {
  PRIMARY_ID: '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII',
  PRIMARY_GID: '71726164',
  HELIUS_ID: '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy',
  HELIUS_GID: '314286327',
  PE_ID: '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g',
  PE_GIDS: [
    { name: 'Гібридні інвертори', gid: '2087142679' },
    { name: 'Мережеві інвертори', gid: '1047165471' },
    { name: 'АКБ', gid: '1248903265' }
  ]
};

function parseCSV(text) {
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

function parsePrice(str) {
  if (!str) return null;
  let s = str.trim();
  if (s.toLowerCase().includes('гот') || s.includes('/')) {
    const match = s.match(/[\d\s,.]+/);
    if (match) s = match[0];
  }
  s = s.replace(/[$€₴]|грн/gi, '').trim();
  s = s.replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(s);
  return (isNaN(val) || val <= 0) ? null : val;
}

function cleanStr(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
}

// Advanced model extractor & matcher
function extractProductInfo(name) {
  if (!name) return null;
  const s = name.trim();
  const low = s.toLowerCase();

  // Special cases / Cable / Accessories
  if (low.includes('кабель')) return { type: 'cable', key: 'кабель6мм' };
  if (low.includes('стійка') || low.includes('rack')) {
    if (low.includes('8') || low.includes('lrack')) return { type: 'rack', key: 'rack8' };
    if (low.includes('13') || low.includes('hrack')) return { type: 'rack', key: 'rack13' };
    return { type: 'rack', key: cleanStr(s) };
  }
  if (low.includes('pdu2') || low.includes('bms')) return { type: 'bms', key: 'bmspdu2' };

  // Deye batteries
  // SE-F5-PRO-C, SE-G5.1-PRO-B, SE-F12, SE-F16, BOS-G 5.1 PRO, BOS-B A3 PRO
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

  // Inverters
  // Deye SUN-6k-SG05LP1-EU, SUN-8k-SG05LP1-EU, SUN-10k-SG02LP1-EU, SUN-12k-SG02LP1-EU, SUN-12k-SG05LP3-EU, SUN-15k-SG05LP3-EU-sm2, SUN-20k-SG05LP3-EU-sm2, SUN-30k-SG02HP3-AM3, SUN-50k-SG01HP3, SUN-80k-SG02HP3, SUN-100k-SG02HP3-EU
  m = low.match(/sun[-_\s]*(\d+k?)[-_\s]*(sg\d+)[-_\s]*([lh]p\d+)?/);
  if (m) {
    const kw = m[1].replace('k', '');
    const sg = m[2];
    const p = m[3] || '';
    return { type: 'inverter', key: `sun_${kw}k_${sg}_${p}`.replace(/_+$/, '') };
  }

  // Solis
  m = low.match(/solis[-_\s]*s5[-_\s]*gc30k/);
  if (m) return { type: 'inverter', key: 'solis_s5_gc30k' };

  // Huawei
  m = low.match(/sun2000[-_\s]*30ktl[-_\s]*m3/);
  if (m) return { type: 'inverter', key: 'huawei_sun2000_30ktl_m3' };

  // Longi / JaSolar
  if (low.includes('longi') || low.includes('jasolar') || low.includes('solar')) {
    return { type: 'panel', key: cleanStr(s) };
  }

  return { type: 'other', key: cleanStr(s) };
}

async function runRefinedMerge() {
  // 1. Primary
  const primaryText = await (await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.PRIMARY_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.PRIMARY_GID}`)).text();
  const primaryRows = parseCSV(primaryText);

  // 2. Helius
  const heliusText = await (await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.HELIUS_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.HELIUS_GID}`)).text();
  const heliusRows = parseCSV(heliusText);
  const heliusProducts = [];
  for (let i = 1; i < heliusRows.length; i++) {
    const row = heliusRows[i];
    if (row.length < 5) continue;
    const model = (row[0] || '').trim();
    const priceRaw = (row[4] || row[9] || '').trim();
    const price = parsePrice(priceRaw);
    if (model && price) {
      const info = extractProductInfo(model);
      if (info) heliusProducts.push({ model, price, info, rawPrice: priceRaw });
    }
  }

  // 3. PE
  const peProducts = [];
  for (const sheet of CONFIG.PE_GIDS) {
    const peText = await (await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.PE_ID}/gviz/tq?tqx=out:csv&gid=${sheet.gid}`)).text();
    const rows = parseCSV(peText);
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      let model = '', priceRaw = '';
      if (sheet.name === 'АКБ') {
        model = (row[0] || '').trim();
        priceRaw = (row[1] || '').trim();
      } else {
        model = (row[1] || '').trim();
        priceRaw = (row[3] || row[4] || '').trim();
      }
      const price = parsePrice(priceRaw);
      if (model && price) {
        const info = extractProductInfo(model);
        if (info) peProducts.push({ model, price, info, rawPrice: priceRaw, sheet: sheet.name });
      }
    }
  }

  console.log(`Helius parsed items: ${heliusProducts.length}`);
  console.log(`PE parsed items: ${peProducts.length}`);
  console.log("\n=================== FINAL MATCHING EVALUATION ===================");

  let hFound = 0, peFound = 0;
  const total = primaryRows.length - 1;

  for (let i = 1; i < primaryRows.length; i++) {
    const row = primaryRows[i];
    const name = (row[0] || '').trim();
    if (!name) continue;

    const pInfo = extractProductInfo(name);

    // Match Helius
    const hMatch = heliusProducts.find(h => {
      if (h.info.type !== pInfo.type) return false;
      if (h.info.key === pInfo.key) return true;
      if (pInfo.key.length > 5 && (h.info.key.includes(pInfo.key) || pInfo.key.includes(h.info.key))) return true;
      return false;
    });

    // Match PE
    const peMatch = peProducts.find(p => {
      if (p.info.type !== pInfo.type) return false;
      if (p.info.key === pInfo.key) return true;
      if (pInfo.key.length > 5 && (p.info.key.includes(pInfo.key) || pInfo.key.includes(p.info.key))) return true;
      return false;
    });

    if (hMatch) hFound++;
    if (peMatch) peFound++;

    console.log(`\n[Line ${i+1}] ${name}`);
    console.log(`   Key: ${pInfo.key} (Type: ${pInfo.type})`);
    console.log(`   Хеліус (Великий гурт): ${hMatch ? `✅ ${hMatch.price} $ ("${hMatch.model}")` : '❌ Не знайдено'}`);
    console.log(`   ПЕ (Дрібний гурт):     ${peMatch ? `✅ ${peMatch.price} $ ("${peMatch.model}")` : '❌ Не знайдено'}`);
  }

  console.log(`\nSummary: Total Primary Rows = ${total}`);
  console.log(`Helius Matched: ${hFound}/${total}`);
  console.log(`PE Matched: ${peFound}/${total}`);
}

runRefinedMerge().catch(console.error);
