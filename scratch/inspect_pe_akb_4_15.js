async function inspectPeAkbLines45() {
  const sid = '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('АКБ')}`;
  const res = await fetch(url);
  const text = await res.text();
  text.split('\n').forEach((l, idx) => {
    if (idx + 1 >= 2 && idx + 1 <= 15) {
      console.log(`[Line ${idx+1}] ${l}`);
    }
  });
}

inspectPeAkbLines45().catch(console.error);
