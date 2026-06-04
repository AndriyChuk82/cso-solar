async function run() {
  try {
    const payload = {
      operationName: "Point",
      variables: { alias: "goverla-ua" },
      query: "query Point($alias: Alias!) { point(alias: $alias) { rates { currency { codeAlpha } bid { absolute } ask { absolute } } } }"
    };

    const response = await fetch('https://api.goverla.ua/graphql', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://goverla.ua/'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
