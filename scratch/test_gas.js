const fs = require('fs');

// Mock Google Apps Script global objects
global.UrlFetchApp = {
  fetch: (url) => ({
    getContentText: () => {
      const syncFetch = require('child_process').execSync;
      return syncFetch(`curl -s "${url}"`).toString();
    }
  })
};

const codeContent = fs.readFileSync('scratch/Code.gs', 'utf8');
eval(codeContent);

async function testScript() {
  console.log("Testing fetchHeliusCatalog()...");
  const helius = fetchHeliusCatalog();
  console.log(`Helius items fetched: ${helius.length}`);

  console.log("Testing fetchPECatalog()...");
  const pe = fetchPECatalog();
  console.log(`PE items fetched: ${pe.length}`);
}

testScript().catch(console.error);
