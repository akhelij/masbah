<script setup lang="ts">
defineProps<{
  label?: string
}>()

const model = defineModel<boolean>({ default: false })

function toggle(): void {
  model.value = !model.value
}
</script>

<template>
  <button
    class="chip"
    :class="{ 'is-on': model }"
    type="button"
    :aria-pressed="model"
    @click="toggle"
  >
    <svg
      class="chk"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="m5 12 5 5L20 6" />
    </svg>
    <slot>{{ label }}</slot>
  </button>
</template>
