<script setup lang="ts">
// Password input with a show/hide eye toggle (S9 `.pw` pattern). Mirrors the
// PInput field markup (label + hint/error) so it sits naturally in the forms.
const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    placeholder?: string
    autocomplete?: string
    id?: string
  }>(),
  {
    autocomplete: 'current-password',
  }
)

const model = defineModel<string>({ default: '' })

const { t } = useI18n()

const visible = ref(false)
const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
</script>

<template>
  <div class="field">
    <label v-if="label" class="label" :for="fieldId">{{ label }}</label>
    <div class="pw">
      <input
        :id="fieldId"
        v-model="model"
        class="input"
        :class="{ 'is-error': error }"
        :type="visible ? 'text' : 'password'"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error || hint ? `${fieldId}-desc` : undefined"
      >
      <button
        class="eye"
        type="button"
        :class="{ 'is-on': visible }"
        :aria-label="visible ? t('auth.hidePassword') : t('auth.showPassword')"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <svg
          v-if="!visible"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <path d="m9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M2 2l20 20" />
        </svg>
      </button>
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

<style scoped>
.pw {
  position: relative;
}
.pw .input {
  padding-inline-end: 3rem;
}
.pw .eye {
  position: absolute;
  inset-inline-end: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 99px;
  border: none;
  background: none;
  color: var(--ink-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
}
.pw .eye:hover,
.pw .eye.is-on {
  color: var(--aqua-700);
}
.pw .eye:focus-visible {
  outline: none;
  box-shadow: var(--focus);
}
.pw .eye svg {
  width: 20px;
  height: 20px;
}
</style>
