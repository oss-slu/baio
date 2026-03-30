import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'DM Sans', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', 'Roboto Mono', ...defaultTheme.fontFamily.mono],
        dna: ['JetBrains Mono', 'Roboto Mono', 'SF Mono', 'Monaco', 'monospace'],
        custom: ["Krona One", 'sans-serif'],
        custom2: ["DM Sans", 'sans-serif'],
        custom3: ["Cal Sans", 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0EA5E9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        virus: {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        host: {
          light: '#dcfce7',
          DEFAULT: '#22c55e',
          dark: '#16a34a',
        },
        novel: {
          light: '#fef9c3',
          DEFAULT: '#eab308',
          dark: '#ca8a04',
        },
        uncertain: {
          light: '#f1f5f9',
          DEFAULT: '#64748b',
          dark: '#475569',
        },
        background: '#F8FAFC',
        card: '#FFFFFF',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
        glow: '0 10px 60px -30px rgba(14, 165, 233, 0.4)',
      },
      fontSize: {
        'metric': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      borderRadius: {
        'card': '8px',
      },
    },
  },
  plugins: [],
}
