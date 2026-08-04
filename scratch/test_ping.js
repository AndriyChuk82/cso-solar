async function testPing() {
  const url = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec?action=ping';
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  console.log("Ping status:", res.status);
  console.log("Ping text:", text);
}

testPing().catch(console.error);
