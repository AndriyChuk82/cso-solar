import { Currency, CurrencyRates } from '../types';

/**
 * Конвертує ціну з однієї валюти в іншу
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: CurrencyRates
): number {
  if (fromCurrency === toCurrency) return amount;

  // Спочатку конвертуємо в UAH
  let uahAmount = amount;
  if (fromCurrency === 'USD') {
    uahAmount = amount * rates.USD;
  } else if (fromCurrency === 'EUR') {
    uahAmount = amount * rates.EUR;
  }

  // Потім з UAH в цільову валюту
  if (toCurrency === 'UAH') {
    return uahAmount;
  } else if (toCurrency === 'USD') {
    return uahAmount / rates.USD;
  } else if (toCurrency === 'EUR') {
    return uahAmount / rates.EUR;
  }

  return amount;
}

/**
 * Форматує суму в валюті
 */
export function formatCurrency(amount: number, currency: Currency): string {
  if (amount === undefined || amount === null) return `0.00 ${getCurrencySymbol(currency)}`;
  
  const formatted = amount.toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formatted} ${getCurrencySymbol(currency)}`;
}

/**
 * Форматує суму без валюти
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  if (amount === undefined || amount === null) return '0.00';
  return amount.toLocaleString('uk-UA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Парсить суму з рядка
 */
export function parseAmount(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[^\d.,]/g, '').replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Отримує символ валюти
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    UAH: '₴',
  };
  return symbols[currency];
}

/**
 * Отримує назву валюти
 */
export function getCurrencyName(currency: Currency): string {
  const names: Record<Currency, string> = {
    USD: 'Долар США',
    EUR: 'Євро',
    UAH: 'Гривня',
  };
  return names[currency];
}
