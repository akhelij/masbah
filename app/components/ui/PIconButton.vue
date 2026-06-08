<script setup lang="ts">
type Variant = 'default' | 'whatsapp'

withDefaults(
  defineProps<{
    variant?: Variant
    label: string
    disabled?: boolean
  }>(),
  {
    variant: 'default',
    disabled: false,
  }
)
</script>

<template>
  <button
    class="icon-btn"
    :class="{ 'icon-btn-wa': variant === 'whatsapp' }"
    type="button"
    :aria-label="label"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
