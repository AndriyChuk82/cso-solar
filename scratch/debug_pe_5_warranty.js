async function debugPEWarranty() {
  const sidPE = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';
  const targetSheets = ['Гібридні інвертори', 'Мережеві інвертори', 'АКБ'];

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

  for (let sheetName of targetSheets) {
    const urlP = `https://docs.google.com/spreadsheets/d/${sidPE}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const resP = await fetch(urlP);
    const textP = await resP.text();
    const rows = parseCSVText(textP);
    rows.forEach((row, idx) => {
      const lineStr = row.join(' ');
      if (lineStr.toLowerCase().includes('10k-sg05') || lineStr.toLowerCase().includes('10k') && lineStr.toLowerCase().includes('sg05')) {
        console.log(`[PE Sheet ${sheetName} Row ${idx+1}]`);
        row.forEach((colVal, colIdx) => {
          console.log(`  Col ${colIdx} (${String.fromCharCode(65+colIdx)}): "${colVal}" -> parsed: ${parsePriceValueForPrimary(colVal)}`);
        });
      }
    });
  }
}

debugPEWarranty().catch(console.error);
