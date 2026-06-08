<script setup lang="ts">
const { t } = useI18n()
useSeoMeta({
  title: () => t('home.title'),
  description: () => t('home.subtitle'),
})
</script>

<template>
  <main>
    <section class="hero">
      <div class="noise" />
      <div class="blob" style="width: 320px; height: 320px; top: -80px; inset-inline-start: -60px" />
      <div class="blob" style="width: 240px; height: 240px; bottom: -40px; inset-inline-end: 6%; animation-delay: -5s" />
      <div class="wrap" style="padding-block: clamp(2.75rem, 7vw, 5rem)">
        <p class="t-over rise" style="color: rgba(255, 255, 255, 0.85)">Pissina · v2</p>
        <h1 class="t-display rise" style="max-width: 18ch; margin-top: 0.6rem; animation-delay: 0.06s">
          {{ t('home.title') }}
        </h1>
        <p
          class="t-bodyl rise"
          style="max-width: 54ch; margin-top: 1rem; color: rgba(255, 255, 255, 0.92); animation-delay: 0.12s"
        >
          {{ t('home.subtitle') }}
        </p>
        <div class="rise" style="display: flex; gap: 0.6rem; margin-top: 1.6rem; flex-wrap: wrap; animation-delay: 0.18s">
          <span class="badge badge-cash">💵 {{ t('common.cashOnPlace') }}</span>
          <span class="badge" style="background: rgba(255, 255, 255, 0.16); color: #fff">FR / العربية · RTL</span>
        </div>
        <div class="rise" style="margin-top: 1.6rem; animation-delay: 0.24s">
          <button class="btn btn-primary btn-lg">{{ t('common.book') }}</button>
        </div>
      </div>
      <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style="display: block; width: 100%; height: 54px" aria-hidden="true">
        <path d="M0,38 C240,72 480,8 720,30 C960,52 1200,14 1440,40 L1440,70 L0,70 Z" fill="#FAFAF7" />
      </svg>
    </section>
  </main>
</template>
