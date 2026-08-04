async function testNoGid() {
  const sid = '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy';
  const url1 = `https://docs.google.com/spreadsheets/d/${sid}/export?format=csv`;
  const res1 = await fetch(url1);
  const text1 = await res1.text();
  console.log("No GID lines:", text1.split('\n').length);
}

testNoGid().catch(console.error);
