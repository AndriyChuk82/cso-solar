const sheets = {
  primary: ['1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII', '71726164'],
  helius: ['1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy', '314286327'],
  pe_hybrids: ['1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g', '2087142679'],
  pe_grid: ['1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g', '1047165471'],
  pe_akb: ['1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g', '1248903265']
};

async function test() {
  for (const [name, [sid, gid]] of Object.entries(sheets)) {
    const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&gid=${gid}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      const lines = text.split('\n');
      console.log(`=== ${name} (${lines.length} lines) ===`);
      lines.slice(0, 8).forEach(l => console.log(l.substring(0, 140)));
    } catch(e) {
      console.log(`=== ${name} ERROR: ${e.message} ===`);
    }
  }
}
test();
