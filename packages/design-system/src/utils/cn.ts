import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 *
 * @example
 * cn('px-2 py-1', condition && 'bg-primary', 'px-4') // => 'py-1 bg-primary px-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
