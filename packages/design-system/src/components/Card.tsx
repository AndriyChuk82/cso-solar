import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Enable glassmorphism effect
   * @default false
   */
  glass?: boolean;

  /**
   * Enable hover effect
   * @default false
   */
  hover?: boolean;

  /**
   * Padding size
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /**
   * Border variant
   * @default 'default'
   */
  border?: 'none' | 'default' | 'primary' | 'success' | 'danger' | 'warning';
}

/**
 * Card component with glassmorphism support and various padding options
 *
 * @example
 * <Card>Content</Card>
 * <Card glass hover padding="lg">Glassmorphism card</Card>
 * <Card border="primary">Primary border</Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      glass = false,
      hover = false,
      padding = 'md',
      border = 'default',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',

          // Padding
          {
            'p-0': padding === 'none',
            'p-3': padding === 'sm',
            'p-4': padding === 'md',
            'p-6': padding === 'lg',
          },

          // Glass or solid
          glass
            ? 'glass-card'
            : 'bg-white shadow-sm',

          // Border
          {
            'border-0': border === 'none',
            'border border-neutral-200': border === 'default' && !glass,
            'border-2 border-primary': border === 'primary',
            'border-2 border-success': border === 'success',
            'border-2 border-danger': border === 'danger',
            'border-2 border-warning': border === 'warning',
          },

          // Hover effect
          hover && 'smooth-hover cursor-pointer',

          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
