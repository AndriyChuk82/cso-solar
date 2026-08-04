const primaryUrl = 'https://docs.google.com/spreadsheets/d/1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII/gviz/tq?tqx=out:csv&gid=71726164';

async function checkPrimary() {
  const res = await fetch(primaryUrl);
  const text = await res.text();
  console.log("=== PRIMARY SHEET CONTENT ===");
  text.split('\n').forEach((line, idx) => {
    console.log(`${idx + 1}: ${line}`);
  });
}

checkPrimary();
