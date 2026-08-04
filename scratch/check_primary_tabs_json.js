async function checkPrimaryTabs() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:json`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("JSON response snippet:", text.substring(0, 300));
}

checkPrimaryTabs().catch(console.error);
