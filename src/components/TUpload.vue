<template>
    
    <div>    
           
        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            
            <div v-if="files.length == 0" class="space-y-1 text-center">
               
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="flex flex-col space-y-2 items-center text-sm text-gray-600">
                    <p class="pl-1 text-xs text-gray-400"> Un conseil : choisissez au moins 2 ou 3 photos (max 6 photos) présentant votre piscine sous différents angles pour bien montrer le lieu.</p>
                    <p class="text-xs text-gray-400">
                        PNG, JPG jusqu'a 10MB
                    </p>
                    <label for="file-upload" class="relative shadow p-1 cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500">
                    <span>Choisir vos images</span>
                    <input id="file-upload" name="file-upload" type="file" class="sr-only" @change="previewImage"  accept="image/*" multiple/>
                    </label>
                </div>
                
            </div>
            <div v-else class="grid grid-cols-3 gap-2 items-stretch p-5">
                
                <div v-for="(file,i) in files" :key="i" class="relative w-32 h-36 max-h-36" >
                    <div v-if="file.url==null">
                        <div class="w-32 h-36 relative pt-1 rounded-lg shadow flex flex-row items-center justify-center">
                            
                            <img class="w-32 h-36 object-cover object-center rounded-lg shadow-lg opacity-75" :src="file.tmpUrl" alt="uploaded-file">   
                            <div class="absolute top-1/2 overflow-hidden h-2 mb-4 text-xs flex rounded bg-cyan-300 w-28 cursor-wait">
                                <div :style='{ width: file.uploadValue + "%"}' class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-cyan-600"></div>
                            </div>                   
                            <svg v-if="!upload_started" @click="remove(i,true)" class="text-red-500 w-4 h-4 absolute top-1 right-1 bg-gray-600 rounded-full shadow-lg cursor-pointer transform duration-300 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>              
                        </div>
                    </div>
                    <div v-else>
                        <img class="w-32 h-36 object-cover object-center rounded-lg shadow-lg" :src="file.url"  alt="uploaded-file"> 
                        <svg v-if="!upload_started" @click="remove(i)" class="text-red-500 w-4 h-4 absolute top-1 right-1 bg-gray-600 rounded-full shadow-lg cursor-pointer transform duration-300 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> 
                    </div>
                </div>
                
            </div> 
            
            
        </div>
       
    </div>

    <div v-if="files.length > 0" class="flex items-center text-sm text-gray-600   mb-2">
        <p v-if="upload_started">            
            <TButton @click="onUpload">Chargement en cours...</TButton>     
        </p>
        <div class="space-x-2" v-else>
            <label for="file-upload" class="relative shadow p-2 cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500">
            <span> Changer </span>
            <input id="file-upload" name="file-upload" type="file" class="sr-only" @change="previewImage"  accept="image/*" multiple/>
            </label>                
            <TButton @click="onUpload" v-if="!allFilledUp">Commencer l'upload</TButton>            
        </div>
    </div> 

</template>

<script>
import { ref } from '@vue/reactivity';
import firebase from 'firebase/app';
import { computed } from '@vue/runtime-core';
import { createToast } from 'mosha-vue-toastify'
export default {
 emits: ["set_uploaded_files", "set_upload_state"],
 props: ['media'],
 setup(props,  { emit }){

    const isValidImage = (value, vm) =>  {
        if (!value) {
            return true
        }
        ;
        const fileSizeinKb = value.size / 1024
        const size = Math.round(fileSizeinKb * 100) / 100 // convert up to 2 decimal place        
        return size <= 10000 && value.name.match(/.(png|jpg|jpeg)$/i);
    }
   
    let files = ref([]); 
    if(props.media){
        files = ref(props.media);
    }  
    const upload_started = ref(false);

    const previewImage = (event) => {
        if(event.target.files.length <= 6)
        {
            files.value = [];
            upload_started.value = false;
            for(let i=0;i < event.target.files.length;i++){
                if(isValidImage(event.target.files[i]))
                {
                    let file = {
                        uploadValue : 0,
                        url : null,
                        imageData : event.target.files[i],
                        tmpUrl: URL.createObjectURL(event.target.files[i])
                    };
                    files.value.push(file);
                }else{ 
                    files.value = [];
                    createToast('Votre image doit être soit .PNG ou .JPG et ne doit pas depassé 10 MB  🤓', {
                        type: 'danger',
                        timeout: 3000,
                        position: 'bottom-left',
                    });
                    break;
                }           	
            }
        }else{
             createToast('Vous avez droit à 6 images seulement  🤓', {
                type: 'danger',
                timeout: 3000,
                position: 'bottom-left',
            });
        }
    };

    const onUpload = async () => {
        upload_started.value = true;
        const storage = firebase.storage();
        for (let index = 0; index < files.value.length; index++) {
            let file = files.value[index];
            let storageRef = storage.ref(`announces/${Math.random()*100000000000000000}`).put(file.imageData);
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
                            resolve(url);
                        });
                    }      
                )
            )           
        };
        emit('set_uploaded_files', files.value);
        upload_started.value = false;
    }
    
    const allFilledUp = computed(() => {
        if(files.value.length == 0){
            return true;
        }
        const result = files.value.map((file) => file.url != null);
        emit('set_upload_state', !result.includes(false));
        return !result.includes(false); // Result should not include any false value (false == file.url is null == file is not yet uploaded)
    });

    const remove = (index, tmp) => {
        files.value.splice(index, 1); 
        if(!tmp) //the set uploaded files is still not used, so we don't have to update it's value yet
        emit('set_uploaded_files', files.value);
    }
    return { previewImage, onUpload, remove, files, upload_started, allFilledUp}
 }
}
</script>

<style>
</style>