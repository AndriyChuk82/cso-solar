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

  // На localhost дозволяємо відсутність токенів в налаштуваннях, 
  // якщо розраховуємо на серверний проксі (.env.local)
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
        const el = clonedDoc.getElementById(mainEl.id);
        if (el) {
          // Add is-exporting class ONLY to the clone
          clonedDoc.body.classList.add('is-exporting');
          
          el.style.width = '1200px';
          el.style.padding = '40px';
          el.style.background = '#ffffff';
          
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
            span.style.color = style.color;
            span.style.fontSize = style.fontSize;
            span.style.fontWeight = style.fontWeight;
            span.style.fontFamily = style.fontFamily;
            span.style.minHeight = '1.2em';
            
            if (input.placeholder?.includes('Опис') || input.className.includes('text-[10px]')) {
              span.style.marginTop = '2px';
              span.style.opacity = '0.8';
            }
            
            input.parentNode.replaceChild(span, input);
          });

          const header = el.querySelector('.print-header') as HTMLElement;
          if (header) {
            header.style.display = 'block'; // Outer wrapper
            const inner = header.querySelector('.print-logo-row') as HTMLElement;
            if (inner) {
              inner.style.display = 'flex';
              inner.style.justifyContent = 'space-between';
              inner.style.width = '100%';
              inner.style.alignItems = 'flex-start';
              inner.style.borderBottom = '2px solid #f59e0b';
              inner.style.paddingBottom = '16px';
              inner.style.marginBottom = '16px';
            }
            
            const logo = el.querySelector('.print-logo') as HTMLImageElement;
            if (logo) {
              logo.style.height = '45px';
              logo.style.width = 'auto';
            }
          }
          
          el.querySelectorAll('.no-print').forEach(node => {
            (node as HTMLElement).style.display = 'none';
          });

          el.querySelectorAll('.cost-column').forEach(node => {
            (node as HTMLElement).style.display = 'none';
          });

          // Уніфікація шрифтів та стилізація опису
          const table = el.querySelector('table');
          if (table) {
            table.style.fontSize = '11px';
            const allCells = el.querySelectorAll('td, th');
            allCells.forEach((cell: any) => {
              cell.style.fontSize = '11px';
              // Назва та опис товару у другій колонці
              if (cell.cellIndex === 1) {
                const spans = cell.querySelectorAll('span');
                if (spans.length >= 1) {
                  spans[0].style.fontWeight = '700';
                  spans[0].style.fontSize = '11px';
                  spans[0].style.display = 'block';
                  spans[0].style.marginBottom = '2px';
                }
                if (spans.length >= 2) {
                  spans[1].style.fontStyle = 'italic';
                  spans[1].style.fontSize = '10px';
                  spans[1].style.color = '#64748b';
                  spans[1].style.display = 'block';
                  spans[1].style.marginTop = '1px';
                }
              }
              
              // Центрування (крім назви та підсумкового рядка)
              if (cell.cellIndex !== 1 && !cell.hasAttribute('colspan')) {
                cell.style.textAlign = 'center';
                const spans = cell.querySelectorAll('span');
                spans.forEach((s: any) => {
                  s.style.textAlign = 'center';
                  s.style.display = 'block';
                  s.style.width = '100%';
                });
              } else if (cell.hasAttribute('colspan')) {
                cell.style.textAlign = 'right';
                cell.style.paddingRight = '10px';
              }
            });
          }

          // Коригування ширини стовпців для кращого вигляду на скріншоті
          const tableHeaders = el.querySelectorAll('th');
          if (tableHeaders.length >= 8) {
            tableHeaders[0].style.width = '45px';  // # 
            tableHeaders[1].style.width = 'auto';  // Назва (займає решту)
            tableHeaders[2].style.width = '65px';  // Од.
            tableHeaders[3].style.width = '85px';  // Кіл.
            tableHeaders[6].style.width = '125px'; // Ціна
            tableHeaders[7].style.width = '145px'; // Сума
          }
        }
      }
    });

    const photoBase64 = canvas.toDataURL('image/png').split(',')[1];
    const caption = `📋 ${proposal.number} від ${proposal.date}`;

    await telegramRequest('sendPhoto', { photoBase64, caption }, botToken, chatId);
  } finally {
    // No more manual restores needed as we didn't touch the real DOM
  }
}

async function sendTelegramPdf(proposal: Proposal, botToken?: string, chatId?: string) {
  // Generate PDF using existing function
  const pdfBlob = await exportToPDF(proposal, true);

  if (!pdfBlob) {
    throw new Error('Failed to generate PDF');
  }

  // Convert blob to base64
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
      // Server-side proxy
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
        throw new Error(`Сервер повернув некоректну відповідь (можливо, бекенд не запущено). Статус: ${resp.status}`);
      }
      
      if (!resp.ok) throw new Error(result.error || `Помилка сервера: ${resp.status}`);
      return result;
    } catch (e) {
      console.warn('Proxy failed, checking direct API fallback:', e);
      if (!botToken || !chatId) {
        const errorMsg = e instanceof Error ? e.message : 'серверний проксі не відповідає';
        throw new Error(`Не вдалося надіслати: ${errorMsg}. Перевірте, чи запущено 'npx vercel dev' та чи вказані токени в налаштуваннях.`);
      }
      // Continue to direct API below
    }
  }

  // Direct Telegram API fallback or default for non-deployed
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

