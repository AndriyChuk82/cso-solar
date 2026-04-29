import { Proposal } from '../types';
import { formatCurrency, convertCurrency } from './currency';
import { formatDate } from './calculations';
import { TTNData } from '../components/TTNModal';
import { WarrantyData } from '../components/WarrantyModal';
import { SELLERS } from '../config';

/**
 * Друк рахунку-фактури
 */
export function printInvoice(proposal: Proposal) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateInvoiceHTML(proposal);
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Друк видаткової накладної
 */
export function printDeliveryNote(proposal: Proposal) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateDeliveryNoteHTML(proposal);
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Друк ТТН з даними з модального вікна
 */
export function printTTNWithData(proposal: Proposal, data: TTNData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateTTNHTMLWithData(proposal, data);
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Друк гарантійного талону з даними з модального вікна
 */
export function printWarrantyWithData(proposal: Proposal, data: WarrantyData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateWarrantyHTMLWithData(proposal, data);
  printWindow.document.write(html);
  printWindow.document.close();
}

function generateInvoiceHTML(proposal: Proposal): string {
  const accentColor = '#F59E0B';
  const currencySymbol = proposal.currency === 'UAH' ? '₴' : (proposal.currency === 'EUR' ? '€' : '$');
  const dateStr = proposal.date ? new Date(proposal.date).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA');
  const invoiceNumber = (proposal.number || '').replace('КП-', '');
  const seller = proposal.seller || SELLERS.tov_cso;

  const rates = {
    USD: proposal.rates?.usdToUah || 41.5,
    EUR: proposal.rates?.eurToUah || 51.0,
    UAH: 1
  };

  const convert = (amount: number) => {
    // Внутрішні розрахунки завжди в USD
    return convertCurrency(amount, 'USD', proposal.currency, rates);
  };

  const itemsHTML = (proposal.items || []).map((item, i) => {
    const price = convert(item.price || 0);
    const sum = price * (item.quantity || 0);
    const itemName = item.name || item.product?.name || 'Без назви';
    const itemUnit = item.unit || item.product?.unit || 'шт.';
    
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${i + 1}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px;">
          <strong>${itemName}</strong>
        </td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${itemUnit}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${item.quantity || 0}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap;">${price.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap; font-weight: 600;">${sum.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const totalConverted = convert(proposal.total);

  return `
    <html>
      <head>
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
          <img src="https://i.ibb.co/32JD4dc/logo.png" height="45">
          <div class="doc-title">РАХУНОК-ФАКТУРА</div>
        </div>
        <hr style="height: 3px; background-color: ${accentColor}; border: none; margin: 10px 0 20px;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
          <div style="font-size: 11px;">
            <div style="text-transform: uppercase; font-size: 9px; color: #9CA3AF; font-weight: 600; margin-bottom: 5px;">Постачальник</div>
            <strong>${seller.fullName}</strong><br>
            ЄДРПОУ: ${seller.taxId}<br>
            IBAN: ${seller.iban}<br>
            Банк: ${seller.bank}<br>
            Адреса: ${seller.address}
          </div>
          <div style="font-size: 11px;">
            <div style="text-transform: uppercase; font-size: 9px; color: #9CA3AF; font-weight: 600; margin-bottom: 5px;">Покупець</div>
            <strong>${proposal.clientName || '____________________'}</strong><br>
            Тел: ${proposal.clientPhone || '-'}<br>
            Email: ${proposal.clientEmail || '-'}<br>
            Адреса: ${proposal.clientAddress || '-'}
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
              <td style="padding: 10px; text-align: center; font-size: 13px;">${currencySymbol} ${totalConverted.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="font-size: 10px; text-align: center; width: 200px;">
            <div style="border-bottom: 1px solid #1F2937; height: 30px;"></div>
            Виписав (ПІБ, підпис)
          </div>
          <div style="font-size: 10px; text-align: center; width: 200px;">
            <div style="border-bottom: 1px solid #1F2937; height: 30px;"></div>
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
}

function generateDeliveryNoteHTML(proposal: Proposal): string {
  const accentColor = '#F59E0B';
  const dateStr = proposal.date ? new Date(proposal.date).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA');
  const dnNumber = (proposal.number || '').replace('КП-', 'ВН-');
  const seller = proposal.seller || SELLERS.tov_cso;

  const itemsHTML = (proposal.items || []).map((item, i) => {
    const itemName = item.name || item.product?.name || 'Без назви';
    const itemUnit = item.unit || item.product?.unit || 'шт.';
    
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${i + 1}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px;">
          <strong>${itemName}</strong>
        </td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${itemUnit}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${item.quantity || 0}</td>
      </tr>
    `;
  }).join('');

  return `
    <html>
      <head>
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
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Постачальник:</span><br><strong>${seller.fullName}</strong></div>
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Покупець:</span><br><strong>${proposal.clientName || '____________________'}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px">№</th>
              <th style="text-align: left;">Товар</th>
              <th style="width: 60px">Од.</th>
              <th style="width: 60px">К-сть</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="text-align: center; font-size: 10px; width: 200px;">
            <div style="border-bottom: 1px solid #000; height: 35px;"></div>
            Відпустив
          </div>
          <div style="text-align: center; font-size: 10px; width: 200px;">
            <div style="border-bottom: 1px solid #000; height: 35px;"></div>
            Отримав
          </div>
        </div>

        <script>
          window.onload = () => setTimeout(() => window.print(), 800);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;
}

function generateTTNHTMLWithData(proposal: Proposal, data: TTNData): string {
  const dateStr = data.date ? new Date(data.date) : new Date();
  const day = dateStr.getDate().toString().padStart(2, '0');
  const month = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"][dateStr.getMonth()];
  const year = dateStr.getFullYear().toString().substring(2);
  
  const itemsHTML = (data.selectedItems || []).map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="text-align: left;">${item.editedName || item.name || item.product?.name || 'Без назви'}</td>
      <td>${item.unit || item.product?.unit || 'шт.'}</td>
      <td>${item.editedQuantity || item.quantity || 0}</td>
      <td style="color:#fff">_</td>
      <td style="color:#fff">_</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  `).join('');

  const totalQty = data.selectedItems.reduce((acc, item) => acc + (item.editedQuantity || item.quantity), 0);

  return `
    <html>
      <head>
        <title>ТТН ${proposal.number} - Друк</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 0; line-height: 1.1; }
          .container { width: 270mm; margin: 0 auto; position: relative; }
          
          .top-right-appendix { position: absolute; top: 0; right: 0; text-align: right; font-size: 10px; line-height: 1.2; }
          .top-right-appendix a { text-decoration: underline; color: blue; }
          
          .header-center { text-align: center; margin-top: 30px; margin-bottom: 20px; }
          .main-title { font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .form-number { position: absolute; top: 55px; right: 0; font-weight: bold; }
          
          .date-line { font-size: 13px; margin-top: 5px; }
          .date-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 40px; text-align: center; }
          .date-month-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 100px; text-align: center; }
          
          .row { display: flex; align-items: flex-end; margin-bottom: 12px; }
          .field-wrap { display: flex; flex-direction: column; flex-grow: 1; margin-right: 15px; }
          .field-wrap:last-child { margin-right: 0; }
          .field-top { display: flex; align-items: flex-end; }
          .label { white-space: nowrap; margin-right: 5px; }
          .value { border-bottom: 1px solid #000; flex-grow: 1; text-align: center; min-height: 14px; font-family: Arial, sans-serif; font-size: 11px; padding: 0 4px; }
          .subtext { font-size: 7.5px; text-align: center; margin-top: 1px; line-height: 1; }
          
          .table-title { text-align: center; font-weight: bold; text-transform: uppercase; margin: 15px 0 8px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10px; margin-bottom: 10px; }
          th, td { border: 1px solid #000; padding: 3px; text-align: center; vertical-align: middle; }
          th { font-family: 'Times New Roman', Times, serif; font-size: 9.5px; font-weight: normal; }
          
          .signatures { display: flex; justify-content: space-between; margin-top: 15px; }
          .sig-block { width: 45%; text-align: center; position: relative; }
          .sig-line { border-bottom: 1px solid #000; height: 18px; margin-top: 5px; }
          .page-break { page-break-after: always; }
          
          .info-box { border: 1px solid #000; padding: 5px; margin-bottom: 15px; }
          .stamp-box { display: inline-block; position: relative; width: 0; height: 0; vertical-align: top; }
          .cso-seal-overlay { position: absolute; width: 140px; top: 10px; left: 50%; transform: translateX(-50%); pointer-events: none; mix-blend-mode: multiply; opacity: 0.9; z-index: 10; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Page 1 Overlay Info -->
          <div class="top-right-appendix">
            <a href="#">Додаток 7</a><br>
            до <a href="#">Правил перевезень вантажів автомобільним транспортом в Україні</a><br>
            (пункт 11.1 глави 11)
          </div>
          
          <div class="header-center">
            <div class="main-title">ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА</div>
            <div class="date-line">
              № « <span class="date-gap">${day}</span> » <span class="date-month-gap">${month}</span> 20<span class="date-gap">${year}</span> року
            </div>
          </div>
          <div class="form-number">Форма № 1-ТН</div>
          
          <div class="row" style="width: 400px; margin-bottom: 25px;">
            <div class="field-wrap">
              <div class="field-top">
                <span class="label">Місце складання</span>
                <span class="value">${data.place}</span>
              </div>
            </div>
          </div>
          
          <!-- Line 1: Car, Trailer, TransportType -->
          <div class="row">
            <div class="field-wrap" style="flex: 2;">
              <div class="field-top"><span class="label">Автомобіль</span><span class="value">${data.car || ''}</span></div>
              <div class="subtext">(марка, модель, тип, реєстраційний номер)</div>
            </div>
            <div class="field-wrap" style="flex: 2;">
              <div class="field-top"><span class="label">Причіп/напівпричіп</span><span class="value">${data.trailer || ''}</span></div>
              <div class="subtext">(марка, модель, тип, реєстраційний номер)</div>
            </div>
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">Вид перевезень</span><span class="value">${data.transportType}</span></div>
            </div>
          </div>
          
          <!-- Line 2: Carrier, Driver -->
          <div class="row">
            <div class="field-wrap" style="flex: 2;">
              <div class="field-top"><span class="label">Автомобільний перевізник</span><span class="value">${data.carrier || ''}</span></div>
              <div class="subtext">(повне найменування (прізвище (за наявності), власне ім'я та по батькові (за наявності), унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності), код платника податків...)</div>
            </div>
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">Водій</span><span class="value">${data.driver || ''}</span></div>
              <div class="subtext">(прізвище (за наявності), власне ім'я та по батькові (за наявності), унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності), номер посвідчення водія)</div>
            </div>
          </div>
          
          <!-- Line 3: Sender -->
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажовідправник</span><span class="value">${data.sender || ''}</span></div>
              <div class="subtext">(повне найменування / ПІБ, унікальний номер запису в ЄДДР (за наявності), код платника податків згідно з ЄДРПОУ або податковий номер)</div>
            </div>
          </div>
          
          <!-- Line 4: Receiver -->
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажоодержувач</span><span class="value">${data.receiver || ''}</span></div>
              <div class="subtext">(повне найменування / ПІБ, унікальний номер запису в ЄДДР (за наявності), код платника податків згідно з ЄДРПОУ або податковий номер)</div>
            </div>
          </div>
          
          <!-- Line 5: Load/Unload Points -->
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Пункт навантаження</span><span class="value">${data.loadPoint || ''}</span></div>
              <div class="subtext">(місцезнаходження)</div>
            </div>
            <div class="field-wrap">
              <div class="field-top"><span class="label">Пункт розвантаження</span><span class="value">${data.unloadPoint || ''}</span></div>
              <div class="subtext">(місцезнаходження)</div>
            </div>
          </div>
          
          <!-- Line 6: Qty places, weight, receiver driver -->
          <div class="row">
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">кількість місць</span><span class="value">${totalQty}</span></div>
              <div class="subtext">(словами)</div>
            </div>
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">масою брутто, т</span><span class="value"></span></div>
              <div class="subtext">(словами)</div>
            </div>
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">отримав водій/експедитор</span><span class="value">${data.driver || ''}</span></div>
              <div class="subtext">(прізвище (за наявності), власне ім'я та по батькові (за наявності), унікальний номер запису в ЄДДР (за наявності), посада, підпис)</div>
            </div>
          </div>
          
          <!-- Line 7: Vehicle Data -->
          <div class="row" style="margin-top: 10px;">
            <span class="label" style="font-size: 9px;">Відомості про транспортний засіб (автомобіль/автопоїзд/комбінований транспортний засіб)</span>
            <div class="field-wrap" style="width: 80px;"><div class="value">${data.carLength}</div><div class="subtext">(довжина, м)</div></div>
            <div class="field-wrap" style="width: 80px;"><div class="value">${data.carWidth}</div><div class="subtext">(ширина, м)</div></div>
            <div class="field-wrap" style="width: 80px;"><div class="value">${data.carHeight}</div><div class="subtext">(висота, м)</div></div>
            <div class="field-wrap"><div class="value">${data.totalWeightWithCargo}</div><div class="subtext">(загальна вага/маса з вантажем та маса брутто, т)</div></div>
          </div>
          
          <!-- Line 8: Total Sum -->
          <div class="row">
            <span class="label">Усього відпущено на загальну суму</span>
            <div class="field-wrap" style="flex: 3;"><div class="value">${data.totalSumWords}</div><div class="subtext">(словами, з урахуванням ПДВ)</div></div>
            <span class="label">, у тому числі ПДВ</span>
            <div class="field-wrap" style="flex: 1;"><div class="value">${data.vatSum}</div></div>
          </div>
          
          <!-- Line 9: Docs -->
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Супровідні документи на вантаж</span><span class="value">${data.additionalDocs}</span></div>
            </div>
          </div>

          <div class="page-break"></div>

          <!-- Page 2 -->
          <div class="table-title">ВІДОМОСТІ ПРО ВАНТАЖ</div>
          <table>
            <thead>
              <tr>
                <th style="width: 4%">№ з/п</th>
                <th style="width: 35%">Найменування вантажу</th>
                <th style="width: 8%">Одиниця виміру</th>
                <th style="width: 8%">Кількість місць</th>
                <th style="width: 10%">Ціна без ПДВ, грн</th>
                <th style="width: 10%">Загальна сума з ПДВ, грн</th>
                <th style="width: 8%">Вид пакування</th>
                <th style="width: 10%">Документи з вантажем</th>
                <th style="width: 7%">Маса брутто, т</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: left; font-weight: bold;">Усього:</td>
                <td style="font-weight: bold;">${totalQty}</td>
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
            </tfoot>
          </table>

          <div class="signatures">
            <div class="sig-block">
              Здав (відповідальна особа вантажовідправника)
              <div class="sig-line"></div>
              ${data.sealType !== 'none' ? `<img src="${window.location.origin}/proposals/doc/${data.sealType === 'cso' ? 'sign_cso.png' : 'fop_past.jpg'}" class="cso-seal-overlay">` : ''}
              <div class="field-subtext">(ПІБ, посада, підпис)</div>
            </div>
            <div class="sig-block">
              Прийняв (відповідальна особа вантажоодержувача)
              <div class="sig-line"></div>
              <div class="field-subtext">(ПІБ, посада, підпис)</div>
            </div>
          </div>

          <div class="table-title" style="margin-top: 25px;">ВАНТАЖНО-РОЗВАНТАЖУВАЛЬНІ ОПЕРАЦІЇ</div>
          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width: 25%">Операція</th>
                <th rowspan="2" style="width: 15%">Маса брутто, т</th>
                <th colspan="3">Час (год хв)</th>
                <th rowspan="2" style="width: 30%">Підпис відповідальної особи</th>
              </tr>
              <tr>
                <th style="width: 10%">прибуття</th>
                <th style="width: 10%">вибуття</th>
                <th style="width: 10%">простою</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: left;">Завантаження</td>
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
              <tr>
                <td style="text-align: left;">Розвантаження</td>
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <script>
          window.onload = () => setTimeout(() => window.print(), 800);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;
}





function generateWarrantyHTMLWithData(proposal: Proposal, data: WarrantyData): string {
  const dateStr = data.date ? data.date.split('-').reverse().join('.') : new Date().toLocaleDateString('uk-UA');
  
  const itemsHTML = (data.selectedItems || []).map((item, i) => {
    const serials = item.serialNumbers && item.serialNumbers.length > 0 
      ? item.serialNumbers.map(sn => sn || '_________________').join('<br>')
      : '';
    
    return `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align: left;">${item.editedName || item.name || item.product?.name || 'Без назви'}</td>
        <td>${item.editedQuantity || item.quantity || 0}</td>
        <td style="word-break: break-all; line-height: 1.6;">${serials}</td>
        <td>${item.warrantyPeriod || ''}</td>
      </tr>
    `;
  }).join('');

  return `
    <html>
      <head>
        <title>Гарантійний талон ${proposal.number} - Друк</title>
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
              <span class="info-value">${data.seller || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Адреса продавця:</span>
              <span class="info-value">${data.sellerAddress || ''}</span>
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
            <p>Придбаний Вами виріб повністю відповідає характеристикам, вказаних у технічному паспорті. Вказані характеристики гарантуються заводом-виробником. Пристрій прослужить Вам довго та якісно при дотриманні правил експлуатації та норм, вказаних в посібнику користувача. При виникненні необхідності гарантійного обслуговування приладу, просимо Вас звертатися до авторизованого сервісного центру постачальника, імпортера або магазину, де була здійснена покупка (адресу сервісних центрів можна дізнатися на офіційному сайті виробника товару).</p>
            <ol>
              <li>Гарантійне обслуговування передбачає безкоштовний ремонт, або заміну комплектуючих приладу протягом гарантійного терміну.</li>
              <li>Гарантійний ремонт здійснюється авторизованим сервісним центром.</li>
              <li>Рішення питання доцільності ремонту, або заміни непрацюючих частин виробу, приймається авторизованим сервісним центром.</li>
              <li>Гарантійне обслуговування здійснюється лише при наявності правильно та чітко заповненого гарантійного талону. В гаранійному талоні повинно бути вказано: Виробник, модель, дата продажу та поставлена чітка печатка продавця з його реквізитами.</li>
              <li>Гарантійне обслуговування не здійснюється у випадку:
                <ul style="list-style-type: none; padding-left: 10px; margin: 4px 0;">
                  <li>5.1. Відсутності гарантійного талону чи інших документів, що засвідчують купівлю товару з відповідними печатками, реквізитами продавця та датою продажу.</li>
                  <li>5.2. Недотримання робочих параметрів, вказаних у технічному паспорті на придбаний товар.</li>
                  <li>5.3. Наявності механічних пошкоджень, що могли вивести з ладу внутрішні електронні компоненти пристрою.</li>
                  <li>5.4. Проникнення сторонніх предметів в середину пристрою.</li>
                </ul>
              </li>
              <li>На товар, у якого вийшов гарантійний термін, гарантійне обслуговування не розповсюджується.</li>
            </ol>
            <p class="attention">Зверніть увагу! При самостійному підключенні та монтажі, споживач зобов’язаний технічно проконсультуватися з постачальником, строго дотримуючись його вказівок. Надати монтажну схему з дотриманням технічних характеристик, вказаних в технічному паспорті на виріб. Споживач зобов’язаний надати фото підтвердження придбаного та вмонтованого обладнання з відображенням усіх потрібних робочих характеристик. При недотриманні вище зазначених вказівок та відсутності фото підтвердження вмонтованого обладнання, гарантія на товар не розповсюджується. ${data.notes ? '<br><br><strong>Примітки:</strong> ' + data.notes : ''}</p>
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
                ${data.sealType !== 'none' ? `<img src="${window.location.origin}/proposals/doc/${data.sealType === 'cso' ? 'sign_cso.png' : 'fop_past.jpg'}" class="cso-seal-overlay" style="display:block">` : ''}
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
          window.onload = () => setTimeout(() => window.print(), 800);
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;
}



