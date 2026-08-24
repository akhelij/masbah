<script setup lang="ts">
// Blog index page — lists all blog posts with SEO-optimized meta.
const { t, locale } = useI18n()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: true })
const config = useRuntimeConfig()

// Blog posts data — in production this could come from a CMS or API
const posts = [
  {
    slug: 'louer-piscine-privee-maroc',
    title: locale.value === 'ar' ? 'كيفية استئجار مسبح خاص في المغرب' : 'Louer une piscine privée au Maroc : guide complet 2024',
    excerpt: locale.value === 'ar'
      ? 'دليل شامل لاستئجار مسبح خاص في المغرب. اكتشف الأسعار، المدن الأكثر طلباً، والنصائح للحصول على أفضل تجربة.'
      : 'Guide complet pour louer une piscine privée au Maroc. Découvrez les prix, les villes les plus demandées et nos conseils pour une expérience parfaite.',
    date: '2024-08-20',
    readTime: '5 min',
    image: '/blog/piscine-privee-maroc.jpg',
  },
  {
    slug: 'devenir-hote-piscine-maroc',
    title: locale.value === 'ar' ? 'كن مضيف مسبح في المغرب: الدخل والمزايا' : 'Devenir hôte de piscine au Maroc : revenus et avantages',
    excerpt: locale.value === 'ar'
      ? 'حوّل مسبحك الخاص إلى مصدر دخل. تعرّف على الإمكانيات المالية، المزايا، وكيفية البدء بخطوات بسيطة.'
      : 'Transformez votre piscine privée en source de revenus. Découvrez le potentiel financier, les avantages et comment démarrer en quelques étapes simples.',
    date: '2024-08-18',
    readTime: '4 min',
    image: '/blog/devenir-hote.jpg',
  },
  {
    slug: 'meilleures-piscines-casablanca',
    title: locale.value === 'ar' ? 'أفضل المسابح الخاصة في الدار البيضاء والنواحي' : 'Les meilleures piscines privées à Casablanca et environs',
    excerpt: locale.value === 'ar'
      ? 'استكشف أفضل الخيارات في دار بوعزة، بوسكورة، المحمدية والدار البيضاء. مقارنة، أسعار، ونصائح الحجز.'
      : 'Explorez les meilleures options à Dar Bouazza, Bouskoura, Mohammedia et Casablanca. Comparaisons, tarifs et conseils de réservation.',
    date: '2024-08-15',
    readTime: '6 min',
    image: '/blog/piscines-casablanca.jpg',
  },
]

useSeoMeta({
  title: () => `${locale.value === 'ar' ? 'المدونة' : 'Blog'} — Masbah`,
  description: () => locale.value === 'ar'
    ? 'نصائح، أدلة، وأخبار حول استئجار المسابح الخاصة في المغرب.'
    : 'Conseils, guides et actualités sur la location de piscines privées au Maroc.',
  ogTitle: () => `${locale.value === 'ar' ? 'المدونة' : 'Blog'} — Masbah`,
  ogDescription: () => locale.value === 'ar'
    ? 'نصائح، أدلة، وأخبار حول استئجار المسابح الخاصة في المغرب.'
    : 'Conseils, guides et actualités sur la location de piscines privées au Maroc.',
  ogImage: () => `${config.public.siteUrl}/pwa-512x512.png`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: [...(localeHead.value.link ?? [])],
  meta: [...(localeHead.value.meta ?? [])],
}))
</script>

<template>
  <div class="blog-index">
    <section class="hero">
      <div class="noise" />
      <div class="wrap hero-inner">
        <span class="t-over" style="color: rgba(255,255,255,0.85)">
          {{ locale === 'ar' ? 'المدونة' : 'Blog' }}
        </span>
        <h1 class="t-display" style="margin-top:0.8rem">
          {{ locale === 'ar' ? 'نصائح وأدلة حول المسابح الخاصة' : 'Conseils & guides sur les piscines privées' }}
        </h1>
        <p class="t-bodyl hero-sub">
          {{ locale === 'ar'
            ? 'اكتشف كيفية استئجار مسبح خاص، كيفية أن تصبح مضيفاً، وأفضل المواقع في المغرب.'
            : 'Découvrez comment louer une piscine privée, devenir hôte, et trouver les meilleures adresses au Maroc.'
          }}
        </p>
      </div>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" class="hero-wave" aria-hidden="true">
        <path d="M0,34 C240,64 480,6 720,28 C960,50 1200,12 1440,36 L1440,60 L0,60 Z" fill="#FAFAF7"/>
      </svg>
    </section>

    <section class="wrap section">
      <div class="posts-grid">
        <NuxtLink
          v-for="post in posts"
          :key="post.slug"
          :to="localePath(`/blog/${post.slug}`)"
          class="post-card"
        >
          <div class="post-image">
            <div class="post-image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          </div>
          <div class="post-content">
            <div class="post-meta">
              <span class="post-date">{{ post.date }}</span>
              <span class="post-read">{{ post.readTime }}</span>
            </div>
            <h2 class="post-title">{{ post.title }}</h2>
            <p class="post-excerpt">{{ post.excerpt }}</p>
            <span class="post-cta">
              {{ locale === 'ar' ? 'اقرأ المزيد' : 'Lire l\'article' }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-x" aria-hidden="true">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </span>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section { padding-block: clamp(2.4rem, 5vw, 3.8rem); }

.hero { position: relative; overflow: hidden; isolation: isolate; background: linear-gradient(140deg, #0e7490 0%, #0891b2 38%, #22c9de 72%, #7fe6ef 100%); color: #fff; }
.hero-inner { text-align: center; padding-top: clamp(2.5rem, 5vw, 3.6rem); padding-bottom: clamp(2.8rem, 6vw, 4rem); }
.hero-sub { margin-top: 0.9rem; color: rgba(255,255,255,0.92); max-width: 46ch; margin-inline: auto; }
.hero-wave { display: block; width: 100%; height: 46px; }
.noise { position: absolute; inset: 0; z-index: -1; opacity: 0.05; mix-blend-mode: overlay; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

.posts-grid { display: grid; gap: 1.2rem; }
@media (min-width: 640px) { .posts-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .posts-grid { grid-template-columns: repeat(3, 1fr); } }

.post-card { display: flex; flex-direction: column; background: #fff; border: 1px solid var(--line); border-radius: var(--r-2xl); overflow: hidden; box-shadow: var(--sh-sm); text-decoration: none; color: var(--ink); transition: transform var(--dur-2), box-shadow var(--dur-2); }
.post-card:hover { transform: translateY(-3px); box-shadow: var(--sh-lg); }
.post-card:hover .post-cta { color: var(--aqua-700); }

.post-image { aspect-ratio: 16/10; background: var(--sand-2); overflow: hidden; }
.post-image-placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: var(--ink-faint); }
.post-image-placeholder svg { width: 40px; height: 40px; }

.post-content { padding: 1.2rem; display: flex; flex-direction: column; flex: 1; }
.post-meta { display: flex; gap: 0.8rem; font-size: 0.78rem; color: var(--ink-muted); margin-bottom: 0.5rem; }
.post-title { font-size: 1.1rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.5rem; }
.post-excerpt { font-size: 0.9rem; color: var(--ink-muted); line-height: 1.5; flex: 1; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.post-cta { display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 700; color: var(--aqua-600); font-size: 0.9rem; transition: color var(--dur-1); }
.post-cta svg { width: 16px; height: 16px; }
</style>
