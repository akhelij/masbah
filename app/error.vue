<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const is404 = computed(() => props.error?.statusCode === 404)

const title = computed(() => (is404.value ? t('error.notFoundTitle') : t('error.genericTitle')))
const message = computed(() =>
  is404.value ? t('error.notFoundBody') : t('error.genericBody')
)

useSeoMeta({
  title: () => title.value,
  robots: 'noindex',
})

function goHome(): void {
  // Clear the error then navigate to the localized home route.
  clearError({ redirect: localePath('/') })
}
</script>

<template>
  <div class="err-page">
    <header class="err-header">
      <div class="wrap">
        <NuxtLink :to="localePath('/')" class="brand-link" :aria-label="t('nav.home')">
          <BrandLogo :size="30" />
        </NuxtLink>
      </div>
    </header>

    <main class="wrap err-main">
      <div class="err-card">
        <div class="err-ill">
          <svg
            viewBox="0 0 260 180"
            width="100%"
            style="max-width: 320px"
            role="img"
            :aria-label="t('error.illustrationAlt')"
          >
            <g stroke="#F59E0B" stroke-width="2.4" stroke-linecap="round">
              <path d="M40 12v-7M40 49v0M21 31h-7M59 31h0M27 18l-5-5M53 44l0 0M27 44l-5 5M53 18l0 0" />
            </g>
            <circle cx="40" cy="31" r="12" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2.4" />
            <ellipse cx="135" cy="106" rx="100" ry="60" fill="#CFF7FB" stroke="#0E7490" stroke-width="3.5" />
            <ellipse cx="135" cy="106" rx="83" ry="46" fill="#F1F1EA" stroke="#0E7490" stroke-width="1.6" />
            <clipPath id="errBasin"><ellipse cx="135" cy="106" rx="83" ry="46" /></clipPath>
            <g clip-path="url(#errBasin)" stroke="#A4ECF5" stroke-width="1.6">
              <path d="M75 80v60M105 70v72M135 66v80M165 70v72M195 80v60M55 96h160M55 116h160" />
            </g>
            <path d="M100 126q14-10 30-4q14 6 3 11q-20 8-35 0z" fill="#6FDDED" opacity=".85" />
            <g transform="translate(176 96)">
              <circle r="21" fill="#FFE4E8" stroke="#F43F5E" stroke-width="3" />
              <circle r="9" fill="#F1F1EA" stroke="#F43F5E" stroke-width="2" />
              <g stroke="#F43F5E" stroke-width="3" stroke-linecap="round">
                <path d="M0-21v6M0 15v6M-21 0h6M15 0h6" />
              </g>
            </g>
            <g stroke="#0E7490" stroke-width="3.2" stroke-linecap="round" fill="none">
              <path d="M116 48v22M130 48v22M116 55h14M116 62h14" />
            </g>
          </svg>
        </div>

        <div class="err-body">
          <span class="badge err-tag">{{ is404 ? t('error.tag404') : t('error.tagGeneric') }}</span>
          <h1 class="t-h2 err-title">{{ title }}</h1>
          <p class="t-body muted err-msg">{{ message }}</p>
          <div class="err-actions">
            <PButton @click="goHome">
              <template #icon>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </template>
              {{ t('error.backHome') }}
            </PButton>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.err-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--sand);
}
.err-header {
  background: #fff;
  border-bottom: 1px solid var(--line);
  padding-block: 0.7rem;
}
.brand-link {
  text-decoration: none;
  border-radius: var(--r-md);
  display: inline-flex;
}
.brand-link:focus-visible {
  outline: none;
  box-shadow: var(--focus);
}
.err-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block: 2.5rem;
}
.err-card {
  display: grid;
  gap: 1rem;
  align-items: center;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-card);
  overflow: hidden;
  max-width: 880px;
  width: 100%;
}
.err-ill {
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, var(--aqua-50), #fff);
  padding: clamp(1.5rem, 4vw, 2.4rem);
}
.err-body {
  padding: clamp(1.6rem, 4vw, 2.4rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.err-tag {
  align-self: flex-start;
  background: var(--coral-soft);
  color: var(--coral-ink);
}
.err-title {
  margin-top: 0.7rem;
}
.err-msg {
  margin-top: 0.5rem;
  max-width: 48ch;
}
.err-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.2rem;
}

@media (min-width: 768px) {
  .err-card {
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }
}
</style>
