<template>
  <div class="flex items-center text-gray-400" :class="spaceY + ' ' + spaceX">
    <div>
      <slot />
    </div>
    <div class="line"  :class="spaceL" />
  </div>
</template>

<script>
export default {
  name: 'TDivider',
  props:{
    spaceL:{default:"ml-5"},    
    spaceY:{default:"my-4"},        
    spaceX:{default:"space-x-2"}
  }
}
</script>

<style scoped>
  .line{
    height: 1px;
    @apply bg-gray-400 flex-1
  }
</style>
