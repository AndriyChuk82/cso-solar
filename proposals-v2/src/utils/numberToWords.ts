/**
 * Функція для перетворення числа в суму прописом (українською мовою).
 */
export function numberToWords(amount: number): string {
  const units = ['', 'один', 'два', 'три', 'чотири', 'п\'ять', 'шість', 'сім', 'вісім', 'дев\'ять'];
  const unitsFemale = ['', 'одна', 'дві', 'три', 'чотири', 'п\'ять', 'шість', 'сім', 'вісім', 'дев\'ять'];
  const teens = ['десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять', 'п\'ятнадцять', 'шістнадцять', 'сімнадцять', 'вісімнадцять', 'дев\'ятнадцять'];
  const tens = ['', '', 'двадцять', 'тридцять', 'сорок', 'п\'ятдесят', 'шістдесят', 'сімдесят', 'вісімдесят', 'дев\'яносто'];
  const hundreds = ['', 'сто', 'двісті', 'триста', 'чотириста', 'п\'ятсот', 'шістсот', 'сімсот', 'вісімсот', 'дев\'ятсот'];

  function convertGroup(n: number, isFemale: boolean = false): string {
    let res = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) res += hundreds[h] + ' ';
    if (t === 1) {
      res += teens[u] + ' ';
    } else {
      if (t > 1) res += tens[t] + ' ';
      if (u > 0) res += (isFemale ? unitsFemale[u] : units[u]) + ' ';
    }
    return res.trim();
  }

  function getDeclension(n: number, forms: [string, string, string]): string {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  }

  if (amount === 0) return 'нуль гривень 00 копійок';

  const integerPart = Math.floor(amount);
  const fractionPart = Math.round((amount - integerPart) * 100);

  const billions = Math.floor(integerPart / 1000000000);
  const millions = Math.floor((integerPart % 1000000000) / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  let result = '';

  if (billions > 0) {
    result += convertGroup(billions) + ' ' + getDeclension(billions, ['мільярд', 'мільярди', 'мільярдів']) + ' ';
  }
  if (millions > 0) {
    result += convertGroup(millions) + ' ' + getDeclension(millions, ['мільйон', 'мільйони', 'мільйонів']) + ' ';
  }
  if (thousands > 0) {
    result += convertGroup(thousands, true) + ' ' + getDeclension(thousands, ['тисяча', 'тисячі', 'тисяч']) + ' ';
  }
  if (remainder > 0 || integerPart === 0) {
    result += convertGroup(remainder) + ' ';
  }

  const hryvnia = getDeclension(integerPart, ['гривня', 'гривні', 'гривень']);
  const kopiyok = fractionPart.toString().padStart(2, '0');

  result = result.trim();
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return `${result} ${hryvnia} ${kopiyok} копійок`;
}
