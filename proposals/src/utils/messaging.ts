import { Proposal } from '../types';
import { formatCurrency } from './currency';
import html2canvas from 'html2canvas';
import { exportToPDF } from './pdf';
import { useProposalStore } from '../store';

const IS_DEPLOYED = window.location.protocol === 'https:';

// Telegram Bot API
export async function sendToTelegram(
  proposal: Proposal,
  format: 'text' | 'photo' | 'pdf'
) {
  const { settings } = useProposalStore.getState();
  const botToken = settings.telegramBotToken;
  const chatId = settings.telegramChatId;

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!IS_DEPLOYED && !isLocal && (!botToken || !chatId)) {
    throw new Error('Вкажіть Telegram Bot Token та Chat ID в налаштуваннях');
  }

  if (format === 'text') {
    await sendTelegramText(proposal, botToken, chatId);
  } else if (format === 'photo') {
    await sendTelegramPhoto(proposal, botToken, chatId);
  } else {
    await sendTelegramPdf(proposal, botToken, chatId);
  }
}

async function sendTelegramText(proposal: Proposal, botToken?: string, chatId?: string) {
  let text = `📋 <b>${escapeHtml(proposal.number)}</b> від ${proposal.date}\n`;
  if (proposal.clientName) text += `👤 ${escapeHtml(proposal.clientName)}\n`;
  if (proposal.clientPhone) text += `📞 ${escapeHtml(proposal.clientPhone)}\n`;
  text += '\n';

  proposal.items.forEach((item, i) => {
    const sum = item.price * item.quantity;
    text += `${i + 1}. ${escapeHtml(item.name || item.product.name)}\n   ${item.quantity} ${item.unit || item.product.unit} × ${formatCurrency(item.price, proposal.currency)} = ${formatCurrency(sum, proposal.currency)}\n`;
  });

  const totalSum = proposal.items.reduce((s, it) => s + it.price * it.quantity, 0);
  text += `\n💰 <b>Всього: ${formatCurrency(totalSum, proposal.currency)}</b>`;

  await telegramRequest('sendMessage', { text, parseMode: 'HTML' }, botToken, chatId);
}

async function sendTelegramPhoto(proposal: Proposal, botToken?: string, chatId?: string) {
  const mainEl = document.getElementById('proposal-container') || document.getElementById('mainContent');
  if (!mainEl) throw new Error('Елемент пропозиції не знайдено');

  try {
    const canvas = await html2canvas(mainEl, {
      scale: 3, 
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const { settings } = useProposalStore.getState();
        prepareElementForCapture(clonedDoc, mainEl.id, settings.showCostInCapture);
      }
    });

    const photoBase64 = canvas.toDataURL('image/png').split(',')[1];
    const caption = `📋 ${proposal.number} від ${proposal.date}`;

    await telegramRequest('sendPhoto', { photoBase64, caption }, botToken, chatId);
  } catch (error) {
    console.error('Telegram photo generation error:', error);
    throw error;
  }
}

async function sendTelegramPdf(proposal: Proposal, botToken?: string, chatId?: string) {
  const { settings } = useProposalStore.getState();
  const pdfBlob = await exportToPDF(proposal, true, settings.showCostInCapture);
  if (!pdfBlob) throw new Error('Failed to generate PDF');

  const reader = new FileReader();
  const pdfBase64 = await new Promise<string>((resolve, reject) => {
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(pdfBlob);
  });

  const caption = `📋 ${proposal.number} від ${proposal.date}`;
  const filename = `${proposal.number}.pdf`;

  await telegramRequest('sendDocument', { pdfBase64, caption, filename }, botToken, chatId);
}

async function telegramRequest(
  action: string,
  data: any,
  botToken?: string,
  chatId?: string
) {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const shouldTryProxy = IS_DEPLOYED || isLocal;

  if (shouldTryProxy) {
    try {
      const resp = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, chatId, ...data }),
      });
      
      const text = await resp.text();
      let result;
      try {
        result = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error(`Сервер повернув некоректну відповідь. Статус: ${resp.status}`);
      }
      
      if (!resp.ok) throw new Error(result.error || `Помилка сервера: ${resp.status}`);
      return result;
    } catch (e) {
      console.warn('Proxy failed, checking direct API fallback:', e);
      if (!botToken || !chatId) {
        throw new Error(`Не вдалося надіслати: ${e instanceof Error ? e.message : 'proxy error'}`);
      }
    }
  }

  if (!botToken || !chatId) throw new Error('Помилка: Токени не вказано в налаштуваннях');

  if (action === 'sendMessage') {
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: data.text,
        parse_mode: data.parseMode || 'HTML',
      }),
    });
    if (!resp.ok) throw new Error(await resp.text());
  } else if (action === 'sendPhoto') {
    const photoData = Uint8Array.from(atob(data.photoBase64), c => c.charCodeAt(0));
    const blob = new Blob([photoData], { type: 'image/png' });
    const fd = new FormData();
    fd.append('chat_id', chatId);
    fd.append('photo', blob, 'proposal.png');
    if (data.caption) fd.append('caption', data.caption);
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: fd,
    });
    if (!resp.ok) {
      const errData = await resp.json();
      throw new Error(errData.description || 'Telegram API error');
    }
  } else if (action === 'sendDocument') {
    const dataBytes = Uint8Array.from(atob(data.pdfBase64), c => c.charCodeAt(0));
    const blob = new Blob([dataBytes], { type: 'application/pdf' });
    const fd = new FormData();
    fd.append('chat_id', chatId);
    fd.append('document', blob, data.filename || 'proposal.pdf');
    if (data.caption) fd.append('caption', data.caption);
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: fd,
    });
    if (!resp.ok) {
      const errData = await resp.json();
      throw new Error(errData.description || 'Telegram API error');
    }
  }
}

