/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--primary, #f59e0b)',
          light: 'var(--primary-light, #fbbf24)',
          dark: 'var(--primary-dark, #d97706)',
          bg: 'var(--primary-bg, #fffbeb)',
        },
        accent: {
          DEFAULT: '#374151',
          light: '#4b5563',
          dark: '#1f2937',
        },
      }
    },
  },
  plugins: [],
}
