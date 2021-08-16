<template>
  <div v-if="isActive">
    <div class="min-h-extra max-w-screen  opacity-75 fixed inset-0 z-40" @clicks="hide" />

      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-30" aria-hidden="true" @click="hide"></div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="fixed inset-0 max-w-screen mx-auto rounded-3xl z-50 min-h-extra flex items-center justify-center p-5" >
        <div   v-click-outside="hide" class=" transform scale-90 bg-white rounded-xl overflow-auto z-auto w-screen-1/2 max-w-screen-lg max-h-full h-auto scrolling-auto relative scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 scrollbar-track-gray-100" :class="_width">
          <div class="relative mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="fill-current w-4 h-4 z-10 absolute top-0 right-0 mr-4 mt-5 cursor-pointer" @click="isActive = false">
            <path
              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41z"
            />
          </svg>
          </div>
          <slot />
        </div>
      </div>
  </div>
</template>

<script>
import { inject, onMounted, ref, watchEffect } from '@vue/runtime-core';

export default {
  name: 'TModal',
  props: {
    active: {
      default: false
    },
    name: {
      required: true
    },
    _width:{
      default:""
    }
  },  
  setup (props) {
    const isActive = ref(false);
    const emitter = inject('$emitter');

    const show = () => {
      setTimeout(function(){  isActive.value = true }, 0);    
    }
    const hide = () => {
      isActive.value = false
    }
    
    onMounted(() => {
      isActive.value = props.active;
      emitter.on('showModal', (name) => {
        if (props.name === name) {
          show()
        }
      });
      emitter.on('hideModal', (name) => {
        if (props.name === name) {
          hide()
        }
      });
    });

    return {
      isActive , show, hide
    }
  },
}
</script>

<style scoped>
body{
  overflow-y: hidden;
}
</style>
