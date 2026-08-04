const HELIUS_SPREADSHEET_ID = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';

async function testHeliusFetch() {
  const url = `https://docs.google.com/spreadsheets/d/${HELIUS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n');
  console.log("Helius total CSV lines:", lines.length);
  lines.slice(0, 15).forEach((l, idx) => console.log(`${idx+1}: ${l.substring(0, 120)}`));
}

testHeliusFetch();
