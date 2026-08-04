async function findEquipmentSheet() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const tabNames = ['Прайс дилерський', 'Інвертори', 'Сонячні панелі', 'Електрофурнітура', 'Система кріплень'];
  
  for (let name of tabNames) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
      const res = await fetch(url);
      const text = await res.text();
      if (text.includes('SE-F5') || text.includes('SUN-') || text.includes('Deye')) {
        console.log(`FOUND EQUIPMENT IN TAB: "${name}"! First 200 chars:`, text.substring(0, 200));
      }
    } catch (e) {}
  }
}

findEquipmentSheet().catch(console.error);
