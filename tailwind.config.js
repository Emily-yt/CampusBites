/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef6f0',
          100: '#fde8d6',
          200: '#fad4b5',
          300: '#f6b78d',
          400: '#f1905d',
          500: '#ed7437',
          600: '#e85a1f',
          700: '#c4461a',
          800: '#9d391c',
          900: '#7c301a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
