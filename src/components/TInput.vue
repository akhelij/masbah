<template>
  <div class="flex space-x-2 rounded-lg border border-b border-solid border-gray-300 py-3 px-5 w-full  items-center mb-5">
    <span class="text-cyan-500"><slot /></span>
    <input 
      ref="input" 
      class="appearance-none outline-none flex-1 bg-transparent h-full" 
      v-bind="{
        ...$attrs,
        onInput: (event) => $emit('update:modelValue', event.target.value)
      }" 
      :value="modelValue"        
    >
     
  </div>
</template>

<script>
export default {
  inheritAttrs: false,
  name: 'TInput',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    
  }
}
</script>

<style>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>
