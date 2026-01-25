/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@coinbase/onchainkit/**/*.{js,ts,jsx,tsx}",
  ],
  important: true,
  theme: {
    extend: {
      colors: {
        'base-blue': '#0052FF',
        'base-dark': '#000D1F',
        'base-light': '#F0F4FF',
      },
      animation: {
        'flip': 'flip 0.3s ease-in-out',
        'match': 'match 0.5s ease-in-out',
        'shake': 'shake 0.4s ease-in-out',
        'celebrate': 'celebrate 0.5s ease-in-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        match: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
        celebrate: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '25%': { transform: 'scale(1.2) rotate(-5deg)' },
          '75%': { transform: 'scale(1.2) rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
}
