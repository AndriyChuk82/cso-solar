import { Proposal, ProposalItem } from '../types';

/**
 * Розраховує підсумок для товару
 */
export function calculateItemTotal(price: number, quantity: number, discount: number = 0): number {
  const subtotal = price * quantity;
  const discountAmount = (subtotal * discount) / 100;
  return subtotal - discountAmount;
}

/**
 * Розраховує загальну суму пропозиції
 */
export function calculateProposalTotal(items: ProposalItem[], markup: number = 0): {
  subtotal: number;
  markupAmount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const markupAmount = (subtotal * markup) / 100;
  const total = subtotal + markupAmount;

  return { subtotal, markupAmount, total };
}

/**
 * Розраховує відсоток від суми
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return (amount * percentage) / 100;
}

/**
 * Розраховує відсоток між двома числами
 */
export function calculatePercentageDifference(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Округлює число до заданої кількості знаків після коми
 */
export function roundTo(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Перевіряє чи пропозиція валідна для збереження
 */
export function validateProposal(proposal: Proposal): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!proposal.clientName.trim()) {
    errors.push('Вкажіть ім\'я клієнта');
  }

  if (proposal.items.length === 0) {
    errors.push('Додайте хоча б один товар');
  }

  if (proposal.items.some(item => item.quantity <= 0)) {
    errors.push('Кількість товарів має бути більше 0');
  }

  if (proposal.markup < 0) {
    errors.push('Націнка не може бути від\'ємною');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Генерує номер пропозиції
 */
export function generateProposalNumber(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `КП-${year}${month}${day}-${random}`;
}

/**
 * Форматує дату
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Форматує дату та час
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
