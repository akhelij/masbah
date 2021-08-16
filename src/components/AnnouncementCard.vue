<template>
 <div class="grid h-full grid-cols-12 gap-5 pb-5 mt-5 sm:mt-12">
    <div @click="showAnnouncementDetails(announcement)" class="relative flex flex-col items-start justify-end h-full col-span-12 overflow-hidden rounded-xl group md:col-span-6 xl:col-span-4 cursor-pointer shadow" v-for="(announcement,index) in announcements" :key="index">
                    
        <a href="#"  class="block w-full bg-center bg-cover h-72" :style="announcement.media ? { 'backgroundImage':`url('${announcement.media[0]}')` } : { 'backgroundImage':`url('https://fakeimg.pl/1200/')` }">
        </a>
        <div  class="relative z-20 w-full h-auto py-4 px-2 md:px-4   bg-transparent backdrop-filter backdrop-blur-2xl shadow-lg drop-shadow-lg bg-opacity-25 border-t-0  border-gray-900  ">
            <a href="#_" class="inline-block text-xs font-semibold absolute top-0 -mt-3.5 rounded-full px-4 py-2 uppercase text-cyan-600 bg-white border-b filter drop-brightness-90 ">{{ announcement.city.name }} </a>
            
            <div class="text-sm font-bold  absolute top-0 right-1 flex flex-col items-end">
                <p class="text-gray-400 font-normal text-xs">{{ useTimeago(announcement.created_at.toDate()) }}</p>
            </div>
            <h2 class="my-2 text-lg text-gray-600 font-semibold" >
               {{announcement.title}}            
            </h2>
            <div class="mb-2 flex items-center justify-between">
                <div class="relative">
                    <img class="inline-block h-12 w-12 rounded-full ring-1 ring-white" :src="announcement.user.avatar" alt="">
                    <!-- <span class="absolute -right-1 text-xs top-0">💬</span> -->
                    <span class="absolute -right-1 text-xs bottom-0 transform duration-75 hover:scale-110"  @click="showAnnouncerContact(announcement)">📞</span>
                </div>
            <div class="text-sm font-bold   flex flex-col items-end" >
                <span class="text-3xl font-semibold text-cyan-600  flex flex-row space-x-1 items-center"><span class="filter drop-shadow-sm brightness-95">{{ announcement.half_day_price }} </span> <span class="flex flex-col -space-y-1"><span class="text-xs font-bold text-cyan-600 filter drop-shadow-sm brightness-95">Dhs </span><span class="text-xs font-light text-cyan-600 filter drop-shadow-sm brightness-95 ">/Personne</span></span>  </span>
                <p class="text-gray-400" v-if="announcement.max_people == announcement.min_people">👪 {{ announcement.max_people }} personnes</p>
                <p class="text-gray-400" v-else>👪 {{ announcement.min_people }} à {{ announcement.max_people }} personnes</p>                  
            </div>
            </div>

        </div>
    </div>
   
 </div>

 <div class="flex  items-center justify-center space-x-2" v-if="hasPagination">
    <router-link
        :to="{ name: 'Home', query: { page: page - 1 } }"
        rel="prev"
        v-if="page != 1"
    >
        <TSecondaryButton> Précédent </TSecondaryButton>
    </router-link>
    <span class="m-1 p-1 border rounded-md">{{page}}</span>
    <router-link
        :to="{ name: 'Home', query: { page: page + 1 } }"
        rel="next"
        v-if="hasNext"
    >
        <TSecondaryButton> Suivant </TSecondaryButton>
    </router-link> 
 </div>
<TModal :name="'ContactAnnouncer'">
    <ContactAnnouncer :contact="announcer_contact" />
</TModal>
</template>

<script>
import { computed, reactive, ref } from '@vue/runtime-core';
import { useStore } from 'vuex'

import { inject } from '@vue/runtime-core'
import { useRouter } from 'vue-router';

import useTimeago from '@/use/timeago'
export default {
 name: "AnnouncementCard",
 props:['page'],
 setup(props){
    const offset = ref(1);
    const router = useRouter();
    const store = useStore();
    const announcements = computed(() => {
        let result = store.getters.getAnnouncements
        return result.slice((props.page - 1) * offset.value, props.page * offset.value)
    });

    const hasNext = computed(() => {
        let result = store.getters.getAnnouncements;
        return props.page < Math.ceil(result.length / offset.value);
    });

    const hasPagination = computed(() => {
        let result = store.getters.getAnnouncements;
        return offset.value < result.length;
    });

    const emitter = inject('$emitter');

    const announcer_contact = reactive({
        name:"",
        phone:""
    });

    const showAnnouncerContact = (announcement) => {
        announcer_contact.avatar = announcement.user.avatar;
        announcer_contact.name = announcement.user.username;
        announcer_contact.phone = announcement.phone;
        emitter.emit('showModal' ,'ContactAnnouncer');
    }

    const showAnnouncementDetails = (announcement) =>{
      store.dispatch('setAnnouncementAction',announcement);
      router.push({ 
        name: 'Details',
        params: {
            id: announcement.id
        }
      });
    }
    
     return {announcements, emitter, showAnnouncerContact, showAnnouncementDetails, announcer_contact, useTimeago, hasNext, hasPagination}
 }
}
</script>

<style>

</style>