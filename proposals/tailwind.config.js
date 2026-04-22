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
          DEFAULT: '#d4a373',
          light: '#e9c46a',
          dark: '#bc8a5f',
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
