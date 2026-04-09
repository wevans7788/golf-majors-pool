/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'golf-green': '#2e7d32',
        'golf-accent': '#388e3c',
        'sand': '#f5f5dc',
        'water': '#1976d2',
      },
      fontFamily: {
        'golf': ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}