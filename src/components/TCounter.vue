<template>
    <div class="text-lg font-semibold flex flex-row justify-center items-center space-x-4">
        <button 
         @click="$emit('update:modelValue', props.modelValue - 1 < 1 ? 1 : props.modelValue - 1)"
         class="w-10 h-10 cursor-pointer transform duration-300 hover:scale-75"
        >      
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
        <span> {{ modelValue }}</span>
        <button @click="$emit('update:modelValue', props.modelValue + 1)" class="w-10 h-10 cursor-pointer transform duration-300 hover:scale-75">
            <svg  class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
    </div>
</template>

<script>
export default {
    name: 'TCounter',
    props: {
        modelValue: {
            type: Number,
            default: 1,
        },
    },
    setup(props) {
        return { props }
    },
}
</script>

<style>
</style>