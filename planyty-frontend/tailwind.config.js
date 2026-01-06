/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FDF7E4',
        secondary: '#FAEED1',
        // subtle purple accent palette (used as `accent-50` .. `accent-900` and `accent`)
        accent: {
          50:  '#faf7ff',
          100: '#f3ecff',
          200: '#e6d5ff',
          300: '#d1afff',
          400: '#b685ff',
          500: '#9b4bff', // primary accent
          600: '#8833e6',
          700: '#6b22b3',
          800: '#4a146f',
          900: '#2b082f',
        },
      },
      gradientColorStops: theme => ({
        'accent-start': theme('colors.accent.100'),
        'accent-end': theme('colors.accent.600'),
      }),
      boxShadow: {
        'accent-soft': '0 8px 30px rgba(155,75,255,0.12)',
      },
      animation: {
        'slide-down': 'slide-down 0.2s ease-out',
        'pulse-slow': 'pulse-slow 2s infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'gradient': 'gradient 3s ease infinite',
      },
      keyframes: {
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}