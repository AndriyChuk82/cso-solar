import { Proposal } from '../types';
import { formatCurrency, convertCurrency } from './currency';
import { formatDate } from './calculations';
import { TTNData } from '../components/TTNModal';
import { WarrantyData } from '../components/WarrantyModal';
import { InvoiceData } from '../components/InvoiceModal';
import { SELLERS } from '../config';
import { numberToWords } from './numberToWords';

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
 * Друк рахунку-фактури з даними контрагента з модального вікна
 */
export function printInvoiceWithData(proposal: Proposal, data: InvoiceData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateInvoiceHTML(proposal, data);
  printWindow.document.write(html);
  printWindow.document.close();
}

export interface DeliveryNoteData {
  buyerName: string;
  dnNumber: string;
  dnDate: string;
  showPrices: boolean;
  includeStamp: boolean;
}

/**
 * Друк видаткової накладної з налаштуваннями
 */
export function printDeliveryNoteWithData(proposal: Proposal, data: DeliveryNoteData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateDeliveryNoteHTML(proposal, data);
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Друк видаткової накладної (стандартний)
 */
export function printDeliveryNote(proposal: Proposal) {
  const defaultData: DeliveryNoteData = {
    buyerName: proposal.clientName || '____________________',
    dnNumber: (proposal.number || '').replace('КП-', 'ВН-') || `ВН-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`,
    dnDate: proposal.date ? proposal.date.split('T')[0] : new Date().toISOString().split('T')[0],
    showPrices: true,
    includeStamp: false,
  };
  printDeliveryNoteWithData(proposal, defaultData);
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

export function printContract(proposal: Proposal, withStamp: boolean = true) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна для друку');
    return;
  }

  const html = generateContractHTML(proposal, withStamp);
  printWindow.document.write(html);
  printWindow.document.close();
}

