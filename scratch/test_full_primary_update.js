async function testFullPrimaryUpdate() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Прайс дилерський')}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("=== PRIMARY SHEET TAB: Прайс дилерський ===");
  const lines = text.split('\n');
  lines.slice(0, 15).forEach((l, idx) => {
    console.log(`Row ${idx+1}: ${l}`);
  });
}

testFullPrimaryUpdate().catch(console.error);
