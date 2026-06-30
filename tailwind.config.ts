import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', hover: '#1D4ED8', bg: '#EFF6FF' },
        bg: '#FAFAF8',
        surface: { DEFAULT: '#FFFFFF', hover: '#F5F5F3' },
        border: '#E6E4DF',
        text: { primary: '#1C1B1A', secondary: '#6B6A68', tertiary: '#9C9A97' },
        tag: { bg: '#F0EFED', text: '#5C5B59' },
        selection: '#DBEAFE',
      },
      fontFamily: {
        heading: ['Inter', '-apple-system', 'PingFang SC', 'sans-serif'],
        body: ['Inter', '-apple-system', 'PingFang SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      maxWidth: {
        reading: '720px',
      },
    },
  },
  plugins: [],
}

export default config
