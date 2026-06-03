/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // backgrounds (cream)
        cream: {
          DEFAULT: '#f3efe6',
          50:  '#fbf8f1',
          100: '#f5f1e7',
          200: '#ece6d8',
          300: '#e2dac6',
        },
        // ink (deep blacks)
        ink: {
          DEFAULT: '#0d0f15',
          900: '#0d0f15',
          800: '#14171f',
          700: '#1c2030',
          600: '#2a2e3d',
        },
        // gold palette (rich gradient stops)
        gold: {
          DEFAULT: '#e6b836',
          50:  '#fff9e8',
          100: '#fff2c2',
          200: '#f6d877',
          300: '#f4cb55',
          400: '#e7b53a',
          500: '#e6b836',
          600: '#d29a1f',
          700: '#c89320',
          800: '#b07b1c',
          900: '#8a5310',
        },
        muted: '#6c6a62',
        line: 'rgba(15,17,25,.08)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Archivo Black"', 'Archivo', 'sans-serif'],
        archivo: ['Archivo', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gold-shine': 'linear-gradient(180deg,#8a5310 0%,#d99820 8%,#f6cf5a 18%,#fff3c4 28%,#e7b53a 42%,#a86b13 55%,#d99820 68%,#f4cb55 80%,#6f4310 100%)',
        'gold-btn': 'linear-gradient(180deg,#f5cb4f 0%, #e3ae28 55%, #c98e17 100%)',
        'gold-soft': 'linear-gradient(180deg,#f5cb4f 0%, #e3ae28 100%)',
        'cream-fade': 'linear-gradient(180deg,#fbf8f1 0%,#f3efe6 60%,#ece6d8 100%)',
        'dark-panel': 'linear-gradient(180deg, #0d0f15 0%, #0a0c12 100%)',
        'date-card': 'linear-gradient(180deg,#171a23 0%, #0d0f15 100%)',
        'prize-card': 'linear-gradient(180deg,#ffffff 0%, #f4efe2 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.7s ease-out',
        'slide-up': 'slideUp 0.7s cubic-bezier(0.16,1,0.3,1)',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(24px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 0 1px rgba(230,184,54,.15), 0 30px 60px -30px rgba(230,184,54,.45), inset 0 0 60px rgba(230,184,54,.08)' },
          '50%':     { boxShadow: '0 0 0 1px rgba(230,184,54,.3),  0 30px 60px -20px rgba(230,184,54,.6),  inset 0 0 80px rgba(230,184,54,.16)' },
        },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
};
