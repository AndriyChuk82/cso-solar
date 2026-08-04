async function checkPraisHeliusTab() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  // Let's get sheet gid for _Прайс_Хеліус
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=_Прайс_Хеліус`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("Length:", text.length);
  const lines = text.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('SE-F5') || l.includes('SUN-06K') || idx < 15) {
      console.log(`[Line ${idx+1}] ${l.substring(0, 150)}`);
    }
  });
}

checkPraisHeliusTab().catch(console.error);
