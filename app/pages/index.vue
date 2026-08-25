<script setup lang="ts">
import type { PoolListItem, SlotKey } from '~/types/db'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: true })
const config = useRuntimeConfig()

// ── Data ────────────────────────────────────────────────────────────────
const { pools: featured, pending: featuredPending, error: featuredError } = useFeaturedPools(6)
const { cities } = useCities()
const { favoriteIdSet } = useFavorites()
const { toggle } = useToggleFavorite()

// A small curated set of popular cities (fallback slugs if the DB is empty).
const popularCities = computed(() => cities.value.slice(0, 8))

// ── Search bar ──────────────────────────────────────────────────────────
const searchCity = ref('')
const searchSlot = ref<'' | SlotKey>('')

const slotOptions = computed(() => [
  { value: '', label: t('home.search.slotAny') },
  { value: 'morning', label: t('slots.morning') },
  { value: 'afternoon', label: t('slots.afternoon') },
  { value: 'evening', label: t('slots.evening') },
  { value: 'full_day', label: t('slots.fullDay') },
])

function submitSearch(): void {
  const params = new URLSearchParams()
  const city = searchCity.value.trim()
  if (city) params.set('city', city)
  if (searchSlot.value) params.set('slot', searchSlot.value)
  const qs = params.toString()
  navigateTo(localePath(`/search${qs ? `?${qs}` : ''}`))
}

// ── Favorites wiring ────────────────────────────────────────────────────
function isFav(id: string): boolean {
  return favoriteIdSet.value.has(id)
}

function onToggleFav(pool: PoolListItem, next: boolean): void {
  // `next` is the new model value emitted by PoolCard; toggle() takes the
  // CURRENT state, so we pass its inverse.
  void toggle(pool.id, !next)
}

// Card amenity chips: show the first couple of included amenities as emoji/text.
function cardAmenities(pool: PoolListItem): string[] {
  return pool.amenities
    .filter((a) => a.included)
    .slice(0, 3)
    .map((a) => (locale.value === 'ar' ? a.label_ar : a.label_fr))
}

// ── SEO ─────────────────────────────────────────────────────────────────
const ogImage = computed(() => `${config.public.siteUrl}/pwa-512x512.png`)

useSeoMeta({
  title: () => `Masbah — ${t('home.title')}`,
  description: () => t('home.subtitle'),
  ogTitle: () => `Masbah — ${t('home.title')}`,
  ogDescription: () => t('home.subtitle'),
  ogImage: () => ogImage.value,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: [...(localeHead.value.link ?? [])],
  meta: [...(localeHead.value.meta ?? [])],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${config.public.siteUrl}/#website`,
            url: config.public.siteUrl,
            name: 'Masbah',
            description: t('home.subtitle'),
            inLanguage: locale.value === 'ar' ? 'ar-MA' : 'fr-MA',
            publisher: { '@id': `${config.public.siteUrl}/#organization` },
            potentialAction: {
              '@type': 'SearchAction',
              target: `${config.public.siteUrl}/${locale.value}/search?city={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@type': 'Organization',
            '@id': `${config.public.siteUrl}/#organization`,
            name: 'Masbah',
            alternateName: 'مصباح',
            url: config.public.siteUrl,
            logo: `${config.public.siteUrl}/pwa-512x512.png`,
            sameAs: [],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer support',
              availableLanguage: ['French', 'Arabic'],
            },
          },
          {
            '@type': 'LocalBusiness',
            '@id': `${config.public.siteUrl}/#localbusiness`,
            name: 'Masbah — Location de piscines privées',
            description: t('home.subtitle'),
            url: config.public.siteUrl,
            areaServed: {
              '@type': 'Country',
              name: 'Morocco',
            },
            priceRange: '$$',
            paymentAccepted: 'Cash',
            currenciesAccepted: 'MAD',
          },
        ],
      }),
    },
  ],
}))
</script>

