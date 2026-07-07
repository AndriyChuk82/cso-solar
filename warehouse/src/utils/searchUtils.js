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
 * Більш жорстка нормалізація для перевірки на дублікати (видаляє пробіли та спецсимволи)
 */
export function normalizeForComparison(str) {
  if (!str) return '';
  return normalizeForSearch(str).replace(/[\s\W_]/g, '');
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
    const normalizedWord = normalizeForSearch(word);
    
    // Якщо пошукове слово складається лише з цифр, воно має збігатися як окреме число
    // (без сусідніх цифр, тобто не бути частиною чисел на кшталт 80, 180 або 038)
    if (/^\d+$/.test(normalizedWord)) {
      let index = normalizedContent.indexOf(normalizedWord);
      while (index !== -1) {
        const prevChar = index > 0 ? normalizedContent[index - 1] : '';
        const nextChar = index + normalizedWord.length < normalizedContent.length 
          ? normalizedContent[index + normalizedWord.length] 
          : '';
        const isPrevDigit = prevChar >= '0' && prevChar <= '9';
        const isNextDigit = nextChar >= '0' && nextChar <= '9';
        
        if (!isPrevDigit && !isNextDigit) {
          return true;
        }
        index = normalizedContent.indexOf(normalizedWord, index + 1);
      }
      return false;
    }
    
    return normalizedContent.includes(normalizedWord);
  });
}

