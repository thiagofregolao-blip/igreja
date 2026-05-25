/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: '#f5b800', 400: '#fac800', 500: '#f5b800', 600: '#d49d00' },
        ink: { DEFAULT: '#0a0a0a', 900: '#0a0a0a', 950: '#050505' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
