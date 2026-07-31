/**
 * Утиліти для формування та друку документів у додаток Склад (Warehouse)
 * Гарантійний талон, ТТН, Видаткова накладна, Рахунок-фактура
 */

export const SELLERS = {
  fop_pastushok: {
    id: 'fop_pastushok',
    shortName: 'ФОП Пастушок М. В.',
    fullName: 'ФОП Пастушок Марія Володимирівна',
    taxId: '3090406261',
    taxIdType: 'РНОКПП',
    address: 'Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38',
    office: 'Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38',
    iban: 'UA183257960000026004500152186',
    bank: 'Філія Львiвське обласне управління АТ "ОЩАДБАНК"',
    mfo: '325796',
    phone: '(067) 374-08-12',
    logo: 'https://i.ibb.co/32JD4dc/logo.png',
    stamp: '/proposals/doc/fop_past.jpg'
  },
  tov_cso: {
    id: 'tov_cso',
    shortName: 'ТОВ "ЦСО"',
    fullName: 'ТОВ «Центр сервісного обслуговування»',
    taxId: '31758743',
    taxIdType: 'ЄДРПОУ',
    address: 'Україна, 80700, Львівська обл., м. Золочів, вул. І. Труша 1Б',
    office: 'Львівська обл., м. Золочів, вул. І. Труша 1Б',
    iban: 'UA333003350000000002600846582',
    bank: 'АТ «РАЙФФАЙЗЕН БАНК»',
    mfo: '300335',
    phone: '067-370-32-36, 073-370-32-36',
    logo: 'https://i.ibb.co/32JD4dc/logo.png',
    stamp: '/proposals/doc/sign_cso.png'
  }
};

/**
 * Перетворення числа в суму прописом українською мовою
 */
export function numberToWords(amount) {
  const units = ['', 'один', 'два', 'три', 'чотири', 'п\'ять', 'шість', 'сім', 'вісім', 'дев\'ять'];
  const unitsFemale = ['', 'одна', 'дві', 'три', 'чотири', 'п\'ять', 'шість', 'сім', 'вісім', 'дев\'ять'];
  const teens = ['десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять', 'п\'ятнадцять', 'шістнадцять', 'сімнадцять', 'вісімнадцять', 'дев\'ятнадцять'];
  const tens = ['', '', 'двадцять', 'тридцять', 'сорок', 'п\'ятдесят', 'шістдесят', 'сімдесят', 'вісімдесят', 'дев\'яносто'];
  const hundreds = ['', 'сто', 'двісті', 'триста', 'чотириста', 'п\'ятсот', 'шістсот', 'сімсот', 'вісімсот', 'дев\'ятсот'];

  function convertGroup(n, isFemale = false) {
    let res = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) res += hundreds[h] + ' ';
    if (t === 1) {
      res += teens[u] + ' ';
    } else {
      if (t > 1) res += tens[t] + ' ';
      if (u > 0) res += (isFemale ? unitsFemale[u] : units[u]) + ' ';
    }
    return res.trim();
  }

  function getDeclension(n, forms) {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  }

  if (!amount || amount === 0) return 'нуль гривень 00 копійок';

  const integerPart = Math.floor(amount);
  const fractionPart = Math.round((amount - integerPart) * 100);

  const billions = Math.floor(integerPart / 1000000000);
  const millions = Math.floor((integerPart % 1000000000) / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  let result = '';

  if (billions > 0) {
    result += convertGroup(billions) + ' ' + getDeclension(billions, ['мільярд', 'мільярди', 'мільярдів']) + ' ';
  }
  if (millions > 0) {
    result += convertGroup(millions) + ' ' + getDeclension(millions, ['мільйон', 'мільйони', 'мільйонів']) + ' ';
  }
  if (thousands > 0) {
    result += convertGroup(thousands, true) + ' ' + getDeclension(thousands, ['тисяча', 'тисячі', 'тисяч']) + ' ';
  }
  if (remainder > 0 || integerPart === 0) {
    result += convertGroup(remainder) + ' ';
  }

  const hryvnia = getDeclension(integerPart, ['гривня', 'гривні', 'гривень']);
  const kopiyok = fractionPart.toString().padStart(2, '0');

  result = result.trim();
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return `${result} ${hryvnia} ${kopiyok} копійок`;
}

