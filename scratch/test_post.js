async function testPost() {
  const url = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'updatePrimaryPrices' }),
    redirect: 'follow'
  });
  const text = await res.text();
  console.log("POST Response:", text);
}

testPost().catch(console.error);
