<script setup lang="ts">
// Bottom-sheet presentation of PModal on all viewport sizes. Same public API.
defineProps<{
  title?: string
  labelClose?: string
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <PModal v-model:open="open" variant="sheet" :title="title" :label-close="labelClose">
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </PModal>
</template>
