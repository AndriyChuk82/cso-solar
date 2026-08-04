async function listAllSheetNames() {
  const sid = '1HANizDH1A5Vd_aNU9Xu6mgRXJx2Yqb7mQz534CivyII';
  const url = `https://docs.google.com/spreadsheets/d/${sid}/edit`;
  const res = await fetch(url);
  const text = await res.text();
  
  // Extract sheet names from html JS object
  const matches = text.match(/\"sheetId\":\d+,\"name\":\"[^\"]+\"/g);
  console.log("Sheet names found in HTML:", matches);
}

listAllSheetNames().catch(console.error);
