async function verify725() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const gid = '71726164';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("Primary sheet row 2:");
  const row2 = text.split('\n')[1];
  console.log(row2);
}

verify725();
