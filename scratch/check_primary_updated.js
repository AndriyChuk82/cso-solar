async function checkPrimaryUpdated() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const gid = '71726164';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("=== UPDATED PRIMARY SHEET ===");
  text.split('\n').forEach((l, idx) => {
    if (idx < 20) console.log(`${idx+1}: ${l.substring(0, 140)}`);
  });
}

checkPrimaryUpdated();