/**
 * Друк Видаткової накладної
 */
export function printDeliveryNote(issueData, customData = {}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateDeliveryNoteHTML(issueData, customData);
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Друк ТТН з даними модального вікна
 */
export function printTTNWithData(issueData, data) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateTTNHTML(data);
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Друк Гарантійного талону з даними модального вікна
 */
export function printWarrantyWithData(issueData, data) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateWarrantyHTML(issueData, data);
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Друк Рахунку-фактури
 */
export function printInvoiceWithData(issueData, data) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateInvoiceHTML(issueData, data);
  printWindow.document.write(html);
  printWindow.document.close();
}

// ===== HTML GENERATORS =====

function generateDeliveryNoteHTML(issue, customData = {}) {
  const accentColor = '#F59E0B';
  const dateStr = issue.date ? new Date(issue.date).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA');
  const dnNumber = issue.number || issue.issueNumber || (issue.id ? `ВН-${issue.id}` : `ВН-${Date.now().toString().slice(-6)}`);
  
  const seller = SELLERS.fop_pastushok;
  const buyerName = customData.buyerName || issue.buyerName || issue.clientName || '____________________';

  const items = customData.selectedItems || issue.items || [];
  let totalSum = 0;

  const itemsHTML = items.map((item, i) => {
    const itemName = item.editedName || item.name || item.productName || item.product?.name || 'Без назви';
    const itemUnit = item.unit || item.product?.unit || 'шт';
    const qty = parseFloat(item.editedQuantity ?? item.quantity ?? 1);
    const price = parseFloat(item.price || 0);
    const sum = qty * price;
    totalSum += sum;

    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${i + 1}</td>
        <td style="padding: 8px; border: 1px solid #E5E7EB; font-size: 11px;"><strong>${itemName}</strong></td>
        <td style="padding: 8px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${itemUnit}</td>
        <td style="padding: 8px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${qty}</td>
        <td style="padding: 8px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right; white-space: nowrap;">${price ? price.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
        <td style="padding: 8px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right; white-space: nowrap; font-weight: 600;">${sum ? sum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
      </tr>
    `;
  }).join('');

  const currencySymbol = issue.currency === 'USD' ? '$' : (issue.currency === 'EUR' ? '€' : 'грн.');
  const totalSumWordsStr = totalSum > 0 ? numberToWords(totalSum) : '';

  return `
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Видаткова накладна ${dnNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1F2937; padding: 40px 50px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .doc-title { color: ${accentColor}; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #F9FAFB; padding: 10px; text-align: center; border: 1px solid #E5E7EB; font-size: 10px; text-transform: uppercase; color: #4B5563; }
          .total-row td { background-color: #FFFDF2; font-weight: 700; color: ${accentColor}; border: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${seller.logo}" height="45">
          <div class="doc-title">ВИДАТКОВА НАКЛАДНА</div>
        </div>
        <hr style="height: 3px; background-color: ${accentColor}; border: none; margin: 10px 0 20px;">
        
        <div style="font-size: 15px; font-weight: 700; margin-bottom: 25px; text-align: center;">
          Видаткова накладна № ${dnNumber} від ${dateStr}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 25px; font-size: 11px; line-height: 1.5;">
          <div>
            <span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px; font-weight: 700;">Постачальник:</span><br>
            <strong>${seller.fullName}</strong><br>
            РНОКПП: ${seller.taxId}<br>
            Адреса: ${seller.address}<br>
            Тел: ${seller.phone}
          </div>
          <div>
            <span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px; font-weight: 700;">Отримувач / Покупець:</span><br>
            <strong>${buyerName}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px">№</th>
              <th style="text-align: left;">Найменування товару</th>
              <th style="width: 50px">Од.</th>
              <th style="width: 60px">К-сть</th>
              <th style="width: 90px">Ціна (${currencySymbol})</th>
              <th style="width: 100px">Сума (${currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            <tr class="total-row">
              <td colspan="4" style="border: none; background: none;"></td>
              <td style="padding: 10px; text-align: right; text-transform: uppercase; font-size: 11px;">Разом:</td>
              <td style="padding: 10px; text-align: right; font-size: 11px; white-space: nowrap;">${totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}</td>
            </tr>
          </tbody>
        </table>

        ${totalSumWordsStr ? `<div style="margin-top: 15px; font-size: 11px; font-style: italic;"><strong>Всього на суму:</strong> ${totalSumWordsStr}</div>` : ''}

        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="text-align: center; font-size: 10px; width: 220px; position: relative;">
            <div style="border-bottom: 1px solid #1F2937; height: 35px; position: relative;">
              <img src="${seller.stamp}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -45%); width: 135px; opacity: 0.95; pointer-events: none; mix-blend-mode: multiply;">
            </div>
            <div style="margin-top: 5px;">Відпустив (підпис, ФОП Пастушок)</div>
          </div>
          <div style="text-align: center; font-size: 10px; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 35px;"></div>
            <div style="margin-top: 5px;">Отримав (підпис покупця)</div>
          </div>
        </div>

        <script>
          window.onload = () => setTimeout(() => window.print(), 600);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;
}

function generateTTNHTML(data) {
  const dateObj = data.date ? new Date(data.date) : new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const monthNames = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  const month = monthNames[dateObj.getMonth()];
  const year = String(dateObj.getFullYear()).slice(-2);

  const selectedItems = data.selectedItems || [];
  let totalQty = 0;
  const itemsHTML = selectedItems.map((item, i) => {
    const qty = parseFloat(item.editedQuantity || item.quantity || 1);
    totalQty += qty;
    const name = item.editedName || item.name || item.productName || item.product?.name || '';
    const unit = item.unit || item.product?.unit || 'шт';
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
            .page-break { page-break-after: always; }
          }
          * { box-sizing: border-box; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 0; line-height: 1.25; }
          .container { width: 280mm; margin: 0 auto; position: relative; }
          .top-right-appendix { position: absolute; top: 0; right: 0; text-align: right; font-size: 9.5px; line-height: 1.25; }
          .header-center { text-align: center; margin-top: 25px; margin-bottom: 22px; }
          .main-title { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
          .form-number { position: absolute; top: 60px; right: 0; font-weight: bold; font-size: 11px; }
          .date-line { font-size: 13px; margin-top: 6px; font-weight: bold; }
          .date-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 35px; text-align: center; }
          .date-month-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 100px; text-align: center; }
          .row { display: flex; align-items: flex-end; margin-bottom: 18px; width: 100%; }
          .field-wrap { display: flex; flex-direction: column; flex-grow: 1; margin-right: 15px; }
          .field-wrap:last-child { margin-right: 0; }
          .field-top { display: flex; align-items: flex-end; }
          .label { white-space: nowrap; margin-right: 6px; font-weight: bold; font-size: 11px; }
          .value { border-bottom: 1px solid #000; flex-grow: 1; text-align: center; min-height: 18px; font-family: Arial, sans-serif; font-size: 11.5px; padding: 0 4px; line-height: 1.2; }
          .subtext { font-size: 8px; text-align: center; margin-top: 2px; line-height: 1.1; }
          .table-title { text-align: center; font-weight: bold; text-transform: uppercase; margin: 12px 0 6px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9px; margin-bottom: 8px; }
          th, td { border: 1px solid #000; padding: 3px 2px; text-align: center; vertical-align: middle; }
          th { font-family: 'Times New Roman', Times, serif; font-size: 8.5px; font-weight: normal; }
          .signatures { display: flex; justify-content: space-between; margin-top: 12px; }
          .sig-block { width: 48%; text-align: left; position: relative; }
          .sig-line { border-bottom: 1px solid #000; height: 16px; margin-top: 12px; position: relative; }
          .field-subtext { font-size: 7px; text-align: center; margin-top: 1px; }
          .page-break { page-break-after: always; }
          .cso-seal-overlay { position: absolute; width: 130px; top: -55px; left: 50%; transform: translateX(-50%); pointer-events: none; mix-blend-mode: multiply; opacity: 0.92; z-index: 10; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="top-right-appendix">
            Додаток 7<br>
            до Правил перевезень вантажів автомобільним транспортом в Україні<br>
            (пункт 11.1 глави 11)
          </div>
          
          <div class="header-center">
            <div class="main-title">ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА</div>
            <div class="date-line">
              N _________ " <span class="date-gap">${day}</span> " <span class="date-month-gap">${month}</span> 20<span class="date-gap">${year}</span> року
            </div>
          </div>
          <div class="form-number">Форма № 1-ТН</div>
          
          <div class="row" style="width: 350px; margin-bottom: 10px;">
            <div class="field-wrap">
              <div class="field-top">
                <span class="label">Місце складання</span>
                <span class="value">${data.place || ''}</span>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap" style="flex: 2;">
              <div class="field-top"><span class="label">Автомобіль</span><span class="value">${data.car || ''}</span></div>
              <div class="subtext">(марка, модель, тип, реєстраційний номер)</div>
            </div>
            <div class="field-wrap" style="flex: 2;">
              <div class="field-top"><span class="label">Причіп/напівпричіп</span><span class="value">${data.trailer || ''}</span></div>
              <div class="subtext">(марка, модель, тип, реєстраційний номер)</div>
            </div>
            <div class="field-wrap" style="flex: 1.2;">
              <div class="field-top"><span class="label">Вид перевезень</span><span class="value">${data.transportType || ''}</span></div>
            </div>
          </div>

          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Місце де зберігається автомобіль*</span><span class="value">${data.carStoragePlace || ''}</span></div>
              <div class="subtext">(адреса місцезнаходження автомобільного перевізника, його структурного підрозділу або філії, де зберігається транспортний засіб)</div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap" style="flex: 2;">
              <div class="field-top"><span class="label">Автомобільний перевізник</span><span class="value">${data.carrier || ''}</span></div>
              <div class="subtext">(повне найменування / ПІБ, код ЄДРПОУ / РНОКПП)</div>
            </div>
            <div class="field-wrap" style="flex: 1.2;">
              <div class="field-top"><span class="label">Водій</span><span class="value">${data.driver || ''}</span></div>
              <div class="subtext">(ПІБ, номер посвідчення водія)</div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажовідправник</span><span class="value">${data.sender || ''}</span></div>
              <div class="subtext">(повне найменування / ПІБ, ЄДРПОУ / РНОКПП)</div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажоодержувач</span><span class="value">${data.receiver || ''}</span></div>
              <div class="subtext">(повне найменування / ПІБ, ЄДРПОУ / РНОКПП)</div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">Пункт навантаження</span><span class="value">${data.loadPoint || ''}</span></div>
              <div class="subtext">(місцезнаходження)</div>
            </div>
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">Пункт розвантаження</span><span class="value">${data.unloadPoint || ''}</span></div>
              <div class="subtext">(місцезнаходження)</div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">кількість місць</span><span class="value">${totalQty}</span></div>
              <div class="subtext">(словами)</div>
            </div>
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">масою брутто, т</span><span class="value">${data.grossWeightWords || ''}</span></div>
              <div class="subtext">(словами)</div>
            </div>
            <div class="field-wrap" style="flex: 1.5;">
              <div class="field-top"><span class="label">отримав водій/експедитор</span><span class="value">${data.driver || ''}</span></div>
              <div class="subtext">(ПІБ, посада, підпис)</div>
            </div>
          </div>
          
          <div class="row" style="margin-top: 5px;">
            <span class="label" style="font-size: 8.5px;">Відомості про транспортний засіб</span>
            <div class="field-wrap" style="width: 75px;"><div class="value">${data.carLength || ''}</div><div class="subtext">(довжина, м)</div></div>
            <div class="field-wrap" style="width: 75px;"><div class="value">${data.carWidth || ''}</div><div class="subtext">(ширина, м)</div></div>
            <div class="field-wrap" style="width: 75px;"><div class="value">${data.carHeight || ''}</div><div class="subtext">(висота, м)</div></div>
            <div class="field-wrap" style="flex: 1;"><div class="value">${data.totalWeightWithCargo || ''}</div><div class="subtext">(загальна вага з вантажем, т)</div></div>
          </div>
          
          <div class="row">
            <span class="label">Усього відпущено на загальну суму</span>
            <div class="field-wrap" style="flex: 3;"><div class="value">${data.totalSumWords || ''}</div><div class="subtext">(словами)</div></div>
            <span class="label">у тому числі ПДВ</span>
            <div class="field-wrap" style="flex: 1;"><div class="value">${data.vatSum || ''}</div></div>
            <span class="label">грн.</span>
          </div>
          
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Супровідні документи на вантаж</span><span class="value">${data.additionalDocs || ''}</span></div>
            </div>
          </div>

          <div class="page-break"></div>

          <div style="text-align: right; font-weight: bold; font-size: 9px; margin-bottom: 4px;">Зворотній бік</div>

          <div class="table-title" style="margin-top: 0;">ВІДОМОСТІ ПРО ВАНТАЖ</div>
          <table>
            <thead>
              <tr>
                <th style="width: 3%">№<br>з/п</th>
                <th style="width: 25%">Найменування вантажу</th>
                <th style="width: 10%">Ідентифікаційний номер</th>
                <th style="width: 6%">Вид</th>
                <th style="width: 8%">Температурний режим</th>
                <th style="width: 7%">Одиниця вимірювання</th>
                <th style="width: 6%">Кількість місць</th>
                <th style="width: 8%">Ціна без ПДВ</th>
                <th style="width: 9%">Загальна сума</th>
                <th style="width: 6%">Вид пакування</th>
                <th style="width: 8%">Документи</th>
                <th style="width: 5%">Маса брутто, т</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="text-align: left; font-weight: bold;">Усього:</td>
                <td></td>
                <td style="font-weight: bold;">${totalQty}</td>
                <td></td>
                <td style="font-weight: bold;">0,00</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div class="signatures" style="margin-top: 15px;">
            <div class="sig-block">
              <div style="font-weight: bold; text-align: left; margin-bottom: 2px;">Здав (відповідальна особа вантажовідправника)</div>
              <div class="sig-line" style="margin-top: 15px; position: relative;">
                ${data.sealType !== 'none' ? `<img src="${SELLERS.fop_pastushok.stamp}" class="cso-seal-overlay">` : ''}
              </div>
              <div class="field-subtext">(ПІБ, посада, підпис)</div>
            </div>
            <div class="sig-block">
              <div style="font-weight: bold; text-align: left; margin-bottom: 2px;">Прийняв (відповідальна особа вантажоодержувача)</div>
              <div class="sig-line" style="margin-top: 15px;"></div>
              <div class="field-subtext">(ПІБ, посада, підпис)</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = () => setTimeout(() => window.print(), 600);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;
}

function generateWarrantyHTML(issue, data) {
  const dateStr = data.date ? data.date.split('-').reverse().join('.') : new Date().toLocaleDateString('uk-UA');
  
  const itemsHTML = (data.selectedItems || []).map((item, i) => {
    const serials = item.serialNumbers && item.serialNumbers.length > 0 
      ? item.serialNumbers.map(sn => sn || '_________________').join('<br>')
      : '';
    
    return `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align: left;">${item.editedName || item.name || item.productName || item.product?.name || 'Без назви'}</td>
        <td>${item.editedQuantity || item.quantity || 1}</td>
        <td style="word-break: break-all; line-height: 1.6;">${serials}</td>
        <td>${item.warrantyPeriod || ''}</td>
      </tr>
    `;
  }).join('');

  const seller = SELLERS.fop_pastushok;

  return `
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Гарантійний талон - Друк</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #000; background: #fff; margin: 0; padding: 0; line-height: 1.4; }
          .container { width: 180mm; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 25px; }
          .title { font-size: 20px; font-weight: bold; text-transform: uppercase; }
          .date-line { font-size: 16px; margin-top: 5px; }
          .info-block { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 5px; }
          .info-label { font-weight: bold; min-width: 150px; }
          .info-value { border-bottom: 1px solid #000; flex-grow: 1; padding-left: 5px; font-size: 15px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; }
          th { font-family: 'Times New Roman', Times, serif; font-size: 14px; font-weight: bold; background-color: #f5f5f5; }
          .terms-title { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 8px; text-transform: uppercase; }
          .terms-content { font-size: 11.5px; text-align: justify; line-height: 1.2; }
          .terms-content p { margin: 0 0 4px 0; }
          .terms-content ol { margin: 0 0 4px 0; padding-left: 18px; }
          .terms-content li { margin-bottom: 2px; }
          .attention { font-weight: bold; margin-top: 8px; font-size: 11px; }
          .agreement-text { margin-top: 15px; font-weight: bold; font-style: italic; text-align: justify; font-size: 12px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
          .sig-block { width: 45%; }
          .sig-line { border-bottom: 1px solid #000; height: 25px; margin-top: 5px; }
          .sig-subtext { font-size: 10px; text-align: center; margin-top: 2px; }
          .stamp-box { width: 90px; height: 90px; border: 1px dashed #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 12px; margin: -30px auto 0 auto; position: relative; }
          .cso-seal-overlay { position: absolute; width: 145px; bottom: 0px; left: -20px; pointer-events: none; mix-blend-mode: multiply; opacity: 0.94; z-index: 10; }
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
              <span class="info-value">${data.seller || seller.fullName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Адреса продавця:</span>
              <span class="info-value">${data.sellerAddress || seller.address}</span>
            </div>
            <div class="info-row" style="margin-top: 10px;">
              <span class="info-label">Покупець (ПІБ):</span>
              <span class="info-value">${data.buyer || ''}</span>
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
              <li>Гарантійне обслуговування здійснюється лише при наявності правильно та чітко заповненого гарантійного талону.</li>
              <li>Гарантійне обслуговування не здійснюється у випадку:
                <ul style="list-style-type: none; padding-left: 10px; margin: 4px 0;">
                  <li>5.1. Відсутності гарантійного талону чи документів про купівлю товару.</li>
                  <li>5.2. Недотримання робочих параметрів, вказаних у технічному паспорті.</li>
                  <li>5.3. Наявності механічних пошкоджень електронних компонентів пристрою.</li>
                  <li>5.4. Проникнення сторонніх предметів всередину пристрою.</li>
                </ul>
              </li>
              <li>На товар, у якого вийшов гарантійний термін, гарантійне обслуговування не розповсюджується.</li>
            </ol>
            <p class="attention">Зверніть увагу! При самостійному підключенні та монтажі, споживач зобов’язаний технічно проконсультуватися з постачальником, строго дотримуючись його вказівок. Надати монтажну схему з дотриманням технічних характеристик, вказаних в технічному паспорті на виріб. ${data.notes ? '<br><br><strong>Примітки:</strong> ' + data.notes : ''}</p>
          </div>

          <div class="agreement-text">
            Новий виріб в повному комплекті, з інструкцією по експлуатацією отримав. З умовами гарантійного обслуговування ознайомлений та згідний.
          </div>

          <div class="signatures">
            <div class="sig-block">
              <div><strong>Продавець:</strong></div>
              <div class="sig-line"></div>
              <div class="sig-subtext">(підпис продавця)</div>
              <div class="stamp-box">
                М.П.
                ${data.sealType !== 'none' ? `<img src="${seller.stamp}" class="cso-seal-overlay" style="display:block">` : ''}
              </div>
            </div>
            <div class="sig-block">
              <div><strong>Покупець:</strong></div>
              <div class="sig-line"></div>
              <div class="sig-subtext">(підпис клієнта)</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = () => setTimeout(() => window.print(), 600);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;
}

function generateInvoiceHTML(issue, data) {
  const accentColor = '#F59E0B';
  const seller = SELLERS.fop_pastushok;
  const dateStr = data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('uk-UA') : (issue.date ? new Date(issue.date).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA'));
  const invoiceNumber = data.invoiceNumber || `РФ-${Date.now().toString().slice(-6)}`;
  const withStamp = data.includeStamp !== undefined ? data.includeStamp : true;

  const items = issue.items || [];
  let totalSum = 0;

  const itemsHTML = items.map((item, i) => {
    const itemName = item.name || item.productName || item.product?.name || 'Без назви';
    const itemUnit = item.unit || item.product?.unit || 'шт';
    const qty = parseFloat(item.quantity || 1);
    const price = parseFloat(item.price || 0);
    const sum = qty * price;
    totalSum += sum;

    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${i + 1}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px;"><strong>${itemName}</strong></td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${itemUnit}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${qty}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${price.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; font-weight: 600;">${sum.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const currencySymbol = issue.currency === 'USD' ? '$' : (issue.currency === 'EUR' ? '€' : 'грн.');

  return `
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Рахунок-фактура ${invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1F2937; padding: 40px 50px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .doc-title { color: ${accentColor}; font-weight: 700; font-size: 18px; letter-spacing: 1px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #F9FAFB; padding: 10px; text-align: center; border: 1px solid #E5E7EB; font-size: 9px; color: #4B5563; text-transform: uppercase; }
          .total-row td { background-color: #FFFDF2; font-weight: 700; color: ${accentColor}; border: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${seller.logo}" height="45">
          <div class="doc-title">РАХУНОК-ФАКТУРА</div>
        </div>
        <hr style="height: 3px; background-color: ${accentColor}; border: none; margin: 10px 0 20px;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
          <div style="font-size: 11px; line-height: 1.6;">
            <div style="text-transform: uppercase; font-size: 9px; color: #9CA3AF; font-weight: 600; margin-bottom: 5px;">Постачальник</div>
            <strong>${seller.fullName}</strong><br>
            ЄДРПОУ/РНОКПП: ${seller.taxId}<br>
            IBAN: ${seller.iban}<br>
            Банк: ${seller.bank}<br>
            Адреса: ${seller.address}
          </div>
          <div style="font-size: 11px; line-height: 1.6;">
            <div style="text-transform: uppercase; font-size: 9px; color: #9CA3AF; font-weight: 600; margin-bottom: 5px;">Покупець</div>
            <strong>${data.buyerName || issue.buyerName || '____________________'}</strong><br>
            ${data.buyerTaxId ? `<strong>ЄДРПОУ / ІПН:</strong> ${data.buyerTaxId}<br>` : ''}
            ${data.buyerIban ? `<strong>р/р (IBAN):</strong> ${data.buyerIban}<br>` : ''}
            ${data.buyerBank ? `<strong>Банк:</strong> ${data.buyerBank}<br>` : ''}
            ${data.buyerPhone ? `Тел: ${data.buyerPhone}<br>` : ''}
            ${data.buyerAddress ? `Адреса: ${data.buyerAddress}` : ''}
          </div>
        </div>

        <div style="font-size: 14px; font-weight: 700; margin-bottom: 20px; text-align: center;">
          Рахунок-фактура № ${invoiceNumber} від ${dateStr}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px">№</th>
              <th style="text-align: left;">Найменування</th>
              <th style="width: 40px">Од.</th>
              <th style="width: 40px">К-сть</th>
              <th style="width: 85px">Ціна (${currencySymbol})</th>
              <th style="width: 85px">Сума (${currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            <tr class="total-row">
              <td colspan="4" style="border: none; background: none;"></td>
              <td style="padding: 10px; text-align: right; text-transform: uppercase; font-size: 11px;">Разом:</td>
              <td style="padding: 10px; text-align: center; font-size: 11px; white-space: nowrap;">${totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ${currencySymbol}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 70px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="font-size: 10px; text-align: center; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 30px; position: relative;">
              ${(withStamp && seller.stamp) ? `<img src="${seller.stamp}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -45%); width: 135px; opacity: 0.95; pointer-events: none; mix-blend-mode: multiply;">` : ''}
            </div>
            <div style="margin-top: 5px;">Виписав (ПІБ, підпис)</div>
          </div>
          <div style="font-size: 10px; text-align: center; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 30px;"></div>
            <div style="margin-top: 5px;">Отримав (ПІБ, підпис)</div>
          </div>
        </div>

        <script>
          window.onload = () => setTimeout(() => window.print(), 600);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;
}
