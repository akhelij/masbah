<template>
  <select
    ref="input"
    placeholder="..."
    class="appearance-none outline-none  border border-solid border-gray-300 rounded-lg py-3 px-5 w-full"
    :value="value"
    @change="$emit('input', $event.target.value)"
  >
    <slot />
  </select>
</template>

<script>
export default {
  name: 'TSelect',
  props: {
    value: {
      default: ''
    }
  }
}
</script>

<style scoped>
select {
  background-image: linear-gradient(45deg, transparent 50%, gray 50%),
  linear-gradient(135deg, gray 50%, transparent 50%);
  background-position: calc(100% - 24px) calc(1em + 8px),
  calc(100% - 16px) calc(1em + 8px);
  background-size: 8px 10px,
  8px 10px;
  background-repeat: no-repeat;
}
</style>