<template>
  <div class="home">
    <!-- ═══════════ HERO + SEARCH ═══════════ -->
    <section class="hero">
      <div class="noise" />
      <div
        class="blob"
        style="width: 340px; height: 340px; top: -90px; inset-inline-start: -70px"
      />
      <div
        class="blob"
        style="
          width: 280px;
          height: 280px;
          bottom: -30px;
          inset-inline-end: 6%;
          animation-delay: -6s;
        "
      />
      <div class="wrap hero-inner">
        <div class="hero-copy">
          <span class="hero-eyebrow rise">
            <span class="dot" />
            {{ t('home.badge') }}
          </span>
          <h1 class="t-display rise" style="margin-top: 1rem; animation-delay: 0.05s">
            {{ t('home.title') }}
          </h1>
          <p class="t-bodyl rise hero-sub" style="animation-delay: 0.12s">
            {{ t('home.subtitle') }}
          </p>
        </div>

        <!-- Search card -->
        <form class="search-card rise" style="animation-delay: 0.2s" @submit.prevent="submitSearch">
          <div class="search-grid">
            <div class="field search-city">
              <label class="label" for="home-city">{{ t('home.search.cityLabel') }}</label>
              <div class="city-wrap">
                <svg
                  class="city-pin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--aqua-700)"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  id="home-city"
                  v-model="searchCity"
                  class="input city-input"
                  type="text"
                  autocomplete="off"
                  :placeholder="t('home.search.cityPlaceholder')"
                />
              </div>
            </div>

            <PSelect
              id="home-slot"
              v-model="searchSlot"
              class="search-slot"
              :label="t('home.search.slotLabel')"
              :options="slotOptions"
            />

            <button class="btn btn-primary btn-lg search-submit" type="submit">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              {{ t('home.search.submit') }}
            </button>
          </div>

          <div class="search-trust">
            <span class="trust-pill">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success)"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {{ t('common.cashOnPlace') }}
            </span>
            <span class="trust-pill">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success)"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {{ t('pool.verified') }}
            </span>
            <span class="trust-pill">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success)"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {{ t('pool.sheltered') }}
            </span>
          </div>
        </form>
      </div>
      <svg viewBox="0 0 1440 70" preserveAspectRatio="none" class="hero-wave" aria-hidden="true">
        <path
          d="M0,38 C240,72 480,8 720,30 C960,52 1200,14 1440,40 L1440,70 L0,70 Z"
          fill="#FAFAF7"
        />
      </svg>
    </section>

