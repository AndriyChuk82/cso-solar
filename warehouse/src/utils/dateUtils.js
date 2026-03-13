/**
 * Форматує дату з формату YYYY-MM-DD у DD.MM.YYYY
 * @param {string} dateStr 
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  
  // Якщо дата вже у форматі DD.MM.YYYY, повертаємо як є
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return dateStr;

  try {
    // Обробка ISO Date String або YYYY-MM-DD
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`;
    }
    
    // Спроба розпарсити через Date об'єкт
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}.${m}.${y}`;
    }
    
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Отримує поточну дату у форматі YYYY-MM-DD (для input type="date")
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}
