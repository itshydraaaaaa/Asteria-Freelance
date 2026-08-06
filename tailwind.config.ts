import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ast: {
          primary: '#11606e',
          light:   '#60c8d4',
          sky:     '#4CB4E7',
          dark:    '#0a3a40',
          black:   '#000000',
          white:   '#ffffff',
          surface: '#f4fbfb',
          muted:   '#e0f2f3',
          gray:    '#6b7280',
        },
      },
      fontFamily: {
        heading: ['var(--font-exo2)', 'sans-serif'],
        body:    ['var(--font-inter)', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.2em',
      },
    },
  },
  plugins: [],
}

export default config
