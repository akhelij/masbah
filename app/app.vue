<script setup lang="ts">
const { locale, localeProperties } = useI18n()

// Drive <html lang> + RTL direction from the active locale.
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
