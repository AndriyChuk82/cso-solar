import { Proposal } from '../types';
import { formatCurrency } from './currency';
import html2canvas from 'html2canvas';
import { toPng, toBlob } from 'html-to-image';
import { exportToPDF } from './pdf';
import { useProposalStore } from '../store';
import { toast } from 'sonner';

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

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

function buildProposalCaption(proposal: Proposal): string {
  const dateFormatted = formatDisplayDate(proposal.date);
  let caption = `📋 ${proposal.number} від ${dateFormatted}`;
  if (proposal.clientName && proposal.clientName.trim()) {
    caption += `\n👤 Клієнт: ${proposal.clientName.trim()}`;
  }
  return caption;
}

async function sendTelegramText(proposal: Proposal, botToken?: string, chatId?: string) {
  const dateFormatted = formatDisplayDate(proposal.date);
  let text = `📋 <b>${escapeHtml(proposal.number)}</b> від ${dateFormatted}\n`;
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
      scale: 1.5, 
      useCORS: false,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        const { settings } = useProposalStore.getState();
        prepareElementForCapture(clonedDoc, mainEl.id, settings.showCostInCapture);
      }
    });

    const photoBase64 = canvas.toDataURL('image/png').split(',')[1];
    const caption = buildProposalCaption(proposal);

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

  const caption = buildProposalCaption(proposal);
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