function generateInvoiceHTML(proposal: Proposal, data?: InvoiceData): string {
  const accentColor = '#F59E0B';
  const currencySymbol = proposal.currency === 'UAH' ? '₴' : (proposal.currency === 'EUR' ? '€' : '$');
  const dateStr = data?.invoiceDate 
    ? new Date(data.invoiceDate).toLocaleDateString('uk-UA') 
    : (proposal.date ? new Date(proposal.date).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA'));
  const invoiceNumber = data?.invoiceNumber || (proposal.number || '').replace('КП-', '');
  const withStamp = data?.includeStamp !== undefined ? data.includeStamp : true;
  
  // Robust seller detection
  const sellerId = proposal.seller?.id || (proposal as any).sellerId || 'tov_cso';
  const seller = SELLERS[sellerId as keyof typeof SELLERS] || proposal.seller || SELLERS.tov_cso;

  const rates = {
    USD: proposal.rates?.usdToUah || 45.0,
    EUR: proposal.rates?.eurToUah || 51.5,
    UAH: 1
  };

  // Округляємо ціни окремо для кожного товару у валюті відображення
  const convertedItems = (proposal.items || []).map(item => {
    const price = Math.round(convertCurrency(item.price || 0, 'USD', proposal.currency, rates) * 100) / 100;
    const sum = Math.round(price * (item.quantity || 0) * 100) / 100;
    return { ...item, displayPrice: price, displaySum: sum };
  });

  const displaySubtotal = convertedItems.reduce((acc, item) => acc + item.displaySum, 0);

  let totalConverted = displaySubtotal;
  if (proposal.vatMode === 'add') {
    const displayVat = Math.round(displaySubtotal * 0.2 * 100) / 100;
    totalConverted = displaySubtotal + displayVat;
  }

  const itemsHTML = convertedItems.map((item, i) => {
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
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap;">${item.displayPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap; font-weight: 600;">${item.displaySum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const buyerName = data?.buyerName || proposal.clientName || '____________________';
  const buyerTaxId = data?.buyerTaxId || (proposal as any).clientTaxId;
  const buyerIban = data?.buyerIban || (proposal as any).clientIban;
  const buyerBank = data?.buyerBank || (proposal as any).clientBank;
  const buyerPhone = data?.buyerPhone || proposal.clientPhone;
  const buyerEmail = data?.buyerEmail || proposal.clientEmail;
  const buyerAddress = data?.buyerAddress || proposal.clientAddress;

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
          <div style="font-size: 11px; line-height: 1.6;">
            <div style="text-transform: uppercase; font-size: 9px; color: #9CA3AF; font-weight: 600; margin-bottom: 5px;">Постачальник</div>
            <strong>${seller.fullName}</strong><br>
            ЄДРПОУ: ${seller.taxId}<br>
            IBAN: ${seller.iban}<br>
            Банк: ${seller.bank}<br>
            Адреса: ${seller.address}
          </div>
          <div style="font-size: 11px; line-height: 1.6;">
            <div style="text-transform: uppercase; font-size: 9px; color: #9CA3AF; font-weight: 600; margin-bottom: 5px;">Покупець</div>
            <strong>${buyerName}</strong><br>
            ${buyerTaxId ? `<strong>ЄДРПОУ / ІПН:</strong> ${buyerTaxId}<br>` : ''}
            ${buyerIban ? `<strong>р/р (IBAN):</strong> ${buyerIban}<br>` : ''}
            ${buyerBank ? `<strong>Банк:</strong> ${buyerBank}<br>` : ''}
            ${buyerPhone ? `Тел: ${buyerPhone}<br>` : ''}
            ${buyerEmail ? `Email: ${buyerEmail}<br>` : ''}
            ${buyerAddress ? `Адреса: ${buyerAddress}` : ''}
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
              <td style="padding: 10px; text-align: center; font-size: 11px; white-space: nowrap;">${totalConverted.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 70px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="font-size: 10px; text-align: center; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 30px; position: relative;">
              ${(withStamp && seller.stamp) ? `<img src="${seller.stamp}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -45%); width: 135px; height: auto; opacity: 0.95; pointer-events: none; mix-blend-mode: multiply; filter: contrast(1.5) brightness(1.2);">` : ''}
            </div>
            <div style="margin-top: 5px;">Виписав (ПІБ, підпис)</div>
          </div>
          <div style="font-size: 10px; text-align: center; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 30px;"></div>
            <div style="margin-top: 5px;">Отримав (ПІБ, підпис)</div>
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

function generateDeliveryNoteHTML(proposal: Proposal, data?: DeliveryNoteData): string {
  const accentColor = '#F59E0B';
  const showPrices = data ? data.showPrices : true;
  const includeStamp = data ? data.includeStamp : false;

  const dnNumber = data?.dnNumber || (proposal.number || '').replace('КП-', 'ВН-');
  const dateRaw = data?.dnDate || proposal.date;
  const dateStr = dateRaw ? new Date(dateRaw).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA');
  const buyerName = data?.buyerName || proposal.clientName || '____________________';
  
  // Robust seller detection
  const sellerId = proposal.seller?.id || (proposal as any).sellerId || 'tov_cso';
  const seller = SELLERS[sellerId as keyof typeof SELLERS] || proposal.seller || SELLERS.tov_cso;

  const currencySymbol = proposal.currency === 'UAH' ? 'грн.' : (proposal.currency === 'EUR' ? 'EUR' : 'USD');

  let totalSum = 0;
  let totalQty = 0;

  const itemsHTML = (proposal.items || []).map((item, i) => {
    const itemName = item.name || item.product?.name || 'Без назви';
    const itemUnit = item.unit || item.product?.unit || 'шт.';
    const qty = item.quantity || 0;
    const price = item.price || 0;
    const sum = price * qty;

    totalSum += sum;
    totalQty += qty;
    
    if (showPrices) {
      return `
        <tr>
          <td style="padding: 6px 4px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${i + 1}</td>
          <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: left;">
            <strong>${itemName}</strong>
          </td>
          <td style="padding: 6px 4px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap;">${itemUnit}</td>
          <td style="padding: 6px 4px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap;">${qty}</td>
          <td style="padding: 6px 6px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right; white-space: nowrap;">${price.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 6px 6px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right; font-weight: 600; white-space: nowrap;">${sum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    } else {
      return `
        <tr>
          <td style="padding: 6px 4px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${i + 1}</td>
          <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: left;">
            <strong>${itemName}</strong>
          </td>
          <td style="padding: 6px 4px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap;">${itemUnit}</td>
          <td style="padding: 6px 4px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap;">${qty}</td>
        </tr>
      `;
    }
  }).join('');

  const totalSumWords = numberToWords(Math.round(totalSum));

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
          th { background: #F9FAFB; padding: 6px 4px; text-align: center; border: 1px solid #E5E7EB; font-size: 9px; text-transform: uppercase; color: #4B5563; }
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
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Покупець:</span><br><strong>${buyerName}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">№</th>
              <th style="text-align: left; padding-left: 10px;">Товар</th>
              <th style="width: 40px;">Од.</th>
              <th style="width: 45px;">К-сть</th>
              ${showPrices ? `
                <th style="width: 65px; text-align: right; padding-right: 6px;">Ціна (${currencySymbol})</th>
                <th style="width: 75px; text-align: right; padding-right: 6px;">Сума (${currencySymbol})</th>
              ` : ''}
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            ${showPrices ? `
              <tr>
                <td colspan="4" style="border: none; padding: 8px 0;"></td>
                <td style="padding: 6px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right; font-weight: 700; background: #F9FAFB;">Разом:</td>
                <td style="padding: 6px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right; font-weight: 700; background: #F9FAFB; white-space: nowrap;">${totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        <div style="margin-top: 25px; font-size: 11px; color: #374151; line-height: 1.6;">
          ${showPrices ? `
            <div>Всього найменувань <strong>${proposal.items?.length || 0}</strong>, на суму <strong>${totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}</strong></div>
            <div style="font-style: italic; color: #4B5563; margin-top: 4px;">Всього на суму: ${totalSumWords}</div>
          ` : `
            <div>Всього найменувань <strong>${proposal.items?.length || 0}</strong></div>
          `}
        </div>

        <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="font-size: 10px; text-align: center; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 35px; position: relative;">
              ${(includeStamp && seller.stamp) ? `<img src="${seller.stamp}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -45%); width: 135px; height: auto; opacity: 0.95; pointer-events: none; mix-blend-mode: multiply; filter: contrast(1.5) brightness(1.2);">` : ''}
            </div>
            <div style="margin-top: 5px;">Відпустив (ПІБ, підпис)</div>
          </div>
          <div style="font-size: 10px; text-align: center; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 35px;"></div>
            <div style="margin-top: 5px;">Отримав (ПІБ, підпис)</div>
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

export function generateTTNHTMLWithData(_proposal: Proposal, data: TTNData): string {
  return generateTTNHTML(data);
}

export function generateTTNHTML(data: any): string {
  const dateObj = data.date ? new Date(data.date) : new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const monthNames = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  const month = monthNames[dateObj.getMonth()];
  const year = String(dateObj.getFullYear()).slice(-2);

  const selectedItems = data.selectedItems || [];
  let totalQty = 0;
  const itemsHTML = selectedItems.map((item: any, i: number) => {
    const qty = item.editedQuantity || item.quantity || 1;
    totalQty += qty;
    const name = item.editedName || item.name || item.product?.name || '';
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
          @page { size: A4 landscape; margin: 6mm 10mm; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
          }
          * { box-sizing: border-box; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; color: #000; background: #fff; margin: 0; padding: 0; line-height: 1.25; }
          .container { width: 275mm; margin: 0 auto; position: relative; }
          .top-right-appendix { position: absolute; top: 0; right: 0; text-align: right; font-size: 8pt; line-height: 1.15; font-family: 'Times New Roman', serif; max-width: 200px; }

          .header-center { text-align: center; margin-top: 10px; margin-bottom: 18px; }
          .main-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
          .date-line { font-size: 11pt; margin-top: 5px; font-weight: bold; }
          .date-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 35px; text-align: center; font-family: Arial, sans-serif; font-size: 10.5pt; }
          .date-month-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 90px; text-align: center; font-family: Arial, sans-serif; font-size: 10.5pt; }
          
          .row { display: flex; align-items: flex-end; margin-bottom: 12px; width: 100%; }
          .field-wrap { display: flex; flex-direction: column; flex-grow: 1; margin-right: 12px; }
          .field-wrap:last-child { margin-right: 0; }
          .field-top { display: flex; align-items: flex-end; }
          .label { white-space: nowrap; margin-right: 4px; font-weight: bold; font-size: 10pt; }
          .value { border-bottom: 1px solid #000; flex-grow: 1; text-align: center; min-height: 17px; font-family: Arial, sans-serif; font-size: 10.5pt; padding: 0 4px; line-height: 1.1; }
          .subtext { font-size: 6.5pt; text-align: center; margin-top: 1px; line-height: 1.1; font-family: 'Times New Roman', serif; }
          
          .table-title { text-align: center; font-weight: bold; text-transform: uppercase; margin: 10px 0 5px 0; font-size: 11pt; }
          table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 8.5pt; margin-bottom: 6px; }
          th, td { border: 1px solid #000; padding: 2px 3px; text-align: center; vertical-align: middle; }
          th { font-family: 'Times New Roman', Times, serif; font-size: 7.5pt; font-weight: normal; }
          
          .signatures { display: flex; justify-content: space-between; margin-top: 10px; }
          .sig-block { width: 48%; text-align: left; position: relative; }
          .sig-line { border-bottom: 1px solid #000; height: 16px; margin-top: 10px; position: relative; }
          .field-subtext { font-size: 6.5pt; text-align: center; margin-top: 1px; font-family: 'Times New Roman', serif; }
          .page-break { page-break-after: always; }
          .cso-seal-overlay { position: absolute; width: 130px; top: -50px; left: 50%; transform: translateX(-50%); pointer-events: none; mix-blend-mode: multiply; opacity: 0.92; z-index: 10; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Page 1 Front Side -->
          <div class="top-right-appendix">
            Додаток 7<br>
            до Правил перевезень вантажів<br>
            автомобільним транспортом в Україні<br>
            (пункт 11.1 глави 11)
            <div style="font-weight: bold; font-size: 9.5pt; margin-top: 4px;">Форма № 1-ТН</div>
          </div>
          
          <div class="header-center">
            <div class="main-title">ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА</div>
            <div class="date-line">
              N _________ " <span class="date-gap">${day}</span> " <span class="date-month-gap">${month}</span> 20<span class="date-gap">${year}</span> року
            </div>
          </div>
          
          <div class="row" style="width: 320px; margin-bottom: 8px;">
            <div class="field-wrap">
              <div class="field-top">
                <span class="label">Місце складання</span>
                <span class="value">${data.place || 'м. Тернопіль'}</span>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap" style="flex: 2.5;">
              <div class="field-top"><span class="label">Автомобіль</span><span class="value">${data.car || ''}</span></div>
              <div class="subtext">(марка, модель, тип, реєстраційний номер)</div>
            </div>
            <div class="field-wrap" style="flex: 2.5;">
              <div class="field-top"><span class="label">Причіп/напівпричіп</span><span class="value">${data.trailer || ''}</span></div>
              <div class="subtext">(марка, модель, тип, реєстраційний номер)</div>
            </div>
            <div class="field-wrap" style="flex: 1.2;">
              <div class="field-top"><span class="label">Вид перевезень</span><span class="value">${data.transportType || 'Автомобільні'}</span></div>
            </div>
          </div>

          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Місце де зберігається автомобіль*</span><span class="value">${data.carStoragePlace || ''}</span></div>
              <div class="subtext">(адреса місцезнаходження автомобільного перевізника, його структурного підрозділу або філії, де зберігається транспортний засіб)</div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap" style="flex: 3;">
              <div class="field-top"><span class="label">Автомобільний перевізник</span><span class="value">${data.carrier || ''}</span></div>
              <div class="subtext">(повне найменування (прізвище (за наявності), власне ім'я та по батькові (за наявності), унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності), код платника податків згідно з Єдиним державним реєстром підприємств та організацій України або податковий номер (реєстраційний номер облікової картки платника податків або серія (за наявності) та номер паспорта громадянина України (для фізичних осіб, які через свої релігійні переконання відмовляються від прийняття реєстраційного номера облікової картки платника податків та повідомили про це відповідний контролюючий орган і мають відмітку в паспорті))</div>
            </div>
            <div class="field-wrap" style="flex: 1.5;">
              <div class="field-top"><span class="label">Водій</span><span class="value">${data.driver || ''}</span></div>
              <div class="subtext">(прізвище (за наявності), власне ім'я та по батькові (за наявності), унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності), номер посвідчення водія)</div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажовідправник</span><span class="value">${data.sender || ''}</span></div>
              <div class="subtext">(повне найменування (прізвище (за наявності), власне ім'я та по батькові (за наявності), унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності), код платника податків згідно з Єдиним державним реєстром підприємств та організацій України або податковий номер (реєстраційний номер облікової картки платника податків або серія (за наявності) та номер паспорта громадянина України (для фізичних осіб, які через свої релігійні переконання відмовляються від прийняття реєстраційного номера облікової картки платника податків та повідомили про це відповідний контролюючий орган і мають відмітку в паспорті))</div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажоодержувач</span><span class="value">${data.receiver || ''}</span></div>
              <div class="subtext">(повне найменування (прізвище (за наявності), власне ім'я та по батькові (за наявності), унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності), код платника податків згідно з Єдиним державним реєстром підприємств та організацій України або податковий номер (реєстраційний номер облікової картки платника податків або серія (за наявності) та номер паспорта громадянина України (для фізичних осіб, які через свої релігійні переконання відмовляються від прийняття реєстраційного номера облікової картки платника податків та повідомили про це відповідний контролюючий орган і мають відмітку в паспорті))</div>
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">Пункт навантаження</span><span class="value">${data.loadPoint || 'м. Тернопіль'}</span></div>
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
              <div class="subtext">(прізвище (за наявності), власне ім'я та по батькові (за наявності), унікальний номер запису в ЄДДР (за наявності), посада, підпис)</div>
            </div>
          </div>
          
          <div class="row" style="margin-top: 5px;">
            <span class="label" style="font-size: 7.5pt; max-width: 190px;">Відомості про транспортний засіб<br>(автомобіль/автопоїзд/комбінований транспортний засіб)</span>
            <div class="field-wrap" style="width: 80px;"><div class="value">${data.carLength || ''}</div><div class="subtext">(довжина, м)</div></div>
            <div class="field-wrap" style="width: 80px;"><div class="value">${data.carWidth || ''}</div><div class="subtext">(ширина, м)</div></div>
            <div class="field-wrap" style="width: 80px;"><div class="value">${data.carHeight || ''}</div><div class="subtext">(висота, м)</div></div>
            <div class="field-wrap" style="flex: 1;"><div class="value">${data.totalWeightWithCargo || ''}</div><div class="subtext">(загальна вага/маса з вантажем та маса брутто, т)</div></div>
          </div>
          
          <div class="row">
            <span class="label">Усього відпущено на загальну суму</span>
            <div class="field-wrap" style="flex: 3;"><div class="value">${data.totalSumWords || ''}</div><div class="subtext">(словами, з урахуванням ПДВ)</div></div>
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

          <!-- Page 2 Back Side -->
          <div style="text-align: right; font-weight: bold; font-size: 9.5pt; margin-bottom: 4px; font-family: 'Times New Roman', serif;">Зворотній бік</div>

          <div class="table-title" style="margin-top: 0; font-size: 11pt;">ВІДОМОСТІ ПРО ВАНТАЖ</div>
          <table>
            <thead>
              <tr>
                <th style="width: 3%">№<br>з/п</th>
                <th style="width: 25%">Найменування вантажу (туші, напівтуші, четвертини, відруби, шматки м'яса)** / номер контейнера; клас небезпечних речовин, до якого віднесено вантаж, у разі перевезення небезпечних вантажів</th>
                <th style="width: 9%">Ідентифікаційний номер тварини від якої отримано сировину**</th>
                <th style="width: 6%">Вид тварини**</th>
                <th style="width: 8%">Температурний режим транспортування***</th>
                <th style="width: 6%">Одиниця вимірювання</th>
                <th style="width: 6%">Кількість місць</th>
                <th style="width: 8%">Ціна без ПДВ за одиницю, грн</th>
                <th style="width: 9%">Загальна сума з ПДВ, грн</th>
                <th style="width: 6%">Вид пакування</th>
                <th style="width: 8%">Документи з вантажем</th>
                <th style="width: 7%">Маса брутто, т</th>
              </tr>
              <tr style="font-size: 7.5pt; text-align: center; font-weight: bold;">
                <td>1</td>
                <td>2</td>
                <td>3</td>
                <td>4</td>
                <td>5</td>
                <td>6</td>
                <td>7</td>
                <td>8</td>
                <td>9</td>
                <td>10</td>
                <td>11</td>
                <td>12</td>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="text-align: left; font-weight: bold; font-family: 'Times New Roman', serif;">Усього:</td>
                <td></td>
                <td style="font-weight: bold; font-family: Arial, sans-serif;">${totalQty}</td>
                <td></td>
                <td style="font-weight: bold; font-family: Arial, sans-serif;">0,00</td>
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
                ${data.sealType !== 'none' ? `<img src="${window.location.origin}/proposals/doc/${data.sealType === 'cso' ? 'sign_cso.png' : 'fop_past.jpg'}" class="cso-seal-overlay">` : ''}
              </div>
              <div class="field-subtext">(прізвище (за наявності), власне ім'я та по батькові (за наявності), посада, підпис)</div>
            </div>
            <div class="sig-block">
              <div style="font-weight: bold; text-align: left; margin-bottom: 2px;">Прийняв (відповідальна особа вантажоодержувача)</div>
              <div class="sig-line" style="margin-top: 15px;"></div>
              <div class="field-subtext">(прізвище (за наявності), власне ім'я та по батькові (за наявності), посада, підпис)</div>
            </div>
          </div>

          <div class="table-title" style="margin-top: 18px; font-size: 11pt;">ВАНТАЖНО-РОЗВАНТАЖУВАЛЬНІ ОПЕРАЦІЇ</div>
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
              <tr style="font-size: 7.5pt; text-align: center; font-weight: bold;">
                <td>1</td>
                <td>2</td>
                <td>3</td>
                <td>4</td>
                <td>5</td>
                <td>6</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: left; font-family: 'Times New Roman', serif;">Завантаження</td>
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
              <tr>
                <td style="text-align: left; font-family: 'Times New Roman', serif;">Розвантаження</td>
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 6.5pt; margin-top: 6px; line-height: 1.25; text-align: left; font-family: 'Times New Roman', serif;">
            * відомості заповнюються у випадках передбачених Положенням про робочий час і час відпочинку водіїв колісних транспортних засобів, затвердженого наказом Міністерства транспорту та зв'язку України від 07 червня 2010 року №340<br>
            ** відомості заповнюються у разі перевезення туш, напівтуш, четвертин, відрубів, шматків м'яса.<br>
            *** відомості заповнюються у разі перевезення харчових продуктів, які потребують дотримання температурного режиму.
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

function generateContractHTML(proposal: Proposal, withStamp: boolean = true): string {
  const dateStr = proposal.date ? new Date(proposal.date).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA');
  const contractNumber = (proposal.number || '').replace('КП-', 'Д-');
  
  // Визначаємо продавця безпосередньо з об'єкта пропозиції
  const seller = proposal.seller || SELLERS.tov_cso;
  const sellerId = seller.id;
  
  const isVAT = sellerId === 'tov_cso' || seller.taxId === '31758743';
  
  const rates = {
    USD: proposal.rates?.usdToUah || 41.5,
    EUR: proposal.rates?.eurToUah || 51.0,
    UAH: 1
  };

  // Округляємо ціни окремо для кожного товару у валюті відображення
  const convertedItems = (proposal.items || []).map(item => {
    const price = Math.round(convertCurrency(item.price || 0, 'USD', proposal.currency, rates) * 100) / 100;
    const sum = Math.round(price * (item.quantity || 0) * 100) / 100;
    return { ...item, displayPrice: price, displaySum: sum };
  });

  const displaySubtotal = convertedItems.reduce((acc, item) => acc + item.displaySum, 0);

  let totalAmount = displaySubtotal;
  if (proposal.vatMode === 'add') {
    const displayVat = Math.round(displaySubtotal * 0.2 * 100) / 100;
    totalAmount = displaySubtotal + displayVat;
  }

  const vatAmount = isVAT ? Math.round((totalAmount - (totalAmount / 1.2)) * 100) / 100 : 0;
  
  const itemsHTML = convertedItems.map((item, i) => {
    const itemName = item.name || item.product?.name || 'Без назви';
    const itemUnit = item.unit || item.product?.unit || 'шт.';
    
    return `
      <tr>
        <td class="center">${i + 1}</td>
        <td>${itemName}</td>
        <td class="center">${itemUnit}</td>
        <td class="center">${item.quantity || 0}</td>
        <td class="right">${item.displayPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="right">${item.displaySum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const totalWords = numberToWords(totalAmount);

  return `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
    <meta charset="UTF-8">
    <title>Договір ${contractNumber}</title>
    <style>
      @page { size: A4; margin: 20mm 15mm 20mm 25mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: "Times New Roman", Times, serif; font-size: 11pt; line-height: 1.15; color: #000; background: #fff; }
      .page { max-width: 210mm; margin: 0 auto; padding: 5mm; background: #fff; }
      h1 { font-size: 13pt; font-weight: bold; text-align: center; margin-bottom: 5pt; }
      h2 { font-size: 11pt; font-weight: bold; text-align: center; margin: 8pt 0 4pt; }
      .subtitle { font-size: 11pt; text-align: center; margin-bottom: 4pt; }
      .date-row { display: flex; justify-content: space-between; margin: 8pt 0 6pt; }
      p { text-align: justify; margin-bottom: 3pt; text-indent: 1.25cm; }
      p.no-indent { text-indent: 0; }
      p.bold { font-weight: bold; }
      table { border-collapse: collapse; width: 100%; margin: 6pt 0; font-size: 10pt; }
      table.req td { padding: 2pt 3pt; vertical-align: top; border: none; width: 50%; }
      table.items th, table.items td { border: 0.5pt solid #000; padding: 3pt 4pt; vertical-align: middle; }
      table.items th { background: #f2f2f2; font-weight: bold; text-align: center; }
      table.items td.center { text-align: center; }
      table.items td.right { text-align: right; }
      table.items tr.total td { font-weight: bold; }
      .stamp { margin-top: 4pt; font-size: 9pt; color: #666; }
      .page-break { page-break-before: always; }
      .total-text { margin-top: 8pt; text-indent: 0; font-weight: bold; }
      @media print {
        .no-print { display: none; }
      }
    </style>
    </head>
    <body>
    <div class="page">
      <h1>ДОГОВІР КУПІВЛІ-ПРОДАЖУ ОБЛАДНАННЯ</h1>
      <div class="subtitle">№ ${contractNumber}</div>

      <div class="date-row">
        <span>м. Золочів</span>
        <span>«${dateStr.split('.')[0]}» ${["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"][parseInt(dateStr.split('.')[1])-1]} ${dateStr.split('.')[2]} р.</span>
      </div>

      <p>${seller.fullName} (надалі — <strong>«Продавець»</strong>), в особі ${sellerId === 'tov_cso' ? 'директора Пастушка Петра Петровича' : 'Пастушок Марії Володимирівни'}, що діє на підставі ${sellerId === 'tov_cso' ? 'Статуту' : 'Виписки з ЄДР'}, з однієї сторони, та</p>

      <p><strong>${proposal.clientName || '_____________________________________'}</strong> (надалі — <strong>«Покупець»</strong>), ${proposal.clientAddress ? 'що проживає за адресою: ' + proposal.clientAddress + ',' : ''} з іншої сторони,</p>

      <p>разом іменовані «Сторони», уклали цей Договір купівлі-продажу обладнання (надалі — «Договір») про наступне:</p>

      <h2>1. ПРЕДМЕТ ДОГОВОРУ</h2>
      <p>1.1. Продавець зобов'язується передати у власність Покупцеві обладнання (надалі — «Товар»), а Покупець зобов'язується прийняти та оплатити Товар на умовах, визначених цим Договором.</p>
      <p>1.2. Найменування, технічні характеристики, кількість та ціна Товару визначаються у Додатку № 1 до цього Договору, який є його невід'ємною частиною.</p>
      <p>1.3. Товар є новим, не був у використанні, відповідає технічним вимогам і стандартам якості.</p>

      <h2>2. ЦІНА ДОГОВОРУ ТА ПОРЯДОК РОЗРАХУНКІВ</h2>
      <p>2.1. Загальна вартість Товару відповідно до Додатку № 1 становить <strong>${totalAmount.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн</strong> (${totalWords})${isVAT ? ', у тому числі ПДВ 20% — ' + vatAmount.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' грн.' : ' (без ПДВ).'}</p>
      <p>2.2. Розрахунки між Сторонами здійснюються у безготівковій формі шляхом перерахування грошових коштів на поточний рахунок Продавця.</p>
      <p>2.3. Покупець сплачує 100% вартості Товару протягом 3 банківських днів з дати виставлення рахунку-фактури.</p>
      <p>2.4. Датою оплати вважається дата зарахування коштів на рахунок Продавця.</p>

      <h2>3. ПОРЯДОК ПОСТАВКИ ТА ПЕРЕДАЧІ ТОВАРУ</h2>
      <p>3.1. Поставка Товару здійснюється протягом 30 календарних днів з дати отримання оплати від Покупця.</p>
      <p>3.2. Місце передачі Товару: за домовленістю Сторін.</p>
      <p>3.3. Передача Товару оформлюється Актом приймання-передачі або видатковою накладною.</p>
      <p>3.4. Право власності на Товар переходить до Покупця з моменту підписання документів про передачу.</p>
      <p>3.5. Ризик випадкового знищення або пошкодження Товару переходить до Покупця одночасно з переходом права власності.</p>

      <h2>4. ЯКІСТЬ ТОВАРУ ТА ГАРАНТІЙНІ ЗОБОВ'ЯЗАННЯ</h2>
      <p>4.1. Якість Товару повинна відповідати технічним характеристикам виробника.</p>
      <p>4.2. Продавець надає гарантію на Товар згідно з гарантійними термінами виробника, вказаними у гарантійному талоні.</p>
      <p>4.3. Гарантія не поширюється на пошкодження, що виникли внаслідок неналежного використання, механічних пошкоджень або несанкціонованого втручання у конструкцію Товару.</p>

      <h2>5. ПРАВА ТА ОБОВ'ЯЗКИ СТОРІН</h2>
      <p class="bold no-indent">5.1. Продавець зобов'язується:</p>
      <p>5.1.1. передати Покупцеві Товар у строки та на умовах, визначених цим Договором;</p>
      <p>5.1.2. забезпечити передачу Покупцеві технічної документації та гарантійних талонів.</p>
      <p class="bold no-indent">5.2. Покупець зобов'язується:</p>
      <p>5.2.1. прийняти Товар відповідно до умов цього Договору;</p>
      <p>5.2.2. здійснити оплату у строки та в порядку, визначених розділом 2 цього Договору.</p>

      <h2>6. ВІДПОВІДАЛЬНІСТЬ СТОРІН</h2>
      <p>6.1. За порушення строків оплати Покупець сплачує Продавцеві пеню у розмірі подвійної облікової ставки НБУ від суми заборгованості за кожен день прострочення.</p>
      <p>6.2. Сплата штрафних санкцій не звільняє Сторони від виконання своїх зобов'язань за цим Договором.</p>

      <h2>7. ФОРС-МАЖОР</h2>
      <p>7.1. Сторони звільняються від відповідальності за невиконання зобов'язань у разі настання обставин непереборної сили (форс-мажор), які безпосередньо впливають на виконання цього Договору.</p>

      <h2>8. КОНФІДЕНЦІЙНІСТЬ</h2>
      <p>8.1. Сторони зобов'язуються не розголошувати конфіденційну інформацію, отриману в процесі виконання цього Договору.</p>

      <h2>9. ВИРІШЕННЯ СПОРІВ</h2>
      <p>9.1. Всі спори між Сторонами вирішуються шляхом переговорів. У разі неможливості вирішення спору — у судовому порядку згідно з законодавством України.</p>

      <h2>10. СТРОК ДІЇ ДОГОВОРУ</h2>
      <p>10.1. Цей Договір набирає чинності з моменту підписання і діє до повного виконання Сторонами своїх зобов'язань.</p>

      <h2>11. ПРИКІНЦЕВІ ПОЛОЖЕННЯ</h2>
      <p>11.1. Цей Договір укладений у 2 примірниках, що мають однакову юридичну силу.</p>
      <p>11.2. Будь-які зміни до цього Договору оформлюються у письмовій формі.</p>

      <h2>12. РЕКВІЗИТИ ТА ПІДПИСИ СТОРІН</h2>
      <table class="req">
        <tr>
          <td><strong>ПРОДАВЕЦЬ</strong></td>
          <td><strong>ПОКУПЕЦЬ</strong></td>
        </tr>
        <tr>
          <td><strong>${seller.fullName}</strong></td>
          <td><strong>${proposal.clientName || '___________________________'}</strong></td>
        </tr>
        <tr>
          <td>Код: ${seller.taxId}</td>
          <td>Тел.: ${proposal.clientPhone || '_____________________'}</td>
        </tr>
        <tr>
          <td>Адреса: ${seller.address}</td>
          <td>Адреса: ${proposal.clientAddress || '___________________'}</td>
        </tr>
        <tr>
          <td>IBAN: ${seller.iban}</td>
          <td>Email: ${proposal.clientEmail || '____________________'}</td>
        </tr>
        <tr>
          <td>Банк: ${seller.bank}</td>
          <td></td>
        </tr>
        <tr>
          <td style="padding-top: 20pt; position: relative;">
            ____________ /________________/
            ${(withStamp && seller.stamp) ? `<img src="${seller.stamp}" style="position: absolute; top: -35px; left: 40px; width: 150px; height: auto; opacity: 0.95; pointer-events: none; z-index: 1; mix-blend-mode: multiply; filter: contrast(1.5) brightness(1.2);">` : ''}
          </td>
          <td style="padding-top: 20pt;">____________ /________________/</td>
        </tr>
        <tr>
          <td class="stamp">М.П.</td>
          <td class="stamp">М.П.</td>
        </tr>
      </table>

      <div class="page-break"></div>
      <h1>ДОДАТОК № 1</h1>
      <div class="subtitle">до Договору № ${contractNumber} від ${dateStr}</div>
      <br>
      <h2>ПЕРЕЛІК ОБЛАДНАННЯ (СПЕЦИФІКАЦІЯ)</h2>
      <table class="items">
        <thead>
          <tr>
            <th style="width:5%;">№</th>
            <th style="width:45%;">Найменування</th>
            <th style="width:10%;">Од.</th>
            <th style="width:10%;">К-сть</th>
            <th style="width:15%;">Ціна, грн</th>
            <th style="width:15%;">Сума, грн</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
          <tr class="total">
            <td colspan="5" class="right">РАЗОМ:</td>
            <td class="right">${totalAmount.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          ${isVAT ? `
          <tr>
            <td colspan="5" class="right">У тому числі ПДВ (20%):</td>
            <td class="right">${vatAmount.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>` : ''}
        </tbody>
      </table>
      <p class="no-indent total-text">Загальна вартість: ${totalWords}</p>

      <table class="req" style="margin-top: 30pt;">
        <tr>
          <td><strong>Від Продавця:</strong></td>
          <td><strong>Від Покупця:</strong></td>
        </tr>
        <tr>
          <td style="padding-top: 20pt; position: relative;">
            ____________ /________________/
            ${(withStamp && seller.stamp) ? `<img src="${seller.stamp}" style="position: absolute; top: -35px; left: 40px; width: 150px; height: auto; opacity: 0.95; pointer-events: none; z-index: 1; mix-blend-mode: multiply; filter: contrast(1.5) brightness(1.2);">` : ''}
          </td>
          <td style="padding-top: 20pt;">____________ /________________/</td>
        </tr>
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



