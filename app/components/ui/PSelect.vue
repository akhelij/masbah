<script setup lang="ts">
interface Option {
  value: string
  label: string
}

const props = defineProps<{
  label?: string
  options: Option[]
  hint?: string
  error?: string
  id?: string
  placeholder?: string
}>()

const model = defineModel<string>()

const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
</script>

<template>
  <div class="field">
    <label v-if="label" class="label" :for="fieldId">{{ label }}</label>
    <div class="select-wrap">
      <select
        :id="fieldId"
        v-model="model"
        class="select"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error || hint ? `${fieldId}-desc` : undefined"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
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
