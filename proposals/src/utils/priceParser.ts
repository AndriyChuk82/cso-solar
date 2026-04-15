import { Currency } from '../types';

/**
 * Результат парсингу ціни
 */
export interface ParsedPrice {
  value: number;
  currency: Currency;
}

/**
 * Парсить ціну з рядка, підтримуючи різні формати:
 * - "850" → { value: 850, currency: 'USD' }
 * - "800 гот / 960 з ПДВ" → { value: 800, currency: 'USD' }
 * - "1200€" → { value: 1200, currency: 'EUR' }
 * - "45000 грн" → { value: 45000, currency: 'UAH' }
 *
 * @param str - Рядок з ціною
 * @returns Об'єкт з числовим значенням та валютою, або null якщо не вдалося розпарсити
 */
export function parsePrice(str: string): ParsedPrice | null {
  if (!str || str.trim() === '') return null;

  let s = str.trim();
  let currency: Currency = 'USD';

  // Визначення валюти за символами
  if (s.includes('€')) currency = 'EUR';
  if (s.includes('₴') || s.toLowerCase().includes('грн')) currency = 'UAH';

  // КРИТИЧНО: Обробка формату "800 гот / 960 з ПДВ"
  // Витягуємо перше число ДО видалення символів валюти
  if (s.toLowerCase().includes('гот') || s.includes('/')) {
    const match = s.match(/[\d\s,.]+/);
    if (match) {
      s = match[0];
    }
  }

  // Видаляємо символи валюти
  s = s.replace(/[$€₴]|грн/gi, '').trim();

  // Видаляємо пробіли (наприклад, "1 200" → "1200")
  s = s.replace(/\s/g, '');

  // Замінюємо кому на крапку для decimal
  s = s.replace(',', '.');

  const val = parseFloat(s);

  // Валідація результату
  if (isNaN(val) || val <= 0) {
    console.warn('⚠️ parsePrice не зміг розпарсити:', {
      original: str,
      afterProcessing: s,
      parsedValue: val,
      isNaN: isNaN(val)
    });
    return null;
  }

  return { value: val, currency };
}

/**
 * Генерує стабільний ID на основі рядка (hash)
 * Використовується для створення унікальних ID продуктів
 */
export function generateStableId(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'p' + Math.abs(hash).toString(36);
}
