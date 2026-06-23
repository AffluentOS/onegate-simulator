import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-navy': '#0C1624',
        navy: '#1C2B4A',
        royal: '#2557A7',
        gold: '#C9A84C',
        burgundy: '#8B1A3C',
        plum: '#4A2D7A',
        cream: '#F5F0E4',
        mist: '#E8EBF2',
        ink: '#1C2B4A',
        muted: '#6B7A94',
        success: '#1A6B42',
        'border-light': '#D4D9E8',
        'border-mid': '#B8C0D4',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Helvetica Neue', 'sans-serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      boxShadow: {
        sm: '0 2px 12px rgba(12,22,36,.06)',
        md: '0 4px 20px rgba(12,22,36,.08)',
        lg: '0 8px 32px rgba(12,22,36,.12)',
      },
      borderRadius: { md: '4px', lg: '8px' },
    },
  },
  plugins: [],
};
export default config;
