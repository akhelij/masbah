<template>
 <ul class="grid h-full grid-cols-12 gap-5 pb-5 mt-5 sm:mt-12">
    <li v-for="i in 6"  :key="i" class="relative flex flex-col items-start justify-end h-full col-span-12 overflow-hidden rounded-xl group md:col-span-6 xl:col-span-4 cursor-pointer shadow" @click="showAnnouncementDetails(announcement)">
        <a href="#"  class="block w-full bg-center bg-cover h-72 bg-gray-300 animate-pulse" >
        </a>
        <div  class="relative z-20 w-full h-auto py-4 px-2 md:px-4 bg-transparent backdrop-filter backdrop-blur-2xl shadow-lg drop-shadow-lg bg-opacity-25 border-t-0  border-gray-900  ">
            <a href="#_" class="inline-block text-xs font-semibold absolute top-0 -mt-3.5 rounded-full px-4 py-2 uppercase bg-white border-b filter drop-brightness-90"> <span class="bg-gray-300 text-gray-300 rounded-full h-12 w-12 animate-pulse">city</span></a>
            
            <h2 class="my-2 text-lg text-gray-300 bg-gray-300  animate-pulse font-semibold rounded-full" >
                      <span>Une belle piscine bien entretenue</span>
            </h2>
            <div class="mb-2 flex items-center justify-between">
                <div class="relative">
                    <div class="inline-block h-12 w-12 rounded-full ring-1 ring-white bg-gray-300  animate-pulse"></div>
                </div>
            <div class="text-sm font-bold flex flex-col items-end space-y-1" >
                <span class="text-3xl font-semibold text-gray-300  flex flex-row space-x-1 items-center animate-pulse">
                    <span class="bg-gray-300 rounded-full">158</span> 
                    <span class="flex flex-col space-y-1">
                        <span class="text-xs font-bold bg-gray-300 rounded-full">Dhs </span>
                        <span class="text-xs font-light bg-gray-300 rounded-full">/Personnes</span>
                    </span>  
                </span>
                <p class="bg-gray-300 text-gray-300 animate-pulse rounded-full"> 3 à 6 personnes</p>                  
            </div>
            </div>

        </div>
    </li>   
</ul>

</template>

<script>

export default {
 name: "SkelettonAnnouncementCard",
 setup(){
    

    
    
     return {}
 }
}
</script>