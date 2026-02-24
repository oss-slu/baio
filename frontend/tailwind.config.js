import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', 'Roboto Mono', ...defaultTheme.fontFamily.mono],
        dna: ['JetBrains Mono', 'Roboto Mono', 'SF Mono', 'Monaco', 'monospace'],
      },
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        virus: {
          light: '#fecdd3',
          DEFAULT: '#f43f5e',
          dark: '#e11d48',
        },
        host: {
          light: '#bbf7d0',
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        novel: {
          light: '#fde68a',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
      },
      boxShadow: {
        glow: '0 10px 60px -30px rgba(99, 102, 241, 0.5)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
      fontSize: {
        'metric': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '800' }],
      },
    },
  },
  plugins: [],
}
