/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ner: {
          tea: '#2C5E3B',       // Assam Tea Green
          forest: '#1E3F20',
          brahmaputra: '#205493', // Brahmaputra Blue
          golden: '#D97706',    // Muga Silk Golden Yellow
          terracotta: '#C05621',
          bg: '#F8FAFC',
        }
      },
      fontSize: {
        'elder-sm': '1.125rem',  // 18px base for elderly small text
        'elder-base': '1.25rem', // 20px
        'elder-lg': '1.5rem',    // 24px
        'elder-xl': '2rem',      // 32px
        'elder-2xl': '2.5rem',   // 40px
      }
    },
  },
  plugins: [],
}
