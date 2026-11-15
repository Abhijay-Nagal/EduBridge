/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3edfc',
          100: '#e8ddf8',
          200: '#d8c9f1',
          300: '#c5b3e6',
          400: '#b199dc',
          500: '#8f6bd0',
          600: '#6a45b8',
          700: '#4f3190',
          800: '#3a2370',
          900: '#231a24',
        },
        ink: '#231a24',
        cream: '#fff6ee',
        lime: '#dcf75a',
        bubble: '#efa3dc',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        pop: '5px 5px 0 #231a24',
        'pop-sm': '3px 3px 0 #231a24',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}
