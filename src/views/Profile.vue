<template>
  <section class="relative w-full">
    <div class="relative flex flex-col justify-center space-y-10 md:space-y-0 md:flex-row md:space-x-5 w-full md:text-gray-800 px-4 sm:px-5 py-10 mx-auto sm:py-12 md:py-16 md:px-10 max-w-screen-xl" v-if="user!=null">
      <div class="bg-white shadow-xl rounded-2xl md:max-w-xs sm:px-2  h-80 w-full" >
        <div class="flex flex-col items-center justify-center px-6 md:px-8 py-4 space-y-4">
          <div class="relative rounded-full">
          
          <img
            class="mx-auto rounded-full max-h-36"
            height="100"
            width="100"
            :src="user.avatar != null &&  user.avatar != undefined ? user.avatar : defaultAvatar"
            alt="user-avatar"
          />

          <input id="file-upload" name="file-upload" type="file" class="sr-only" @change="previewImage"  accept="image/*"/>
          
          <label v-if="!upload_started" for="file-upload" class="absolute flex justify-center bottom-0 w-full bg-white bg-opacity-50 rounded-tr-md rounded-bl-md p-1 cursor-pointer transform duration-300 hover:scale-110" >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>          
          </label>
          <div v-else class="absolute flex justify-center bottom-0 w-full bg-white bg-opacity-50  p-1 cursor-pointer" >
            <svg  class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
          </div>
          <div class="flex flex-row items-center justify-center space-x-2">
            <input v-model="user.username" @keydown="allowChange = true" class="text-lg text-center font-bold border-b outline-none sm:max-w-xs w-52 pl-1" />
            <button :class="allowChange ? 'shadow rounded p-1' : 'text-gray-300' " class="-ml-4 transform duration-300 hover:scale-110 active:scale-100 cursor-pointer">
              <svg @click="allowChange ? updateUser() : ''" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>           
          </div>
          
          <p class="text-gray-500 text-lg font-bold">
          📧 {{ user.email }}
          </p>
        </div>
        <div class="flex">
          <div
            class="flex flex-col text-center py-2 border-r-2 border-gray-400 w-1/2"
          >
            <span class="text-md font-semibold text-gray-400">📢 Publications</span
            ><span class="text-md font-bold">{{pubs_count}}</span>
          </div>
          <div class="flex flex-col text-center py-2 w-1/2">
            <span class="text-md font-semibold text-gray-400">🤩 Votes</span
            ><span class="text-md font-bold">{{ votes_count }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col w-full" v-if="Object.keys(my_announcements).length > 0">
        <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg rounded">
              <table class="min-w-full divide-y divide-gray-200 ">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photos
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Titre
                    </th>
                    <th scope="col" class="hidden md:block px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      prix
                    </th>
                    <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th scope="col" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>                  
                    
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(announcement,announcement_index) in my_announcements" :key="announcement.id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="flex -space-x-2 mt-2">
                            <TTooltip v-if="!hasMedia(announcement.media) ">
                              <template v-slot:message>
                                Veuillez ajouter des photos à votre annonce
                              </template>
                              <template v-slot:icon>
                                <span class="animate-pulse hover:animate-none">⚠️</span>
                              </template>
                            </TTooltip>
                            <img v-for="img,index in announcement.media" :key="index" class="inline-block h-6 w-6 rounded-lg ring-1 ring-white" :src="img" alt="media" />
                          </div>
                        </div>                      
                      </div>
                    </td>
                    <td>
                      <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {{ announcement.title }}
                          </div>                        
                        </div>
                        
                    </td>
                    <td class="hidden md:block">
                      <div class="px-6 py-4 whitespace-nowrap ">
                            <div class="text-sm font-bold text-cyan-600 flex items-center">
                              {{ announcement.half_day_price }}  
                              <span class="text-xs text-gray-600 ml-1"> Dhs</span>
                            </div>
                          </div>
                    </td>
                    
                    <td class="px-2 py-4 space-x-2 whitespace-nowrap  text-gray-500">
                    <span class="cursor-pointer hover:text-lg" @click="updateAnnouncement(announcement)"> ✏️ |</span>
                    <span class="cursor-pointer hover:text-lg" @click="deleteAnnouncement(announcement, announcement_index)">❌ </span>
                    </td>

                    <td class="px-3 py-6 flex items-center space-x-2 transform scale-90">
                      <span :class="announcement.published ? ' text-green-800' : ' text-red-800'" class=" hidden md:flex px-2 text-xs font-semibold flex-row items-center" >
                        <TTooltip v-if="!hasMedia(announcement.media)">
                          <template v-slot:message>
                            Veuillez ajouter des photos à votre annonce
                          </template>
                          <template v-slot:icon>
                            <span class="animate-pulse hover:animate-none">⚠️</span>
                          </template>
                        </TTooltip>
                        
                        <label>{{announcement.published ? "Activer" : "Désactiver"}} </label>
                        
                      </span>
                      <div :class="hasMedia(announcement.media)  ? '' : 'filter grayscale'">
                        <TToggle  :disabled=" hasMedia(announcement.media)  ? false : 'disabled'" v-model="announcement.published" @update:modelValue="changeAnnouncementStatus(announcement)"/>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col items-center justify-center space-y-12 w-full border" v-if="Object.keys(my_announcements).length == 0">
      <span class="text-7xl"> 🙄 </span>
      <h1 class="text-3xl"> Vous n'avez aucune annonce ! </h1>
      </div>
    </div>
    
  </section>
</template>

<script>
import firebase from 'firebase/app';
import { ref } from '@vue/reactivity';
import { computed, watchEffect } from '@vue/runtime-core';
import { useStore } from 'vuex';
import { createToast } from 'mosha-vue-toastify';
import defaultAvatar from '@/assets/img/default-avatar.png';
import { useRouter } from 'vue-router';

export default {
  name: "Profile",  
  setup() {
    const router = useRouter();
    const store = useStore();    
    const hasMedia = (value) => value != null &&  Object.keys(value).length > 0;
    let allowChange = ref(false);
    
    let user = computed(() => store.getters.getUser);    
    console.log(user.value.avatar);
    let my_announcements = computed(() => store.getters.getMyAnnouncements);    
    
    watchEffect(() =>{
        my_announcements = computed(() => store.getters.getMyAnnouncements);
    });

    const pubs_count = computed(() => 10);
    const votes_count = computed(() => 0);

    const isValidImage = (value, vm) =>  {
        if (!value) {
            return true;
        }        
        const fileSizeinKb = value.size / 1024
        const size = Math.round(fileSizeinKb * 100) / 100 // convert up to 2 decimal place        
        return size <= 10000 && value.name.match(/.(png|jpg|jpeg)$/i);
    }
       
    const files = ref([]); 
    const upload_started = ref(false);

    const previewImage = (event) => {
        if(event.target.files.length <= 1)
        {
            files.value = [];
            upload_started.value = false;
                if(isValidImage(event.target.files[0]))
                {
                    let file = {
                        uploadValue : 0,
                        url : null,
                        imageData : event.target.files[0],
                        tmpUrl: URL.createObjectURL(event.target.files[0])
                    };
                    user.value.avatar = URL.createObjectURL(event.target.files[0]);
                    files.value.push(file);
                    onUpload(files);
                }else{ 
                    files.value = [];
                    createToast('Votre image doit être soit .PNG ou .JPG et ne doit pas depassé 10 MB  🤓', {
                        type: 'danger',
                        timeout: 3000,
                        position: 'bottom-left',
                    });
                }           	
            
        }else{
             createToast('Vous avez droit à 1 image seulement  🤓', {
                type: 'danger',
                timeout: 3000,
                position: 'bottom-left',
            });
        }
    };

    const onUpload = async (files) => {
        upload_started.value = true;
        const storage = firebase.storage();
        for (let index = 0; index < files.value.length; index++) {
            let file = files.value[index];
            let storageRef = storage.ref(`users/profile${Math.random()*100000000000000000}`).put(file.imageData);
            await new Promise(resolve => storageRef
                .on(
                    `state_changed`,
                    snapshot => {
                        file.uploadValue = (snapshot.bytesTransferred/snapshot.totalBytes)*100;
                    }, 
                    error=>{
                        console.log(error.message);
                        reject(error.message)
                    },
                    ()=>{
                        file.uploadValue = 100;
                        storageRef.snapshot.ref.getDownloadURL()
                        .then((url)=>{
                            file.url = url;
                            user.value.avatar = url;
                            updateUser();                            
                            resolve(url);
                        });
                    }      
                )
            )           
        };
        upload_started.value = false;
    }

    const updateUser = () => {
      allowChange.value = false;
      store.dispatch('updateUserAction', user.value)
      .then((response) => {
        if(response.success){
          createToast('Profile mis à jour 👍 !', {
              type: 'success',
              timeout: 3000,
              position: 'bottom-left',
          });
        }
      })
      .catch(() => {
        createToast('😫 Oups, Erreur inattendu, vérifiez votre connexion et réessayez !', {
              type: 'success',
              timeout: 3000,
              position: 'bottom-left',
          });
      });
    }

    const deleteAnnouncement = (announcement, index) => {
      if(confirm('Voulez-vous vraiment supprimer ?'))
      {
        store.dispatch('deleteAnnouncementAction',announcement)
        .then((response) => {
          if(response.success){
            createToast('Annonce supprimée 👍 !', {
                type: 'success',
                timeout: 3000,
                position: 'bottom-left',
            });
          }
        
        })
        .catch((error) => {
          console.log(error);
            createToast('😫 Oups, Erreur inattendu, vérifiez votre connexion et réessayez !', {
                type: 'danger',
                timeout: 3000,
                position: 'bottom-left',
            });
          });
      }
    }

    const changeAnnouncementStatus = (announcement) =>{
      if(Object.keys(announcement.media).length >0)
      {
        store.dispatch('changeAnnouncementStatusAction',announcement)
        .then((response) => {
          if(response.success){          
            createToast(announcement.published ? 'Annonce Publiée 👍 !' : 'Annonce Désactivée 👍 !', {
                type: 'info',
                timeout: 3000,
                position: 'bottom-left',
            })         
          }
        
        })
        .catch((error) => {
          console.log(error);
            createToast('😫 Oups, Erreur inattendu, vérifiez votre connexion et réessayez !', {
                type: 'danger',
                timeout: 3000,
                position: 'bottom-left',
            });
        });
      }
    }
    
    const updateAnnouncement = (announcement) => {
      store.dispatch('setAnnouncementAction',announcement);
      router.push({ 
        name: 'UpdateAnnouncement',
        params: {
            id: announcement.id
            }
      });
    }

    return { 
      user, hasMedia, my_announcements, allowChange, 
      defaultAvatar, pubs_count, votes_count, upload_started, previewImage, updateUser,
      deleteAnnouncement, changeAnnouncementStatus, updateAnnouncement 
    };
  },
};
</script>

<style>
</style>