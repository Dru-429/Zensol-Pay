/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#ffffff',
        card: '#f7f7f7',
        accent: '#0052ff',
        accent2: '#05b169',
        'primary-text': '#0a0b0d',
        'secondary-text': '#5b616e',
        'muted-text': '#7c828a',
        'border-color': '#dee1e6',
        'border-soft': '#eef0f3',
        'surface-strong': '#eef0f3',
        'semantic-up': '#05b169',
        'semantic-down': '#cf202f',
        'accent-yellow': '#f4b000',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
