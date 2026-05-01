import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Format as UAH */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency', currency: 'UAH',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount || 0);
}

/** Format as USD */
export function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount || 0);
}

/** Format as plain number with group separators */
export function formatNumber(amount) {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Format amount according to selected currency and exchange rate.
 * @param {number} amount   - Amount
 * @param {'USD'|'UAH'} targetCurrency - Currency to display in
 * @param {number} rate     - UAH per 1 USD
 * @param {'USD'|'UAH'} sourceCurrency - Currency the amount is currently in
 */
export function formatAmount(amount, targetCurrency = 'USD', rate = 41, sourceCurrency = 'USD') {
  const num = parseFloat(amount) || 0;
  
  let finalNum = num;

  // Convert USD to UAH
  if (targetCurrency === 'UAH' && sourceCurrency === 'USD') {
    finalNum = num * rate;
  }
  
  // Convert UAH to USD
  if (targetCurrency === 'USD' && sourceCurrency === 'UAH') {
    finalNum = num / rate;
  }

  return formatNumber(finalNum);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return String(dateString);
  return d.toLocaleDateString('uk-UA');
}
