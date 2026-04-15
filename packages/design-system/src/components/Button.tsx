import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';

  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Enable glassmorphism effect
   * @default false
   */
  glass?: boolean;

  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;
}

/**
 * Button component with multiple variants, sizes, and glassmorphism support
 *
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="success" glass>Save</Button>
 * <Button variant="ghost" size="sm">Cancel</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      glass = false,
      fullWidth = false,
      loading = false,
      className,
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'ds-button',
          `ds-button-${size}`,
          `ds-button-${variant}`,
          fullWidth && 'ds-button-full',
          className
        )}
        style={style}
        {...props}
      >
        {loading && (
          <svg
            className="ds-button-spinner"
            style={{ width: '1rem', height: '1rem' }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
