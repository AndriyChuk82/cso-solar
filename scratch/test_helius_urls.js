async function testHeliusUrls() {
  const sid = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';
  const gid = '314286327';

  const url1 = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const url2 = `https://docs.google.com/spreadsheets/d/${sid}/export?format=csv&gid=${gid}`;

  const res1 = await fetch(url1);
  const text1 = await res1.text();

  const res2 = await fetch(url2);
  const text2 = await res2.text();

  console.log("gviz status:", res1.status, "lines:", text1.split('\n').length);
  console.log("export status:", res2.status, "lines:", text2.split('\n').length);
}

testHeliusUrls().catch(console.error);