<!-- ═══════════ STATS / TRUST BAR ═══════════ -->
    <section class="wrap stats-bar">
      <div class="stats-grid">
        <div class="stat">
          <span class="stat-num">15+</span>
          <span class="stat-label">{{ t('home.stats.cities') }}</span>
        </div>
        <div class="stat">
          <span class="stat-num">100%</span>
          <span class="stat-label">{{ t('home.stats.cash') }}</span>
        </div>
        <div class="stat">
          <span class="stat-num">24h</span>
          <span class="stat-label">{{ t('home.stats.response') }}</span>
        </div>
        <div class="stat">
          <span class="stat-num">0 DH</span>
          <span class="stat-label">{{ t('home.stats.fees') }}</span>
        </div>
      </div>
    </section>

    <!-- ═══════════ POPULAR CITIES ═══════════ -->
    <section v-if="popularCities.length" class="wrap section cities-section">
      <div class="sec-head">
        <div>
          <span class="t-over">{{ t('home.popular.over') }}</span>
          <h2 class="t-h2" style="margin-top: 0.3rem">{{ t('home.popular.title') }}</h2>
        </div>
      </div>
      <div class="city-chips">
        <NuxtLink
          v-for="c in popularCities"
          :key="c.id"
          :to="localePath(`/search?city=${encodeURIComponent(c.slug)}`)"
          class="chip city-chip"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {{ locale === 'ar' ? c.name_ar : c.name_fr }}
        </NuxtLink>
      </div>
    </section>

    <!-- ═══════════ FEATURED POOLS ═══════════ -->
    <section class="wrap section">
      <div class="sec-head">
        <div>
          <span class="t-over">{{ t('home.featured.over') }}</span>
          <h2 class="t-h2" style="margin-top: 0.3rem">{{ t('home.featured.title') }}</h2>
        </div>
        <NuxtLink :to="localePath('/search')" class="see-all">
          {{ t('common.seeAll') }}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            class="flip-x"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </NuxtLink>
      </div>

      <!-- Loading -->
      <div v-if="featuredPending" class="pool-grid">
        <PoolCardSkeleton v-for="n in 6" :key="n" />
      </div>

      <!-- Error -->
      <div v-else-if="featuredError" class="state-block">
        <p class="t-body muted">{{ t('home.featured.error') }}</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!featured.length" class="state-block">
        <span class="state-ill">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-3.5-3.5" />
            <path d="M8 11c.8-1 2.2-1 3 0s2.2 1 3 0" />
          </svg>
        </span>
        <p class="t-body muted" style="max-width: 28rem">{{ t('home.featured.empty') }}</p>
      </div>

      <!-- Grid -->
      <div v-else class="pool-grid">
        <PoolCard
          v-for="pool in featured"
          :id="pool.id"
          :key="pool.id"
          :title="pool.title"
          :city="pool.neighborhood ? `${pool.neighborhood} · ${pool.cityName}` : pool.cityName"
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

    <!-- ═══════════ WHY MASBAH ═══════════ -->
    <section class="wrap section why-section">
      <div class="sec-head-center">
        <span class="t-over">{{ t('home.why.over') }}</span>
        <h2 class="t-h2" style="margin-top: 0.3rem">{{ t('home.why.title') }}</h2>
      </div>
      <div class="why-grid">
        <div class="why-card">
          <span class="why-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z"/>
            </svg>
          </span>
          <h3 class="why-title">{{ t('home.why.b1Title') }}</h3>
          <p class="t-body muted">{{ t('home.why.b1Body') }}</p>
        </div>
        <div class="why-card">
          <span class="why-ico why-ico-aqua">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2.5"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
              <path d="m9 16 2 2 4-4"/>
            </svg>
          </span>
          <h3 class="why-title">{{ t('home.why.b2Title') }}</h3>
          <p class="t-body muted">{{ t('home.why.b2Body') }}</p>
        </div>
        <div class="why-card">
          <span class="why-ico why-ico-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="3"/>
              <circle cx="12" cy="12" r="2.5"/>
            </svg>
          </span>
          <h3 class="why-title">{{ t('home.why.b3Title') }}</h3>
          <p class="t-body muted">{{ t('home.why.b3Body') }}</p>
        </div>
        <div class="why-card">
          <span class="why-ico why-ico-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          <h3 class="why-title">{{ t('home.why.b4Title') }}</h3>
          <p class="t-body muted">{{ t('home.why.b4Body') }}</p>
        </div>
      </div>
    </section>

    <!-- ═══════════ HOW IT WORKS ═══════════ -->
    <section class="how-section">
      <div class="wrap section">
        <div class="how-head">
          <span class="t-over">{{ t('home.how.over') }}</span>
          <h2 class="t-h2" style="margin-top: 0.3rem">{{ t('home.how.title') }}</h2>
          <p class="t-body muted" style="margin-top: 0.5rem">{{ t('home.how.subtitle') }}</p>
        </div>
        <div class="how-grid">
          <div class="step">
            <span class="num">01</span>
            <span class="ico">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <h3 class="step-title">{{ t('home.how.step1Title') }}</h3>
            <p class="t-body muted" style="margin-top: 0.35rem">{{ t('home.how.step1Body') }}</p>
          </div>
          <div class="step">
            <span class="num">02</span>
            <span class="ico">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2.5" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="m9 16 2 2 4-4" />
              </svg>
            </span>
            <h3 class="step-title">{{ t('home.how.step2Title') }}</h3>
            <p class="t-body muted" style="margin-top: 0.35rem">{{ t('home.how.step2Body') }}</p>
          </div>
          <div class="step">
            <span class="num">03</span>
            <span class="ico ico-amber">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </span>
            <h3 class="step-title">{{ t('home.how.step3Title') }}</h3>
            <p class="t-body muted" style="margin-top: 0.35rem">{{ t('home.how.step3Body') }}</p>
          </div>
        </div>
        <div class="how-cta">
          <NuxtLink :to="localePath('/comment-ca-marche')" class="btn btn-secondary">
            {{ t('home.how.cta') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ═══════════ SOCIAL PROOF ═══════════ -->
    <section class="wrap section proof-section">
      <div class="sec-head-center">
        <span class="t-over">{{ t('home.proof.over') }}</span>
        <h2 class="t-h2" style="margin-top: 0.3rem">{{ t('home.proof.title') }}</h2>
      </div>
      <div class="proof-grid">
        <div class="proof-card">
          <div class="proof-stars">★★★★★</div>
          <p class="proof-quote">{{ t('home.proof.q1') }}</p>
          <div class="proof-author">
            <span class="proof-name">{{ t('home.proof.a1Name') }}</span>
            <span class="proof-meta">{{ t('home.proof.a1Meta') }}</span>
          </div>
        </div>
        <div class="proof-card">
          <div class="proof-stars">★★★★★</div>
          <p class="proof-quote">{{ t('home.proof.q2') }}</p>
          <div class="proof-author">
            <span class="proof-name">{{ t('home.proof.a2Name') }}</span>
            <span class="proof-meta">{{ t('home.proof.a2Meta') }}</span>
          </div>
        </div>
        <div class="proof-card">
          <div class="proof-stars">★★★★★</div>
          <p class="proof-quote">{{ t('home.proof.q3') }}</p>
          <div class="proof-author">
            <span class="proof-name">{{ t('home.proof.a3Name') }}</span>
            <span class="proof-meta">{{ t('home.proof.a3Meta') }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════ HOST CTA ═══════════ -->
    <section class="wrap section">
      <div class="host-cta-band">
        <div class="host-cta-inner">
          <div class="host-cta-copy">
            <span class="t-over" style="color: rgba(255,255,255,0.85)">{{ t('home.hostCta.over') }}</span>
            <h2 class="host-cta-title">{{ t('home.hostCta.title') }}</h2>
            <p class="t-bodyl" style="color: rgba(255,255,255,0.92); margin-top: 0.5rem">{{ t('home.hostCta.subtitle') }}</p>
            <div class="host-cta-row">
              <NuxtLink :to="localePath('/devenir-hote')" class="btn btn-white btn-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                {{ t('home.hostCta.cta') }}
              </NuxtLink>
            </div>
            <p class="host-cta-note">{{ t('home.hostCta.note') }}</p>
          </div>
          <div class="host-cta-visual">
            <div class="host-cta-card">
              <div class="host-cta-card-title">💰 {{ t('home.hostCta.estimateTitle') }}</div>
              <div class="host-cta-card-num">3 000 - 10 000 DH</div>
              <div class="host-cta-card-sub">{{ t('home.hostCta.estimateSub') }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════ FAQ ═══════════ -->
    <section class="wrap section faq-section">
      <div class="sec-head-center" style="margin-bottom: 1.6rem">
        <span class="t-over">{{ t('home.faq.over') }}</span>
        <h2 class="t-h2" style="margin-top: 0.3rem">{{ t('home.faq.title') }}</h2>
      </div>
      <div class="faq-list">
        <details class="faq">
          <summary>
            {{ t('home.faq.q1') }}
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </summary>
          <p class="faq-ans">{{ t('home.faq.a1') }}</p>
        </details>
        <details class="faq">
          <summary>
            {{ t('home.faq.q2') }}
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </summary>
          <p class="faq-ans">{{ t('home.faq.a2') }}</p>
        </details>
        <details class="faq">
          <summary>
            {{ t('home.faq.q3') }}
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </summary>
          <p class="faq-ans">{{ t('home.faq.a3') }}</p>
        </details>
        <details class="faq">
          <summary>
            {{ t('home.faq.q4') }}
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </summary>
          <p class="faq-ans">{{ t('home.faq.a4') }}</p>
        </details>
        <details class="faq">
          <summary>
            {{ t('home.faq.q5') }}
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </summary>
          <p class="faq-ans">{{ t('home.faq.a5') }}</p>
        </details>
      </div>
      <div class="faq-more">
        <NuxtLink :to="localePath('/comment-ca-marche')" class="btn btn-secondary">
          {{ t('home.faq.more') }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Hero ─────────────────────────────────────────────────────────── */
.hero-inner {
  padding-top: clamp(2.4rem, 5vw, 3.6rem);
  padding-bottom: clamp(2.6rem, 5vw, 3.6rem);
}
.hero-copy {
  max-width: 40rem;
  margin-inline: auto;
  text-align: center;
}
.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(255, 255, 255, 0.16);
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}
.hero-eyebrow .dot {
  width: 7px;
  height: 7px;
  border-radius: 99px;
  background: #fcd34d;
}
.hero-sub {
  margin-top: 0.8rem;
  color: rgba(255, 255, 255, 0.92);
}
.hero-wave {
  display: block;
  width: 100%;
  height: 48px;
}

/* ── Search card ──────────────────────────────────────────────────── */
.search-card {
  max-width: 54rem;
  margin: 1.6rem auto 0;
  background: #fff;
  border-radius: var(--r-3xl);
  box-shadow: var(--sh-lg);
  border: 1px solid var(--line);
  padding: 1rem;
}
.search-grid {
  display: grid;
  gap: 0.75rem;
}
.city-wrap {
  position: relative;
}
.city-pin {
  position: absolute;
  inset-inline-start: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  pointer-events: none;
}
.city-input {
  padding-inline-start: 2.5rem;
}
.search-submit {
  width: 100%;
}
.search-trust {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem 1.4rem;
  margin-top: 0.95rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--line);
}
.trust-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink);
}
.trust-pill svg {
  width: 16px;
  height: 16px;
}
@media (min-width: 880px) {
  .search-grid {
    grid-template-columns: 1.6fr 1fr auto;
    align-items: end;
  }
  .search-submit {
    width: auto;
    min-height: 48px;
  }
}

/* ── Sections ─────────────────────────────────────────────────────── */
.section {
  padding-block: clamp(2.4rem, 5vw, 3.8rem);
}
.sec-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.4rem;
}
.see-all {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 700;
  color: var(--aqua-700);
  flex: none;
  text-decoration: none;
}
.see-all svg {
  width: 18px;
  height: 18px;
}

