module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      backgroundImage: theme => ({
        'hero-pattern': "url('/src/assets/img/kid-girl.jpg')",
        'list-annoucements': "url('/src/assets/img/bg-circle-scatter.png')",
       }),
      colors: {
        'cyan': {
          DEFAULT: '#37EDFF',
          '50': '#FFFFFF',
          '100': '#FFFFFF',
          '200': '#D0FBFF',
          '300': '#9DF6FF',
          '400': '#6AF2FF',
          '500': '#37EDFF',
          '600': '#04E8FF',
          '700': '#00BDD0',
          '800': '#008F9D',
          '900': '#00606A'
        }
      },
    },
  },
  variants: {
    extend: {
      transitionProperty: ['hover', 'focus'],
      transform: ['hover', 'focus'],
      scale: ['active'],
    },
  },
  plugins: [],
}
