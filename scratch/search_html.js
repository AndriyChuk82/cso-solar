async function searchHtml() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/edit`;
  const res = await fetch(url);
  const text = await res.text();
  
  const regex = /"([^"]+)"/g;
  let match;
  const set = new Set();
  while ((match = regex.exec(text)) !== null) {
    const val = match[1];
    if (val.includes('Хеліус') || val.includes('Журнал') || val.includes('Зміст') || val.includes('Інвертори')) {
      set.add(val);
    }
  }
  console.log("Matched tab names:", Array.from(set));
}

searchHtml().catch(console.error);
