<template>
  <section class="relative">
    <div class="max-w-7xl mx-auto">
      <div :class=" hero_design ? ' bg-cover bg-white pb-8 lg:max-w-2xl lg:w-full ' : 'w-full'" class="relative z-10 pb-2 lg:bg-none   ">
      
        <svg  :class=" hero_design ? 'hidden lg:block' : 'hidden'" class="absolute -right-6 inset-y-0 h-full w-52 transform translate-x-1/2" id="visual" viewBox="0 0 1000 3000" width="1000" height="3000" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"><path d="M718 0L718.7 38.5C719.3 77 720.7 154 724.2 231C727.7 308 733.3 385 730 461.8C726.7 538.7 714.3 615.3 701.8 692.2C689.3 769 676.7 846 675.8 923C675 1000 686 1077 695.2 1154C704.3 1231 711.7 1308 705.5 1384.8C699.3 1461.7 679.7 1538.3 683.8 1615.2C688 1692 716 1769 732.8 1846C749.7 1923 755.3 2000 741.7 2077C728 2154 695 2231 691.8 2307.8C688.7 2384.7 715.3 2461.3 717.5 2538.2C719.7 2615 697.3 2692 685.3 2769C673.3 2846 671.7 2923 670.8 2961.5L670 3000L0 3000L0 2961.5C0 2923 0 2846 0 2769C0 2692 0 2615 0 2538.2C0 2461.3 0 2384.7 0 2307.8C0 2231 0 2154 0 2077C0 2000 0 1923 0 1846C0 1769 0 1692 0 1615.2C0 1538.3 0 1461.7 0 1384.8C0 1308 0 1231 0 1154C0 1077 0 1000 0 923C0 846 0 769 0 692.2C0 615.3 0 538.7 0 461.8C0 385 0 308 0 231C0 154 0 77 0 38.5L0 0Z" fill="#d0fbff"></path><path d="M466 0L466.7 38.5C467.3 77 468.7 154 477 231C485.3 308 500.7 385 500 461.8C499.3 538.7 482.7 615.3 467 692.2C451.3 769 436.7 846 431.2 923C425.7 1000 429.3 1077 434.7 1154C440 1231 447 1308 449.7 1384.8C452.3 1461.7 450.7 1538.3 462 1615.2C473.3 1692 497.7 1769 500.8 1846C504 1923 486 2000 473.7 2077C461.3 2154 454.7 2231 450.8 2307.8C447 2384.7 446 2461.3 450.5 2538.2C455 2615 465 2692 464 2769C463 2846 451 2923 445 2961.5L439 3000L0 3000L0 2961.5C0 2923 0 2846 0 2769C0 2692 0 2615 0 2538.2C0 2461.3 0 2384.7 0 2307.8C0 2231 0 2154 0 2077C0 2000 0 1923 0 1846C0 1769 0 1692 0 1615.2C0 1538.3 0 1461.7 0 1384.8C0 1308 0 1231 0 1154C0 1077 0 1000 0 923C0 846 0 769 0 692.2C0 615.3 0 538.7 0 461.8C0 385 0 308 0 231C0 154 0 77 0 38.5L0 0Z" fill="#e8fdff"></path><path d="M232 0L232.5 38.5C233 77 234 154 243.8 231C253.7 308 272.3 385 269.5 461.8C266.7 538.7 242.3 615.3 238.5 692.2C234.7 769 251.3 846 260 923C268.7 1000 269.3 1077 267.3 1154C265.3 1231 260.7 1308 264.3 1384.8C268 1461.7 280 1538.3 284.7 1615.2C289.3 1692 286.7 1769 278 1846C269.3 1923 254.7 2000 254 2077C253.3 2154 266.7 2231 265.7 2307.8C264.7 2384.7 249.3 2461.3 242.3 2538.2C235.3 2615 236.7 2692 246.5 2769C256.3 2846 274.7 2923 283.8 2961.5L293 3000L0 3000L0 2961.5C0 2923 0 2846 0 2769C0 2692 0 2615 0 2538.2C0 2461.3 0 2384.7 0 2307.8C0 2231 0 2154 0 2077C0 2000 0 1923 0 1846C0 1769 0 1692 0 1615.2C0 1538.3 0 1461.7 0 1384.8C0 1308 0 1231 0 1154C0 1077 0 1000 0 923C0 846 0 769 0 692.2C0 615.3 0 538.7 0 461.8C0 385 0 308 0 231C0 154 0 77 0 38.5L0 0Z" fill="#ffffff"></path></svg>
        
        <div>        
          <div class="relative py-2 md:py-6 px-4 sm:px-6  lg:px-8">
            <nav class="relative flex items-center justify-around sm:h-10 lg:justify-start" aria-label="Global">
              <div class="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
                <div class="flex items-center justify-between w-full md:w-auto">
                  <router-link :to="{ name:'Home' }" v-if="!hero_design">
                    <svg  class="w-6 h-6 mr-2 cursor-pointer outline-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  </router-link>
                  <router-link :to="{ name:'Home' }">
                    <span class="sr-only">Pissina</span>                  
                    <a href="#_" class="text-3xl font-black leading-none text-gray-900 select-none logo">Pissina<span class="text-cyan-600">.</span></a>
                  </router-link>
                  <div class="-mr-2 flex items-center md:hidden">
                    <button type="button" @click="openMenu" class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500" aria-expanded="false">
                      <span class="sr-only">Open main menu</span>
                      <!-- Heroicon name: outline/menu -->
                      <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
                <div class="hidden md:flex flex-row justify-end w-full" v-if="isAuth">
                  <div class="flex flex-row items-center  space-x-4" >
                    <router-link :to="{ name: 'CreateAnnouncement' }" v-show="show_publish_btn">
                          <TButton > + Proposer votre piscine 📣 </TButton>
                    </router-link> 
                    <img  class="h-12 w-12 rounded-full  mt-1" :src="isAuth ? user.avatar : 'defaultAvatar'" alt="">
                        
                    <Dropdown :items="items" :withoutDivider="true" @logout="logout" :_style="'w-44 -ml-40 mt-14 z-50'" class="z-50">
                        <button v-if="isAuth" id="user-menu" aria-haspopup="true" class="-ml-8 mt-6 transform duration-75 hover:scale-110">
                          <span class="sr-only">Open user menu</span>
                          ⚙️
                        </button>
                      </Dropdown> 
                  </div>
                </div>
              <div class="flex flex-row justify-end w-full" v-else>
                <!-- <div class=" md:block md:ml-10 md:pr-4 md:space-x-8 flex flex-row items-center" > -->
                              

                  
                  <!-- <TSecondaryButton  @click="logout">🔓 Se déconnecter</TSecondaryButton> -->
                <!-- </div> -->
                  
                <div class="hidden md:block md:ml-20 md:space-x-8"  >
                  <TButton @click="emitter.emit('showModal' ,'RegisterModal')"> 📝 Créer un compte </TButton>
                  <TSecondaryButton @click="emitter.emit('showModal' ,'SignInModal')"> 🔐 Se connecter</TSecondaryButton>                
                </div>
              </div>
            </nav>
          </div>

          <div  v-click-outside="closeMenu" class="absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden opacity-0 scale-95" :class="open ? 'duration-150 ease-out transform opacity-100 scale-100' : 'duration-100 ease-in opacity-0 scale-95 hidden'">
            <div class="rounded-lg shadow-md bg-white ring-1 ring-black ring-opacity-5 overflow-hidden">
              <div class="px-5 pt-4 flex items-center justify-between">
                <div>
                  <router-link :to="{ name:'Home' }">
                    <span class="sr-only">Pissina</span>                  
                    <a href="#_" class="text-3xl font-black leading-none text-gray-900 select-none logo">Pissina<span class="text-cyan-600">.</span></a>
                  </router-link>
                </div>
                <div class="-mr-2">
                  <button type="button"  @click="closeMenu"  class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500">
                    <span class="sr-only">Close main menu</span>
                    <!-- Heroicon name: outline/x -->
                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div  v-if="isAuth" >
                
                <router-link :to="{ name: 'CreateAnnouncement' }" class="block w-full px-5 py-3 text-start font-medium text-cyan-600 bg-gray-50 hover:bg-gray-100 border-b">
                  📣 Proposer votre piscine 
                </router-link>
                <router-link :to="{ name: 'Profile' }" class="block w-full px-5 py-3 text-start font-medium text-cyan-600 bg-gray-50 hover:bg-gray-100 border-b">
                  😎 Profile
                </router-link>
                <a href="#"  v-if="isAuth" @click="logout" class="block w-full px-5 py-3 text-start font-medium text-gray-400 bg-gray-50 hover:bg-gray-100">
                  🔐 Se déconnecter
                </a>
              </div>
              
              <div v-else>
                <a href="#"  @click="emitter.emit('showModal' ,'RegisterModal')" class="block w-full px-5 py-3 text-center font-medium text-cyan-600 bg-gray-50 hover:bg-gray-100 border-b">
                📝 Créer un compte
                </a>
                <a href="#"  @click="emitter.emit('showModal' ,'SignInModal')" class="block w-full px-5 py-3 text-center font-medium text-cyan-600 bg-gray-50 hover:bg-gray-100">
                  🔐 Se connecter
                </a>
              </div>
            </div>
          </div>
        </div>

        <main :class=" hero_design ? 'block' : 'hidden'" class="my-5 mx-auto max-w-7xl px-4 sm:mt-6 sm:px-6 md:mt-6 lg:mt-6 lg:px-8 xl:mt-8 z-30">
          <div class="sm:text-center lg:text-left">
            <h1 class="text-4xl tracking-tight font-extrabold  md:text-gray-900 sm:text-5xl md:text-6xl">
              <span class="block xl:inline">Location de piscines</span>
              <span class="block text-cyan-600 xl:inline"> entre particulier </span>
            </h1>
            <p class="mt-3 text-base text-gray-900 font-bold md:text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              Ce site vous permet de déposer vos annonces de location de Piscine, De particulier à particulier !
            </p>
            <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
              <div class="rounded-md shadow">
                <!-- <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-500 md:py-4 md:text-lg md:px-10"> -->
              
                <TButton class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-500 md:py-4 md:text-lg md:px-10">
                  👀 Trouver une piscine 
                </TButton>
            </div>
                  
            </div>
          </div>
        </main>
        
      </div>
      
    </div>
      
    <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2" :class=" hero_design ? 'hidden lg:block' : 'hidden'">      
      <img class="z-50 h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full" :src="heroBg" alt="">
    </div>
  </section>
