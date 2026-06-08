<script setup lang="ts">
// City landing page (SSR, crawlable) — e.g. /fr/piscines/casablanca.
// Resolves the city by slug, renders a hero + SEO intro + the city's pools as
// a PoolCard grid, plus links to nearby/other cities. Emits ItemList JSON-LD
// so the page is a genuine, indexable SEO entry point.
import type { City, PoolListItem } from '~/types/db'

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: true })
const config = useRuntimeConfig()

const slug = computed(() => String(route.params.slug))

const { cities, pending: citiesPending } = useCities()
const city = computed<City | null>(
  () => cities.value.find((c) => c.slug === slug.value) ?? null
)
const cityName = computed(() =>
  city.value ? (locale.value === 'ar' ? city.value.name_ar : city.value.name_fr) : ''
)

// Unknown slug → friendly 404 once cities have loaded.
const notFound = computed(() => !citiesPending.value && !city.value)

// Pools for this city (composable re-runs when the slug filter changes).
const poolFilters = computed(() => ({ citySlug: slug.value }))
const { pools, pending: poolsPending } = usePools(poolFilters)

// Other cities to cross-link (same region first, then fill up to 8).
const otherCities = computed(() => {
  const me = city.value
  if (!me) return []
  const rest = cities.value.filter((c) => c.slug !== me.slug)
  const sameRegion = rest.filter((c) => me.region && c.region === me.region)
  const others = rest.filter((c) => !(me.region && c.region === me.region))
  return [...sameRegion, ...others].slice(0, 8)
})
function cityLabel(c: City): string {
  return locale.value === 'ar' ? c.name_ar : c.name_fr
}

// ── Favorites wiring (same pattern as index/search) ──────────────────────
const { favoriteIdSet } = useFavorites()
const { toggle } = useToggleFavorite()
function isFav(id: string): boolean {
  return favoriteIdSet.value.has(id)
}
function onToggleFav(pool: PoolListItem, next: boolean): void {
  void toggle(pool.id, !next)
}
function cardAmenities(pool: PoolListItem): string[] {
  return pool.amenities
    .filter((a) => a.included)
    .slice(0, 3)
    .map((a) => (locale.value === 'ar' ? a.label_ar : a.label_fr))
}
function cardCity(pool: PoolListItem): string {
  return pool.neighborhood ? `${pool.neighborhood} · ${pool.cityName}` : pool.cityName
}

const poolCount = computed(() => pools.value.length)
const searchLink = computed(() => localePath(`/search?city=${encodeURIComponent(slug.value)}`))

// ── SEO ──────────────────────────────────────────────────────────────────
const pageTitle = computed(() =>
  cityName.value ? t('city.seoTitle', { city: cityName.value }) : 'Masbah'
)
const pageDescription = computed(() =>
  cityName.value ? t('city.seoDesc', { city: cityName.value }) : t('home.subtitle')
)

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value,
  ogTitle: () => pageTitle.value,
  ogDescription: () => pageDescription.value,
  ogImage: () => pools.value.find((p) => p.coverUrl)?.coverUrl ?? `${config.public.siteUrl}/pwa-512x512.png`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

