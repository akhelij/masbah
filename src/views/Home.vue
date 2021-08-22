<template>
    <section class="relative min-h-screen">
        <div class="max-w-7xl mx-auto">
            <div class="relative z-10 pb-2 lg:bg-none w-full">
                <main
                    :class="route.name == 'Home' ? 'block' : 'hidden'"
                    class="
                        my-5
                        max-w-7xl
                        px-4
                        sm:mt-6 sm:px-6
                        lg:mt-6 lg:px-8
                        xl:mt-8
                    "
                >
                    <div
                        class="
                            text-left
                            lg:w-3/5
                            flex flex-col
                            items-center
                            md:items-start
                            justify-between
                            min-h-9/12
                            sm:min-h-8/12
                            lg:min-h-7/12
                        "
                    >
                        <h1
                            class="
                                text-5xl
                                tracking-tight
                                font-bold
                                md:text-gray-900
                                sm:text-6xl
                                md:text-6xl
                                text-center
                                md:text-left
                            "
                        >
                            <span class="block xl:inline leading-snug"
                                >Location de piscines</span
                            >
                            <span
                                class="
                                    block
                                    text-cyan-600
                                    xl:inline
                                    leading-snug
                                "
                            >
                                entre particulier
                            </span>
                        </h1>
                        <p
                            class="
                                text-center
                                md:text-left
                                text-2xl
                                font-bold
                                md:font-medium
                                tracking-widest
                                leading-loose
                                text-gray-600
                                sm:mt-10
                                max-w-xl
                                w-full
                                md:text-xl md:w-1/2
                                lg:w-4/5 lg:mx-0
                            "
                        >
                            Profiter d'une piscine juste pour vous et au prix
                            qui vous convient !
                        </p>
                        <div
                            class="mt-8 justify-center sm:flex sm:justify-start"
                        >
                            <div
                                class="
                                    rounded-md
                                    space-y-4
                                    sm:space-y-0
                                    flex flex-col
                                    sm:flex-row
                                    items-center
                                    justify-start
                                    space-x-0
                                    sm:space-x-4
                                    w-full
                                    md:w-auto
                                "
                            >
                                <!-- <div class="rounded-md space-y-5">  -->
                                <TButton
                                    @click="sendToList()"
                                    class="
                                        flex
                                        items-center
                                        justify-center
                                        px-8
                                        py-3
                                        border border-transparent
                                        text-lg
                                        font-medium
                                        rounded-md
                                        text-white
                                        bg-cyan-600
                                        hover:bg-cyan-500
                                        md:py-4 md:text-lg md:px-10
                                    "
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
                                    class="
                                        text-lg
                                        px-8
                                        py-3
                                        bg-white
                                        md:py-4 md:text-lg md:px-10
                                    "
                                >
                                    Vous êtes proprietaire 📣
                                </TSecondaryButton>
                            </div>
                        </div>
                    </div>
                    <div
                        class="
                            hero_illustration
                            absolute
                            top-20
                            sm:top-0
                            md:-top-5 md:right-0
                            w-full
                            md:w-3/5
                            lg:w-1/2
                            p-10
                            opacity-25
                            md:opacity-100
                        "
                    >
                        <img :src="illustration5" alt="" />
                    </div>
                </main>
            </div>
        </div>
        <img
            :src="waves"
            alt=""
            srcset=""
            class="absolute bottom-20 lg:bottom-10 w-full"
        />
    </section>

    <HowItWorks />
</template>

<script>
import logo from '@/assets/img/logo.png'
import illustration5 from '@/assets/img/illustrations/Jumping into the pool-pana.svg'
import waves from '@/assets/img/illustrations/layered-waves-haikei.svg'

import { computed, inject, ref, watchEffect } from '@vue/runtime-core'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import { createToast } from 'mosha-vue-toastify'
import defaultAvatar from '@/assets/img/default-avatar.png'

export default {
    setup() {
        const router = useRouter()
        const route = useRoute()

        const open = ref(false)
        const openMenu = () => {
            setTimeout(function () {
                open.value = true
            }, 0)
        }
        const closeMenu = () => {
            open.value = false
        }
        const store = useStore()
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
            router.push('/announcements')
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
        return {
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
