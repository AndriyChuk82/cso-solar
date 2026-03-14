/**
 * Повна транслітерація кирилиці в латиницю для пошуку.
 * Дозволяє знаходити товари навіть при введенні латинськими літерами.
 * Наприклад: "prob" знайде "Пробка", "solar" знайде "Солар"
 */
const TRANSLIT_MAP = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'ґ': 'g', 'д': 'd',
  'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i',
  'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
  'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ь': '', 'ю': 'yu', 'я': 'ya', 'ъ': '', 'ы': 'y', 'э': 'e'
};

/**
 * Нормалізація рядка для пошуку (транслітерація кирилиці + lowercase)
 * @param {string} str — рядок для нормалізації
 * @returns {string} — нормалізований рядок (повністю латиниця, lowercase)
 */
export function normalizeForSearch(str) {
  if (!str) return '';
  return str.toString().toLowerCase().split('').map(ch => TRANSLIT_MAP[ch] || ch).join('');
}

/**
 * Перевіряє, чи містить рядок пошуковий запит.
 * Шукає і по оригінальному тексту (lowercase), і по транслітерованому.
 * @param {string} content — текст, в якому шукаємо
 * @param {string} query — пошуковий запит
 * @returns {boolean}
 */
export function matchesSearch(content, query) {
  if (!query || !query.trim()) return true;
  const searchWords = query.trim().toLowerCase().split(/\s+/);
  const original = (content || '').toString().toLowerCase();
  const transliterated = normalizeForSearch(content);
  
  return searchWords.every(word => {
    const wordTranslit = normalizeForSearch(word);
    return original.includes(word) || transliterated.includes(word) || transliterated.includes(wordTranslit);
  });
}
