<script setup lang="ts">
const props = defineProps<{
  label?: string
  min?: string
  max?: string
  disabledDates?: string[]
  hint?: string
  error?: string
  id?: string
}>()

const model = defineModel<string>()

const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const minDate = computed(() => props.min ?? todayIso())

function onChange(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  // Guard: reject explicitly disabled dates (full availability calendar arrives later).
  if (value && props.disabledDates?.includes(value)) {
    model.value = ''
    return
  }
  model.value = value
}
</script>

<template>
  <div class="field">
    <label v-if="label" class="label" :for="fieldId">{{ label }}</label>
    <input
      :id="fieldId"
      class="input"
      :class="{ 'is-error': error }"
      type="date"
      :value="model"
      :min="minDate"
      :max="max"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error || hint ? `${fieldId}-desc` : undefined"
      @change="onChange"
    />
    <span v-if="error" :id="`${fieldId}-desc`" class="hint-err">
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16.5v.01" />
      </svg>
      {{ error }}
    </span>
    <span v-else-if="hint" :id="`${fieldId}-desc`" class="hint">{{ hint }}</span>
  </div>
</template>
