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

function normalizeKey(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Model extraction regex / rules
function extractModelKey(str) {
  if (!str) return '';
  const s = str.toLowerCase();
  
  // Deye inverters: SUN-6K-SG05LP1-EU -> sun6ksg05lp1
  // Batteries: SE-F5-PRO-C, SE-G5.1-PRO-B, BOS-G, etc.
  let match = s.match(/sun[-_\s]*\d+k?[-_\s]*sg\d+[a-z0-9]*/i);
  if (match) return normalizeKey(match[0]);

  match = s.match(/se[-_\s]*[fg]\d+(\.\d+)?[-_\s]*(pro)?[-_\s]*[a-z]?/i);
  if (match) return normalizeKey(match[0]);

  match = s.match(/bos[-_\s]*g(\s*\d+\.\d+)?(\s*pro)?/i);
  if (match) return normalizeKey(match[0]);

  match = s.match(/solis[-_\s]*[a-z0-9-]+/i);
  if (match) return normalizeKey(match[0]);

  match = s.match(/sun2000[-_\s]*[a-z0-9-]+/i);
  if (match) return normalizeKey(match[0]);

  return normalizeKey(str);
}

async function runTestMerge() {
  // 1. Fetch Primary
  const primaryText = await (await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.PRIMARY_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.PRIMARY_GID}`)).text();
  const primaryRows = parseCSV(primaryText);

  // 2. Fetch Helius
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
      heliusProducts.push({ model, price, key: extractModelKey(model), rawPrice: priceRaw });
    }
  }

  // 3. Fetch PE
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
        peProducts.push({ model, price, key: extractModelKey(model), rawPrice: priceRaw, sheet: sheet.name });
      }
    }
  }

  console.log(`Helius parsed: ${heliusProducts.length} items`);
  console.log(`PE parsed: ${peProducts.length} items`);

  console.log("\n=== MERGE RESULTS ===");
  for (let i = 1; i < primaryRows.length; i++) {
    const row = primaryRows[i];
    const name = (row[0] || '').trim();
    if (!name) continue;

    const targetKey = extractModelKey(name);

    // Find in Helius
    const hMatch = heliusProducts.find(h => h.key && (h.key === targetKey || h.key.includes(targetKey) || targetKey.includes(h.key)));

    // Find in PE
    const peMatch = peProducts.find(p => p.key && (p.key === targetKey || p.key.includes(targetKey) || targetKey.includes(p.key)));

    console.log(`\nТовар: "${name}" [Key: ${targetKey}]`);
    console.log(`  - Хеліус (Великий гурт): ${hMatch ? `${hMatch.price} $ (з "${hMatch.model}")` : '❌ Не знайдено'}`);
    console.log(`  - ПЕ (Дрібний гурт): ${peMatch ? `${peMatch.price} $ (з "${peMatch.model}")` : '❌ Не знайдено'}`);
  }
}

runTestMerge().catch(console.error);
