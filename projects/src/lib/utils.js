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

/**
 * Format amount according to selected currency and exchange rate.
 * @param {number} amount   - Amount in USD (base)
 * @param {'USD'|'UAH'} currency
 * @param {number} rate     - UAH per 1 USD
 */
export function formatAmount(amount, currency = 'USD', rate = 41) {
  const num = parseFloat(amount) || 0;
  if (currency === 'UAH') return formatCurrency(num * rate);
  return formatUSD(num);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return String(dateString);
  return d.toLocaleDateString('uk-UA');
}
