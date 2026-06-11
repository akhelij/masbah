// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-06-08',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@nuxt/fonts',
    '@nuxtjs/i18n',
    '@nuxtjs/supabase',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
    // Vercel Web Analytics — only emits in production on Vercel; no-op locally.
    '@vercel/analytics/nuxt',
    // '@pinia/nuxt' — re-enabled in M3 (client UI state: filters, wizard draft).
    // Deferred: @pinia/nuxt@0.11.3 SSR hook crashes on Nuxt 4.4; revisit version then.
  ],

  // Public pages are SEO-critical → server-rendered.
  ssr: true,

  // Keep the Nuxt instance available across `await` boundaries inside
  // useAsyncData handlers (usePoolImageUrl reads runtime config there).
  // Without this, composables called after an await throw — which emptied
  // every pool list once the first uploaded (non-http) cover photo appeared.
  experimental: {
    asyncContext: true,
  },

  typescript: {
    strict: true,
  },

  // Resolve components by filename regardless of subfolder, so <PButton>,
  // <PHeader>, <PoolCard> work from components/ui|layout|pool/*.
  components: [{ path: '~/components', pathPrefix: false }],

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
    // Canonical production origin → useLocaleHead({ seo: true }) emits ABSOLUTE
    // canonical + hreflang URLs (relative ones are invalid per Lighthouse SEO).
    baseUrl: 'https://masbah.ma',
    locales: [
      { code: 'fr', language: 'fr-MA', dir: 'ltr', file: 'fr.json', name: 'Français' },
      { code: 'ar', language: 'ar-MA', dir: 'rtl', file: 'ar.json', name: 'العربية' },
    ],
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'masbah_lang',
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
      name: 'Masbah — Location de piscines au Maroc',
      short_name: 'Masbah',
      description: 'Louez une piscine près de chez vous. Paiement sur place.',
      lang: 'fr',
      theme_color: '#0E7490',
      background_color: '#FAFAF7',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        {
          src: '/maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      // SSR app: don't hijack navigations with an offline shell (data must stay
      // fresh). Precache the built client assets and runtime-cache only remote
      // images — Unsplash + Supabase Storage objects — never the REST/auth API.
      navigateFallback: undefined,
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ url }) =>
            url.hostname === 'images.unsplash.com' ||
            (url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/')),
          handler: 'CacheFirst',
          options: {
            cacheName: 'masbah-images',
            expiration: { maxEntries: 160, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
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
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
})
