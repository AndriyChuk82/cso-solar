const gasUrl = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';

async function searchProps() {
  const res = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getProposals' })
  });
  const data = await res.json();
  const props = data.proposals || [];

  console.log('Searching all proposals in GAS history...');
  props.forEach(p => {
    if (p.number && p.number.includes('20260417')) {
      console.log('Match by 20260417:', {
        id: p.id,
        number: p.number,
        clientName: p.clientName,
        date: p.date,
        itemsCount: p.items ? p.items.length : 0
      });
    }
    if (p.clientName && p.clientName.toLowerCase().includes('волод')) {
      console.log('Match by волод:', {
        id: p.id,
        number: p.number,
        clientName: p.clientName,
        date: p.date
      });
    }
  });
}

searchProps();
