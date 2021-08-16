<template>
  <h1 class="font-bold text-xl">
      About {{name}}
  </h1>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
export default{
  setup(){
    const store = useStore();
    const name = computed(() => { return store.state.user.name });
     
      return{ name }
  }
}
</script>

<style>

</style>