/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'admin-bg': '#F6F5EF',
        'admin-sidebar': '#73736B',
        'admin-accent': '#EF4444',
      }
    },
  },
  plugins: [],
}