async function triggerLiveUpdate() {
  const url = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec?action=updatePrimaryPrices';
  console.log("Triggering live update endpoint...");
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  console.log("Result:", text);
}

triggerLiveUpdate().catch(console.error);
