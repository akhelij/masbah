<script setup lang="ts">
// Centered auth shell used by the standalone auth pages (login / signup /
// reset-password / confirm). These pages set `layout: false`, so this provides
// the sand background, top bar (BrandLogo + LanguageSwitcher) and the white card.
const localePath = useLocalePath()
const { t } = useI18n()
</script>

<template>
  <div class="auth-page">
    <header class="auth-topbar wrap">
      <NuxtLink :to="localePath('/')" class="brand-link" :aria-label="t('nav.home')">
        <BrandLogo :size="30" />
      </NuxtLink>
      <LanguageSwitcher />
    </header>

    <main class="auth-main">
      <div class="auth-card">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--sand);
}
.auth-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1rem;
}
.brand-link {
  text-decoration: none;
  border-radius: var(--r-md);
}
.brand-link:focus-visible {
  outline: none;
  box-shadow: var(--focus);
}
.auth-main {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem 1.25rem 3rem;
}
@media (min-width: 640px) {
  .auth-main {
    align-items: center;
  }
}
.auth-card {
  width: 100%;
  max-width: 26rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-card);
  padding: 1.75rem 1.5rem;
}
</style>
