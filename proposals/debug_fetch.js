const fs = require('fs');
const url = 'https://docs.google.com/spreadsheets/d/1JzZFwvw6-m5JqP2Nra2azUvoWfuoY6Bsh-3qWtLPZ_k/gviz/tq?tqx=out:json&gid=1248903265';

console.log('Завантаження даних...');
fetch(url)
  .then(res => res.text())
  .then(text => {
    const jsonStr = text.substring(47).slice(0, -2);
    const data = JSON.parse(jsonStr);
    
    console.log('Дані отримано. Шукаю DEYE BOS-G...');
    
    const rows = data.table.rows;
    for (const row of rows) {
      if (!row.c) continue;
      
      const col0 = row.c[0] ? (row.c[0].f || row.c[0].v || '') : '';
      if (col0.toString().includes('BOS-G')) {
        console.log('--- Знайдено модель! ---');
        console.log('Column A (Model):', col0);
        row.c.forEach((cell, idx) => {
          if (cell) {
            console.log(`Column ${String.fromCharCode(65 + idx)} (${idx}):`, { v: cell.v, f: cell.f });
          } else {
            console.log(`Column ${String.fromCharCode(65 + idx)} (${idx}): EMPTY`);
          }
        });
        console.log('------------------------');
      }
    }
  })
  .catch(err => console.error('Помилка:', err));
