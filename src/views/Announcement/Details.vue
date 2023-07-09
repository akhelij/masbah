<template>
    <div class="bg-white" v-if="announcement">
      <!-- h-64 grid grid-rows-3 grid-flow-col gap-4 -->
      <div :class="adjust_width ? 'grid-rows-2' : ''" class="grid grid-flow-col gap-2 md:gap-4 px-2 sm:px-8 mx-auto mt-6 max-w-screen-xl">
        <div v-for="media,index in announcement.media" :key="index" :class="(index == 0 && adjust_width) ? 'col-span-2' : ''" class="rounded-lg overflow-hidden shadow max-h-96">
          <img :src="media"  class="w-full h-full object-center object-cover" alt="media"/>
        </div>        
      </div>
      <!-- Product info -->
      <div class="max-w-2xl mx-auto pt-10 pb-16 px-4 sm:px-6 lg:max-w-screen-xl lg:pt-16 lg:pb-24 lg:px-8 lg:grid lg:grid-cols-3 lg:grid-rows-[auto,auto,1fr] lg:gap-x-8">
       
            <div class="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8 flex flex-col md:flex-row justify-between">
                <div class="space-y-2">
                    <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        {{ announcement.title }}
                    </h1>
                    <h4 class="text-xl font-bold">👪 {{ announcement.min_people }} à {{ announcement.max_people }} personnes</h4>
                </div>

                <div>
                    <h3 class="text-2xl text-cyan-500 font-bold">{{ announcement.city.name }}</h3>
                    <p class="text-gray-400 text-xs">{{ useTimeago(announcement.created_at.toDate()) }}</p>
                </div>
     
            </div>

            
        

        <!-- Options -->
        <div class="mt-4 lg:mt-0 lg:row-span-3">
          <h2 class="sr-only">Informations</h2>
          <div class="flex flex-row items-center justify-between">

            <div class="flex flex-col items-start justify-between">

                <p class="text-lg font-semibold text-gray-800 flex items-center"> Demi Journée</p> 
                <p class="text-3xl font-semibold text-cyan-600  flex flex-row space-x-1 items-center"><span class="filter drop-shadow-sm brightness-95">{{ announcement.half_day_price }} </span> <span class="flex flex-col -space-y-1"><span class="text-xs font-bold text-cyan-600 filter drop-shadow-sm brightness-95">Dhs </span><span class="text-xs font-light text-cyan-600 filter drop-shadow-sm brightness-95 ">/Personne</span></span>  </p>
            
                
            </div>
            <div class="flex flex-col items-start justify-between">

                <p class="text-lg font-semibold text-gray-800 flex items-center"> Journée Complete</p> 
                <p class="text-3xl font-semibold text-cyan-600  flex flex-row space-x-1 items-center"><span class="filter drop-shadow-sm brightness-95">{{ announcement.full_day_price }} </span> <span class="flex flex-col -space-y-1"><span class="text-xs font-bold text-cyan-600 filter drop-shadow-sm brightness-95">Dhs </span><span class="text-xs font-light text-cyan-600 filter drop-shadow-sm brightness-95 ">/Personne</span></span>  </p>
                            
            </div>

          </div>

          <!-- Reviews -->
          <div class="mt-6">
            <h3 class="sr-only">Equipements</h3>
            <h3 class="text-lg font-semibold">Equipements Inclus : </h3>
            <div class=" text-sm my-4">
                <div v-for="extra,index in announcement.extras" :key="index" > 
                    <div class="flex flex-row justify-between space-y-2 font-semibold" v-if="extra.available && extra.price==null">
                        <span >{{extra.label}}</span> 
                        <span class="text-gray-500 " v-if="extra.price != null">
                            {{extra.price}} Dhs 
                            <span v-if="extra.byone">/ personne</span>
                        </span>
                        <span class="text-green-500" v-else>
                            Gratuit
                        </span>
                    </div>
                </div>
            </div>
            <h3 class="text-lg font-semibold">Extras : </h3>
            <div class=" text-sm my-4">
                <div v-for="extra,index in announcement.extras" :key="index" > 
                    <div class="flex flex-row justify-between space-y-2 font-semibold" v-if="extra.available && extra.price!=null">
                        <span >{{extra.label}}</span> 
                        <span class="text-gray-500 " v-if="extra.price != null">
                            {{extra.price}} Dhs 
                            <span v-if="extra.byone">/ personne</span>
                        </span>
                        <span class="text-green-500" v-else>
                            Inlcus
                        </span>
                    </div>
                </div>
            </div>
          </div>

          <div class="mt-10"> 
            <div class="flex flex-row justify-between items-center" v-if="announcement.user">
                <img class=" h-16 w-16 rounded-full ring-1 ring-white" :src="announcement.user.avatar" alt="contact-avatar">
                <span class="text-lg font-bold">{{announcement.user.username}}</span>
            </div>             

            <div class="my-2">
                {{announcement.address}}
            </div>
            
            <button @click.prevent="emitter.emit('showModal' ,'ContactAnnouncer');" class="mt-10 w-full bg-green-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Afficher le contact</button>
          </div>
        </div>

        <div class="py-10 lg:pt-6 lg:pb-16 lg:col-start-1 lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
          <!-- Description and details -->
          <div>
            <h3 class="sr-only">Description</h3>
            <div class="space-y-6">
              <p class="text-base text-gray-900">{{ product.description }}</p>
            </div>
          </div>

          <div class="mt-10">
            <h3 class="text-lg font-semibold text-gray-900">Réglements :</h3>

            <div class="mt-4">
              <ul role="list" class="pl-4 list-disc text-sm space-y-2">
                <li v-for="rule,index in announcement.rules" :key="index" class="text-gray-400 list-none flex flex-row space-x-3 items-center">
                   <span v-if="rule.allowed">
                       <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </span> 
                  <span v-else>
                      <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                  </span> 
                  <span :class="rule.allowed ? '' : 'line-through'" class="text-gray-800">{{ rule.title }}</span>                  
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-10">
            <h2 class="text-lg font-semibold text-gray-900">Précisions de votre hôte :</h2>

            <div class="mt-4 space-y-6">
              <p class="text-sm text-gray-600">{{ announcement.more_rules }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  

  <TModal :name="'ContactAnnouncer'" >
    <ContactAnnouncer :contact="{ avatar: announcement.user.avatar,name: announcement.user.username ,phone: announcement.phone }" />
  </TModal>
</template>

<script>
import { computed, inject, onBeforeMount, ref, watchEffect } from 'vue'
import { useStore } from 'vuex'
import useTimeago from '@/use/timeago'
const product = {
  name: 'Details',
  price: '$192',
  href: '#',
  breadcrumbs: [
    { id: 1, name: 'Men', href: '#' },
    { id: 2, name: 'Clothing', href: '#' },
  ],
  images: [
    {
      src: 'https://tailwindui.com/img/ecommerce-images/product-page-02-secondary-product-shot.jpg',
      alt: 'Two each of gray, white, and black shirts laying flat.',
    },
    {
      src: 'https://tailwindui.com/img/ecommerce-images/product-page-02-tertiary-product-shot-01.jpg',
      alt: 'Model wearing plain black basic tee.',
    },
    {
      src: 'https://tailwindui.com/img/ecommerce-images/product-page-02-tertiary-product-shot-02.jpg',
      alt: 'Model wearing plain gray basic tee.',
    },
    {
      src: 'https://tailwindui.com/img/ecommerce-images/product-page-02-featured-product-shot.jpg',
      alt: 'Model wearing plain white basic tee.',
    },
  ],
  description:
    'The Basic Tee 6-Pack allows you to fully express your vibrant personality with three grayscale options. Feeling adventurous? Put on a heather gray tee. Want to be a trendsetter? Try our exclusive colorway: "Black". Need to add an extra pop of color to your outfit? Our white tee has you covered.',
  highlights: [
    'Hand cut and sewn locally',
    'Dyed with our propietary colors',
    'Pre-washed & pre-shrunk',
    'Ultra-soft 100% cotton',
  ],
  details:
    'The 6-Pack includes two black, two white, and two heather gray Basic Tees. Sign up for our subscription service and be the first to get new, exciting colors, like our upcoming "Charcoal Gray" limited release.',
}
export default {
  props:['id'],
  watch:{

  },
  setup(props) {        
    const emitter = inject('$emitter');
    const store = useStore();
    let announcement = computed(() => store.getters.getAnnouncement);
    let adjust_width = ref(false);

    onBeforeMount(() => {
        
        if(props.id != null && announcement.value == "")
        {
            store.dispatch('getAnnouncementByIdAction', props.id)
            .then((response) => {
                if(response.success){
                    announcement = response.data;
                }else{
                    console.log(response.data)
                }
            })
            .catch((error) => {
                console.log(error);
            })
        }
    })
   

    watchEffect(() => {
        console.log(announcement.value);
       
        if(announcement.value != "" && announcement.value.media != null && announcement.value.media.length > 2 && announcement.value.media.length % 2 > 0){

          adjust_width.value = true;
        }
    });

    return {
      announcement,
      useTimeago,
      product,
      emitter,
      adjust_width
    }
  },
}
</script>