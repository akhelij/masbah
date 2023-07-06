<template>
  <section class="max-w-7xl mx-auto z-50"  >
      <div class="relative py-2 md:py-6 px-4 sm:px-6  lg:px-8">
        <nav class="relative flex items-center justify-around sm:h-10 lg:justify-start" aria-label="Global">
          <div class="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0 w-full md:w-auto">
            <div class="flex flex-row items-center justify-between w-full md:w-auto">
              <router-link :to="{ name:'Home' }">
                <span class="sr-only">Pissina</span>                  
                <a href="#_" class="text-3xl font-black leading-none text-gray-900 select-none logo">Pissina<span class="text-cyan-600">.</span></a>
              </router-link>
              <div class="-mr-2 flex items-center justify-between md:hidden">
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
              <router-link :to="{ name: 'CreateAnnouncement' }" v-show="route.name != 'CreateAnnouncement'">
                    <TButton > + Proposer votre piscine 📣 </TButton>
              </router-link> 
              <img  class="h-12 w-12 rounded-full  mt-1" :src="isAuth && user.avatar != null &&  user.avatar != undefined ? user.avatar : defaultAvatar" alt="avatar">
                  
              <Dropdown :items="items" :withoutDivider="true" @logout="logout" :_style="'w-44 -ml-40 mt-14 z-50'">
                <button v-if="isAuth" id="user-menu" aria-haspopup="true" class="-ml-8 mt-6 transform duration-75 hover:scale-110">
                  <span class="sr-only">Open user menu</span>
                  ⚙️
                </button>
              </Dropdown> 
            </div>
          </div>
          <div class="flex flex-row justify-end w-full" v-else>           
            <div class="hidden md:block md:ml-20 md:space-x-8"  >
              <TButton @click="emitter.emit('showModal' ,'RegisterModal')"> 📝 Créer un compte </TButton>
              <TSecondaryButton @click="emitter.emit('showModal' ,'SignInModal')"> 🔐 Se connecter</TSecondaryButton>                
            </div>
          </div>
        </nav>
      </div>

      <div  v-click-outside="closeMenu" class="absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden opacity-0 scale-95 z-50" :class="open ? 'duration-150 ease-out transform opacity-100 scale-100' : 'duration-100 ease-in opacity-0 scale-95 hidden'">
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
            
            <router-link @click="closeMenu()" :to="{ name: 'CreateAnnouncement' }" class="block w-full px-5 py-3 text-start font-medium text-cyan-600 bg-gray-50 hover:bg-gray-100 border-b">
              📣 Proposer votre piscine 
            </router-link>
            <router-link @click="closeMenu()" :to="{ name: 'Profile' }" class="block w-full px-5 py-3 text-start font-medium text-cyan-600 bg-gray-50 hover:bg-gray-100 border-b">
              😎 Profile
            </router-link>
            <a href="#"  v-if="isAuth" @click="logout(); closeMenu()" class="block w-full px-5 py-3 text-start font-medium text-gray-400 bg-gray-50 hover:bg-gray-100">
              🔐 Se déconnecter
            </a>
          </div>
          
          <div v-else>
            <a href="#"  @click="emitter.emit('showModal' ,'RegisterModal'); closeMenu()" class="block w-full px-5 py-3 text-center font-medium text-cyan-600 bg-gray-50 hover:bg-gray-100 border-b">
            📝 Créer un compte
            </a>
            <a href="#"  @click="emitter.emit('showModal' ,'SignInModal'); closeMenu()" class="block w-full px-5 py-3 text-center font-medium text-cyan-600 bg-gray-50 hover:bg-gray-100">
              🔐 Se connecter
            </a>
          </div>
        </div>
      </div>
      
  </section>
  <TModal :name="'SignInModal'">
        <AuthSignIn />
    </TModal>
    <TModal :name="'RegisterModal'">
        <AuthRegister />
    </TModal>
    <TModal :name="'ResetModal'">
        <AuthReset />
    </TModal>
</template>

<script>

import logo from "@/assets/img/logo.png";
import { computed, inject, ref, watchEffect } from '@vue/runtime-core';
import { useStore } from 'vuex';

import { createToast } from 'mosha-vue-toastify';

import defaultAvatar from '@/assets/img/default-avatar.png';
import { useRoute } from 'vue-router';
export default {
   
    setup(){
        const route = useRoute();
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
        return { items, logo, defaultAvatar, emitter, isAuth, user, logout, open, openMenu, closeMenu, route }
    }
}
</script>
