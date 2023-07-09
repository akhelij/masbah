module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: theme => ({
        'card-right': "url('/src/assets/img/bg_card_right.png')",
        'card-left': "url('/src/assets/img/bg_card_left.png')",
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
      minHeight: {               
        '1/12': '8vh',                   
        '2/12': '16vh', 
        '3/12': '24vh',                    
        '4/12': '32vh',                    
        '5/12': '40vh', 
        '6/12': '50vh',              
        '7/12': '58vh',              
        '8/12': '66vh',              
        '9/12': '74vh',                 
        '10/12': '82vh',              
        '11/12': '90vh',
        'extra': '130vh'
      },
    },
  },
  plugins: [],
}
