import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bond-primary': '#1B4D6E',
        'bond-secondary': '#E8B931',
        'bond-bg': '#FAFAF8',
        'bond-card': '#FFFFFF',
        'bond-text': '#1A1A1A',
        'bond-text-light': '#6B7280',
        'bond-success': '#2ECC71',
        'bond-streak': '#E74C3C',
        'cat-appreciation': '#E8B931',
        'cat-curiosity': '#4A90D9',
        'cat-memories': '#9B59B6',
        'cat-reciprocity': '#2ECC71',
        'cat-play': '#E74C3C',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
