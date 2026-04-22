/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.html', './src/**/*.js'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a1929',
          900: '#0f2744',
          800: '#1a3a5c',
          700: '#1e4d8c',
        },
        'surface':         '#f7f9fb',
        'surface-lowest':  '#ffffff',
        'surface-low':     '#f2f4f6',
        'surface-high':    '#e6e8ea',
        'on-surface':      '#191c1e',
        'on-variant':      '#45464d',
        'primary-fixed':   '#dae2fd',
        'primary-cnt':     '#131b2e',
        'secondary':       '#712edd',
        'secondary-fixed': '#ebddff',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body:     ['Inter',   'sans-serif'],
      },
    },
  },
  plugins: [],
}
