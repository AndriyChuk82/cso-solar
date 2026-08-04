const HELIUS_SPREADSHEET_ID = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';

async function printRow49() {
  const url = `https://docs.google.com/spreadsheets/d/${HELIUS_SPREADSHEET_ID}/export?format=csv`;
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('SE-F5 Pro-C')) {
      console.log(`Line ${idx+1}:`, l);
    }
  });
}

printRow49();
