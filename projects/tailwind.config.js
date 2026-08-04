/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary, #f59e0b)',
          light: 'var(--primary-light, #fbbf24)',
          dark: 'var(--primary-dark, #d97706)',
          bg: 'var(--primary-bg, #fffbeb)',
        },
        brand: {
          light: '#fbbf24',
          DEFAULT: '#F59E0B',
          dark: '#d97706',
          glow: 'rgba(245, 158, 11, 0.1)',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      borderRadius: {
        'xl': '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

