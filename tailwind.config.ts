import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F4EFE3',
          raised: '#FFFDF8',
        },
        ink: {
          DEFAULT: '#1D2A3A',
          soft: '#4A5A6A',
          faint: '#8B93A0',
        },
        airmail: {
          red: '#B23A2E',
          blue: '#2C5282',
        },
        stamp: {
          gold: '#C89B3C',
        },
        stub: '#DCD3BE',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['Inter', '"Noto Sans TC"', 'sans-serif'],
      },
    },
  },
}
