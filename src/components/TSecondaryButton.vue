<template>
  <button class="outline-none focus:outline-none font-semibold rounded-md text-center px-4 py-2 border border-cyan-500 duration-500 transform  hover:scale-105 hover:bg-cyan-600 hover:text-white" :class="[active ? 'bg-cyan-600 text-white' : 'text-gray-500']">
    <slot />
  </button>
</template>

<script>
export default {
  name: 'TSecondaryButton',
  props: {
    active: { default:false },
   
  }
}
</script>

