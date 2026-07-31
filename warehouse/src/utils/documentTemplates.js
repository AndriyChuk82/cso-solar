/**
 * Офіційні шаблони друку документів з модуля Комерційні Пропозиції (КП):
 * - Гарантійний талон
 * - Видаткова накладна
 * - ТТН (Форма № 1-ТН)
 */

export function printOfficialDocumentFromKP(docType, data) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку документа');
    return;
  }

  let html = '';
  if (docType === 'warranty') {
    html = generateOfficialWarrantyHTML(data);
  } else if (docType === 'ttn') {
    html = generateOfficialTTNHTML(data);
  } else {
    html = generateOfficialDeliveryNoteHTML(data);
  }

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Офіційний Гарантійний талон з КП
 */
export function generateOfficialWarrantyHTML(data) {
  const dateObj = data.docDate ? new Date(data.docDate) : new Date();
  const dateStr = dateObj.toLocaleDateString('uk-UA');

  const items = data.items || [];
  const itemsHTML = items.map((item, i) => {
    const serials = item.serials ? String(item.serials).replace(/\n/g, '<br>') : '—';
    const warrantyPeriod = item.warrantyMonths ? `${item.warrantyMonths} міс.` : '12 міс.';
    return `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align: left; font-weight: bold;">${item.name || 'Товар'}</td>
        <td>${item.qty || 1} ${item.unit || 'шт'}</td>
        <td style="word-break: break-all; line-height: 1.6; font-family: monospace;">${serials}</td>
        <td style="font-weight: bold; color: #b45309;">${warrantyPeriod}</td>
      </tr>
    `;
  }).join('');

  const sellerName = data.seller?.fullName || 'ФОП Пастушок Марія Володимирівна';
  const sellerOffice = data.seller?.office || 'Україна, 80700, Львівська обл., м. Золочів';
  const buyerName = data.buyer?.name || 'Покупець';

  return `
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Гарантійний талон № ${data.docNumber || ''}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #000; background: #fff; margin: 0; padding: 0; line-height: 1.4; }
          .container { width: 180mm; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f59e0b; pb: 10px; }
          .title { font-size: 22px; font-weight: bold; text-transform: uppercase; color: #1e293b; }
          .date-line { font-size: 15px; margin-top: 5px; }
          .info-block { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 6px; }
          .info-label { font-weight: bold; min-width: 150px; }
          .info-value { border-bottom: 1px solid #000; flex-grow: 1; padding-left: 5px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; }
          th { font-family: 'Times New Roman', Times, serif; font-size: 13px; font-weight: bold; background-color: #f8fafc; }
          .terms-title { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 8px; text-transform: uppercase; }
          .terms-content { font-size: 11px; text-align: justify; line-height: 1.35; }
          .terms-content p { margin: 0 0 4px 0; }
          .terms-content ol { margin: 0 0 4px 0; padding-left: 18px; }
          .terms-content li { margin-bottom: 2px; }
          .attention { font-weight: bold; margin-top: 8px; font-size: 10.5px; }
          .agreement-text { margin-top: 15px; font-weight: bold; font-style: italic; text-align: justify; font-size: 11.5px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 35px; }
          .sig-block { width: 45%; }
          .sig-line { border-bottom: 1px solid #000; height: 25px; margin-top: 5px; }
          .sig-subtext { font-size: 10px; text-align: center; margin-top: 2px; }
          .stamp-box { width: 85px; height: 85px; border: 1px dashed #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 11px; margin: -25px auto 0 auto; position: relative; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">ГАРАНТІЙНИЙ ТАЛОН</div>
            <div class="date-line">Дата продажу: <span style="font-weight:bold; border-bottom:1px solid #000; padding:0 15px;">${dateStr}</span></div>
          </div>

          <div class="info-block">
            <div class="info-row">
              <span class="info-label">Продавець:</span>
              <span class="info-value">${sellerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Адреса продавця:</span>
              <span class="info-value">${sellerOffice}</span>
            </div>
            <div class="info-row" style="margin-top: 10px;">
              <span class="info-label">Покупець (ПІБ):</span>
              <span class="info-value">${buyerName}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">№</th>
                <th style="width: 40%">Найменування обладнання</th>
                <th style="width: 10%">шт.</th>
                <th style="width: 30%">Серійні номери</th>
                <th style="width: 15%">Гарантійний<br>період</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="terms-title">Умови гарантійного обслуговування</div>
          <div class="terms-content">
            <p>Придбаний Вами виріб повністю відповідає характеристикам, вказаних у технічному паспорті. Вказані характеристики гарантуються заводом-виробником. Пристрій прослужить Вам довго та якісно при дотриманні правил експлуатації та норм, вказаних в посібнику користувача. При виникненні необхідності гарантійного обслуговування приладу, просимо Вас звертатися до авторизованого сервісного центру постачальника, імпортера або магазину, де була здійснена покупка.</p>
            <ol>
              <li>Гарантійне обслуговування передбачає безкоштовний ремонт, або заміну комплектуючих приладу протягом гарантійного терміну.</li>
              <li>Гарантійний ремонт здійснюється авторизованим сервісним центром.</li>
              <li>Рішення питання доцільності ремонту, або заміни непрацюючих частин виробу, приймається авторизованим сервісним центром.</li>
              <li>Гарантійне обслуговування здійснюється лише при наявності правильно та чітко заповненого гарантійного талону. В гарантійному талоні повинно бути вказано: Виробник, модель, дата продажу та поставлена чітка печатка продавця з його реквізитами.</li>
              <li>Гарантійне обслуговування не здійснюється у випадку:
                <ul style="list-style-type: none; padding-left: 10px; margin: 4px 0;">
                  <li>5.1. Відсутності гарантійного талону чи інших документів, що засвідчують купівлю товару з відповідними печатками.</li>
                  <li>5.2. Недотримання робочих параметрів, вказаних у технічному паспорті на придбаний товар.</li>
                  <li>5.3. Наявності механічних пошкоджень, що могли вивести з ладу внутрішні електронні компоненти пристрою.</li>
                </ul>
              </li>
              <li>На товар, у якого вийшов гарантійний термін, гарантійне обслуговування не розповсюджується.</li>
            </ol>
            <p class="attention">Зверніть увагу! При самостійному підключенні та монтажі, споживач зобов’язаний технічно проконсультуватися з постачальником, строго дотримуючись його вказівок. Споживач зобов’язаний надати фото підтвердження вмонтованого обладнання. ${data.notes ? '<br><br><strong>Примітки:</strong> ' + data.notes : ''}</p>
          </div>

          <div class="agreement-text">
            Новий виріб в повному комплекті, з інструкцією по експлуатацією отримав. З умовами гарантійного обслуговування ознайомлений та згідний.
          </div>

          <div class="signatures">
            <div class="sig-block">
              <div><strong>Продавець:</strong></div>
              <div class="sig-line"></div>
              <div class="sig-subtext">(підпис продавця)</div>
              <div class="stamp-box">М.П.</div>
            </div>
            <div class="sig-block">
              <div><strong>Покупець:</strong></div>
              <div class="sig-line"></div>
              <div class="sig-subtext">(підпис клієнта)</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = () => setTimeout(() => window.print(), 500);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;
}

/**
 * Офіційна Видаткова накладна з КП
 */
export function generateOfficialDeliveryNoteHTML(data) {
  const accentColor = '#F59E0B';
  const dateStr = data.docDate ? new Date(data.docDate).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA');
  const dnNumber = data.docNumber || `ВН-${Math.floor(1000 + Math.random() * 9000)}`;

  const sellerName = data.seller?.fullName || 'ФОП Пастушок Марія Володимирівна';
  const buyerName = data.buyer?.name || 'Покупець';

  const items = data.items || [];
  const itemsHTML = items.map((item, i) => {
    const qty = parseFloat(item.qty) || 1;
    const price = parseFloat(item.price) || 0;
    const total = parseFloat(item.total) || (qty * price);
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${i + 1}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px;">
          <strong>${item.name || 'Товар'}</strong>
        </td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${item.unit || 'шт'}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${qty}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right;">${price.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right; font-weight: bold;">${total.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const totalSum = items.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);
  const currencySymbol = data.currency === 'USD' ? '$' : 'грн';

  return `
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Видаткова накладна ${dnNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1F2937; padding: 40px 50px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .doc-title { color: ${accentColor}; font-weight: 700; font-size: 18px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #F9FAFB; padding: 10px; text-align: center; border: 1px solid #E5E7EB; font-size: 9px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://i.ibb.co/32JD4dc/logo.png" height="45">
          <div class="doc-title">ВИДАТКОВА НАКЛАДНА</div>
        </div>
        <hr style="height: 3px; background-color: ${accentColor}; border: none; margin: 10px 0 20px;">
        
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 30px; text-align: center;">
          Видаткова накладна № ${dnNumber} від ${dateStr}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; font-size: 11px;">
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Постачальник:</span><br><strong>${sellerName}</strong></div>
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Покупець:</span><br><strong>${buyerName}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px">№</th>
              <th style="text-align: left;">Товар</th>
              <th style="width: 60px">Од.</th>
              <th style="width: 60px">К-сть</th>
              <th style="width: 90px">Ціна (${currencySymbol})</th>
              <th style="width: 100px">Сума (${currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            <tr style="font-weight: bold;">
              <td colspan="4" style="border: none; text-align: right; padding: 10px;">Всього:</td>
              <td colspan="2" style="border: 1px solid #E5E7EB; text-align: right; padding: 10px; font-size: 13px; color: #d97706;">${totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ${currencySymbol}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="text-align: center; font-size: 10px; width: 200px;">
            <div style="border-bottom: 1px solid #000; height: 35px;"></div>
            Відпустив (Постачальник)
          </div>
          <div style="text-align: center; font-size: 10px; width: 200px;">
            <div style="border-bottom: 1px solid #000; height: 35px;"></div>
            Отримав (Покупець)
          </div>
        </div>

        <script>
          window.onload = () => setTimeout(() => window.print(), 500);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;
}

/**
 * Офіційна ТТН (Форма № 1-ТН) з КП
 */
export function generateOfficialTTNHTML(data) {
  const dateObj = data.docDate ? new Date(data.docDate) : new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const monthNames = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  const month = monthNames[dateObj.getMonth()];
  const year = String(dateObj.getFullYear()).slice(-2);

  const items = data.items || [];
  const itemsHTML = items.map((item, i) => {
    const qty = parseFloat(item.qty) || 1;
    const name = item.name || 'Товар';
    const unit = item.unit || 'шт';
    return `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align: left;">${name}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>${unit}</td>
        <td>${qty}</td>
        <td>—</td>
        <td>—</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `;
  }).join('');

  const sellerName = data.seller?.fullName || 'ФОП Пастушок Марія Володимирівна';
  const buyerName = data.buyer?.name || 'Покупець';

  return `
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Товарно-транспортна накладна (Форма № 1-ТН)</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
          * { box-sizing: border-box; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 0; line-height: 1.25; }
          .container { width: 280mm; margin: 0 auto; position: relative; }
          .top-right-appendix { position: absolute; top: 0; right: 0; text-align: right; font-size: 9.5px; line-height: 1.25; }
          .header-center { text-align: center; margin-top: 20px; margin-bottom: 15px; }
          .main-title { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
          .date-line { font-size: 13px; margin-top: 6px; font-weight: bold; }
          .date-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 35px; text-align: center; }
          .date-month-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 100px; text-align: center; }
          .row { display: flex; align-items: flex-end; margin-bottom: 12px; width: 100%; }
          .field-wrap { display: flex; flex-direction: column; flex-grow: 1; margin-right: 15px; }
          .field-top { display: flex; align-items: flex-end; }
          .label { white-space: nowrap; margin-right: 6px; font-weight: bold; font-size: 11px; }
          .value { border-bottom: 1px solid #000; flex-grow: 1; text-align: center; min-height: 18px; font-family: Arial, sans-serif; font-size: 11px; padding: 0 4px; }
          table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9px; margin-bottom: 15px; }
          th, td { border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; }
          .signatures { display: flex; justify-content: space-between; margin-top: 20px; }
          .sig-block { width: 30%; text-align: center; }
          .sig-line { border-bottom: 1px solid #000; height: 25px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="top-right-appendix">
            Додаток 7<br>
            до Правил перевезень вантажів автомобільним транспортом в Україні
          </div>
          
          <div class="header-center">
            <div class="main-title">ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА</div>
            <div class="date-line">
              N ${data.docNumber || ''} " <span class="date-gap">${day}</span> " <span class="date-month-gap">${month}</span> 20<span class="date-gap">${year}</span> року
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажовідправник:</span><span class="value">${sellerName}</span></div>
            </div>
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажоодержувач:</span><span class="value">${buyerName}</span></div>
            </div>
          </div>

          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Автомобіль:</span><span class="value">${data.logistics?.vehicleNo || '—'}</span></div>
            </div>
            <div class="field-wrap">
              <div class="field-top"><span class="label">Водій:</span><span class="value">${data.logistics?.driverName || '—'}</span></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px">№</th>
                <th>Найменування вантажу</th>
                <th>Документи</th>
                <th>Спосіб пакування</th>
                <th>К-сть місць</th>
                <th>Одиниця виміру</th>
                <th>Кількість</th>
                <th>Маса брутто, т</th>
                <th>Оголошена вартість</th>
                <th>Вид пакування</th>
                <th>Штрихкод</th>
                <th>Примітки</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-block">
              <div><strong>Сдав (Вантажовідправник):</strong></div>
              <div class="sig-line"></div>
            </div>
            <div class="sig-block">
              <div><strong>Прийняв водій:</strong></div>
              <div class="sig-line"></div>
            </div>
            <div class="sig-block">
              <div><strong>Прийняв (Вантажоодержувач):</strong></div>
              <div class="sig-line"></div>
            </div>
          </div>
        </div>
        <script>
          window.onload = () => setTimeout(() => window.print(), 500);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;
}
