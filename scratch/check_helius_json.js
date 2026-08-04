const HELIUS_SPREADSHEET_ID = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';

async function checkHeliusGids() {
  const url = `https://docs.google.com/spreadsheets/d/${HELIUS_SPREADSHEET_ID}/gviz/tq?tqx=out:json`;
  const res = await fetch(url);
  const text = await res.text();
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[1]);
    console.log("Helius table cols:", data.table.cols.map(c => c.label));
    console.log("Helius first row:", data.table.rows[0].c.map(cell => cell ? cell.v : null));
  }
}

checkHeliusGids();
