/**
 * Утиліти для експорту звітів у Excel (.xlsx) та PDF.
 *
 * Для Excel використовуємо формат CSV з UTF-8 BOM (відкривається в Excel коректно).
 * Для PDF використовуємо генерацію в браузері через HTML → print.
 */

/**
 * Експортує табличні дані у файл .xlsx (CSV з UTF-8 BOM, який Excel розпізнає).
 *
 * @param {string[]} columns — заголовки колонок
 * @param {object[]} items — рядки даних (ключі = назви колонок)
 * @param {string} fileName — назва файлу (без розширення)
 */
export function exportToExcel(columns, items, fileName = 'звіт') {
  if (!columns || !items || items.length === 0) {
    alert('Немає даних для експорту');
    return;
  }

  const separator = ';';
  const BOM = '\uFEFF';

  // Заголовки
  let csv = columns.map(escCsv).join(separator) + '\n';

  // Рядки
  items.forEach((row) => {
    csv += columns.map((col) => escCsv(row[col] ?? '')).join(separator) + '\n';
  });

  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${fileName}.csv`);
}

/**
 * Експортує табличні дані у PDF через друк.
 *
 * @param {string[]} columns — заголовки
 * @param {object[]} items — рядки
 * @param {string} title — заголовок звіту
 * @param {string} fileName — назва файлу (без розширення)
 */
export function exportToPdf(columns, items, title = 'Звіт', fileName = 'звіт') {
  if (!columns || !items || items.length === 0) {
    alert('Немає даних для експорту');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Дозвольте відкриття popup-вікон для генерації PDF');
    return;
  }

  const date = new Date().toLocaleDateString('uk-UA');

  const tableRows = items.map((row) => {
    const cells = columns.map((col) => `<td>${escHtml(String(row[col] ?? '—'))}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const headerCells = columns.map((col) => `<th>${escHtml(col)}</th>`).join('');

  const html = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>${escHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      color: #1a1a2e;
      padding: 20px 30px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #1a3a6b;
    }
    .header img { height: 40px; }
    .header div { font-size: 10px; color: #5a6a8a; }
    h1 {
      font-size: 16px;
      color: #1a3a6b;
      margin-bottom: 4px;
    }
    .date {
      font-size: 10px;
      color: #888;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    th {
      background: #1a3a6b;
      color: white;
      padding: 6px 8px;
      text-align: center;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    th:first-child {
      text-align: left;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      text-align: center;
    }
    td:first-child {
      text-align: left;
    }
    tr:nth-child(even) { background: #f8fafc; }
    .footer {
      margin-top: 16px;
      font-size: 9px;
      color: #999;
      text-align: center;
    }
    @media print {
      body { padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://i.ibb.co/32JD4dc/logo.png" alt="CSO Solar">
    <div>
      <div>CSO Solar — Складський облік</div>
      <div>Офіс та склад: Львівська обл., м. Золочів, вул. І. Труша 1Б</div>
    </div>
  </div>
  <h1>${escHtml(title)}</h1>
  <div class="date">Дата формування: ${date}</div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">CSO Solar — Автоматично сформований звіт</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    }
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

function escCsv(value) {
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadBlob(blob, fileName) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