export async function sendToViber(
  proposal: Proposal,
  format: 'link' | 'photo' | 'pdf'
) {
  if (format === 'link') {
    await sendViberLink(proposal);
  } else if (format === 'photo') {
    await sendViberPhoto();
  } else {
    await sendViberPdf(proposal);
  }
}

async function sendViberLink(proposal: Proposal) {
  const phone = proposal.clientPhone ? proposal.clientPhone.replace(/\D/g, '') : '';
  const totalSum = proposal.items.reduce((s, it) => s + it.price * it.quantity, 0);
  let text = `📋 Пропозиція ${proposal.number} від ${proposal.date}\n💰 Сума: ${formatCurrency(totalSum, proposal.currency)}`;

  const url = phone
    ? `viber://chat?number=%2B${phone}&draft=${encodeURIComponent(text)}`
    : `viber://forward?text=${encodeURIComponent(text)}`;

  window.open(url);
}

async function sendViberPhoto() {
  const mainEl = document.getElementById('proposal-container') || document.getElementById('mainContent');
  if (!mainEl) throw new Error('Елемент пропозиції не знайдено');

  try {
    const canvas = await html2canvas(mainEl, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const { settings } = useProposalStore.getState();
        prepareElementForCapture(clonedDoc, mainEl.id, settings.showCostInCapture);
      }
    });

    canvas.toBlob(async (blob) => {
      if (!blob) throw new Error('Failed to create image');
      try {
        const data = [new ClipboardItem({ [blob.type]: blob })];
        await navigator.clipboard.write(data);
        alert('📸 Скріншот скопійовано! Вставте його (Ctrl+V) у Viber.');
      } catch (err) {
        console.error('Clipboard error:', err);
        alert('Не вдалося скопіювати знімок. Відкрийте зображення та збережіть його вручну.');
        const url = URL.createObjectURL(blob);
        window.open(url);
      }
    }, 'image/png');
  } catch (error) {
    console.error('Viber photo generation error:', error);
    throw error;
  }
}

async function sendViberPdf(proposal: Proposal) {
  const { settings } = useProposalStore.getState();
  await exportToPDF(proposal, false, settings.showCostInCapture);
  alert('📥 PDF готовий. Надішліть його вручну у Viber');
}

