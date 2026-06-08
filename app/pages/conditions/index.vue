<script setup lang="ts">
// Public terms of use, adapted to the Masbah V2 model: Masbah is a connection
// platform only (not a party to the rental), cash on site, no online payment,
// approximate location until acceptance, two-way reviews.
const { t } = useI18n()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: true })
const config = useRuntimeConfig()

const lastUpdated = '2026-06-08'

useSeoMeta({
  title: () => `${t('legal.terms.seoTitle')} — Masbah`,
  description: () => t('legal.terms.intro'),
  ogTitle: () => `${t('legal.terms.seoTitle')} — Masbah`,
  ogDescription: () => t('legal.terms.intro'),
  ogImage: () => `${config.public.siteUrl}/pwa-512x512.png`,
  ogType: 'website',
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: [...(localeHead.value.link ?? [])],
  meta: [...(localeHead.value.meta ?? [])],
}))

const sections = computed(() => [
  { title: t('legal.terms.s1Title'), body: t('legal.terms.s1Body') },
  { title: t('legal.terms.s2Title'), body: t('legal.terms.s2Body') },
  { title: t('legal.terms.s3Title'), body: t('legal.terms.s3Body') },
  { title: t('legal.terms.s4Title'), body: t('legal.terms.s4Body') },
  { title: t('legal.terms.s5Title'), body: t('legal.terms.s5Body') },
  { title: t('legal.terms.s6Title'), body: t('legal.terms.s6Body') },
  { title: t('legal.terms.s7Title'), body: t('legal.terms.s7Body') },
  { title: t('legal.terms.s8Title'), body: t('legal.terms.s8Body') },
  { title: t('legal.terms.s9Title'), body: t('legal.terms.s9Body') },
])
</script>

<template>
  <article class="legal">
    <header class="legal-head">
      <NuxtLink :to="localePath('/')" class="back-link">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="flip-x"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        {{ t('profile.backHome') }}
      </NuxtLink>
      <h1 class="t-h1">{{ t('legal.terms.title') }}</h1>
      <p class="faint t-sm legal-date">{{ t('legal.lastUpdated', { date: lastUpdated }) }}</p>
    </header>

    <p class="t-bodyl legal-intro">{{ t('legal.terms.intro') }}</p>

    <section v-for="(s, i) in sections" :key="i" class="legal-section">
      <h2 class="t-h3">{{ s.title }}</h2>
      <p class="t-body">{{ s.body }}</p>
    </section>

    <section class="legal-section legal-contact">
      <h2 class="t-h3">{{ t('legal.terms.contactTitle') }}</h2>
      <p class="t-body">{{ t('legal.terms.contactBody') }}</p>
    </section>
  </article>
</template>

<style scoped>
.legal {
  max-width: 720px;
  margin-inline: auto;
  padding-block: 1rem 1.5rem;
}
.legal-head {
  margin-bottom: 1.6rem;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--aqua-700);
  text-decoration: none;
  margin-bottom: 1rem;
}
.back-link svg {
  width: 16px;
  height: 16px;
}
.back-link:hover {
  color: var(--aqua-800);
}
.legal-date {
  margin-top: 0.5rem;
}
.legal-intro {
  color: var(--ink);
  margin-bottom: 1.8rem;
}
.legal-section {
  margin-bottom: 1.6rem;
}
.legal-section h2 {
  margin-bottom: 0.5rem;
}
.legal-section p {
  color: var(--ink-muted);
}
.legal-contact {
  border-top: 1px solid var(--line);
  padding-top: 1.6rem;
}
</style>