/* cities */
.cities-section {
  padding-bottom: 0;
}
.city-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.city-chip {
  text-decoration: none;
}
.city-chip svg {
  width: 15px;
  height: 15px;
  color: var(--aqua-700);
}

/* featured grid */
.pool-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
}
@media (min-width: 560px) {
  .pool-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 960px) {
  .pool-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 2.5rem 1rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
}
.state-ill {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 34%, var(--aqua-100), var(--aqua-50));
  display: grid;
  place-items: center;
  color: var(--aqua-700);
}
.state-ill svg {
  width: 38px;
  height: 38px;
}

/* how it works */
.how-section {
  background: var(--sand-2);
}
.how-head {
  text-align: center;
  max-width: 40rem;
  margin-inline: auto;
}
.how-grid {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}
@media (min-width: 640px) {
  .how-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.step {
  position: relative;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  padding: 1.4rem;
  box-shadow: var(--sh-sm);
}
.step .ico {
  width: 56px;
  height: 56px;
  border-radius: var(--r-lg);
  background: var(--aqua-50);
  display: grid;
  place-items: center;
  color: var(--aqua-700);
}
.step .ico.ico-amber {
  background: var(--amber-soft);
  color: var(--amber-ink);
}
.step .ico svg {
  width: 28px;
  height: 28px;
}
.step .num {
  position: absolute;
  top: 1.2rem;
  inset-inline-end: 1.3rem;
  font-weight: 800;
  font-size: 1.5rem;
  /* aqua-700 on the white card → ~4.6:1, passes WCAG AA (was aqua-200, ~1.3:1) */
  color: var(--aqua-700);
  line-height: 1;
}
.step-title {
  margin-top: 1rem;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.015em;
}
.how-cta {
  display: flex;
  justify-content: center;
  margin-top: 1.6rem;
}

/* cash strip */
.cash-section {
  padding-top: 0;
}
.cash-strip {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  padding: 1.1rem 1.3rem;
}
.cash-ico {
  font-size: 1.8rem;
  line-height: 1;
  flex: none;
}
.cash-title {
  font-weight: 700;
}

/* ── Stats bar ────────────────────────────────────────────────────── */
.stats-bar {
  padding-block: clamp(1.6rem, 3.5vw, 2.4rem);
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
.stat {
  text-align: center;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  padding: 1.2rem 0.8rem;
  box-shadow: var(--sh-sm);
}
.stat-num {
  display: block;
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 800;
  color: var(--aqua-700);
  line-height: 1.1;
}
.stat-label {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
  font-weight: 600;
}

/* ── Why Masbah ───────────────────────────────────────────────────── */
.sec-head-center {
  text-align: center;
  max-width: 36rem;
  margin-inline: auto;
  margin-bottom: 2rem;
}
.why-section {
  background: var(--sand-2);
}
.why-grid {
  display: grid;
  gap: 1rem;
}
@media (min-width: 640px) {
  .why-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .why-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
.why-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  padding: 1.4rem;
  box-shadow: var(--sh-sm);
}
.why-ico {
  width: 48px;
  height: 48px;
  border-radius: var(--r-lg);
  background: var(--aqua-50);
  color: var(--aqua-700);
  display: grid;
  place-items: center;
  margin-bottom: 0.9rem;
}
.why-ico svg {
  width: 24px;
  height: 24px;
}
.why-ico-aqua {
  background: #e0f2fe;
  color: #0284c7;
}
.why-ico-amber {
  background: var(--amber-soft);
  color: var(--amber-ink);
}
.why-ico-green {
  background: #dcfce7;
  color: #15803d;
}
.why-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 0.2rem;
}

/* ── Social Proof ─────────────────────────────────────────────────── */
.proof-section {
  max-width: 920px;
  margin-inline: auto;
}
.proof-grid {
  display: grid;
  gap: 1rem;
}
@media (min-width: 768px) {
  .proof-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.proof-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  padding: 1.4rem;
  box-shadow: var(--sh-sm);
  display: flex;
  flex-direction: column;
}
.proof-stars {
  color: #f59e0b;
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  margin-bottom: 0.6rem;
}
.proof-quote {
  font-style: italic;
  color: var(--ink);
  line-height: 1.6;
  flex: 1;
  font-size: 0.95rem;
}
.proof-author {
  margin-top: 1rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--line);
}
.proof-name {
  display: block;
  font-weight: 700;
  font-size: 0.9rem;
}
.proof-meta {
  display: block;
  font-size: 0.82rem;
  color: var(--ink-muted);
  margin-top: 0.15rem;
}

