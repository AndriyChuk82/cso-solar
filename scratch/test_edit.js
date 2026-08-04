async function testPublicEdit() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&gid=71726164`;
  const res = await fetch(url);
  console.log("Status:", res.status);
}

testPublicEdit();
