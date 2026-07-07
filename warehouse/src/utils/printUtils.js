/**
 * Друк видаткової накладної від імені ФОП Пастушок М. В.
 */
export function printDeliveryNote(formData, buyer, showPrices, txId) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const dateStr = formData.date ? new Date(formData.date).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA');
  const dnNumber = txId ? `ВН-${txId.slice(-6).toUpperCase()}` : 'Нова';
  const currencySymbol = formData.currency === 'UAH' ? 'грн' : '$';

  const buyerName = buyer ? buyer.name : '____________________';
  const buyerPhone = buyer ? buyer.phone || '-' : '-';
  const buyerAddress = buyer ? buyer.address || '-' : '-';

  const items = formData.items || [];
  let totalSum = 0;

  const itemsHTML = items.map((item, i) => {
    const itemName = item.productName || 'Без назви';
    const itemUnit = item.unit || 'шт.';
    const itemQty = parseFloat(item.quantity) || 0;
    const itemPrice = parseFloat(item.price) || 0;
    const itemSum = itemPrice * itemQty;
    
    if (showPrices) {
      totalSum += itemSum;
    }

    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${i + 1}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px;">
          <strong>${itemName}</strong>
          ${item.productArticle ? `<span style="font-size: 9px; color: #6B7280; display: block; margin-top: 2px; font-family: monospace;">Арт: ${item.productArticle}</span>` : ''}
        </td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${itemUnit}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; font-weight: 600;">${itemQty}</td>
        ${showPrices ? `
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap;">${itemPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap; font-weight: 600;">${itemSum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        ` : ''}
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Видаткова накладна ${dnNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1F2937; padding: 40px 50px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .doc-title { color: #F59E0B; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #F9FAFB; padding: 10px; text-align: center; border: 1px solid #E5E7EB; font-size: 9px; text-transform: uppercase; color: #4B5563; font-weight: 700; }
          td { padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; }
          .total-row td { background-color: #FFFDF2; font-weight: 700; color: #F59E0B; border: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://i.ibb.co/32JD4dc/logo.png" height="45">
          <div class="doc-title">ВИДАТКОВА НАКЛАДНА</div>
        </div>
        <hr style="height: 3px; background-color: #F59E0B; border: none; margin: 10px 0 20px;">
        
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 30px; text-align: center;">
          Видаткова накладна № ${dnNumber} від ${dateStr}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; font-size: 11px;">
          <div>
            <span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px; font-weight: 600; display: block; margin-bottom: 4px;">Постачальник:</span>
            <strong>ФОП Пастушок Марія Володимирівна</strong><br>
            РНОКПП: 3090406261<br>
            Адреса: Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38<br>
            Тел: (067) 374-08-12
          </div>
          <div>
            <span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px; font-weight: 600; display: block; margin-bottom: 4px;">Покупець:</span>
            <strong>${buyerName}</strong><br>
            Тел: ${buyerPhone}<br>
            Адреса: ${buyerAddress}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px">№</th>
              <th style="text-align: left;">Найменування</th>
              <th style="width: 60px">Од.</th>
              <th style="width: 60px">К-сть</th>
              ${showPrices ? `
              <th style="width: 85px">Ціна (${currencySymbol})</th>
              <th style="width: 85px">Сума (${currencySymbol})</th>
              ` : ''}
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            ${showPrices ? `
            <tr class="total-row">
              <td colspan="4" style="border: none; background: none;"></td>
              <td style="padding: 10px; text-align: right; text-transform: uppercase; font-size: 11px;">Разом:</td>
              <td style="padding: 10px; text-align: center; font-size: 11px; white-space: nowrap;">${totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="text-align: center; font-size: 10px; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 35px; margin-bottom: 5px;"></div>
            Відпустив (ПІБ, підпис)
          </div>
          <div style="text-align: center; font-size: 10px; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 35px; margin-bottom: 5px;"></div>
            Отримав (ПІБ, підпис)
          </div>
        </div>

        <script>
          window.onload = () => setTimeout(() => window.print(), 800);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
