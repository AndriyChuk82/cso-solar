/**
 * Нормалізація рядка для пошуку (видалення розбіжностей між кирилицею та латиницею)
 * @param {string} str — рядок для нормалізації
 * @returns {string} — нормалізований рядок (lowercase + замінені гомогліфи)
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
        .replace(/м/g, 'm') // кирилична 'м' (схожа)
        .replace(/к/g, 'k') // кирилична 'к' (схожа)
        .replace(/в/g, 'b'); // кирилична 'в' -> 'b'
}

/**
 * Перевіряє, чи містить рядок пошуковий запит (з урахуванням нормалізації)
 * @param {string} content — текст, в якому шукаємо
 * @param {string} query — пошуковий запит
 * @returns {boolean}
 */
export function matchesSearch(content, query) {
    if (!query || !query.trim()) return true;
    const searchWords = query.trim().split(/\s+/);
    const normalizedContent = normalizeForSearch((content || '').toString());
    
    return searchWords.every(word => normalizedContent.includes(normalizeForSearch(word)));
}
