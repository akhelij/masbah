<script setup lang="ts">
const props = defineProps<{
  label?: string
  ariaLabel?: string
}>()

const model = defineModel<boolean>({ default: false })

const generatedId = useId()
const labelId = computed(() => (props.label ? `${generatedId}-lbl` : undefined))

function toggle(): void {
  model.value = !model.value
}
</script>

<template>
  <label
    v-if="label"
    style="display: flex; align-items: center; gap: 0.7rem; cursor: pointer"
  >
    <button
      class="toggle"
      :class="{ 'is-on': model }"
      type="button"
      role="switch"
      :aria-checked="model"
      :aria-labelledby="labelId"
      @click="toggle"
    />
    <span :id="labelId" class="t-body">{{ label }}</span>
  </label>
  <button
    v-else
    class="toggle"
    :class="{ 'is-on': model }"
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="ariaLabel"
    @click="toggle"
  />
</template>
