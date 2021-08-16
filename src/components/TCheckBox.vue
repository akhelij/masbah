<template>
  <label class="flex justify-start items-center cursor-pointer">
    <div
      class="border border-solid border-gray-400 rounded w-5 h-5 flex flex-shrink-0 justify-center items-center mr-2"
    >
      <input type="checkbox" class="opacity-0 absolute cursor-pointer"  
        v-bind="{
          ...$attrs,
          onChange: (event) => $emit('update:modelValue', event.target.checked)
        }"
        :checked="modelValue"
      
      >
      <svg class="fill-current hidden w-3 h-3 text-cyan-500 pointer-events-none" viewBox="0 0 20 20">
        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
      </svg>
    </div>
    <div class="select-none flex flex-row">
      <slot />
    </div>
  </label>
</template>

<script>
export default {
  inheritAttrs: false,
  name: 'TCheckBox',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
input:checked + svg {
  display: block;
}
</style>