// Helper to prepare element for capture (screenshot)
function prepareElementForCapture(clonedDoc: Document, elementId: string, showCost: boolean = false) {
  const el = clonedDoc.getElementById(elementId);
  if (!el) return;

  clonedDoc.body.classList.add('is-exporting');
  el.style.width = '1150px';
  el.style.padding = '40px 50px';
  el.style.background = '#ffffff';
  el.style.fontFamily = "'Inter', -apple-system, sans-serif";
  el.style.color = '#1e293b';

  const allElements = el.querySelectorAll('*');
  allElements.forEach((node: any) => {
    node.style.fontFamily = "'Inter', -apple-system, sans-serif";
  });

  const inputs = el.querySelectorAll('input, select, textarea');
  inputs.forEach((input: any) => {
    const span = clonedDoc.createElement('span');
    span.textContent = input.value || (input.placeholder && !input.value ? '' : input.value);
    
    if (input.tagName === 'SELECT') {
      const selectedOption = input.options[input.selectedIndex];
      span.textContent = selectedOption ? selectedOption.text : '';
    }

    const style = window.getComputedStyle(input);
    span.style.display = 'block';
    span.style.width = '100%';
    span.style.textAlign = style.textAlign;
    span.style.color = '#1e293b';
    span.style.fontSize = '12px';
    span.style.fontWeight = style.fontWeight;
    span.style.minHeight = '1.2em';
    
    if (input.placeholder?.includes('Опис') || input.className.includes('text-[0.7rem]')) {
      span.style.fontSize = '10px';
      span.style.marginTop = '2px';
      span.style.color = '#64748b';
      span.style.fontStyle = 'italic';
      if (!input.value) span.style.display = 'none';
    }
    
    input.parentNode.replaceChild(span, input);
  });

  const header = el.querySelector('.print-header') as HTMLElement;
  if (header) {
    header.style.setProperty('display', 'flex', 'important');
    header.style.removeProperty('display'); // Remove inline 'display: none' from React
    header.classList.remove('no-print');
    
    const inner = header.querySelector('.print-logo-row') as HTMLElement;
    if (inner) {
      inner.style.display = 'flex';
      inner.style.justifyContent = 'space-between';
      inner.style.width = '100%';
      inner.style.alignItems = 'center';
      inner.style.paddingBottom = '16px';
      inner.style.marginBottom = '20px';
    }

    const contactInfo = header.querySelector('.print-contact-info') as HTMLElement;
    if (contactInfo) {
      contactInfo.style.textAlign = 'right';
      contactInfo.style.fontSize = '10px';
      contactInfo.style.lineHeight = '1.4';
      contactInfo.style.color = '#475569';
      
      const infoChildren = contactInfo.querySelectorAll('div');
      infoChildren.forEach((child: any, idx) => {
        if (idx === 0) {
          child.style.fontSize = '12px';
          child.style.fontWeight = '700';
          child.style.color = '#1e293b';
        }
      });
    }
    const logo = el.querySelector('.print-logo') as HTMLImageElement;
    if (logo) {
      logo.style.height = '72px';
      logo.style.width = 'auto';
    }
  }
  
  el.querySelectorAll('.no-print').forEach(node => {
    (node as HTMLElement).style.display = 'none';
  });

  el.querySelectorAll('.cost-column').forEach(node => {
    const htmlNode = node as HTMLElement;
    if (!showCost) {
      htmlNode.style.setProperty('display', 'none', 'important');
    } else {
      htmlNode.style.setProperty('display', 'table-cell', 'important');
    }
  });

  // Profit row visibility
  el.querySelectorAll('.profit-row').forEach(node => {
    const htmlNode = node as HTMLElement;
    if (showCost) {
      htmlNode.style.setProperty('display', 'table-row', 'important');
      htmlNode.classList.remove('no-print');
      htmlNode.style.background = '#f8fafc';
    } else {
      htmlNode.style.setProperty('display', 'none', 'important');
    }
  });

  const table = el.querySelector('table');
  if (table) {
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '11.5px';
    
    const allCells = el.querySelectorAll('td, th');
    allCells.forEach((cell: any) => {
      cell.style.fontSize = '11.5px';
      cell.style.padding = '8px 10px';
      cell.style.color = '#1e293b';
      cell.style.borderColor = '#e2e8f0';

      if (cell.cellIndex === 1) {
        const spans = cell.querySelectorAll('span');
        if (spans.length >= 1) {
          spans[0].style.fontWeight = '600';
          spans[0].style.fontSize = '12px';
          spans[0].style.display = 'block';
          spans[0].style.marginBottom = '2px';
        }
        if (spans.length >= 2) {
          spans[1].style.fontStyle = 'italic';
          spans[1].style.fontSize = '10px';
          spans[1].style.color = '#64748b';
          spans[1].style.display = 'block';
        }
      }
      
      if (cell.cellIndex !== 1 && !cell.hasAttribute('colspan')) {
        cell.style.textAlign = 'center';
      } else if (cell.hasAttribute('colspan')) {
        cell.style.textAlign = 'right';
        cell.style.paddingRight = '12px';
      }
    });

    const tableHeaders = el.querySelectorAll('th');
    tableHeaders.forEach((th: any) => {
      th.style.backgroundColor = '#f8fafc';
      th.style.color = '#64748b';
      th.style.textTransform = 'uppercase';
      th.style.fontSize = '10px';
      th.style.letterSpacing = '0.05em';
    });

    const headersArray = Array.from(tableHeaders);
    if (headersArray.length >= 8) {
      headersArray[0].style.width = '45px';
      headersArray[1].style.width = 'auto';
      headersArray[2].style.width = '65px';
      headersArray[3].style.width = '85px';
      
      if (showCost) {
        headersArray[4].style.width = '100px'; // Cost Price
        headersArray[5].style.width = '110px'; // Total Cost
        headersArray[6].style.width = '110px'; // Sale Price
        headersArray[7].style.width = '130px'; // Total Sale
        
        // Переконаємось що для собівартості встановлена ширина
        [4, 5].forEach(idx => {
          if (headersArray[idx]) {
            headersArray[idx].style.setProperty('display', 'table-cell', 'important');
            headersArray[idx].style.textAlign = 'center';
          }
        });
      } else {
        headersArray[6].style.width = '110px';
        headersArray[7].style.width = '130px';
        
        // Примусово приховуємо якщо не потрібно
        [4, 5].forEach(idx => {
          if (headersArray[idx]) {
            headersArray[idx].style.setProperty('display', 'none', 'important');
          }
        });
      }
    }
  }

  const summaryLabels = el.querySelectorAll('span[class*="uppercase"]');
  summaryLabels.forEach((label: any) => {
    label.style.fontSize = '10px';
    label.style.fontWeight = '700';
    label.style.color = '#94a3b8';
  });
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

async function prepImagesForCapture(container: HTMLElement) {
  const imgs = container.querySelectorAll('img');
  for (const img of Array.from(imgs)) {
    if (img.src && !img.src.startsWith('data:')) {
      try {
        const b64 = await convertImgToBase64(img.src);
        img.src = b64;
      } catch (e) {
        console.warn('Could not convert img for capture:', img.src, e);
      }
    }
  }
}

function convertImgToBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}
