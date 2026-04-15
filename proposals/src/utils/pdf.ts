import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Proposal, ProposalItem } from '../types';

/**
 * Генерує PDF, який повністю повторює дизайн друкованої форми
 */
export async function exportToPDF(proposal: Proposal, returnBlob = false): Promise<Blob | void> {
  const currencySymbol = proposal.currency === 'UAH' ? '₴' : (proposal.currency === 'EUR' ? '€' : '$');
  const dateStr = new Date(proposal.date).toLocaleDateString('uk-UA');
  const accentColor = '#F59E0B';

  // Створюємо тимчасовий контейнер для рендерингу
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px'; // Фіксована ширина для стабільного рендерингу
  container.style.backgroundColor = '#ffffff';

  container.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #1F2937; padding: 40px 50px; background: #fff;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <img src="https://i.ibb.co/32JD4dc/logo.png" height="45">
        <div style="text-align: right;">
          <div style="color: ${accentColor}; font-weight: 700; font-size: 14px; letter-spacing: 1px; margin-bottom: 5px;">КОМЕРЦІЙНА ПРОПОЗИЦІЯ</div>
          <div style="font-size: 10px; color: #6B7280; line-height: 1.5;">
            ${proposal.seller.office}<br>
            ${proposal.seller.phone}
          </div>
        </div>
      </div>

      <hr style="height: 3px; background-color: ${accentColor}; margin: 20px 0; border: none;">

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div style="display: flex; gap: 40px;">
          <div style="flex: 1;"><label style="display: block; font-size: 9px; color: #9CA3AF; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Номер</label><span style="display: block; font-size: 13px; font-weight: 600; color: #111827;">${proposal.number}</span></div>
          <div style="flex: 1;"><label style="display: block; font-size: 9px; color: #9CA3AF; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Дата</label><span style="display: block; font-size: 13px; font-weight: 600; color: #111827;">${dateStr}</span></div>
        </div>
        <div style="display: flex; gap: 40px;">
          <div style="flex: 1;"><label style="display: block; font-size: 9px; color: #9CA3AF; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Клієнт</label><span style="display: block; font-size: 13px; font-weight: 600; color: #111827;">${proposal.clientName || 'Не вказано'}</span></div>
          <div style="flex: 1;"><label style="display: block; font-size: 9px; color: #9CA3AF; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Контакт</label><span style="display: block; font-size: 13px; font-weight: 600; color: #111827;">${proposal.clientPhone || '-'}</span></div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #E5E7EB;">
        <thead>
          <tr style="background: #F9FAFB;">
            <th style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 10px; color: #4B5563; text-transform: uppercase;">№</th>
            <th style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 10px; color: #4B5563; text-transform: uppercase; text-align: left;">Найменування</th>
            <th style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 10px; color: #4B5563; text-transform: uppercase;">Од.</th>
            <th style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 10px; color: #4B5563; text-transform: uppercase;">К-сть</th>
            <th style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 10px; color: #4B5563; text-transform: uppercase;">Ціна (${currencySymbol})</th>
            <th style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 10px; color: #4B5563; text-transform: uppercase;">Сума (${currencySymbol})</th>
          </tr>
        </thead>
        <tbody>
          ${proposal.items.map((item: ProposalItem, i: number) => `
            <tr>
              <td style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 12px; text-align: center;">${i + 1}</td>
              <td style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 12px;">
                <strong>${item.name}</strong>
                ${item.product.description ? `<div style="font-size: 9px; color: #6B7280; margin-top: 2px;">${item.product.description}</div>` : ''}
              </td>
              <td style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 12px; text-align: center;">${item.unit || 'шт.'}</td>
              <td style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 12px; text-align: center;">${item.quantity}</td>
              <td style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 12px; text-align: center;">${item.price.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</td>
              <td style="padding: 12px 10px; border: 1px solid #E5E7EB; font-size: 12px; text-align: center; font-weight: 600;">${(item.price * item.quantity).toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 20px; display: flex; flex-direction: column; align-items: flex-end;">
        <div style="background: #FFFBEB; border: 1px solid #FEF3C7; padding: 15px 25px; border-radius: 4px; text-align: right; min-width: 250px;">
          <div style="font-size: 18px; font-weight: 700; color: #B45309;">
            <span>Загальний підсумок:</span> <span style="margin-left: 5px;">${currencySymbol} ${proposal.total.toLocaleString('uk-UA', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #9CA3AF; text-align: right;">
          Курс за замовчуванням: 1 USD = ${proposal.rates?.usdToUah || '41.50'} грн | 1 EUR = ${proposal.rates?.eurToUah || '51.00'} грн
        </div>
      </div>

      ${proposal.notes ? `<div style="margin-top: 40px; padding: 15px; border-left: 3px solid #E5E7EB; background: #F9FAFB; font-size: 11px; color: #4B5563;"><strong>ПРИМІТКИ:</strong><br>${proposal.notes.replace(/\n/g, '<br>')}</div>` : ''}
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // Вища якість
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    document.body.removeChild(container);

    if (returnBlob) {
      return pdf.output('blob');
    } else {
      pdf.save(`${proposal.number.replace(/\//g, '-')}.pdf`);
    }
  } catch (error) {
    console.error('PDF Export Error:', error);
    document.body.removeChild(container);
    throw error;
  }
}