// ItemList of the city's pools + a CollectionPage wrapper for richer indexing.
const jsonLd = computed(() => {
  if (!city.value) return null
  const base = config.public.siteUrl
  const items = pools.value.slice(0, 24).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${base}${localePath(`/pools/${p.id}`)}`,
    name: p.title,
  }))
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle.value,
    description: pageDescription.value,
    url: `${base}${localePath(`/piscines/${slug.value}`)}`,
    about: {
      '@type': 'City',
      name: cityName.value,
      addressCountry: 'MA',
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: pools.value.length,
      itemListElement: items,
    },
  }
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: [...(localeHead.value.link ?? [])],
  meta: [...(localeHead.value.meta ?? [])],
  script: jsonLd.value
    ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd.value) }]
    : [],
}))
</script>

<template>
  <div class="city-page">
    <!-- ░░ NOT FOUND ░░ -->
    <div v-if="notFound" class="wrap notfound">
      <span class="state-ill">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
          <path d="M9 10h6M12 7v6" />
        </svg>
      </span>
      <h1 class="t-h2" style="margin-top: 1rem">{{ t('city.notFoundTitle') }}</h1>
      <p class="t-body muted" style="margin-top: 0.5rem; max-width: 42ch">{{ t('city.notFoundBody') }}</p>
      <NuxtLink :to="localePath('/search')" class="btn btn-primary" style="margin-top: 1.4rem">
        {{ t('city.exploreAll') }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- ░░ HERO ░░ -->
      <section class="hero">
        <div class="blob" style="width: 320px; height: 320px; top: -90px; inset-inline-start: -70px" />
        <div class="blob" style="width: 260px; height: 260px; bottom: -30px; inset-inline-end: 6%" />
        <div class="wrap hero-inner">
          <nav class="crumbs" aria-label="Fil d'Ariane">
            <NuxtLink :to="localePath('/')">{{ t('nav.home') }}</NuxtLink>
            <span aria-hidden="true">/</span>
            <NuxtLink :to="localePath('/search')">{{ t('nav.explore') }}</NuxtLink>
            <span aria-hidden="true">/</span>
            <span class="crumb-current">{{ cityName || '…' }}</span>
          </nav>
          <h1 class="t-display hero-h1">{{ cityName ? t('city.heroTitle', { city: cityName }) : '…' }}</h1>
          <p v-if="city" class="t-bodyl hero-sub">{{ t('city.intro', { city: cityName }) }}</p>
          <div class="hero-actions">
            <NuxtLink :to="searchLink" class="btn btn-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
              {{ t('city.searchCta', { city: cityName }) }}
            </NuxtLink>
            <span class="cash-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="3" /><circle cx="12" cy="12" r="2.5" />
              </svg>
              {{ t('common.cashOnPlace') }}
            </span>
          </div>
        </div>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" class="hero-wave" aria-hidden="true">
          <path d="M0,32 C240,60 480,6 720,26 C960,46 1200,12 1440,34 L1440,60 L0,60 Z" fill="#FAFAF7" />
        </svg>
      </section>

      <!-- ░░ POOLS ░░ -->
      <section class="wrap section">
        <div class="sec-head">
          <div>
            <span class="t-over">{{ t('city.poolsOver') }}</span>
            <h2 class="t-h2" style="margin-top: 0.3rem">
              {{ cityName ? t('city.poolsTitle', { city: cityName }) : t('city.poolsTitleGeneric') }}
            </h2>
          </div>
          <NuxtLink :to="searchLink" class="btn btn-secondary btn-sm see-all">{{ t('common.seeAll') }}</NuxtLink>
        </div>

        <!-- skeletons -->
        <div v-if="poolsPending || citiesPending" class="pool-grid">
          <PoolCardSkeleton v-for="n in 6" :key="n" />
        </div>

        <!-- empty -->
        <div v-else-if="poolCount === 0" class="state-card">
          <span class="ill-circle">
            <span class="acc" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-3.5-3.5" /><path d="M8 11c.8-1 2.2-1 3 0s2.2 1 3 0" />
            </svg>
          </span>
          <div class="sc-title">{{ t('city.empty.title', { city: cityName }) }}</div>
          <p class="sc-copy">{{ t('city.empty.body') }}</p>
          <div class="sc-action">
            <NuxtLink :to="localePath('/search')" class="btn btn-primary btn-sm">{{ t('city.exploreAll') }}</NuxtLink>
          </div>
        </div>

        <!-- grid -->
        <div v-else class="pool-grid">
          <PoolCard
            v-for="pool in pools"
            :id="pool.id"
            :key="pool.id"
            :title="pool.title"
            :city="cardCity(pool)"
            :rating="pool.rating ?? undefined"
            :review-count="pool.reviewCount"
            :price-from="pool.priceFrom ?? undefined"
            :cover-url="pool.coverUrl ?? undefined"
            :amenities="cardAmenities(pool)"
            :sheltered="pool.sheltered"
            :reliable-host="pool.rating !== null && pool.rating >= 4.7"
            :favorite="isFav(pool.id)"
            @update:favorite="(v: boolean) => onToggleFav(pool, v)"
          />
        </div>
      </section>

      <!-- ░░ NEARBY / OTHER CITIES ░░ -->
      <section v-if="otherCities.length" class="wrap section other-cities">
        <div class="sec-head">
          <div>
            <span class="t-over">{{ t('city.nearbyOver') }}</span>
            <h2 class="t-h2" style="margin-top: 0.3rem">{{ t('city.nearbyTitle') }}</h2>
          </div>
        </div>
        <div class="city-chips">
          <NuxtLink
            v-for="c in otherCities"
            :key="c.id"
            :to="localePath(`/piscines/${c.slug}`)"
            class="chip city-chip"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {{ cityLabel(c) }}
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.city-page {
  padding-bottom: 2.5rem;
}

/* not found */
.notfound {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block: clamp(3rem, 8vw, 5rem);
}
.state-ill {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 34%, var(--aqua-100), var(--aqua-50));
  display: grid;
  place-items: center;
  color: var(--aqua-700);
}
.state-ill svg {
  width: 42px;
  height: 42px;
}

/* hero */
.hero {
  position: relative;
  overflow: hidden;
  background: var(--grad-hero);
  color: #fff;
}
.blob {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0));
  pointer-events: none;
}
.hero-inner {
  position: relative;
  padding-top: clamp(1.6rem, 4vw, 2.6rem);
  padding-bottom: clamp(2.2rem, 5vw, 3.2rem);
}
.crumbs {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  flex-wrap: wrap;
}
.crumbs a {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
}
.crumbs a:hover {
  color: #fff;
  text-decoration: underline;
}
.crumb-current {
  color: #fff;
}
.hero-h1 {
  margin-top: 1rem;
}
.hero-sub {
  margin-top: 0.7rem;
  color: rgba(255, 255, 255, 0.92);
  max-width: 56ch;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  align-items: center;
  margin-top: 1.3rem;
}
.cash-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
  border-radius: var(--r-pill);
  padding: 0.5rem 0.85rem;
}
.cash-pill svg {
  width: 16px;
  height: 16px;
}
.hero-wave {
  display: block;
  width: 100%;
  height: 44px;
}

/* sections */
.section {
  padding-top: clamp(1.8rem, 4vw, 2.6rem);
}
.sec-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.2rem;
}
.see-all {
  flex: none;
}
.pool-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 560px) {
  .pool-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (min-width: 1024px) {
  .pool-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

/* state card */
.state-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  padding: 2.4rem 1.3rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ill-circle {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 34%, var(--aqua-100), var(--aqua-50));
  display: grid;
  place-items: center;
  color: var(--aqua-700);
  position: relative;
  margin-bottom: 1rem;
}
.ill-circle > svg {
  width: 42px;
  height: 42px;
}
.ill-circle .acc {
  position: absolute;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--coral);
  top: 10px;
  inset-inline-end: 16px;
  box-shadow: 0 0 0 4px #fff;
}
.sc-title {
  font-weight: 700;
  font-size: 1.02rem;
}
.sc-copy {
  font-size: 0.86rem;
  color: var(--ink-muted);
  line-height: 1.5;
  margin-top: 0.35rem;
  max-width: 24rem;
}
.sc-action {
  margin-top: 1.1rem;
}

/* city chips */
.city-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.city-chip {
  text-decoration: none;
}
.city-chip svg {
  width: 16px;
  height: 16px;
  color: var(--aqua-700);
}
.other-cities {
  margin-top: 0.5rem;
}
</style>
