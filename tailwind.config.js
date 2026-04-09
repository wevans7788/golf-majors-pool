/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Masters Augusta National Color Palette
        'masters': {
          green: '#1b4332',    // Deep Augusta green
          gold: '#f4a261',     // Masters tournament gold
          light: '#52b788',    // Lighter Augusta green
          cream: '#f8f9fa',    // Clean white/cream
          dark: '#081c15'      // Deep forest green
        },
        // Legacy golf colors (for compatibility)
        'golf-green': '#1b4332',
        'golf-accent': '#52b788',
      },
      fontFamily: {
        'golf': ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}