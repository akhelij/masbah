<template>

     <div v-click-outside="onClose">

        <div class="text-gray-500 float-right toggle_button" @click.prevent="visible = !visible" ref="toggle_button">
            <slot>
                <button class="appearance-none cursor-pointer outline-none focus:outline-none">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    class="stroke-current w-6"
                    >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                    </svg>
                </button>
            </slot>
        </div>
        
        <transition name="slide-fade" mode="out-in">
            <div v-show="visible"  class="toggle z-50 origin-top-right absolute right-0 mt-8 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu" :class="_style">
                <div v-for="(item, index) in items" :key="index">
                    <router-link
                        v-if="item.type=='link'"
                        :to="item.link"
                        class="flex px-4 text-sm hover:bg-gray-300 cursor-pointer font-semibold"
                        :class="item.style"
                        @click="visible=false"
                    >
                        <span v-html="item.icon" v-if="item.icon"></span>
                        {{item.text}}
                    </router-link>
                    <div 
                        class="flex px-4 text-sm hover:bg-gray-300 cursor-pointer font-semibold" 
                        :class="item.style"
                        @click="item.text=='Partager'?$emit('showModal','ShareCommunity'):$emit(item.func); visible = false"
                        v-else
                    >
                        <span v-html="item.icon" v-if="item.icon"></span>
                        {{item.text}}
                    </div>
                    <TDivider v-if="!withoutDivider && index != items.length-1" :spaceY="'my-0'" :spaceX="'space-x-0'" class="px-4"/>  
                </div>                
            </div>
        </transition>

    </div>

</template>

<script>
export default {

    name: "Dropdown",
    
    data() {
        return { visible: false }
    },

    props:{
        items: {
            required: true
        },
        withoutDivider: {
            default: false
        },
        _style:{
            default: 'w-32'
        }
    },
    methods:{
        onClose () {
            this.visible = false
        }
    }
    
}

</script>
