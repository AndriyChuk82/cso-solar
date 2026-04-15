import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Помаранчевий градієнт (brand CSO Solar)
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          light: 'hsl(var(--primary-light))',
          dark: 'hsl(var(--primary-dark))',
          bg: 'hsl(var(--primary-bg))',
        },
        // Secondary — Синій
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          light: 'hsl(var(--secondary-light))',
          dark: 'hsl(var(--secondary-dark))',
          bg: 'hsl(var(--secondary-bg))',
        },
        // Neutral — Сірі відтінки
        neutral: {
          50: 'hsl(var(--neutral-50))',
          100: 'hsl(var(--neutral-100))',
          200: 'hsl(var(--neutral-200))',
          300: 'hsl(var(--neutral-300))',
          400: 'hsl(var(--neutral-400))',
          500: 'hsl(var(--neutral-500))',
          600: 'hsl(var(--neutral-600))',
          700: 'hsl(var(--neutral-700))',
          800: 'hsl(var(--neutral-800))',
          900: 'hsl(var(--neutral-900))',
        },
        // Semantic colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          bg: 'hsl(var(--success-bg))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          bg: 'hsl(var(--danger-bg))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          bg: 'hsl(var(--warning-bg))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          bg: 'hsl(var(--info-bg))',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        DEFAULT: 'var(--transition-base)',
        slow: 'var(--transition-slow)',
        smooth: 'var(--transition-smooth)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
