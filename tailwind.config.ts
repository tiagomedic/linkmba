import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        link: {
          yellow: '#F5C400',
          blue: '#003087',
        },
      },
    },
  },
  plugins: [],
}
export default config
