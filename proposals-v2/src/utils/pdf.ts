import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { Proposal } from '../types';

/**
 * Генерує PDF, який 100% ідентичний офіційному дизайну друкованої форми КП
 */
export async function exportToPDF(proposal: Proposal, returnBlob = false, showCost = false): Promise<Blob | void> {
  const printTemplate = document.getElementById('print-proposal-template');
  const mainEl = document.getElementById('proposal-container') || document.getElementById('mainContent');

  if (!mainEl && !printTemplate) throw new Error('Елемент пропозиції не знайдено');

  const targetEl = (!showCost && printTemplate) ? printTemplate : mainEl!;

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

  try {
    const captureWidth = (!showCost && printTemplate) ? 850 : (targetEl.scrollWidth || 1200);

    const dataUrl = await toPng(targetEl, {
      quality: 0.88,
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

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();

    const img = new Image();
    img.src = dataUrl;
    await new Promise((res) => { img.onload = res; });

    const pdfHeight = (img.height * pdfWidth) / img.width;

    pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    if (returnBlob) {
      return pdf.output('blob');
    } else {
      pdf.save(`${proposal.number.replace(/\//g, '-')}.pdf`);
    }
  } catch (error) {
    if (restoreStyle) restoreStyle();
    console.error('PDF Export Error:', error);
    throw error;
  }
}
