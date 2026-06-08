<script setup lang="ts">
defineProps<{
  label?: string
}>()

const model = defineModel<boolean>({ default: false })

function toggle(): void {
  model.value = !model.value
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    toggle()
  }
}
</script>

<template>
  <label style="display: flex; align-items: center; gap: 0.7rem; cursor: pointer">
    <span
      class="check"
      :class="{ 'is-on': model }"
      role="checkbox"
      :aria-checked="model"
      tabindex="0"
      @click="toggle"
      @keydown="onKeydown"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m5 12 5 5L20 6" />
      </svg>
    </span>
    <span v-if="$slots.default || label" class="t-body"><slot>{{ label }}</slot></span>
  </label>
</template>
