/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#1a3a2e',
          darker: '#0d1f1a',
          DEFAULT: '#1a3a2e',
        },
        accent: {
          green: '#00ff88',
          light: '#00e676',
          DEFAULT: '#00ff88',
        },
        secondary: {
          dark: '#0a0f0d',
          DEFAULT: '#0a0f0d',
        },
        card: {
          light: '#f5f5dc',
          white: '#ffffff',
          DEFAULT: '#f5f5dc',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
