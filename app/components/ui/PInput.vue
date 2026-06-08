<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    type?: string
    placeholder?: string
    id?: string
    required?: boolean
    inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  }>(),
  {
    type: 'text',
    required: false,
  },
)

const model = defineModel<string>()

const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
</script>

<template>
  <div class="field">
    <label v-if="label" class="label" :for="fieldId">{{ label }}</label>
    <input
      :id="fieldId"
      v-model="model"
      class="input"
      :class="{ 'is-error': error }"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :inputmode="inputmode"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error || hint ? `${fieldId}-desc` : undefined"
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
