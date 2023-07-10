<template> 
<div class="overflow-hidden">
    <button id="installApp" class="text-white bg-cyan-600 w-full font-semibold py-4">
      💫Installer notre application mobile 💫
    </button>
    <ProgressBar />
    <header :class="route.name != 'Home' ? 'shadow-md md:mb-10' : ''">
        <Header />
    </header>
    
    <main>      
      <router-view />    
    </main>
    
    <footer class="bg-white" :class="route.name == 'Home' ? 'pt-20' : ''">      
        <Footer />
    </footer>  
</div>   
</template>

<script>
import { computed, onBeforeMount } from '@vue/runtime-core';
import { useStore } from 'vuex';
import firebase from 'firebase/app';
import { useRoute, useRouter } from 'vue-router';

export default 
{
  setup(){
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    
    const isLoading = computed(() => store.state.user.loading);

    onBeforeMount(()=>{
       store.dispatch('progressbar/start');
       firebase.auth().onAuthStateChanged((user) => {
          if(user){
            store.dispatch('getUserById', user.uid);            
            store.dispatch('fetchMyAnnouncementsAction', user.uid);    
          }else{
            if(['Profile','CreateAnnouncement','UpdateAnnouncement'].includes(route.name)){
              router.push('/')
            }
          }
        });          
      store.dispatch('fetchAnnouncementsAction');            
      store.dispatch('progressbar/stop'); 
    });

    return { isLoading, route };
  }
  
}
</script>
