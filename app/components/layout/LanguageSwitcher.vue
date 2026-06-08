<script setup lang="ts">
withDefaults(
  defineProps<{
    // Compact shows "ع" for Arabic; full shows "العربية".
    compact?: boolean
  }>(),
  {
    compact: false,
  }
)

const { locale, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div class="lang" role="group" :aria-label="t('lang.switch')">
    <NuxtLink
      :to="switchLocalePath('fr')"
      class="seg"
      :class="{ 'is-on': locale === 'fr' }"
      :aria-current="locale === 'fr' ? 'true' : undefined"
      lang="fr"
    >
      FR
    </NuxtLink>
    <NuxtLink
      :to="switchLocalePath('ar')"
      class="seg ar"
      :class="{ 'is-on': locale === 'ar' }"
      :aria-current="locale === 'ar' ? 'true' : undefined"
      lang="ar"
    >
      {{ compact ? 'ع' : 'العربية' }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.lang {
  display: inline-flex;
  border: 1.5px solid var(--line-strong);
  border-radius: 999px;
  overflow: hidden;
  font-size: 0.76rem;
  font-weight: 700;
}
.seg {
  padding: 0.3rem 0.6rem;
  color: var(--ink-muted);
  text-decoration: none;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--dur-1), color var(--dur-1);
}
.seg:hover {
  color: var(--aqua-800);
  background: var(--aqua-50);
}
.seg.is-on {
  background: var(--aqua-700);
  color: #fff;
}
.seg:focus-visible {
  outline: none;
  box-shadow: var(--focus);
}
</style>
