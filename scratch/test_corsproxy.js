async function testCorsProxy() {
  const targetUrl = 'https://docs.google.com/spreadsheets/d/1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy/export?format=csv';
  const proxyUrl = 'https://corsproxy.io/?url=' + encodeURIComponent(targetUrl);
  
  const res = await fetch(proxyUrl);
  const text = await res.text();
  console.log("Corsproxy response status:", res.status);
  console.log("Corsproxy response length:", text.length);
  console.log("First 200 chars:", text.substring(0, 200));
}

testCorsProxy().catch(console.error);
