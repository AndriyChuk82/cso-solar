async function debugSolis30k() {
  const sidHelius = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const sidPE = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';

  console.log("=== SEARCHING HELIUS FOR SOLIS ===");
  const urlH = `https://docs.google.com/spreadsheets/d/${sidHelius}/gviz/tq?tqx=out:csv&sheet=_Прайс_Хеліус`;
  const resH = await fetch(urlH);
  const textH = await resH.text();
  textH.split('\n').forEach((l, idx) => {
    if (l.toLowerCase().includes('solis') || l.toLowerCase().includes('gc30k') || l.toLowerCase().includes('s5')) {
      console.log(`[Helius Line ${idx+1}] ${l.substring(0, 160)}`);
    }
  });

  console.log("\n=== SEARCHING PE FOR SOLIS ===");
  const targetSheets = ['Гібридні інвертори', 'Мережеві інвертори', 'АКБ'];
  for (let sheetName of targetSheets) {
    const urlP = `https://docs.google.com/spreadsheets/d/${sidPE}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const resP = await fetch(urlP);
    const textP = await resP.text();
    textP.split('\n').forEach((l, idx) => {
      if (l.toLowerCase().includes('solis') || l.toLowerCase().includes('gc30k') || l.toLowerCase().includes('s5')) {
        console.log(`[PE ${sheetName} Line ${idx+1}] ${l.substring(0, 160)}`);
      }
    });
  }
}

debugSolis30k().catch(console.error);
