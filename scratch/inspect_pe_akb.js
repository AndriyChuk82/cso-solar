async function inspectPEAkbTab() {
  const sid = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('АКБ')}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("=== PE АКБ TAB ROWS ===");
  text.split('\n').forEach((l, idx) => {
    console.log(`[Line ${idx+1}] ${l}`);
  });
}

inspectPEAkbTab().catch(console.error);
