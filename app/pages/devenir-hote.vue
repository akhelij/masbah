<script setup lang="ts">
// Host acquisition landing page — converts pool owners into publishers.
// High-impact page for marketplace growth. MUST be indexable and shareable.
const { t } = useI18n()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: true })
const config = useRuntimeConfig()

useSeoMeta({
  title: () => `${t('hostLanding.seoTitle')} — Masbah`,
  description: () => t('hostLanding.seoDescription'),
  ogTitle: () => `${t('hostLanding.seoTitle')} — Masbah`,
  ogDescription: () => t('hostLanding.seoDescription'),
  ogImage: () => `${config.public.siteUrl}/pwa-512x512.png`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: [...(localeHead.value.link ?? [])],
  meta: [...(localeHead.value.meta ?? [])],
}))

const benefits = computed(() => [
  { icon: 'cash', title: t('hostLanding.benefits.b1Title'), body: t('hostLanding.benefits.b1Body') },
  { icon: 'calendar', title: t('hostLanding.benefits.b2Title'), body: t('hostLanding.benefits.b2Body') },
  { icon: 'shield', title: t('hostLanding.benefits.b3Title'), body: t('hostLanding.benefits.b3Body') },
  { icon: 'camera', title: t('hostLanding.benefits.b4Title'), body: t('hostLanding.benefits.b4Body') },
])

const steps = computed(() => [
  { num: '01', title: t('hostLanding.steps.s1Title'), body: t('hostLanding.steps.s1Body') },
  { num: '02', title: t('hostLanding.steps.s2Title'), body: t('hostLanding.steps.s2Body') },
  { num: '03', title: t('hostLanding.steps.s3Title'), body: t('hostLanding.steps.s3Body') },
])

const faqs = computed(() => [
  { q: t('hostLanding.faq.q1'), a: t('hostLanding.faq.a1') },
  { q: t('hostLanding.faq.q2'), a: t('hostLanding.faq.a2') },
  { q: t('hostLanding.faq.q3'), a: t('hostLanding.faq.q3') },
  { q: t('hostLanding.faq.q4'), a: t('hostLanding.faq.a4') },
  { q: t('hostLanding.faq.q5'), a: t('hostLanding.faq.a5') },
])
</script>

