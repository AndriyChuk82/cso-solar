async function debugHuaweiPE() {
  const sidPE = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';
  const urlP = `https://docs.google.com/spreadsheets/d/${sidPE}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Мережеві інвертори')}`;
  const resP = await fetch(urlP);
  const textP = await resP.text();
  
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

  const rows = parseCSVText(textP);
  rows.forEach((r, idx) => {
    const lineStr = r.join(' ');
    if (lineStr.toLowerCase().includes('huawei') || lineStr.toLowerCase().includes('30ktl')) {
      console.log(`[PE Row ${idx+1}]`, r.slice(0, 7).join(' | '));
    }
  });
}

debugHuaweiPE().catch(console.error);
