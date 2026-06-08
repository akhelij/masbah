import type { Config } from 'tailwindcss'

/**
 * Pissina design tokens mirrored into Tailwind so utilities
 * (bg-aqua-700, text-ink-muted, rounded-2xl, shadow-card, font-ar…)
 * stay 1:1 with the CSS variables in app/assets/css/main.css.
 */
export default <Partial<Config>>{
  content: [
    './app/**/*.{vue,js,ts}',
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
    './app/error.vue',
  ],
  theme: {
    extend: {
      colors: {
        aqua: {
          50: '#ECFEFF',
          100: '#CFF7FB',
          200: '#A4ECF5',
          300: '#6FDDED',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        ink: { DEFAULT: '#0F3D4C', strong: '#0A2D38', muted: '#4F6E78', faint: '#8AA2AB' },
        coral: { DEFAULT: '#FB7185', deep: '#F43F5E', soft: '#FFE4E8', ink: '#9F1239' },
        wa: { DEFAULT: '#17A24E', deep: '#138A42' },
        amber: { DEFAULT: '#F59E0B', soft: '#FEF3C7', ink: '#92580A' },
        success: { DEFAULT: '#15A24A', soft: '#DCFCE7' },
        danger: { DEFAULT: '#DC2626', deep: '#B91C1C', soft: '#FEE2E2' },
        sand: { DEFAULT: '#FAFAF7', 2: '#F1F1EA' },
        line: { DEFAULT: '#E6E7E1', 2: '#EDEEE8', strong: '#D3D6CE' },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        pill: '999px',
      },
      boxShadow: {
        sm: 'var(--sh-sm)',
        card: 'var(--sh-card)',
        pop: 'var(--sh-pop)',
        lg: 'var(--sh-lg)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        ar: ['IBM Plex Sans Arabic', 'Plus Jakarta Sans', 'sans-serif'],
      },
      transitionTimingFunction: {
        water: 'cubic-bezier(0.22, 1, 0.36, 1)',
        soft: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      maxWidth: { wrap: '1200px' },
    },
  },
}
