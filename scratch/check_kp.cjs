async function run() {
  console.log('Fetching proposals from Google App Script...');
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getProposals' })
    });
    const res = await response.json();
    console.log('Success:', res.success);
    if (res.success && res.proposals) {
      console.log('Total proposals:', res.proposals.length);
      const sloboda = res.proposals.find(p => p.clientName && p.clientName.includes('Слобода'));
      if (sloboda) {
        console.log('--- Слобода Сергій Proposal ---');
        console.log('Number:', sloboda.number);
        console.log('Total:', sloboda.total);
        console.log('Currency:', sloboda.currency);
        console.log('USD Rate:', sloboda.rates);
        console.log('Items sample:', JSON.stringify(sloboda.items, null, 2));
      } else {
        console.log('Sample proposal:', JSON.stringify(res.proposals[0], null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
