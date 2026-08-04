async function checkZmistRows() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=Зміст`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("=== ZMIST SHEET ROWS ===");
  console.log(text);
}

checkZmistRows().catch(console.error);
