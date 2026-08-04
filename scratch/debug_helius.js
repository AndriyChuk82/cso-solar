const HELIUS_SPREADSHEET_ID = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';
const HELIUS_GID = '314286327';

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

async function debugHelius() {
  const url = `https://docs.google.com/spreadsheets/d/${HELIUS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${HELIUS_GID}`;
  const text = await (await fetch(url)).text();
  const rows = parseCSV(text);
  console.log(`Total Helius CSV rows: ${rows.length}`);
  rows.slice(0, 20).forEach((r, idx) => {
    console.log(`Row ${idx+1}: A="${r[0]}" | B="${r[1]}" | E="${r[4]}" | J="${r[9]}"`);
  });
}

debugHelius();
