/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nyumba-blue': '#2563eb',
        'nyumba-green': '#10b981',
        'nyumba-purple': '#8b5cf6',
        'nyumba-yellow': '#f59e0b',
        'nyumba-red': '#ef4444',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
