<template>
<div class="flex flex-col sm:flex-row">
    <TCheckBox 
        :modelValue="availableValue"
        @update:modelValue="$emit('update:availableValue', $event)"
    >      
        <span class="font-semibold "> {{ label }} </span> 
    </TCheckBox>
    <div v-show="availableValue" class="flex flex-row  items-center">
        <span class="font-semibold text-xs sm:hidden"> Prix :</span>
       <input 
        type="number" 
        class="border-b ml-2 text-sm font-semibold outline-none text-cyan-500 w-20 appearance-none" 
        placeholder="Inclus"
        :value="priceValue"
        @input="$emit('update:priceValue', $event.target.value == '' ? null : $event.target.value)"
        /> 
    
    <div v-show="priceValue != 0 && priceValue != null" class="flex flex-row items-center space-x-1 -ml-6 text-xs">
        <span> MAD</span>
        <div v-if="byoneValue != null" class="flex flex-row items-center">
            /
            <input             
                class="cursor-pointer outline-none mt-1 ml-1"
                type="checkbox"   
                :checked="byoneValue"
                @change="$emit('update:byoneValue', $event.target.checked)"
            > 
            <span>par personne </span>
        </div>
    </div>
    </div>
    </div> 
</template>

<script>
export default {
    inheritAttrs: false,
    props: {
        availableValue: {
            type: Boolean,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },        
        priceValue: {
            type: Number,
            default: null
        },
        byoneValue: {
            type: Boolean,
            default: false,
        },
    }
}
</script>

<style scoped>
input:checked + svg {
    display: block;
}
</style>