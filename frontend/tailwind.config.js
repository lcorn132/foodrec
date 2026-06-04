/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Be Vietnam Pro"', 'Arial', 'sans-serif'],
        body: ['"Be Vietnam Pro"', 'sans-serif'],
      },
      colors: {
        brand: {
          cream: '#FDF6EC',
          'warm-white': '#FFFAF3',
        },
        brown: {
          50: '#EFEBE9',
          100: '#D7CCC8',
          200: '#BCAAA4',
          300: '#A1887F',
          400: '#8D6E63',
          500: '#795548',
          600: '#6D4C41',
          700: '#5D4037',
          800: '#4E342E',
          900: '#3E2723',
        },
        gold: {
          100: '#FDF3D7',
          200: '#FAE8B0',
          300: '#F5D680',
          400: '#F0C94D',
          500: '#E6B422',
          600: '#D4A017',
        },
        primary: {
          50: '#FDF3D7',
          100: '#FAE8B0',
          200: '#F5D680',
          300: '#F0C94D',
          400: '#E6B422',
          500: '#D4A017',
          600: '#B8860B',
        },
        secondary: {
          400: '#F0C94D',
          500: '#E6B422',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.7s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'bounce-in': 'bounceIn 0.8s ease',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
