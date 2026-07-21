/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Control-room surfaces (near-black slate, one step lighter panels)
        base: '#0B1220',
        surface: {
          DEFAULT: '#0F1826',
          raised: '#141E30',
          inset: '#0A111D',
        },
        line: {
          DEFAULT: '#1E2A3E',
          strong: '#28374F',
        },
        // Brand accent — teal, used with discipline
        brand: {
          DEFAULT: '#14B8A6',
          bright: '#2DD4BF',
          dim: '#0E7C72',
        },
        // Semantic status colors
        healthy: '#34D399',
        warn: '#FBBF24',
        danger: '#F87171',
        // Categorical lane hues (distinct, desaturated for dark bg)
        lane: {
          a: '#2DD4BF',
          b: '#38BDF8',
          c: '#818CF8',
          reject: '#F87171',
        },
        // Text ramp
        ink: {
          DEFAULT: '#E6EDF7',
          soft: '#AEBED6',
          muted: '#6B7C99',
          faint: '#475267',
        },
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'JetBrains Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px
      },
      letterSpacing: {
        label: '0.08em',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 0 0 1px rgba(255,255,255,0.01)',
        glow: '0 0 24px -6px rgba(45,212,191,0.45)',
        'glow-soft': '0 0 16px -8px rgba(45,212,191,0.35)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
        },
        'count-in': {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'row-in': {
          '0%': { opacity: '0', transform: 'translateX(-4px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'sheen': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(320%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'count-in': 'count-in 0.18s ease-out',
        'row-in': 'row-in 0.16s ease-out',
        'sheen': 'sheen 2.4s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.16s ease-out',
      },
    },
  },
  plugins: [],
}
