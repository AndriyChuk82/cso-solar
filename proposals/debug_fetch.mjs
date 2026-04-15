import fs from 'fs';

const url = 'https://docs.google.com/spreadsheets/d/1JzZFwvw6-m5JqP2Nra2azUvoWfuoY6Bsh-3qWtLPZ_k/gviz/tq?tqx=out:json&gid=1248903265';

console.log('Завантаження даних...');

try {
  const res = await fetch(url);
  const text = await res.text();
  
  // Знаходимо початок JSON об'єкта (зазвичай після google.visualization.Query.setResponse()
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  
  if (startIdx === -1 || endIdx === -1) {
    console.error('Помилка: Не вдалося знайти JSON у відповіді. Отримана відповідь:');
    console.log(text.substring(0, 200));
    process.exit(1);
  }
  
  const jsonStr = text.substring(startIdx, endIdx + 1);
  const data = JSON.parse(jsonStr);
  
  console.log('Дані отримано. Шукаю DEYE BOS-G...');
  
  const rows = data.table.rows;
  let found = false;
  
  for (const row of rows) {
    if (!row.c) continue;
    
    // Перевіряємо перші два стовпці на наявність BOS-G
    const col0 = row.c[0] ? (row.c[0].f || row.c[0].v || '') : '';
    const col1 = row.c[1] ? (row.c[1].f || row.c[1].v || '') : '';
    
    if (col0.toString().includes('BOS-G') || col1.toString().includes('BOS-G')) {
      found = true;
      console.log('\n--- Знайдено модель! ---');
      row.c.forEach((cell, idx) => {
        const letter = String.fromCharCode(65 + idx);
        if (cell) {
          console.log(`Column ${letter} (${idx}):`, { v: cell.v, f: cell.f });
        } else {
          console.log(`Column ${letter} (${idx}): EMPTY`);
        }
      });
      console.log('------------------------');
    }
  }
  
  if (!found) console.log('Модель не знайдена у списку.');

} catch (err) {
  console.error('Помилка виконання:', err);
}
