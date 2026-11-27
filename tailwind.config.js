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
        brand: {
          cyan: '#00fff2',
          blue: '#0068ff',
          magenta: '#ff007a',
          ebony: '#040710',
        },
        piano: {
          dark: '#040710',
          surface: '#081022',
          border: '#1b2a4a',
          accent: '#00fff2',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
