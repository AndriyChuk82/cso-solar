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
/**
 * Словник синонімів та фонетичної транслітерації популярних брендів.
 */
function mapSynonyms(word) {
  const lower = word.toLowerCase();
  
  // Deye
  if (/^(деє|дей|деі|дее|деи|деї)$/.test(lower)) return 'deye';
  
  // Growatt
  if (/^(гроуват|гроват|гроватт|гроуватт)$/.test(lower)) return 'growatt';
  
  // Victron
  if (/^(віктрон|виктрон|виктон|віктон)$/.test(lower)) return 'victron';
  
  // Pylontech
  if (/^(пилонтех|пілонтех|пайлонтех|пайлон)$/.test(lower)) return 'pylontech';
  
  // Jinko
  if (/^(джинко|джинкоу|дзинко)$/.test(lower)) return 'jinko';
  
  // Longi
  if (/^(лонгі|лонги|лонжи)$/.test(lower)) return 'longi';
  
  // Must
  if (/^(маст|муст)$/.test(lower)) return 'must';
  
  // Solis
  if (/^(соліс|солис)$/.test(lower)) return 'solis';
  
  // Huawei
  if (/^(хуавей|хуавеї)$/.test(lower)) return 'huawei';
  
  // Alicosolar
  if (/^(алікосолар|аликосолар|аліко)$/.test(lower)) return 'alicosolar';
  
  return word;
}

export function matchesSearch(content, query) {
  if (!query || !query.trim()) return true;
  const searchWords = query.trim().split(/\s+/).filter(w => w.length > 0);
  
  const normalizedContent = normalizeForSearch(content);
  
  return searchWords.every(word => {
    const mappedWord = mapSynonyms(word);
    const normalizedWord = normalizeForSearch(mappedWord);
    const originalNormalizedWord = normalizeForSearch(word);
    
    const checkMatch = (w) => {
      // Якщо пошукове слово складається лише з цифр, воно має збігатися як окреме число
      // (без сусідніх цифр, тобто не бути частиною чисел на кшталт 80, 180 або 038)
      if (/^\d+$/.test(w)) {
        let index = normalizedContent.indexOf(w);
        while (index !== -1) {
          const prevChar = index > 0 ? normalizedContent[index - 1] : '';
          const nextChar = index + w.length < normalizedContent.length 
            ? normalizedContent[index + w.length] 
            : '';
          const isPrevDigit = prevChar >= '0' && prevChar <= '9';
          const isNextDigit = nextChar >= '0' && nextChar <= '9';
          
          if (!isPrevDigit && !isNextDigit) {
            return true;
          }
          index = normalizedContent.indexOf(w, index + 1);
        }
        return false;
      }
      return normalizedContent.includes(w);
    };
    
    return checkMatch(normalizedWord) || checkMatch(originalNormalizedWord);
  });
}

