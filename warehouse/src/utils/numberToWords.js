/**
 * Перетворення числа в суму прописом українською мовою.
 * Наприклад: 12500.50 -> "Дванадцять тисяч п'ятсот гривень 50 копійок"
 */

const UNITS = [
  ['', 'один', 'два', 'три', 'чотири', "п'ять", 'шість', 'сім', 'вісім', "дев'ять"],
  ['', 'одна', 'дві', 'три', 'чотири', "п'ять", 'шість', 'сім', 'вісім', "дев'ять"]
];

const TEENS = [
  'десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять',
  'п’ятнадцять', 'шістнадцять', 'сімнадцять', 'вісімнадцять', 'дев’ятнадцять'
];

const TENS = [
  '', '', 'двадцять', 'тридцять', 'сорок', 'п’ятдесят',
  'шістдесят', 'сімдесят', 'вісімдесят', 'дев’яносто'
];

const HUNDREDS = [
  '', 'сто', 'двісті', 'триста', 'чотириста', 'п’ятсот',
  'шістсот', 'сімсот', 'вісімсот', 'дев’ятсот'
];

const THOUSANDS = ['тисяча', 'тисячі', 'тисяч'];
const MILLIONS = ['мільйон', 'мільйони', 'мільйонів'];
const HRYVNI = ['гривня', 'гривні', 'гривень'];
const KOPECKS = ['копійка', 'копійки', 'копійок'];
const DOLLARS = ['долар США', 'долари США', 'доларів США'];
const CENTS = ['цент', 'центи', 'центів'];

function getPlural(number, titles) {
  const abs = Math.abs(number) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return titles[2];
  if (rem > 1 && rem < 5) return titles[1];
  if (rem === 1) return titles[0];
  return titles[2];
}

function triadToWords(num, genderIndex = 0) {
  if (num === 0) return '';
  const parts = [];

  const h = Math.floor(num / 100);
  const remainder = num % 100;
  const t = Math.floor(remainder / 10);
  const u = remainder % 10;

  if (h > 0) parts.push(HUNDREDS[h]);

  if (remainder >= 10 && remainder < 20) {
    parts.push(TEENS[remainder - 10]);
  } else {
    if (t > 0) parts.push(TENS[t]);
    if (u > 0) parts.push(UNITS[genderIndex][u]);
  }

  return parts.join(' ');
}

export function numberToWordsUah(amount, currency = 'UAH') {
  const num = parseFloat(amount) || 0;
  if (num === 0) return currency === 'USD' ? 'Нуль доларів США 00 центів' : 'Нуль гривень 00 копійок';

  const integerPart = Math.floor(Math.abs(num));
  const fractionalPart = Math.round((Math.abs(num) - integerPart) * 100);

  const isUsd = currency === 'USD';
  const mainTitles = isUsd ? DOLLARS : HRYVNI;
  const subTitles = isUsd ? CENTS : KOPECKS;

  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const units = integerPart % 1000;

  const resultParts = [];

  if (millions > 0) {
    const text = triadToWords(millions, 0);
    resultParts.push(`${text} ${getPlural(millions, MILLIONS)}`);
  }

  if (thousands > 0) {
    const text = triadToWords(thousands, 1); // 1 = feminine gender for "тисяча"
    resultParts.push(`${text} ${getPlural(thousands, THOUSANDS)}`);
  }

  if (units > 0 || resultParts.length === 0) {
    const gender = isUsd ? 0 : 1; // 1 = feminine gender for "гривня", 0 for "долар"
    const text = triadToWords(units, gender) || 'нуль';
    resultParts.push(`${text} ${getPlural(integerPart, mainTitles)}`);
  } else {
    resultParts.push(getPlural(integerPart, mainTitles));
  }

  const kopecksStr = String(fractionalPart).padStart(2, '0');
  const subPlural = getPlural(fractionalPart, subTitles);

  const fullStr = `${resultParts.join(' ')} ${kopecksStr} ${subPlural}`;
  return fullStr.charAt(0).toUpperCase() + fullStr.slice(1);
}
