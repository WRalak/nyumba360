/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Airbnb-inspired color palette
        'airbnb': '#FF5A5F',
        'airbnb-pink': '#FF385C',
        'airbnb-red': '#E53E3E',
        'airbnb-orange': '#FFA500',
        'airbnb-yellow': '#FFC107',
        'airbnb-green': '#00A699',
        'airbnb-teal': '#00897B',
        'airbnb-blue': '#0077B6',
        'airbnb-indigo': '#6366F1',
        'airbnb-purple': '#9333EA',
        'airbnb-pink-light': '#FCE4EC',
        'airbnb-pink-dark': '#EC4899',
        'airbnb-gray': '#6B7280',
        'airbnb-gray-light': '#F3F4F6',
        'airbnb-gray-dark': '#374151',
        'airbnb-gray-lighter': '#F9FAFB',
        'airbnb-white': '#FFFFFF',
        'airbnb-black': '#000000',
        // Semantic colors
        'primary': '#FF5A5F',
        'primary-dark': '#E53E3E',
        'primary-light': '#FCE4EC',
        'secondary': '#6B7280',
        'accent': '#FFC107',
        'success': '#00A699',
        'warning': '#FFA500',
        'error': '#E53E3E',
        'info': '#0077B6',
      },
      fontFamily: {
        'sans': ['Satoshi', 'Inter', 'ui-sans-serif', 'system-ui'],
        'serif': ['Georgia', 'ui-serif', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
