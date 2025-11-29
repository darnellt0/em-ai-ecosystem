import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'em-purple': '#36013f',
        'em-teal': '#176161',
        'em-sand': '#f8f3ee',
      },
      boxShadow: {
        card: '0 8px 20px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