// Viber integration
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

  let text = `📋 Пропозиція ${proposal.number} від ${proposal.date}\n`;
  text += `💰 Сума: ${formatCurrency(totalSum, proposal.currency)}`;

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
        const el = clonedDoc.getElementById(mainEl.id);
        if (el) {
          clonedDoc.body.classList.add('is-exporting');
          el.style.width = '1200px';
          el.style.padding = '40px';
          el.style.background = '#ffffff';
          
          const inputs = el.querySelectorAll('input, select, textarea');
          inputs.forEach((input: any) => {
            const span = clonedDoc.createElement('span');
            span.textContent = input.value;
            if (input.tagName === 'SELECT') {
              const selectedOption = input.options[input.selectedIndex];
              span.textContent = selectedOption ? selectedOption.text : '';
            }
            const style = window.getComputedStyle(input);
            span.style.display = 'block';
            span.style.width = '100%';
            span.style.color = style.color;
            span.style.fontSize = style.fontSize;
            span.style.fontWeight = style.fontWeight;
            span.style.fontFamily = style.fontFamily;
            span.style.minHeight = '1.2em';

            if (input.placeholder?.includes('Опис') || input.className.includes('text-[10px]')) {
              span.style.marginTop = '2px';
              span.style.opacity = '0.8';
            }
            input.parentNode.replaceChild(span, input);
          });

          const header = el.querySelector('.print-header') as HTMLElement;
          if (header) {
            header.style.display = 'block';
            const inner = header.querySelector('.print-logo-row') as HTMLElement;
            if (inner) {
              inner.style.display = 'flex';
              inner.style.justifyContent = 'space-between';
              inner.style.width = '100%';
              inner.style.alignItems = 'flex-start';
              inner.style.borderBottom = '2px solid #f59e0b';
              inner.style.paddingBottom = '16px';
              inner.style.marginBottom = '16px';
            }
            
            const logo = el.querySelector('.print-logo') as HTMLImageElement;
            if (logo) {
              logo.style.height = '45px';
              logo.style.width = 'auto';
            }
          }
          
          el.querySelectorAll('.no-print').forEach(node => {
            (node as HTMLElement).style.display = 'none';
          });
          el.querySelectorAll('.cost-column').forEach(node => {
            (node as HTMLElement).style.display = 'none';
          });

          // Уніфікація шрифтів та стилізація опису
          const table = el.querySelector('table');
          if (table) {
            table.style.fontSize = '11px';
            const allCells = el.querySelectorAll('td, th');
            allCells.forEach((cell: any) => {
              cell.style.fontSize = '11px';
              // Назва та опис товару у другій колонці
              if (cell.cellIndex === 1) {
                const spans = cell.querySelectorAll('span');
                if (spans.length >= 1) {
                  spans[0].style.fontWeight = '700';
                  spans[0].style.fontSize = '11px';
                  spans[0].style.display = 'block';
                  spans[0].style.marginBottom = '2px';
                }
                if (spans.length >= 2) {
                  spans[1].style.fontStyle = 'italic';
                  spans[1].style.fontSize = '10px';
                  spans[1].style.color = '#64748b';
                  spans[1].style.display = 'block';
                  spans[1].style.marginTop = '1px';
                }
              }
              
              // Центрування (крім назви та підсумкового рядка)
              if (cell.cellIndex !== 1 && !cell.hasAttribute('colspan')) {
                cell.style.textAlign = 'center';
                const spans = cell.querySelectorAll('span');
                spans.forEach((s: any) => {
                  s.style.textAlign = 'center';
                  s.style.display = 'block';
                  s.style.width = '100%';
                });
              } else if (cell.hasAttribute('colspan')) {
                cell.style.textAlign = 'right';
                cell.style.paddingRight = '10px';
              }
            });
          }

          // Коригування ширини стовпців для кращого вигляду на скріншоті
          const tableHeaders = el.querySelectorAll('th');
          if (tableHeaders.length >= 8) {
            tableHeaders[0].style.width = '45px';  // # 
            tableHeaders[1].style.width = 'auto';  // Назва (займає решту)
            tableHeaders[2].style.width = '65px';  // Од.
            tableHeaders[3].style.width = '85px';  // Кіл.
            tableHeaders[6].style.width = '125px'; // Ціна
            tableHeaders[7].style.width = '145px'; // Сума
          }
        }
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
  } finally {
    document.body.classList.remove('is-exporting');
  }
}

async function sendViberPdf(proposal: Proposal) {
  // Generate and download PDF
  await exportToPDF(proposal);
  alert('📥 PDF готовий. Надішліть його вручну у Viber');
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

// Helper: Convert all images in container to Base64 to avoid CORS issues in canvas
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

// Helper: Image URL to Base64
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
