async function inspectPEAkbTop() {
  const sid = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('АКБ')}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("=== PE АКБ TOP ROWS ===");
  text.split('\n').slice(0, 50).forEach((l, idx) => {
    console.log(`[Line ${idx+1}] ${l}`);
  });
}

inspectPEAkbTop().catch(console.error);
