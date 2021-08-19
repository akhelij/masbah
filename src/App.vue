<template>    
    <ProgressBar />
    <header>
        <Header />
    </header>
    
    <main class="bg-gray-50">      
      <router-view />    
    </main>
    
    <footer class="bg-gray-50">      
        <Footer />
    </footer>
</template>

<script>
import { computed, onBeforeMount } from '@vue/runtime-core';
import { useStore } from 'vuex';
import firebase from 'firebase/app';
import { useRoute, useRouter } from 'vue-router';

let offset = 1;
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

    

    return { isLoading };
  }
  
}
</script>
