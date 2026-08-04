const CONFIG = {
  PE_ID: '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g',
  PE_GIDS: [
    { name: 'Гібридні інвертори', gid: '2087142679' },
    { name: 'Мережеві інвертори', gid: '1047165471' },
    { name: 'АКБ', gid: '1248903265' }
  ]
};

async function searchPE() {
  for (const sheet of CONFIG.PE_GIDS) {
    const text = await (await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.PE_ID}/gviz/tq?tqx=out:csv&gid=${sheet.gid}`)).text();
    const lines = text.split('\n');
    lines.forEach((l, idx) => {
      if (l.toLowerCase().includes('huawei') || l.toLowerCase().includes('longi') || l.toLowerCase().includes('jasolar') || l.toLowerCase().includes('se5.1') || l.toLowerCase().includes('5.1-pro')) {
        console.log(`[${sheet.name} : ${idx+1}] ${l.substring(0, 140)}`);
      }
    });
  }
}

searchPE();
