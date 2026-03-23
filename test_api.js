async function test() {
  const url = 'https://script.google.com/macros/s/AKfycbxqQEMJ4vKBExxmh5-ft-UGVpU9rms4vPd9z0XgZv3b33sJDvXyZoIntOj61TVg9fLK/exec?action=getProjects';
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2).substring(0, 1000));
  } catch (err) {
    console.error(err);
  }
}
test();
