async function run() {
  try {
    const payload = {
      operationName: "Point",
      variables: { alias: "goverla-ua" },
      query: "query Point($alias: Alias!) { point(alias: $alias) { rates { currency { codeAlpha } bid { absolute } ask { absolute } } } }"
    };

    const target = 'https://api.goverla.ua/graphql';
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(target);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Length:', text.length);
    console.log('Data:', text.substring(0, 500));
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
