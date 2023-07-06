<template>
    
    <section class="text-gray-700 bg-white body-font">

        
        <img :src="waves" class="sm:-mb-5 w-full h-auto" alt="waves" 
            width="full"
            height="auto" >

        <div class="flex flex-row items-center h-full  justify-center px-4 sm:px-0 space-x-4 sm:space-x-16 py-5"> 
          <img 
            :src="mobile" 
            class=" w-1/2 md:w-1/3 hidden sm:block h-auto" 
            width="full"
            height="auto" 
            alt="newsletter"
          >
          <div class="flex flex-col space-y-4 justify-between transform sm:scale-75 md:scale-90 lg:min-h-5/12 xl:min-h-7/12  w-full md:w-1/2 max-w-sm">
            <div class="space-y-1">
                <h1 class='text-lg font-bold'>Newsletter :</h1>
                <p class='text-sm text-gray-400'>Recevez un email de nos dernières annonces !</p>
                 <div class='w-full relative'>
                        <TInput
                        placeholder="Adresse e-mail"
                        id="email"
                        type="email"
                        name="email"
                        required
                        >
                            📧
                        </TInput>

                        <div class='absolute top-1 right-1 transform scale-75'>
                            <TButton :button_disabled="true"> Valider </TButton>
                        </div>
                </div>
                <h1 class='text-lg font-bold block sm:hidden'>Partagez avec vos proches :</h1>
             </div>

             <div class="flex flex-row sm:flex-col space-x-2 md:space-x-0 space-y-0 sm:space-y-4 mr-2">
               <h1 class='text-lg font-bold hidden sm:block'>Faites plaisir à vos proches :</h1>
                <ShareNetwork
                    network="facebook"                    
                    url="https://pissina.com"
                    title="Location de piscines entre particulier"
                    description="Profiter d'une piscine juste pour vous et au prix qui vous convient !"                    
                    quote="Vamos a la pissina !"
                    hashtags="pissina, piscine, maroc"
                    class="w-full flex items-center justify-center mx-4 sm:px-2 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 hover:bg-blue-400 md:py-2 md:text-md md:px-2"
                >
                    <svg class="sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24">
                        <path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"/>
                    </svg>
                    <span class="hidden sm:block">
                         Partager sur Facebook
                    </span>
                </ShareNetwork>
                <ShareNetwork
                    network="messenger"
                    url="https://pissina.com"
                    title="Location de piscines entre particulier"
                    description="Profiter d'une piscine juste pour vous et au prix qui vous convient !"
                    class="w-full flex items-center justify-center sm:px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-700 hover:bg-blue-600 md:py-2 md:text-md md:px-2"
                >
                   <svg class="sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24">
                        <path fill="currentColor" d="M256.55 8C116.52 8 8 110.34 8 248.57c0 72.3 29.71 134.78 78.07 177.94 8.35 7.51 6.63 11.86 8.05 58.23A19.92 19.92 0 0 0 122 502.31c52.91-23.3 53.59-25.14 62.56-22.7C337.85 521.8 504 423.7 504 248.57 504 110.34 396.59 8 256.55 8zm149.24 185.13l-73 115.57a37.37 37.37 0 0 1-53.91 9.93l-58.08-43.47a15 15 0 0 0-18 0l-78.37 59.44c-10.46 7.93-24.16-4.6-17.11-15.67l73-115.57a37.36 37.36 0 0 1 53.91-9.93l58.06 43.46a15 15 0 0 0 18 0l78.41-59.38c10.44-7.98 24.14 4.54 17.09 15.62z"/>
                    </svg>
                   <span class="hidden sm:block">
                         Partager par Messenger
                    </span>
                </ShareNetwork>

                <ShareNetwork
                    network="whatsapp"
                    url="https://pissina.com"
                    title="Location de piscines entre particulier"
                    description="Profiter d'une piscine juste pour vous et au prix qui vous convient !"                
                    class="w-full flex items-center justify-center sm:px-4 py-2  border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-500 md:py-2 md:text-md md:px-2"
                >
                <svg class="sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="24" height="24">
                    <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                </svg>
                    <span class="hidden sm:block">
                        Partager par WhatsApp
                    </span>
                </ShareNetwork>
            </div>
          </div>
        </div>

        <section class="bg-cyan-200 text-cyan-900 p-6 rounded-lg mx-auto max-w-7xl px-2 sm:px-8">
            <div class="">
                <h2 class="text-2xl font-bold mb-4 flex items-end"> ⚠️ Avis important</h2>
                <p class="mb-4">
                    Chers utilisateurs,
                </p>
                <p class="mb-4">
                    Nous vous rappelons que les enfants sont sous la responsabilité de leurs parents ou tuteurs légaux lors de leur séjour. Veillez à superviser attentivement vos enfants.
                </p>                
                <p class="mb-4">
                    En cas d'accident, les parents assument l'entière responsabilité des conséquences résultant de l'utilisation de la piscine.
                </p>
                <p class="mb-4">
                    La sécurité et le bien-être de tous nos utilisateurs sont importants pour nous. Nous vous encourageons donc à garder un œil vigilant sur vos enfants, à les accompagner et à veiller à ce qu'ils respectent les règles et les consignes de sécurité en vigueur.
                </p>
                <p class="mb-4">
                    En agissant de manière responsable, nous créons ensemble un environnement sûr et agréable pour tous.
                </p>
                <p class="font-semibold">
                    Merci de votre compréhension et de votre coopération.
                    <br>
                    L'équipe de <span class="underline">Pissina</span>.
                </p>
            </div>
        </section>

        <div class="container flex flex-col items-left sm:items-center px-2 sm:px-8 py-8 mx-auto max-w-7xl sm:flex-row">
            <a href="#_" class="text-xl font-black leading-none text-gray-900 select-none logo">Pissina<span class="text-cyan-600">.</span></a>
            <p class="mt-4 text-sm text-gray-500 sm:ml-4 sm:pl-4 sm:border-l sm:border-gray-200 sm:mt-0">© 2021 Pissina - Location de piscines entre particulier !
            </p>
            <div class="inline-flex justify-start mt-4 space-x-5 sm:ml-auto sm:mt-0 sm:justify-start text-gray-400">
                
                <a href="#" class="text-gray-400 hover:text-gray-500 flex flex-row">
                    <span class="sr-only">Facebook</span>
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd"></path>
                    </svg>
                </a>

                <a href="#" class="text-gray-400 hover:text-gray-500">
                    <span class="sr-only">Instagram</span>
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd"></path>
                    </svg>
                </a>
                <p class="text-lg font-light block sm:hidden -mt-1">@pissinaofficiel</p>
            </div>
            <div class="inline-flex justify-start mt-4 space-x-5 sm:ml-auto sm:mt-0  text-gray-400">
                <router-link :to="{ name: 'Terms' }" class="sm:ml-5">
                Terms and conditions 
                </router-link>
                
                <router-link :to="{ name: 'Privacy' }" class="sm:ml-5">
                    Privacy policy
                </router-link>                
            </div>
        </div>
    </section>
</template>

<script>

import mobile from "@/assets/img/illustrations/Mobile Marketing-pana.svg";
import waves from "@/assets/img/layered-waves.svg";
import { useRoute } from 'vue-router';
import { ref } from '@vue/reactivity';
export default {
    setup(){    
        const route = useRoute();   
        const email = ref(""); 
        return{ waves, mobile, route, email }
    }
}
</script>
<style>

</style>