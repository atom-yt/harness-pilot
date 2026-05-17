/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        harness: {
          blue: '#0066cc',
          green: '#00cc66',
          yellow: '#ffcc00',
          red: '#ff4444',
          gray: '#666666',
        },
      },
    },
  },
  plugins: [],
};