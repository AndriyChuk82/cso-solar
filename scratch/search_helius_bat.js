const HELIUS_SPREADSHEET_ID = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';
const HELIUS_GID = '314286327';

async function searchHeliusBatteries() {
  const url = `https://docs.google.com/spreadsheets/d/${HELIUS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${HELIUS_GID}`;
  const text = await (await fetch(url)).text();
  const lines = text.split('\n');
  lines.forEach((l, idx) => {
    if (l.toLowerCase().includes('se-f') || l.toLowerCase().includes('bos') || l.toLowerCase().includes('rack') || l.toLowerCase().includes('акб') || l.toLowerCase().includes('акумул')) {
      console.log(`[Helius : line ${idx+1}] ${l.substring(0, 140)}`);
    }
  });
}

searchHeliusBatteries();
