async function testPEWarrantyFix() {
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

  function parsePriceValueForPrimary(str) {
    if (!str) return null;
    let s = String(str).trim();
    const low = s.toLowerCase();
    
    // Ignore warranty strings like "5 Років", "10 Років", "гарантія"
    if (low.includes('рок') || low.includes('рік') || low.includes('гарант')) {
      return null;
    }

    if (low.includes('гот') || s.includes('/')) {
      const match = s.match(/[\d\s,.]+/);
      if (match) s = match[0];
    }
    s = s.replace(/[$€₴]|грн/gi, '').trim();
    s = s.replace(/\s/g, '').replace(',', '.');
    const val = parseFloat(s);
    return (isNaN(val) || val <= 0) ? null : val;
  }

  function fetchPENativeForPrimaryTest() {
    const products = [];
    const targetSheets = ['Гібридні інвертори', 'Мережеві інвертори', 'АКБ'];
    // ...
  }

  const sampleWarranty = "5 Роки";
  const sampleEmptyPrice3 = "";
  const sampleEmptyPrice4 = "";

  console.log("Parsing '5 Роки':", parsePriceValueForPrimary(sampleWarranty)); // null
  
  // Test price selection for inverters: ONLY check index 3 or index 4 (NOT 5 which is warranty)
  const rowInverter = ["", "Deye SUN-10KSG05LP3-EU", "Desc", "", "", "5 Роки", "Китай", "Нема в наявності"];
  let priceRaw = String(rowInverter[3] || rowInverter[4] || '').trim();
  let price = parsePriceValueForPrimary(priceRaw);
  console.log("Parsed price for Deye SUN-10KSG05LP3-EU when empty:", price); // null
}

testPEWarrantyFix().catch(console.error);
