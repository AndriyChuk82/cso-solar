async function checkHeliusRedirect() {
  const url = 'https://docs.google.com/spreadsheets/d/1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy/export?format=csv';
  const res = await fetch(url, { redirect: 'manual' });
  console.log("Status:", res.status);
  console.log("Location header:", res.headers.get('location'));
}

checkHeliusRedirect().catch(console.error);
