const HELIUS_SPREADSHEET_ID = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';

async function checkHeliusSheets() {
  const url = `https://docs.google.com/spreadsheets/d/${HELIUS_SPREADSHEET_ID}/gviz/tq?tqx=out:json`;
  const res = await fetch(url);
  const text = await res.text();
  console.log(text.substring(0, 300));
}

checkHeliusSheets();
