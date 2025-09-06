/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif']
      },
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c1c1ff',
          300: '#a2a2ff',
          400: '#8383ff',
          500: '#6464ff',
          600: '#5050cc',
          700: '#3c3c99',
          800: '#282866',
          900: '#141433',
        }
      }
    },
  },
  plugins: [],
}