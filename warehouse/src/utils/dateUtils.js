/**
 * Форматує дату у вигляд ДД.ММ.РРРР
 * Підтримує ISO рядки, об'єкти Date та рядки YYYY-MM-DD
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  
  const s = String(dateStr);
  
  // Якщо вже у форматі ДД.ММ.РРРР - повертаємо як є
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;

  try {
    // 1. Спробуємо через стандартний конструктор Date (найкраще для ISO системних дат)
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      
      // Додаткова перевірка: якщо рік занадто малий (напр. 1970) або нереальний
      if (year > 2000 && year < 2100) {
        return `${day}.${month}.${year}`;
      }
    }

    // 2. Фолбек: ручний парсинг РРРР-ММ-ДД (якщо Date() видає щось не те)
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [_, year, month, dayPart] = isoMatch;
      // Беремо тільки перші дві цифри дня (ігноруємо T... якщо воно потрапило в групу)
      const day = dayPart.substring(0, 2);
      return `${day}.${month}.${year}`;
    }
  } catch (e) {
    console.error('Format date error:', e);
  }

  return s;
}

/**
 * Отримує поточну дату у форматі YYYY-MM-DD (для input type="date")
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}
