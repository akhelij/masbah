<template>
<div class="flex flex-col justify-center">
    <div class='has-tooltip cursor-pointer flex-shrink'>
        <div class="text-xs font-semibold tooltip absolute rounded shadow-lg p-2 bg-gray-100 text-cyan-600 -mt-12">                     
            <slot name="message"/>
        </div>
        <slot name="icon" />
    </div>
</div>
</template>

<script>
export default {

}
</script>

<style lang="postcss" scoped>

.tooltip {
    @apply invisible absolute;
}

.has-tooltip:hover .tooltip {
    @apply visible z-50;
}

</style>