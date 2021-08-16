<template>
<div class="px-10 pt-10 pb-6 flex flex-col justify-center items-center space-y-4">
    <img class="inline-block h-20 w-20 rounded-full ring-1 ring-white" :src="contact.avatar" alt="">
    <h4 class="text-xl font-bold">{{contact.name}}</h4>
    <div class="text-xl font-bold">
        📞 {{contact.phone}}
    </div>
</div>
</template>

<script>
import { inject } from '@vue/runtime-core';
export default {
    name: "ContactAnnouncer",
    props:['contact'],
    setup(){        
        const emitter = inject('$emitter');
        return {emitter}
    }
}
</script>

<style>

</style>