<template>
  <div class="host-lp">
    <!-- ═══════════ HERO ═══════════ -->
    <section class="hero">
      <div class="noise" />
      <div class="wrap hero-inner">
        <span class="t-over" style="color: rgba(255,255,255,0.85)">
          {{ t('hostLanding.hero.over') }}
        </span>
        <h1 class="t-display" style="margin-top:0.8rem">{{ t('hostLanding.hero.title') }}</h1>
        <p class="t-bodyl hero-sub">{{ t('hostLanding.hero.subtitle') }}</p>
        <div class="hero-cta-row">
          <NuxtLink :to="localePath('/publish')" class="btn btn-white btn-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {{ t('hostLanding.hero.ctaPrimary') }}
          </NuxtLink>
          <a href="https://wa.me/212600000000" target="_blank" rel="noopener" class="btn btn-ghost btn-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {{ t('hostLanding.hero.ctaWhatsApp') }}
          </a>
        </div>
        <p class="hero-note">{{ t('hostLanding.hero.note') }}</p>
      </div>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" class="hero-wave" aria-hidden="true">
        <path d="M0,34 C240,64 480,6 720,28 C960,50 1200,12 1440,36 L1440,60 L0,60 Z" fill="#FAFAF7"/>
      </svg>
    </section>

    <!-- ═══════════ EARNINGS CALCULATOR ═══════════ -->
    <section class="wrap section">
      <div class="sec-head-center">
        <span class="t-over">{{ t('hostLanding.calculator.over') }}</span>
        <h2 class="t-h2" style="margin-top:0.3rem">{{ t('hostLanding.calculator.title') }}</h2>
      </div>
      <HostEarningsCalculator />
    </section>

    <!-- ═══════════ BENEFITS ═══════════ -->
    <section class="wrap section">
      <div class="sec-head-center">
        <span class="t-over">{{ t('hostLanding.benefits.over') }}</span>
        <h2 class="t-h2" style="margin-top:0.3rem">{{ t('hostLanding.benefits.title') }}</h2>
      </div>
      <div class="benefits-grid">
        <div v-for="(b, i) in benefits" :key="i" class="benefit-card">
          <span class="b-icon" :class="`b-icon-${b.icon}`">
            <svg v-if="b.icon === 'cash'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <circle cx="12" cy="12" r="2"/>
              <path d="M6 12h.01M18 12h.01"/>
            </svg>
            <svg v-else-if="b.icon === 'calendar'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <svg v-else-if="b.icon === 'shield'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </span>
          <h3 class="t-h3" style="font-size:1.1rem">{{ b.title }}</h3>
          <p class="t-body muted" style="margin-top:0.4rem">{{ b.body }}</p>
        </div>
      </div>
    </section>

    <!-- ═══════════ HOW IT WORKS (Owner) ═══════════ -->
    <section class="wrap section steps-section">
      <div class="sec-head-center">
        <span class="t-over">{{ t('hostLanding.steps.over') }}</span>
        <h2 class="t-h2" style="margin-top:0.3rem">{{ t('hostLanding.steps.title') }}</h2>
      </div>
      <div class="steps-grid">
        <div v-for="(s, i) in steps" :key="i" class="step">
          <span class="num">{{ s.num }}</span>
          <h3 class="t-h3 step-title">{{ s.title }}</h3>
          <p class="t-body muted step-body">{{ s.body }}</p>
        </div>
      </div>
    </section>

    <!-- ═══════════ TRUST SIGNALS ═══════════ -->
    <section class="trust-section">
      <div class="wrap section">
        <div class="sec-head-center" style="max-width:40rem; margin-inline:auto">
          <span class="t-over">{{ t('hostLanding.trust.over') }}</span>
          <h2 class="t-h2" style="margin-top:0.3rem">{{ t('hostLanding.trust.title') }}</h2>
        </div>
        <div class="trust-grid">
          <div class="trust-item">
            <span class="t-h2" style="color:var(--aqua-700)">0%</span>
            <p class="t-body muted">{{ t('hostLanding.trust.stat1') }}</p>
          </div>
          <div class="trust-item">
            <span class="t-h2" style="color:var(--aqua-700)">48h</span>
            <p class="t-body muted">{{ t('hostLanding.trust.stat2') }}</p>
          </div>
          <div class="trust-item">
            <span class="t-h2" style="color:var(--aqua-700)">100%</span>
            <p class="t-body muted">{{ t('hostLanding.trust.stat3') }}</p>
          </div>
          <div class="trust-item">
            <span class="t-h2" style="color:var(--aqua-700)">24/7</span>
            <p class="t-body muted">{{ t('hostLanding.trust.stat4') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════ FAQ ═══════════ -->
    <section class="wrap section faq-section">
      <div class="sec-head-center" style="margin-bottom:1.6rem">
        <h2 class="t-h2">{{ t('hostLanding.faq.title') }}</h2>
      </div>
      <div class="faq-list">
        <details v-for="(f, i) in faqs" :key="i" class="faq">
          <summary>
            {{ f.q }}
            <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
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
          <h2 class="cta-title">{{ t('hostLanding.ctaTitle') }}</h2>
          <p class="t-bodyl cta-sub">{{ t('hostLanding.ctaSubtitle') }}</p>
          <NuxtLink :to="localePath('/publish')" class="btn btn-white btn-lg cta-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {{ t('hostLanding.ctaButton') }}
          </NuxtLink>
          <p class="cta-note">{{ t('hostLanding.ctaNote') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section { padding-block: clamp(2.4rem, 5vw, 3.8rem); }
.sec-head-center { text-align: center; max-width: 36rem; margin-inline: auto; margin-bottom: 2rem; }

/* hero */
.hero { position: relative; overflow: hidden; isolation: isolate; background: linear-gradient(140deg, #0e7490 0%, #0891b2 38%, #22c9de 72%, #7fe6ef 100%); color: #fff; }
.hero-inner { text-align: center; padding-top: clamp(2.5rem, 5vw, 3.6rem); padding-bottom: clamp(2.8rem, 6vw, 4rem); }
.hero-sub { margin-top: 0.9rem; color: rgba(255,255,255,0.92); max-width: 46ch; margin-inline: auto; }
.hero-cta-row { display: flex; flex-wrap: wrap; gap: 0.8rem; justify-content: center; margin-top: 1.6rem; }
.hero-note { margin-top: 1rem; font-size: 0.85rem; color: rgba(255,255,255,0.75); }
.hero-wave { display: block; width: 100%; height: 46px; }
.noise { position: absolute; inset: 0; z-index: -1; opacity: 0.05; mix-blend-mode: overlay; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

/* benefits */
.benefits-grid { display: grid; gap: 1rem; }
@media (min-width: 640px) { .benefits-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .benefits-grid { grid-template-columns: repeat(4, 1fr); } }
.benefit-card { background: #fff; border: 1px solid var(--line); border-radius: var(--r-2xl); padding: 1.4rem; box-shadow: var(--sh-sm); }
.b-icon { width: 48px; height: 48px; border-radius: var(--r-lg); background: var(--aqua-50); color: var(--aqua-700); display: grid; place-items: center; margin-bottom: 0.9rem; }
.b-icon svg { width: 24px; height: 24px; }

/* steps */
.steps-section { background: var(--sand-2); }
.steps-grid { display: grid; gap: 1rem; }
@media (min-width: 640px) { .steps-grid { grid-template-columns: repeat(3, 1fr); } }
.step { position: relative; background: #fff; border: 1px solid var(--line); border-radius: var(--r-2xl); padding: 1.4rem; box-shadow: var(--sh-sm); }
.step .num { position: absolute; top: 1.2rem; inset-inline-end: 1.3rem; font-weight: 800; font-size: 1.5rem; color: var(--aqua-700); line-height: 1; }
.step-title { font-size: 1.15rem; margin-top: 0.2rem; }
.step-body { margin-top: 0.4rem; }

/* trust */
.trust-section { background: var(--sand-2); }
.trust-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, 1fr); }
@media (min-width: 768px) { .trust-grid { grid-template-columns: repeat(4, 1fr); } }
.trust-item { text-align: center; background: #fff; border: 1px solid var(--line); border-radius: var(--r-2xl); padding: 1.4rem; }

/* faq */
.faq-section { max-width: 760px; margin-inline: auto; }
.faq-list { display: flex; flex-direction: column; gap: 0.6rem; }
.faq { background: #fff; border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; }
.faq summary { list-style: none; cursor: pointer; padding: 1rem 1.1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-weight: 700; font-size: 0.98rem; }
.faq summary::-webkit-details-marker { display: none; }
.faq summary .chev { flex: none; width: 20px; height: 20px; transition: transform var(--dur-2); color: var(--aqua-700); }
.faq[open] summary .chev { transform: rotate(180deg); }
.faq-ans { padding: 0 1.1rem 1.1rem; color: var(--ink-muted); line-height: 1.6; font-size: 0.92rem; }

/* cta */
.cta-band { position: relative; overflow: hidden; isolation: isolate; border-radius: var(--r-3xl); background: linear-gradient(140deg, #0e7490 0%, #0891b2 38%, #22c9de 72%, #7fe6ef 100%); color: #fff; }
.cta-inner { padding: clamp(1.8rem, 4.5vw, 3rem); text-align: center; }
.cta-title { font-size: clamp(1.6rem, 3.6vw, 2.3rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.12; }
.cta-sub { margin-top: 0.6rem; color: rgba(255,255,255,0.92); max-width: 40rem; margin-inline: auto; }
.cta-btn { margin-top: 1.4rem; text-decoration: none; }
.cta-note { margin-top: 1rem; font-size: 0.85rem; color: rgba(255,255,255,0.75); }
</style>
