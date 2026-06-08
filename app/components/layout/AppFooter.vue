<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="ftr">
    <div class="wrap ftr-inner">
      <div class="ftr-brand">
        <BrandLogo :size="28" />
        <p class="t-sm muted tagline">{{ t('footer.tagline') }}</p>
      </div>

      <nav class="ftr-links" :aria-label="t('footer.links')">
        <NuxtLink :to="localePath('/how-it-works')" class="ftr-link">
          {{ t('footer.howItWorks') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/privacy')" class="ftr-link">{{ t('footer.privacy') }}</NuxtLink>
        <NuxtLink :to="localePath('/terms')" class="ftr-link">{{ t('footer.terms') }}</NuxtLink>
      </nav>
    </div>
    <div class="wrap ftr-legal">
      <span class="t-sm faint">© {{ year }} Masbah · {{ t('footer.cashReminder') }}</span>
    </div>
  </footer>
</template>

<style scoped>
.ftr {
  border-top: 1px solid var(--line);
  background: #fff;
  margin-top: 2rem;
}
.ftr-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  align-items: center;
  justify-content: space-between;
  padding-block: 1.6rem 1rem;
}
.ftr-brand {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.tagline {
  max-width: 36ch;
}
.ftr-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.2rem;
}
.ftr-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-muted);
  text-decoration: none;
  border-radius: var(--r-sm);
  transition: color var(--dur-1);
}
.ftr-link:hover {
  color: var(--aqua-800);
}
.ftr-link:focus-visible {
  outline: none;
  box-shadow: var(--focus);
}
.ftr-legal {
  padding-bottom: 1.6rem;
}
</style>
