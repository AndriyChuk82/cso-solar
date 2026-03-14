/**
 * Нормалізація рядка для пошуку (видалення розбіжностей між кирилицею та латиницею)
 * Створено ідентично до головного додатка Комерційних Пропозицій (app.js).
 */
export function normalizeForSearch(str) {
  if (!str) return '';
  return str.toString().toLowerCase()
      .replace(/р/g, 'p') // кирилична 'р' -> 'p'
      .replace(/с/g, 'c') // кирилична 'с' -> 'c'
      .replace(/о/g, 'o') // кирилична 'о' -> 'o'
      .replace(/а/g, 'a') // кирилична 'а' -> 'a'
      .replace(/х/g, 'x') // кирилична 'х' -> 'x'
      .replace(/у/g, 'y') // кирилична 'у' -> 'y'
      .replace(/е/g, 'e') // кирилична 'е' -> 'e'
      .replace(/і/g, 'i') // кирилична 'і' -> 'i'
      .replace(/в/g, 'b'); // кирилична 'в' -> 'b' (схожість В та B)
}

/**
 * Перевіряє, чи містить рядок пошуковий запит.
 * @param {string} content — текст, в якому шукаємо
 * @param {string} query — пошуковий запит
 * @returns {boolean}
 */
export function matchesSearch(content, query) {
  if (!query || !query.trim()) return true;
  const searchWords = query.trim().split(/\s+/).filter(w => w.length > 0);
  
  const normalizedContent = normalizeForSearch(content);
  
  return searchWords.every(word => {
    return normalizedContent.includes(normalizeForSearch(word));
  });
}

