async function testLiveGasEndpoint() {
  const url = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec?action=updatePrimaryPrices';
  console.log("Calling live GAS endpoint...");
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  console.log("Response status:", res.status);
  console.log("Response text:", text);
}

testLiveGasEndpoint().catch(console.error);
