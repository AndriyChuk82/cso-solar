async function run() {
  try {
    const response = await fetch('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5');
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('PrivatBank Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
