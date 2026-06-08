<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    min?: number
    max?: number
    step?: number
    label?: string
    ariaLabel?: string
  }>(),
  {
    min: 1,
    max: 99,
    step: 1,
  },
)

const model = defineModel<number>({ default: 0 })

const atMin = computed(() => model.value <= props.min)
const atMax = computed(() => model.value >= props.max)

function clamp(n: number): number {
  return Math.min(props.max, Math.max(props.min, n))
}

function dec(): void {
  if (atMin.value) return
  model.value = clamp(model.value - props.step)
}

function inc(): void {
  if (atMax.value) return
  model.value = clamp(model.value + props.step)
}
</script>

<template>
  <div class="stepper" role="group" :aria-label="ariaLabel ?? label">
    <button
      type="button"
      :aria-label="ariaLabel ? `${ariaLabel} −` : undefined"
      :disabled="atMin"
      @click="dec"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
        <path d="M5 12h14" />
      </svg>
    </button>
    <span class="val" aria-live="polite">{{ model }}</span>
    <button
      type="button"
      :aria-label="ariaLabel ? `${ariaLabel} +` : undefined"
      :disabled="atMax"
      @click="inc"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  </div>
</template>
