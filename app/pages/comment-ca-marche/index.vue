<script setup lang="ts">
// Public "Comment ça marche" page (S13). Expands the home 3-step flow into a
// fuller explainer: renter steps + owner steps, trust & safety pillars, a clear
// cash-on-site explainer, and an FAQ. Indexable.
const { t } = useI18n()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: true })
const config = useRuntimeConfig()

useSeoMeta({
  title: () => `${t('howItWorks.seoTitle')} — Masbah`,
  description: () => t('howItWorks.seoDescription'),
  ogTitle: () => `${t('howItWorks.seoTitle')} — Masbah`,
  ogDescription: () => t('howItWorks.seoDescription'),
  ogImage: () => `${config.public.siteUrl}/pwa-512x512.png`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: [...(localeHead.value.link ?? [])],
  meta: [...(localeHead.value.meta ?? [])],
}))

const faqs = computed(() => [
  { q: t('howItWorks.faq.q1'), a: t('howItWorks.faq.a1') },
  { q: t('howItWorks.faq.q2'), a: t('howItWorks.faq.a2') },
  { q: t('howItWorks.faq.q3'), a: t('howItWorks.faq.a3') },
  { q: t('howItWorks.faq.q4'), a: t('howItWorks.faq.a4') },
])
</script>

<template>
  <div class="hiw">
    <!-- ═══════════ HERO ═══════════ -->
    <section class="hero">
      <div class="noise" />
      <div class="wrap hero-inner">
        <span class="t-over" style="color: rgba(255, 255, 255, 0.85)">
          {{ t('howItWorks.hero.over') }}
        </span>
        <h1 class="t-display" style="margin-top: 0.8rem">{{ t('howItWorks.hero.title') }}</h1>
        <p class="t-bodyl hero-sub">{{ t('howItWorks.hero.subtitle') }}</p>
      </div>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" class="hero-wave" aria-hidden="true">
        <path
          d="M0,34 C240,64 480,6 720,28 C960,50 1200,12 1440,36 L1440,60 L0,60 Z"
          fill="#FAFAF7"
        />
      </svg>
    </section>

    <!-- ═══════════ RENTER STEPS ═══════════ -->
    <section class="wrap section">
      <div class="sec-head-center">
        <span class="t-over">{{ t('howItWorks.steps.over') }}</span>
        <h2 class="t-h2" style="margin-top: 0.3rem">{{ t('howItWorks.steps.title') }}</h2>
      </div>
      <div class="steps-grid">
        <div class="step">
          <span class="num">01</span>
          <span class="tile">
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
          <h3 class="t-h3 step-title">{{ t('howItWorks.steps.step1Title') }}</h3>
          <p class="t-body muted step-body">{{ t('howItWorks.steps.step1Body') }}</p>
        </div>
        <div class="step">
          <span class="num">02</span>
          <span class="tile tile-coral">
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
          <h3 class="t-h3 step-title">{{ t('howItWorks.steps.step2Title') }}</h3>
          <p class="t-body muted step-body">{{ t('howItWorks.steps.step2Body') }}</p>
        </div>
        <div class="step">
          <span class="num">03</span>
          <span class="tile tile-amber">
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
          <h3 class="t-h3 step-title">{{ t('howItWorks.steps.step3Title') }}</h3>
          <p class="t-body muted step-body">{{ t('howItWorks.steps.step3Body') }}</p>
        </div>
      </div>
    </section>

    <!-- ═══════════ CASH EXPLAINER ═══════════ -->
    <section class="wrap section cash-section">
      <div class="cash-band">
        <span class="cash-ico">💵</span>
        <div>
          <h2 class="cash-title">{{ t('howItWorks.cash.title') }}</h2>
          <p class="t-body cash-body">{{ t('howItWorks.cash.body') }}</p>
        </div>
      </div>
    </section>

    <!-- ═══════════ TRUST & SAFETY ═══════════ -->
    <section class="trust-section">
      <div class="wrap section">
        <div class="sec-head-center" style="max-width: 40rem; margin-inline: auto">
          <span class="t-over">{{ t('howItWorks.trust.over') }}</span>
          <h2 class="t-h2" style="margin-top: 0.3rem">{{ t('howItWorks.trust.title') }}</h2>
          <p class="t-body muted" style="margin-top: 0.5rem">
            {{ t('howItWorks.trust.subtitle') }}
          </p>
        </div>
        <div class="pillars">
          <div class="pillar">
            <span class="ptile">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <h3 class="pillar-title">{{ t('howItWorks.trust.phoneTitle') }}</h3>
            <p class="t-sm muted">{{ t('howItWorks.trust.phoneBody') }}</p>
          </div>
          <div class="pillar">
            <span class="ptile ptile-ink">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <h3 class="pillar-title">{{ t('howItWorks.trust.addressTitle') }}</h3>
            <p class="t-sm muted">{{ t('howItWorks.trust.addressBody') }}</p>
          </div>
          <div class="pillar">
            <span class="ptile ptile-amber">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
                />
              </svg>
            </span>
            <h3 class="pillar-title">{{ t('howItWorks.trust.reviewsTitle') }}</h3>
            <p class="t-sm muted">{{ t('howItWorks.trust.reviewsBody') }}</p>
          </div>
          <div class="pillar">
            <span class="ptile ptile-coral">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
              </svg>
            </span>
            <h3 class="pillar-title">{{ t('howItWorks.trust.safetyTitle') }}</h3>
            <p class="t-sm muted">{{ t('howItWorks.trust.safetyBody') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════ OWNER STEPS ═══════════ -->
    <section class="wrap section">
      <div class="sec-head-center">
        <span class="t-over">{{ t('howItWorks.owner.over') }}</span>
        <h2 class="t-h2" style="margin-top: 0.3rem">{{ t('howItWorks.owner.title') }}</h2>
      </div>
      <div class="steps-grid">
        <div class="step">
          <span class="num">01</span>
          <span class="tile">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
          </span>
          <h3 class="t-h3 step-title">{{ t('howItWorks.owner.step1Title') }}</h3>
          <p class="t-body muted step-body">{{ t('howItWorks.owner.step1Body') }}</p>
        </div>
        <div class="step">
          <span class="num">02</span>
          <span class="tile tile-coral">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M22 12h-5l-1.5 3h-7L7 12H2" />
              <path
                d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1Z"
              />
            </svg>
          </span>
          <h3 class="t-h3 step-title">{{ t('howItWorks.owner.step2Title') }}</h3>
          <p class="t-body muted step-body">{{ t('howItWorks.owner.step2Body') }}</p>
        </div>
        <div class="step">
          <span class="num">03</span>
          <span class="tile tile-amber">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <h3 class="t-h3 step-title">{{ t('howItWorks.owner.step3Title') }}</h3>
          <p class="t-body muted step-body">{{ t('howItWorks.owner.step3Body') }}</p>
        </div>
      </div>
      <div class="owner-cta">
        <NuxtLink :to="localePath('/publish')" class="btn btn-secondary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {{ t('howItWorks.owner.cta') }}
        </NuxtLink>
      </div>
    </section>

    <!-- ═══════════ FAQ ═══════════ -->
    <section class="wrap section faq-section">
      <div class="sec-head-center" style="margin-bottom: 1.6rem">
        <h2 class="t-h2">{{ t('howItWorks.faq.title') }}</h2>
      </div>
      <div class="faq-list">
        <details v-for="(f, i) in faqs" :key="i" class="faq">
          <summary>
            {{ f.q }}
            <svg
              class="chev"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <p class="faq-ans">{{ f.a }}</p>
        </details>
      </div>
    </section>

    <!-- ═══════════ FINAL CTA ═══════════ -->
    <section class="wrap section">
      <div class="cta-band">
        <div class="noise" />
        <div class="cta-inner">
          <h2 class="cta-title">{{ t('howItWorks.ctaTitle') }}</h2>
          <p class="t-bodyl cta-sub">{{ t('howItWorks.ctaSubtitle') }}</p>
          <NuxtLink :to="localePath('/search')" class="btn btn-white btn-lg cta-btn">
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
            {{ t('howItWorks.ctaExplore') }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section {
  padding-block: clamp(2.4rem, 5vw, 3.8rem);
}
.sec-head-center {
  text-align: center;
  max-width: 36rem;
  margin-inline: auto;
  margin-bottom: 2rem;
}

/* hero */
.hero {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: linear-gradient(140deg, #0e7490 0%, #0891b2 38%, #22c9de 72%, #7fe6ef 100%);
  color: #fff;
}
.hero-inner {
  text-align: center;
  padding-top: clamp(2.5rem, 5vw, 3.6rem);
  padding-bottom: clamp(2.8rem, 6vw, 4rem);
}
.hero-sub {
  margin-top: 0.9rem;
  color: rgba(255, 255, 255, 0.92);
  max-width: 46ch;
  margin-inline: auto;
}
.hero-wave {
  display: block;
  width: 100%;
  height: 46px;
}
.noise {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.05;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* steps */
.steps-grid {
  display: grid;
  gap: 1rem;
}
@media (min-width: 640px) {
  .steps-grid {
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
.step .num {
  position: absolute;
  top: 1.2rem;
  inset-inline-end: 1.3rem;
  font-weight: 800;
  font-size: 1.5rem;
  /* aqua-700 on the white card → WCAG AA (was aqua-200, ~1.3:1) */
  color: var(--aqua-700);
  line-height: 1;
}
.step .tile {
  width: 56px;
  height: 56px;
  border-radius: var(--r-lg);
  background: var(--aqua-50);
  color: var(--aqua-700);
  display: grid;
  place-items: center;
  margin-bottom: 1rem;
}
.step .tile.tile-coral {
  background: var(--coral-soft);
  color: var(--coral-deep);
}
.step .tile.tile-amber {
  background: var(--amber-soft);
  color: var(--amber-ink);
}
.step .tile svg {
  width: 28px;
  height: 28px;
}
.step-title {
  font-size: 1.15rem;
}
.step-body {
  margin-top: 0.4rem;
}
.owner-cta {
  display: flex;
  justify-content: center;
  margin-top: 1.8rem;
}
.owner-cta .btn {
  text-decoration: none;
}

/* cash explainer */
.cash-section {
  padding-block: 0;
}
.cash-band {
  display: flex;
  align-items: flex-start;
  gap: 1.1rem;
  background: var(--aqua-50);
  border: 1px solid var(--aqua-200);
  border-radius: var(--r-2xl);
  padding: 1.4rem 1.5rem;
}
.cash-ico {
  font-size: 2rem;
  line-height: 1;
  flex: none;
}
.cash-title {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--aqua-900);
}
.cash-body {
  margin-top: 0.4rem;
  color: var(--ink);
}

/* trust */
.trust-section {
  background: var(--sand-2);
}
.pillars {
  display: grid;
  gap: 1rem;
}
@media (min-width: 560px) {
  .pillars {
    grid-template-columns: 1fr 1fr;
  }
}
@media (min-width: 1024px) {
  .pillars {
    grid-template-columns: repeat(4, 1fr);
  }
}
.pillar {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  padding: 1.3rem;
}
.ptile {
  width: 48px;
  height: 48px;
  border-radius: var(--r-lg);
  background: var(--aqua-50);
  color: var(--aqua-700);
  display: grid;
  place-items: center;
  margin-bottom: 0.8rem;
}
.ptile.ptile-ink {
  background: rgba(10, 45, 56, 0.06);
  color: var(--aqua-800);
}
.ptile.ptile-amber {
  background: var(--amber-soft);
  color: var(--amber);
}
.ptile.ptile-coral {
  background: var(--coral-soft);
  color: var(--coral-deep);
}
.ptile svg {
  width: 24px;
  height: 24px;
}
.pillar-title {
  font-weight: 700;
  margin-bottom: 0.4rem;
}

/* faq */
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

/* final cta */
.cta-band {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: var(--r-3xl);
  background: linear-gradient(140deg, #0e7490 0%, #0891b2 38%, #22c9de 72%, #7fe6ef 100%);
  color: #fff;
}
.cta-inner {
  padding: clamp(1.8rem, 4.5vw, 3rem);
  text-align: center;
}
.cta-title {
  font-size: clamp(1.6rem, 3.6vw, 2.3rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.12;
}
.cta-sub {
  margin-top: 0.6rem;
  color: rgba(255, 255, 255, 0.92);
  max-width: 40rem;
  margin-inline: auto;
}
.cta-btn {
  margin-top: 1.4rem;
  text-decoration: none;
}
</style>
