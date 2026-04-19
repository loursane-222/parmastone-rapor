import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          50: '#f0f4ff', 100: '#e0eaff', 200: '#b8d0ff',
          500: '#3b6fd4', 600: '#2d5ab8', 700: '#1e3d8f',
          800: '#162d6e', 900: '#0e1f50',
        }
      }
    }
  },
  plugins: []
}
export default config
