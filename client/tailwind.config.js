/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#313338',
        sidebar: '#1e1f22',
        sidebarAlt: '#2b2d31',
        accent: '#5865f2',
        accentSoft: '#3b3f73',
        textPrimary: '#f2f3f5',
        textSecondary: '#b5bac1',
        inputBg: '#383a40'
      }
    }
  },
  plugins: []
};

