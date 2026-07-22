const gasUrl = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';

async function testItems() {
  const res = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'getProposals' })
  });
  const data = await res.json();
  const kupavaProps = data.proposals.filter(p => (p.clientName || '').toLowerCase().includes('купава'));
  
  kupavaProps.forEach(p => {
    console.log(`\n=== КП ${p.number} ===`);
    p.items.forEach((item, idx) => {
      console.log(`Item ${idx}:`, {
        id: item.id,
        productId: item.productId,
        name: item.name,
        product_id_field: item.product ? item.product.id : undefined,
        price: item.price
      });
    });
  });
}

testItems();
