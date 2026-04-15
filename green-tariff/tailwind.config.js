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
          DEFAULT: '#E8890A',
          light: '#F5A623',
          dark: '#B86D00',
        },
        accent: {
          DEFAULT: '#1a3a6b',
          light: '#2a5298',
          dark: '#0f2445',
        },
      },
    },
  },
  plugins: [],
}
