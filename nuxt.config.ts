// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-06-08',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/fonts',
    '@nuxtjs/i18n',
    '@nuxtjs/supabase',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
    // '@pinia/nuxt' — re-enabled in M3 (client UI state: filters, wizard draft).
    // Deferred: @pinia/nuxt@0.11.3 SSR hook crashes on Nuxt 4.4; revisit version then.
  ],

  // Public pages are SEO-critical → server-rendered.
  ssr: true,

  typescript: {
    strict: true,
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  fonts: {
    families: [
      { name: 'Plus Jakarta Sans', provider: 'google', weights: [400, 500, 600, 700, 800] },
      { name: 'IBM Plex Sans Arabic', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },

  i18n: {
    strategy: 'prefix',
    defaultLocale: 'fr',
    locales: [
      { code: 'fr', language: 'fr-MA', dir: 'ltr', file: 'fr.json', name: 'Français' },
      { code: 'ar', language: 'ar-MA', dir: 'rtl', file: 'ar.json', name: 'العربية' },
    ],
    lazy: true,
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'pissina_lang',
      redirectOn: 'root',
      alwaysRedirect: false,
    },
  },

  supabase: {
    // Public marketplace pages must render without auth.
    // Per-route auth gating is added via middleware in M2.
    redirect: false,
  },

  image: {
    domains: ['images.unsplash.com', 'pcatvbnhfbatgchiynpr.supabase.co'],
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Pissina — Location de piscines au Maroc',
      short_name: 'Pissina',
      description: 'Louez une piscine près de chez vous. Paiement sur place.',
      lang: 'fr',
      theme_color: '#0E7490',
      background_color: '#FAFAF7',
      display: 'standalone',
      start_url: '/',
    },
    workbox: {
      navigateFallback: undefined,
    },
    devOptions: {
      enabled: false,
    },
  },

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
      phoneVerificationEnabled: process.env.NUXT_PUBLIC_PHONE_VERIFICATION_ENABLED === 'true',
    },
  },

  app: {
    head: {
      meta: [
        { name: 'theme-color', content: '#0E7490' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
    },
  },
})
