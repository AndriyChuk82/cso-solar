const https = require('https');
https.get('https://docs.google.com/spreadsheets/d/1FeQGoFst-DWfLemlXI_0T5xQzMsYdSMC2Xj9Cjs5C1U/edit?usp=sharing', (res) => {
    let data = '';
    res.on('data', c => {data += c});
    res.on('end', () => {
        const match = data.match(/"ДОВІДНИК_ТОВАРІВ",\["(\d+)"/i);
        console.log('Exact gid:', match ? match[1] : 'not found');
        
        const allTabs = [...data.matchAll(/"([^"]+)",\["(\d{5,12})"/g)];
        console.log('All tabs found: ', allTabs.map(m => m[1] + ': ' + m[2]).join(', '));
    });
});
