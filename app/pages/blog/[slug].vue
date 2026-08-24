<script setup lang="ts">
// Blog post detail page — renders markdown content with SEO.
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: true })
const config = useRuntimeConfig()

const slug = computed(() => String(route.params.slug))

// Blog posts metadata
const postsMeta: Record<string, { title: string; description: string; date: string; readTime: string }> = {
  'louer-piscine-privee-maroc': {
    title: locale.value === 'ar' ? 'كيفية استئجار مسبح خاص في المغرب' : 'Louer une piscine privée au Maroc : guide complet 2024',
    description: locale.value === 'ar'
      ? 'دليل شامل لاستئجار مسبح خاص في المغرب. اكتشف الأسعار، المدن الأكثر طلباً، والنصائح للحصول على أفضل تجربة.'
      : 'Guide complet pour louer une piscine privée au Maroc. Découvrez les prix, les villes les plus demandées et nos conseils.',
    date: '2024-08-20',
    readTime: '5 min',
  },
  'devenir-hote-piscine-maroc': {
    title: locale.value === 'ar' ? 'كن مضيف مسبح في المغرب: الدخل والمزايا' : 'Devenir hôte de piscine au Maroc : revenus et avantages',
    description: locale.value === 'ar'
      ? 'حوّل مسبحك الخاص إلى مصدر دخل. تعرّف على الإمكانيات المالية، المزايا، وكيفية البدء.'
      : 'Transformez votre piscine privée en source de revenus. Découvrez le potentiel financier et comment démarrer.',
    date: '2024-08-18',
    readTime: '4 min',
  },
  'meilleures-piscines-casablanca': {
    title: locale.value === 'ar' ? 'أفضل المسابح الخاصة في الدار البيضاء' : 'Les meilleures piscines privées à Casablanca et environs',
    description: locale.value === 'ar'
      ? 'استكشف أفضل الخيارات في دار بوعزة، بوسكورة، المحمدية والدار البيضاء.'
      : 'Explorez les meilleures options à Dar Bouazza, Bouskoura, Mohammedia et Casablanca.',
    date: '2024-08-15',
    readTime: '6 min',
  },
}

const meta = computed(() => postsMeta[slug.value])

useSeoMeta({
  title: () => meta.value ? `${meta.value.title} — Masbah Blog` : 'Blog — Masbah',
  description: () => meta.value?.description ?? '',
  ogTitle: () => meta.value ? `${meta.value.title} — Masbah Blog` : 'Blog — Masbah',
  ogDescription: () => meta.value?.description ?? '',
  ogImage: () => `${config.public.siteUrl}/pwa-512x512.png`,
  ogType: 'article',
  twitterCard: 'summary_large_image',
})

// Article structured data
const articleLd = computed(() => {
  if (!meta.value) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.value.title,
    description: meta.value.description,
    image: `${config.public.siteUrl}/pwa-512x512.png`,
    datePublished: meta.value.date,
    author: {
      '@type': 'Organization',
      name: 'Masbah',
      url: config.public.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Masbah',
      logo: { '@type': 'ImageObject', url: `${config.public.siteUrl}/pwa-512x512.png` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${config.public.siteUrl}/${locale.value}/blog/${slug.value}`,
    },
  }
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: [...(localeHead.value.link ?? [])],
  meta: [...(localeHead.value.meta ?? [])],
  script: articleLd.value
    ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(articleLd.value) }]
    : [],
}))

// Simple markdown-like rendering for now
// In production, use @nuxt/content or a proper markdown parser
const contentHtml = computed(() => {
  // This would normally be fetched from a CMS or markdown file
  // For now, return a placeholder
  return `<p class="t-body">${locale.value === 'ar' ? 'جاري تحميل المقال...' : 'Chargement de l\'article...'}</p>`
})
</script>

<template>
  <div class="blog-post">
    <article v-if="meta" class="wrap article-wrap">
      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <NuxtLink :to="localePath('/blog')" class="breadcrumb-link">
          {{ locale === 'ar' ? 'المدونة' : 'Blog' }}
        </NuxtLink>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flip-x" aria-hidden="true">
          <path d="m9 18 6-6-6-6"/>
        </svg>
        <span class="breadcrumb-current">{{ meta.title }}</span>
      </nav>

      <!-- Header -->
      <header class="article-header">
        <div class="article-meta">
          <span class="article-date">{{ meta.date }}</span>
          <span class="article-read">{{ meta.readTime }}</span>
        </div>
        <h1 class="article-title">{{ meta.title }}</h1>
        <p class="article-description">{{ meta.description }}</p>
      </header>

      <!-- Content placeholder -->
      <div class="article-content" v-html="contentHtml" />

      <!-- CTA -->
      <div class="article-cta">
        <NuxtLink :to="localePath('/search')" class="btn btn-primary btn-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          {{ locale === 'ar' ? 'ابحث عن مسبح' : 'Trouver une piscine' }}
        </NuxtLink>
      </div>
    </article>

    <!-- Not found -->
    <div v-else class="wrap notfound">
      <h1 class="t-h2">{{ locale === 'ar' ? 'المقال غير موجود' : 'Article non trouvé' }}</h1>
      <NuxtLink :to="localePath('/blog')" class="btn btn-primary" style="margin-top:1rem">
        {{ locale === 'ar' ? 'العودة إلى المدونة' : 'Retour au blog' }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.blog-post { padding-block: 2rem 4rem; }

.article-wrap { max-width: 720px; margin-inline: auto; }

.breadcrumb { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; font-size: 0.85rem; }
.breadcrumb-link { color: var(--aqua-700); text-decoration: none; font-weight: 600; }
.breadcrumb-link:hover { text-decoration: underline; }
.breadcrumb svg { width: 16px; height: 16px; color: var(--ink-muted); }
.breadcrumb-current { color: var(--ink-muted); }

.article-header { margin-bottom: 2rem; }
.article-meta { display: flex; gap: 1rem; font-size: 0.85rem; color: var(--ink-muted); margin-bottom: 0.8rem; }
.article-title { font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; }
.article-description { font-size: 1.1rem; color: var(--ink-muted); margin-top: 0.6rem; line-height: 1.5; }

.article-content { font-size: 1.05rem; line-height: 1.7; }
.article-content :deep(h2) { font-size: 1.4rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.8rem; }
.article-content :deep(h3) { font-size: 1.15rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.6rem; }
.article-content :deep(p) { margin-bottom: 1rem; }
.article-content :deep(ul), .article-content :deep(ol) { margin-bottom: 1rem; padding-inline-start: 1.5rem; }
.article-content :deep(li) { margin-bottom: 0.4rem; }
.article-content :deep(strong) { font-weight: 700; }
.article-content :deep(a) { color: var(--aqua-700); text-decoration: none; }
.article-content :deep(a:hover) { text-decoration: underline; }

.article-cta { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--line); text-align: center; }

.notfound { text-align: center; padding-block: 4rem; }
</style>
