<script setup lang="ts">
const { locale, localeProperties } = useI18n()

// Drive <html lang> + RTL direction from the active locale. Per-page
// useLocaleHead({ seo: true }) calls emit the canonical + hreflang alternates
// (absolute, via i18n.baseUrl in nuxt.config).
useHead({
  htmlAttrs: {
    lang: locale,
    dir: computed(() => localeProperties.value?.dir ?? 'ltr'),
  },
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
