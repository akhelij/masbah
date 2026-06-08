<script setup lang="ts">
type Variant = 'verified' | 'host' | 'privacy' | 'cash' | 'phone' | 'neutral'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    label?: string
  }>(),
  {
    variant: 'neutral',
  }
)

const variantClass = computed(() =>
  props.variant === 'neutral' ? undefined : `badge-${props.variant}`
)
</script>

<template>
  <span class="badge" :class="[variantClass, { 'badge-neutral-custom': variant === 'neutral' }]">
    <slot name="icon" />
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
.badge-neutral-custom {
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
}
</style>
