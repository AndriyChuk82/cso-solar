async function run() {
  try {
    const gasUrl = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';
    
    // We send a POST request with action: 'getRates'
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getRates' })
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('GAS getRates Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
