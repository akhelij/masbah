<script setup lang="ts">
const props = defineProps<{
  width?: string
  height?: string
  rounded?: string
  circle?: boolean
}>()

const style = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.circle ? '999px' : props.rounded,
}))
</script>

<template>
  <div class="skel" aria-hidden="true" :style="style" />
</template>
