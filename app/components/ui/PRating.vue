<script setup lang="ts">
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    rating: number
    count?: number
    size?: Size
    showValue?: boolean
  }>(),
  {
    size: 'md',
    showValue: false,
  },
)

const fillWidth = computed(() => `${(Math.min(5, Math.max(0, props.rating)) / 5) * 100}%`)

const formattedValue = computed(() => props.rating.toLocaleString('fr'))

const ariaLabel = computed(() => `Noté ${formattedValue.value} sur 5`)
</script>

<template>
  <span style="display: inline-flex; align-items: center; gap: 0.4rem">
    <span class="stars" :class="{ 'stars-sm': size === 'sm' }" :aria-label="ariaLabel">
      <span class="base" aria-hidden="true">★★★★★</span>
      <span class="fill" aria-hidden="true" :style="{ width: fillWidth }">★★★★★</span>
    </span>
    <span v-if="showValue" style="font-weight: 700; font-size: 0.9rem">{{ formattedValue }}</span>
    <span v-if="count !== undefined" class="muted t-sm">{{ count }} avis</span>
  </span>
</template>

<style scoped>
.stars-sm {
  font-size: 0.85rem;
}
</style>