export async function takeProposalScreenshot(): Promise<void> {
  const toastId = toast.loading('📸 Створення скріншоту КП...');
  const t0 = performance.now();

  await new Promise((resolve) => setTimeout(resolve, 30));

  try {
    const { settings } = useProposalStore.getState();
    const showCost = settings.showCostInCapture;
    const printTemplate = document.getElementById('print-proposal-template');
    const mainEl = document.getElementById('proposal-container') || document.getElementById('mainContent');

    if (!mainEl && !printTemplate) {
      toast.error('Елемент пропозиції не знайдено', { id: toastId });
      return;
    }

    const targetEl = (!showCost && printTemplate) ? printTemplate : mainEl!;

    // Тимчасово робимо друкований шаблон видимим з шириною 850px та відступами
    let restoreStyle: (() => void) | null = null;
    if (!showCost && printTemplate) {
      const origDisplay = printTemplate.style.display;
      const origWidth = printTemplate.style.width;
      const origMaxWidth = printTemplate.style.maxWidth;
      const origMargin = printTemplate.style.margin;
      const origPadding = printTemplate.style.padding;
      const origBackground = printTemplate.style.background;

      printTemplate.classList.remove('hidden', 'print:block');
      printTemplate.style.setProperty('display', 'block', 'important');
      printTemplate.style.width = '850px';
      printTemplate.style.maxWidth = '850px';
      printTemplate.style.margin = '0 auto';
      printTemplate.style.padding = '30px';
      printTemplate.style.background = '#ffffff';

      restoreStyle = () => {
        printTemplate.style.display = origDisplay;
        printTemplate.style.width = origWidth;
        printTemplate.style.maxWidth = origMaxWidth;
        printTemplate.style.margin = origMargin;
        printTemplate.style.padding = origPadding;
        printTemplate.style.background = origBackground;
        printTemplate.classList.add('hidden', 'print:block');
      };
    }

    const captureWidth = (!showCost && printTemplate) ? 850 : (targetEl.scrollWidth || 1200);

    // ⚡ html-to-image з чіткими габаритами width: 850 та margin: 0 для 100% повнорозмірного відмалювання
    const dataUrl = await toPng(targetEl, {
      quality: 0.95,
      pixelRatio: 1.5,
      backgroundColor: '#ffffff',
      width: captureWidth,
      style: {
        margin: '0',
        padding: '30px',
        width: `${captureWidth}px`,
        maxWidth: `${captureWidth}px`,
        display: 'block',
        transform: 'none',
      },
      cacheBust: false,
      filter: (node: Node) => {
        if (node instanceof HTMLElement && (node.tagName === 'SCRIPT' || node.tagName === 'IFRAME')) {
          return false;
        }
        return true;
      }
    });

    if (restoreStyle) restoreStyle();

    const renderTime = Math.round(performance.now() - t0);
    console.log(`⚡ html-to-image completed in ${renderTime}ms`);

    toast.success(`📸 Скріншот готовий (${renderTime}мс)! Вставте (Ctrl+V) у чат.`, { id: toastId, duration: 4000 });

    // Отримання блоба для буфера обміну
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({ [blob.type]: blob });
      navigator.clipboard.write([item]).catch((clipboardErr) => {
        console.warn('Clipboard background write failed, downloading fallback...', clipboardErr);
        const link = document.createElement('a');
        link.download = `KP_Screenshot_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      });
    }
  } catch (error) {
    console.error('Screenshot generation error:', error);
    toast.error('Помилка при створенні скріншоту', { id: toastId });
  }
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

  // ПРЕМІУМ ШАБЛОН ДЛЯ ЕКСПОРТУ ЗНІМКІВ
  const printTemplate = clonedDoc.getElementById('print-proposal-template');
  if (printTemplate && !showCost) {
    // Ховаємо весь інтерактивний редактор з скріншоту
    el.querySelectorAll('.no-print').forEach((node) => {
      (node as HTMLElement).style.setProperty('display', 'none', 'important');
    });

    // Робимо красивий друкований шаблон видимим для знімку
    printTemplate.classList.remove('hidden');
    printTemplate.classList.remove('print:block');
    printTemplate.style.setProperty('display', 'block', 'important');
    printTemplate.style.width = '800px';
    printTemplate.style.margin = '0 auto';
    printTemplate.style.padding = '20px';
    printTemplate.style.background = '#ffffff';

    el.style.width = '840px';
    el.style.padding = '10px';
    el.style.background = '#ffffff';
    return;
  }

  // Якщо собівартість має показуватись на фото, ми фотографуємо інтерактивний редактор з собівартістю
  if (showCost) {
    const editorContainer = clonedDoc.getElementById('proposal-editor-container');
    if (editorContainer) {
      editorContainer.classList.remove('no-print');
    }
  }

  clonedDoc.body.classList.add('is-exporting');
  
  // Стилізуємо зовнішній контейнер як сучасну картку з верхньою фірмовою лінією
  el.style.width = '1150px';
  el.style.padding = '50px 60px';
  el.style.background = '#ffffff';
  el.style.fontFamily = "'Inter', -apple-system, sans-serif";
  el.style.color = '#1e293b';
  el.style.borderRadius = '24px';
  el.style.border = '1px solid rgba(232, 228, 209, 0.6)';
  el.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.03)';
  el.style.position = 'relative';
  el.style.overflow = 'hidden';

  // Декоративна градієнтна лінія у верхній частині документа (як у друкованому КП)
  let topStrip = el.querySelector('.export-top-strip') as HTMLElement;
  if (!topStrip) {
    topStrip = clonedDoc.createElement('div');
    topStrip.className = 'export-top-strip';
    topStrip.style.position = 'absolute';
    topStrip.style.top = '0';
    topStrip.style.left = '0';
    topStrip.style.right = '0';
    topStrip.style.height = '6px';
    topStrip.style.background = 'linear-gradient(to right, #fbbf24, #f97316, #f59e0b)';
    el.appendChild(topStrip);
  }

  const allElements = el.querySelectorAll('*');
  allElements.forEach((node: any) => {
    node.style.fontFamily = "'Inter', -apple-system, sans-serif";
  });

  // 1. СТИЛІЗАЦІЯ БЛОКУ КЛІЄНТА (СВІТЛО-СЛАНЦЕВИЙ, КЛАСИЧНИЙ)
  const clientBlock = el.querySelector('.client-info-block') as HTMLElement;
  if (clientBlock) {
    clientBlock.style.background = '#f8fafc';
    clientBlock.style.borderRadius = '16px';
    clientBlock.style.border = '1px solid #e8e4d1';
    clientBlock.style.padding = '16px 20px';
    clientBlock.style.marginBottom = '25px';
    
    const h3 = clientBlock.querySelector('h3');
    if (h3) {
      h3.style.color = '#475569';
      h3.style.fontSize = '11px';
      h3.style.fontWeight = '700';
      h3.style.marginBottom = '10px';
    }
  }

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
    header.style.borderBottom = '2px solid #f59e0b';
    header.style.marginBottom = '20px';
    header.style.paddingBottom = '10px';
    
    const inner = header.querySelector('.print-logo-row') as HTMLElement;
    if (inner) {
      inner.style.display = 'flex';
      inner.style.justifyContent = 'space-between';
      inner.style.width = '100%';
      inner.style.alignItems = 'flex-end';
      inner.style.paddingBottom = '8px';
      inner.style.marginBottom = '0px';
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

  // Стилізація та відображення рядка прибутку (Маржинальності) — у зелених тонах
  el.querySelectorAll('.profit-row').forEach(node => {
    const htmlNode = node as HTMLElement;
    if (showCost) {
      htmlNode.style.setProperty('display', 'table-row', 'important');
      htmlNode.classList.remove('no-print');
      
      const cells = htmlNode.querySelectorAll('td');
      cells.forEach(c => {
        c.style.background = '#f0fdf4'; // М'яке зелене тло
        c.style.color = '#166534'; // Темно-зелений текст
        c.style.padding = '12px 12px';
        c.style.borderTop = '1px solid #bbf7d0';
        c.style.borderBottom = 'none';
      });
      
      // Стилізація тексту всередині рядка прибутку
      const spanBadge = htmlNode.querySelector('span');
      if (spanBadge) {
        spanBadge.style.background = 'transparent';
        spanBadge.style.padding = '0';
        spanBadge.style.color = '#166534';
      }
    } else {
      htmlNode.style.setProperty('display', 'none', 'important');
    }
  });

  const table = el.querySelector('table');
  if (table) {
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '11.5px';
    table.style.marginBottom = '20px';
    
    const allCells = el.querySelectorAll('td, th');
    allCells.forEach((cell: any) => {
      cell.style.fontSize = '11.5px';
      cell.style.padding = '10px 12px';
      cell.style.color = '#1e293b';
      cell.style.borderBottom = '1px solid rgba(232, 228, 209, 0.6)'; // Вишукані піщані межі

      // Стовпчик номерів рядків (#)
      if (cell.cellIndex === 0 && cell.tagName === 'TD') {
        cell.style.color = '#a89a74';
        cell.style.fontWeight = '750';
      }

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
      th.style.backgroundColor = '#f1f5f9'; // Сучасне світло-сіре тло
      th.style.color = '#1e293b';
      th.style.fontWeight = '800';
      th.style.textTransform = 'uppercase';
      th.style.fontSize = '10px';
      th.style.letterSpacing = '0.05em';
      th.style.padding = '12px 10px';
      th.style.borderBottom = '2px solid #e8e4d1'; // Чітка піщана лінія знизу
    });

    // Детальна стилізація підсумкового футера (tfoot)
    const tfoot = table.querySelector('tfoot');
    if (tfoot) {
      const rows = tfoot.querySelectorAll('tr');
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        
        if (row.classList.contains('profit-row')) {
          // Вже оброблено вище
          return;
        }
        
        if (row.classList.contains('font-bold')) {
          // Рядок "Всього до сплати": яскравий бурштиново-оранжевий градієнт
          row.style.background = 'linear-gradient(to right, #f59e0b, #ea580c)';
          cells.forEach(c => {
            c.style.background = 'transparent';
            c.style.color = '#ffffff';
            c.style.padding = '16px 12px';
            c.style.border = 'none';
            c.style.fontWeight = '900';
            
            if (c.className.includes('text-primary') || c.cellIndex === cells.length - 2) {
              c.style.fontSize = '16px';
            } else {
              c.style.fontSize = '12px';
              c.style.textTransform = 'uppercase';
              c.style.letterSpacing = '0.05em';
            }
          });
        } else {
          // Проміжні рядки (Сума без ПДВ, ПДВ)
          row.style.background = '#ffffff';
          cells.forEach(c => {
            c.style.background = '#ffffff';
            c.style.color = '#475569';
            c.style.padding = '10px 12px';
            c.style.borderBottom = '1px solid rgba(232, 228, 209, 0.5)';
            
            if (c.cellIndex === cells.length - 2 || c.cellIndex === 4) {
              c.style.color = '#1e293b';
              c.style.fontWeight = '700';
            }
          });
        }
      });
    }

    const headersArray = Array.from(tableHeaders);
    if (headersArray.length >= 8) {
      headersArray[0].style.width = '45px';
      headersArray[1].style.width = 'auto';
      headersArray[2].style.width = '65px';
      headersArray[3].style.width = '85px';
      
      if (showCost) {
        headersArray[4].style.width = '100px'; // Собівартість
        headersArray[5].style.width = '110px'; // Сума соб.
        headersArray[6].style.width = '110px'; // Ціна продажу
        headersArray[7].style.width = '130px'; // Сума продажу
        
        [4, 5].forEach(idx => {
          if (headersArray[idx]) {
            headersArray[idx].style.setProperty('display', 'table-cell', 'important');
            headersArray[idx].style.textAlign = 'center';
          }
        });
      } else {
        headersArray[6].style.width = '110px';
        headersArray[7].style.width = '130px';
        
        [4, 5].forEach(idx => {
          if (headersArray[idx]) {
            headersArray[idx].style.setProperty('display', 'none', 'important');
          }
        });
      }
    }
  }

  // Охайне оформлення бейджів постачальників та вхідних цін
  const spans = el.querySelectorAll('span');
  spans.forEach((span: any) => {
    if (span.textContent?.includes('Постачальник:')) {
      span.style.background = '#f1f5f9';
      span.style.color = '#475569';
      span.style.border = '1px solid #cbd5e1';
      span.style.borderRadius = '4px';
      span.style.padding = '2px 6px';
      span.style.fontSize = '8px';
      span.style.fontWeight = '800';
      span.style.textTransform = 'uppercase';
      span.style.display = 'inline-flex';
      span.style.alignItems = 'center';
    }
    if (span.textContent?.includes('Вхідна ціна:')) {
      span.style.background = '#fef3c7';
      span.style.color = '#b45309';
      span.style.border = '1px solid #fde68a';
      span.style.borderRadius = '4px';
      span.style.padding = '2px 6px';
      span.style.fontSize = '8px';
      span.style.fontWeight = '800';
      span.style.textTransform = 'uppercase';
      span.style.display = 'inline-flex';
      span.style.alignItems = 'center';
    }
  });

  // Стилізація блоку приміток (Примітки) під загальний стиль друку
  const allContainers = el.querySelectorAll('div');
  allContainers.forEach((div: any) => {
    const label = div.querySelector('label');
    if (label && label.textContent?.includes('Примітки')) {
      div.style.background = '#fdfbf7'; // М'який теплий крем
      div.style.border = '1px solid #e8e4d1'; // Піщана межа
      div.style.padding = '16px 20px';
      div.style.borderRadius = '12px';
      div.style.marginTop = '24px';
      div.style.boxShadow = 'none';
      
      label.style.color = '#a89a74';
      label.style.fontWeight = '800';
      label.style.textTransform = 'uppercase';
      label.style.fontSize = '9px';
      label.style.letterSpacing = '0.05em';
      label.style.marginBottom = '6px';
      label.style.display = 'block';

      const textareaSpan = div.querySelector('span');
      if (textareaSpan) {
        textareaSpan.style.color = '#475569';
        textareaSpan.style.fontSize = '11.5px';
        textareaSpan.style.lineHeight = '1.5';
        textareaSpan.style.fontStyle = 'italic';
        textareaSpan.style.fontWeight = '600';
        textareaSpan.style.whiteSpace = 'pre-wrap';
      }
    }

    // Стилізація тексту про розрахунок курсу валют
    if (div.textContent?.includes('* Розрахунок проведено за курсом:')) {
      div.style.color = '#64748b';
      div.style.fontSize = '10px';
      div.style.fontWeight = '500';
      div.style.fontStyle = 'italic';
      div.style.borderTop = '1px solid #e2e8f0';
      div.style.paddingTop = '10px';
      div.style.marginTop = '15px';
      
      const cursSpans = div.querySelectorAll('span');
      cursSpans.forEach((s: any) => {
        s.style.color = '#475569';
        s.style.fontWeight = '700';
      });
    }
  });

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
