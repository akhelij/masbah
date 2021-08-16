<template>
  <button 
    :disabled="button_disabled"
    :class="button_disabled ? 'bg-gradient-to-r  from-gray-400 to-gray-200' : 'bg-gradient-to-r  from-cyan-600 to-cyan-400'"
    class="outline-none focus:outline-none text-white font-semibold rounded-md text-center px-4 py-2 duration-500 transform  hover:scale-105"
  >
 
    <slot />
  </button>
</template>

<script>
export default {
  name: 'TButton',
  props:{
    button_disabled:{
      type: Boolean,
      default: false
    }
  }
}
</script>

