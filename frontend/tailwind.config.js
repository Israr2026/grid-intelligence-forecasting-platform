/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'grid-blue': '#1e40af',
        'grid-green': '#10b981',
        'grid-red': '#ef4444',
        'grid-yellow': '#f59e0b',
      },
    },
  },
  plugins: [],
}

