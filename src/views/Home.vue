<template>
    <section class="relative lg:min-h-screen">
        <div class="max-w-7xl mx-auto">
            <div class="relative z-10 pb-2 lg:bg-none w-full">
                <main
                    :class="route.name == 'Home' ? 'block' : 'hidden'"
                    class="my-5 max-w-7xl px-4 sm:mt-6 sm:px-6 lg:mt-6 lg:px-8 xl:mt-8"
                >
                    <div
                        class="text-left lg:w-3/5 flex flex-col items-center md:items-start justify-evenly lg:justify-between min-h-5/12 lg:min-h-7/12 mx-auto md:mx-0"
                    >
                        <h1
                            class="tracking-tight font-bold md:text-gray-900 text-6xl text-center md:text-left"
                        >
                            <span class="block xl:inline leading-snug"
                                >Location de piscines</span
                            >
                            <span
                                class="block text-cyan-600 xl:inline leading-snug"
                            >
                                entre particulier
                            </span>
                        </h1>
                        <p
                            class="text-center md:text-left font-bold md:font-medium tracking-widest leading-loose text-gray-600 lg:mt-10 max-w-xl w-full text-3xl md:text-xl md:w-1/2 lg:w-4/5 lg:mx-0"
                        >
                            Profiter d'une piscine juste pour vous et au prix
                            qui vous convient !
                        </p>
                        <div class="justify-center sm:flex sm:justify-start">
                            <div
                                class="rounded-md space-y-4 sm:space-y-0 flex flex-col sm:flex-row items-center justify-start space-x-0 sm:space-x-4 w-full md:w-auto"
                            >
                                <!-- <div class="rounded-md space-y-5">  -->
                                <!-- <TButton
                                    @click="sendToList()"
                                    class="flex items-center justify-center px-8 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-500 md:py-4 md:text-lg md:px-10"
                                >
                                    👀 Trouver votre piscine
                                </TButton>

                                <TSecondaryButton
                                    @click="
                                        isAuth
                                            ? sendToFillForm()
                                            : emitter.emit(
                                                  'showModal',
                                                  'SignInModal'
                                              )
                                    "
                                    class="text-lg px-8 py-3 bg-white md:py-4 md:text-lg md:px-10"
                                >
                                    Vous êtes proprietaire 📣
                                </TSecondaryButton> -->

                                <div
                                    class="flex flex-row items-center space-x-0 w-screen home-filter"
                                >
                                    <multiselect
                                        class="w-3/12"
                                        id="city"
                                        v-model="city"
                                        :searchable="true"
                                        :close-on-select="true"
                                        :options="cities"
                                        label="name"
                                        track-by="name"
                                        name="city"
                                        :select-label="''"
                                        :deselect-label="''"
                                        :selected-label="''"
                                        placeholder="Oú cherchez vous ?"
                                    >
                                        <template #noResult>
                                            Oups! Aucun élément trouvé. Pensez à
                                            modifier la requête de recherche.
                                        </template>
                                    </multiselect>

                                    <button @click="sendToList" class="outline-none focus:outline-none font-semibold rounded-full rounded-l-none text-center px-4 h-16 border border-cyan-500 bg-cyan-600 text-white">
                                        Trouver votre piscine  👀
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="hero_illustration absolute top-20 sm:top-0 md:-top-5 md:right-0 w-full md:w-3/5 lg:w-1/2 p-10 opacity-25 md:opacity-100">
                        <img :src="illustration5" alt="illustration" class="w-full"/>
                    </div>
                </main>
            </div>
        </div>
        <img
            :src="waves"
            alt="waves"
            srcset=""
            class="lg:absolute lg:bottom-10 w-full"
        />
    </section>

    <HowItWorks />
</template>

<style>
.home-filter .multiselect__placeholder {
    @apply text-base font-bold !important
}
.home-filter .multiselect__tags {
    @apply w-full rounded-full rounded-r-none h-16 flex flex-col justify-center px-6 placeholder-gray-700 font-bold !important
}
.home-filter .multiselect__select {
    @apply hidden !important
}
</style>

<script>
import cities from '@/assets/js/cities'
import logo from '@/assets/img/logo.png'
import illustration5 from '@/assets/img/illustrations/Jumping into the pool-pana.svg'
import waves from '@/assets/img/illustrations/layered-waves-haikei.svg'

import { computed, inject, ref, watchEffect } from '@vue/runtime-core'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import { createToast } from 'mosha-vue-toastify'
import defaultAvatar from '@/assets/img/default-avatar.png'


import Multiselect from 'vue-multiselect'

export default {    
    components: { Multiselect },
    setup() {
        const router = useRouter()
        const route = useRoute()
        
        const store = useStore()
        const city = ref(null)
        const no_data_found = ref(false)

        const open = ref(false)
        const openMenu = () => {
            setTimeout(function () {
                open.value = true
            }, 0)
        }
        const closeMenu = () => {
            open.value = false
        }
        
        const emitter = inject('$emitter')
        const isAuth = computed(() => store.getters.isAuth)

        const user = computed(() => store.getters.getUser)
        const logout = () => {
            store
                .dispatch('logoutAction')
                .then(() =>
                    createToast('👋 A bientôt !', {
                        type: 'success',
                        timeout: 2000,
                    })
                )
                .catch((error) => console.log(error))
        }
        const sendToFillForm = () => {
            router.push('/profile')
        }

        const sendToList = () => {
            router.push({ path: '/announcements', query: { city: city.value.name } });
        }

        const items = [
            {
                type: 'link',
                link: '/profile',
                icon: "<span class='mr-1'>😎</span>",
                text: 'Profile',
                style: 'text-gray-700 py-2',
            },
            {
                type: 'func',
                func: 'logout',
                icon: "<span class='mr-2'>🔓 </span>",
                text: ' Se déconnecter',
                style: 'text-gray-500 py-2 mt-1 border-t',
            },
        ]

        
        const filterByCity = (_) => {            
            no_data_found.value = false
            setTimeout(function () {
                console.log(city)
                store
                    .dispatch('filterAnnoucementsByCity', city.value.name)
                    .then((response) => {
                        if (!response.success && response.empty) {
                            no_data_found.value = true
                        } 
                        sendToList(no_data_found);
                    })
            }, 0)
        }

        return {
            city,
            cities,
            filterByCity,
            no_data_found,
            waves,
            illustration5,
            sendToFillForm,
            sendToList,
            items,
            logo,
            defaultAvatar,
            emitter,
            isAuth,
            user,
            logout,
            open,
            openMenu,
            closeMenu,
            route,
        }
    },
}
</script>

<style>
.hero_illustration {
    z-index: -9999 !important;
}
</style>
