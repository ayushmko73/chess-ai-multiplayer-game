/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        chess: {
          light: '#ebecd0',
          dark: '#779556',
          accent: '#f6f669'
        }
      }
    },
  },
  plugins: [],
};