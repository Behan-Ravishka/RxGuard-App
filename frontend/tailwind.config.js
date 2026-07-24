/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'severity-red': '#ef4444',
        'severity-orange': '#f97316',
        'severity-yellow': '#eab308',
        'severity-green': '#22c55e',
      }
    },
  },
  plugins: [],
}