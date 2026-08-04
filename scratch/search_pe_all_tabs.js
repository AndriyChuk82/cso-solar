async function searchPeAllTabs() {
  const sid = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';
  const targetSheets = ['Гібридні інвертори', 'Мережеві інвертори', 'АКБ'];
  for (let sheetName of targetSheets) {
    const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    const text = await res.text();
    text.split('\n').forEach((l, idx) => {
      if (l.includes('SE-F') || l.includes('SE-G') || l.includes('80K') || l.includes('80k')) {
        console.log(`[Sheet ${sheetName} Line ${idx+1}] ${l}`);
      }
    });
  }
}

searchPeAllTabs().catch(console.error);