</template>

<script>

import logo from "@/assets/img/logo.png";
import heroBg from "@/assets/img/kid-girl.jpg";
import waves from "@/assets/img/layered-waves.svg";

import { computed, inject, ref, watchEffect } from '@vue/runtime-core';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { createToast } from 'mosha-vue-toastify';

import defaultAvatar from '@/assets/img/default-avatar.png';
export default {
   
    setup(){
        const route = useRoute();
        const hero_design = ref(true);
        const show_publish_btn = ref(true);
        watchEffect(() => { 
          hero_design.value = route.name == 'Home';
          show_publish_btn.value = route.name != 'CreateAnnouncement'
        })
        
        const open = ref(false);
        const openMenu = () => {
          setTimeout(function(){ open.value = true }, 0);    
        };
        const closeMenu = () => {
          open.value = false;
        };
        const store = useStore();
        const emitter = inject('$emitter');
        const isAuth = computed (() => store.getters.isAuth);
        const user = computed(() => store.getters.getUser);
        const logout = () =>{
          store.dispatch('logoutAction')
            .then(() => createToast('👋 A bientôt !', { type: "success", timeout: 2000}))
            .catch((error) => console.log(error));
        };
        const items= [
        { 
          type: "link" , 
          link: "/profile",
          icon: "<span class='mr-1'>😎</span>",
          text: 'Profile',
          style: "text-gray-700 py-2" 
        },
        { 
          type: "func",
          func: "logout", 
          icon: "<span class='mr-2'>🔓 </span>",
          text: " Se déconnecter",
          style: "text-gray-500 py-2 mt-1 border-t" 
        }
      ];
        return { items, logo, defaultAvatar, heroBg, waves, emitter, isAuth, user, logout, open, openMenu, closeMenu, hero_design, show_publish_btn }
    }
}
</script>

<style>

</style>