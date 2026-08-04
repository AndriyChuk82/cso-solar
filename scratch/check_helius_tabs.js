const HELIUS_SPREADSHEET_ID = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';

async function checkHeliusAllTabs() {
  const url = `https://docs.google.com/spreadsheets/d/${HELIUS_SPREADSHEET_ID}/htmlview`;
  const res = await fetch(url);
  const text = await res.text();
  const matches = text.match(/<li id="sheet-button-([^"]+)"[^>]*><a[^>]*>(.*?)<\/a>/g);
  console.log("Helius tabs found in HTML view:");
  if (matches) {
    matches.forEach(m => console.log(m));
  } else {
    console.log("No tab buttons found in htmlview");
  }
}

checkHeliusAllTabs();