/* ── Host CTA Band ────────────────────────────────────────────────── */
.host-cta-band {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: var(--r-3xl);
  background: linear-gradient(140deg, #0e7490 0%, #0891b2 38%, #22c9de 72%, #7fe6ef 100%);
  color: #fff;
}
.host-cta-inner {
  display: grid;
  gap: 1.5rem;
  padding: clamp(1.8rem, 4.5vw, 3rem);
}
@media (min-width: 768px) {
  .host-cta-inner {
    grid-template-columns: 1.4fr 1fr;
    align-items: center;
  }
}
.host-cta-title {
  font-size: clamp(1.4rem, 3.2vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-top: 0.4rem;
}
.host-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1.2rem;
}
.host-cta-note {
  margin-top: 0.7rem;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75);
}
.host-cta-visual {
  display: flex;
  justify-content: center;
}
.host-cta-card {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--r-2xl);
  padding: 1.4rem 1.8rem;
  text-align: center;
  width: 100%;
  max-width: 280px;
}
.host-cta-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}
.host-cta-card-num {
  font-size: clamp(1.3rem, 2.5vw, 1.7rem);
  font-weight: 800;
  margin-top: 0.4rem;
  color: #fff;
}
.host-cta-card-sub {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.2rem;
}

/* ── FAQ ──────────────────────────────────────────────────────────── */
.faq-section {
  max-width: 760px;
  margin-inline: auto;
}
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.faq {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.faq summary {
  list-style: none;
  cursor: pointer;
  padding: 1rem 1.1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-weight: 700;
  font-size: 0.98rem;
}
.faq summary::-webkit-details-marker {
  display: none;
}
.faq summary .chev {
  flex: none;
  width: 20px;
  height: 20px;
  transition: transform var(--dur-2);
  color: var(--aqua-700);
}
.faq[open] summary .chev {
  transform: rotate(180deg);
}
.faq-ans {
  padding: 0 1.1rem 1.1rem;
  color: var(--ink-muted);
  line-height: 1.6;
  font-size: 0.92rem;
}
.faq-more {
  display: flex;
  justify-content: center;
  margin-top: 1.4rem;
}
</style>
