async function main() {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getAllData' })
  }).then(r => r.json());

  const items = res.products || [];
  const g51 = items.find(p => {
    const name = String(typeof p.name === 'object' && p.name ? (p.name.formattedValue || p.name.stringValue || '') : p.name || '');
    return name.includes('G5.1');
  });

  console.log('GAS Raw Item for G5.1:', g51);
}

main().catch(console.error);
