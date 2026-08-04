async function testProxy() {
  const gvizUrl = 'https://docs.google.com/spreadsheets/d/1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy/gviz/tq?tqx=out:csv&gid=314286327';
  const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(gvizUrl);
  
  const res = await fetch(proxyUrl);
  const text = await res.text();
  console.log("Proxy response status:", res.status);
  console.log("Proxy response length:", text.length);
  console.log("First 200 chars:", text.substring(0, 200));
}

testProxy().catch(console.error);
