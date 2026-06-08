<script setup lang="ts">
interface SlotOption {
  key: string
  label: string
  sub?: string
}

const props = defineProps<{
  options: SlotOption[]
}>()

const model = defineModel<string>()

function select(key: string): void {
  model.value = key
}

function onKeydown(e: KeyboardEvent, index: number): void {
  const last = props.options.length - 1
  let next = -1
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index === last ? 0 : index + 1
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index === 0 ? last : index - 1
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = last
  else return

  e.preventDefault()
  const opt = props.options[next]
  if (!opt) return
  select(opt.key)
  const tabs = (e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>(
    '[role="tab"]',
  )
  tabs?.[next]?.focus()
}
</script>

<template>
  <div class="seg" role="tablist">
    <button
      v-for="(opt, i) in options"
      :key="opt.key"
      class="seg-item"
      :class="{ 'is-on': model === opt.key }"
      type="button"
      role="tab"
      :aria-selected="model === opt.key"
      :tabindex="model === opt.key || (model === undefined && i === 0) ? 0 : -1"
      @click="select(opt.key)"
      @keydown="onKeydown($event, i)"
    >
      <span class="lab">{{ opt.label }}</span>
      <span v-if="opt.sub" class="sub">{{ opt.sub }}</span>
    </button>
  </div>
</template>
