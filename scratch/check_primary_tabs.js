async function checkAllPrimarySheets() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/htmlview`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("HTML View response length:", text.length);
  const matches = text.match(/<li id="sheet-button-([^"]+)"[^>]*><a[^>]*>(.*?)<\/a>/g);
  if (matches) {
    matches.forEach(m => console.log(m));
  } else {
    // Try to find sheet names in script tags
    const scriptMatches = text.match(/sheetName:\s*"([^"]+)"/g);
    console.log("Script matches:", scriptMatches);
  }
}

checkAllPrimarySheets().catch(console.error);
