<template>
  <textarea
    type="text"
    
    class="appearance-none outline-none border border-solid rounded-lg py-3 px-5 w-full"
    :rows="rows"
    :value="modelValue"
    v-bind="{
      ...$attrs,
      onInput: (event) => $emit('update:modelValue', event.target.value)
    }" 
  />
</template>

<script>
export default {
  name:'TTextArea',
  props:{
   rows:{
     default:4
   },
   modelValue:{
     default:''
   }
  },
  data () {
    return {
      
    }
  }
}
</script>

<style scoped>

</style>
