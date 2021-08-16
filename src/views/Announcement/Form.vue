<template>
  <div class="flex flex-row space-x-4 fixed right-10 bottom-10 z-50">
    <router-link :to="{ name:'Profile' }">
      <TButton class="shadow-lg" :disabled="disable_for_loading" v-if="!creation_done && id != null"> Terminer </TButton>
    </router-link>
  <TButton class="shadow-lg" :button_disabled="disable_for_loading" @click="publish" v-if="!creation_done"> {{  id ? "Modifier" : "Publier"}} 📣 </TButton>
  </div>
  
  <div class="flex flex-col items-center justify-center w-full space-y-5 py-20" v-if="creation_done">
    <h1 class="text-6xl font-bold">Félicitations 🥳🥳</h1> 
    <p  class="text-4xl font-bold px-5 text-center">Merci de votre générosité, vous n'avez plus qu'a attendre que l'un des locataires vous contacte pour venir profité dans votre petit bout de paradis !</p>
    <router-link :to="{name:'Home'}" class="text-4xl font-bold p-2 text-center flex flex-row items-center justify-center text-cyan-600">
      🏠 Revenir a la liste des piscines 
    </router-link>
    <router-link :to="{name:'Profile'}" class="text-4xl font-bold p-2 text-center flex flex-row items-center justify-center text-cyan-600">
      Voir vos annonces 📢
    </router-link>
    <img :src="congrats" alt="" width="480" height="320">
  </div>
  <div v-else class="relative w-full md:text-gray-800 px-5 py-10 mx-auto sm:py-12 md:py-16 md:px-10 max-w-7xl">
    <div>
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <div class="px-4 sm:px-0">
            <h3 class="text-2xl font-bold leading-6 text-gray-900">Réglements</h3>
            <p class="mt-1 text-sm text-gray-600">
              Commencez par préciser quelques règles pour vos locataires.
            </p>
          </div>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
            <div class="shadow sm:rounded-md sm:overflow-hidden">
              <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
                
                <TInputError :message="v$.rules.$errors[0].$message" v-if="v$.rules.$error"/>
                <div class=" flex justify-between" v-for="(rule, index) in rules" :key="index">
                  <label  class="block text-xl font-semibold text-gray-700">
                    {{rule.title}}
                  </label>
                   
                  <TToggle  v-model="rule.allowed"/>
                </div>

                <div class="flex flex-col space-y-2 pt-5">
                  <label class="block text-xl font-semibold text-gray-700">
                   Vos précisions supplémentaires • (facultatif)
                  </label>                
                  <!-- <TInputError :message="v$.more_rules.$errors[0].$message" v-if="v$.more_rules.$error"/> -->
                  <TTextArea placeholder="Musique tolérer à faible volume par respect au voisinage" v-model="more_rules"/>
                </div>
                
              </div>              
            </div>
        </div>
      </div>
    </div>

    <div class="hidden sm:block" aria-hidden="true">
      <div class="py-5">
        <div class="border-t border-gray-200" />
      </div>
    </div>

    <div class="mt-10 sm:mt-0">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
           <div class="px-4 sm:px-0">
            <h3 class="text-2xl font-bold leading-6 text-gray-900">Tarifications</h3>
            <p class="mt-1 text-sm text-gray-600">
              Les prix autour de votre piscine.
            </p>
            
              <p class="mt-4 text-xs text-gray-600 mb-2 ">
                *PS: Vous pouvez saisir un prix pour chaque équipement.
              </p>
              <img :src="extra_tuto" class="w-32 border border-cyan-500">
          </div>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
            <div class="shadow overflow-hidden sm:rounded-md">
              <div class="px-4 py-5 bg-white sm:p-6">
                
                <div class="flex flex-col space-y-2 pt-5">
                  <label class="block text-xl font-semibold text-gray-700">
                   A quel prix souhaitez-vous louer votre piscine, par demi-journée et par personne ?
                  </label>            
                  <TInputError :message="v$.half_day_price.$errors[0].$message" v-if="v$.half_day_price.$error"/>                        
                  <TInput type="number" placeholder="Définir votre prix..."  v-model="half_day_price"/>
                </div>
                
                <div class="flex flex-col space-y-2 pt-5">
                  <label class="block text-xl font-semibold text-gray-700">
                   Votre prix à la journée, par personne • (facultatif)
                  </label>
                  <TInputError :message="v$.full_day_price.$errors[0].$message" v-if="v$.full_day_price.$error"/>                    
                  <TInput type="number"  placeholder="Définir votre prix à la journée..." v-model="full_day_price"/>
                </div>

                <div class="flex flex-col space-y-2 pt-5">
                  <label class="text-xl font-semibold text-gray-700 flex flex-col">
                   <span> Quels équipements proposez-vous ?</span>
                   <span class="text-gray-400 text-xs font-normal">Vous pouvez préciser plus de détails dans la description</span>
                  </label>
                    <TInputError :message="v$.extras.$errors[0].$message" v-if="v$.extras.$error"/>
                    
                    <Extra v-for="(extra,index) in extras" :key="index" 
                      :label="extra.label"
                      v-model:availableValue="extra.available"
                      v-model:priceValue.number="extra.price"
                      v-model:byoneValue="extra.byone"
                    />
                </div>
            </div>
             
              
            </div>
        </div>
      </div>
    </div>

    <div class="hidden sm:block" aria-hidden="true">
      <div class="py-5">
        <div class="border-t border-gray-200" />
      </div>
    </div>

    <div class="mt-10 sm:mt-0">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <div class="px-4 sm:px-0">
            <h3 class="text-2xl font-bold leading-6 text-gray-900">Informations</h3>
              <div class="text-sm text-gray-600">
                <p class="mt-1 text-sm text-gray-600">
                Les information nécessaire au locataire pour qu'il puisse avoir une idée de votre pissine.
                </p>
                <p class="mt-1 ">Conseils:</p>
                <ul class="ml-2">
                  <li>• Titre attraiyant,</li>
                  <li>• 2 ou 3 belles photos de votre piscine</li>
                  <li>• Déscription citant:
                    <ul class="text-xs ml-3">
                      <li>* Les points forts de votre pissine.</li>
                      <li>* Les équipements que vous mettez à disposition de votre locataire.</li>
                      <li>* Si le locataire doit vous contacter pour discuter d'une autre offre.</li>
                    </ul>
                  </li>
                </ul>
              </div>
          </div>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
            <div class="shadow overflow-hidden sm:rounded-md">
              <div class="px-4 bg-white space-y-3 sm:p-6">
                  <div class="flex flex-col space-y-2 pt-2">
                    <label class="block text-xl font-semibold text-gray-700">
                    Combien de personnes souhaitez-vous accueillir par location ?
                    </label>
                    <TInputError :message="v$.max_people.$errors[0].$message" v-if="v$.max_people.$error"/>
                    <div class=" flex justify-between">
                      <label  class="block text-lg font-semibold text-gray-700">
                          Au maximum
                      </label>
                      <TCounter v-model.number="max_people"/>
                    </div>
                    
                    <TInputError :message="v$.min_people.$errors[0].$message" v-if="v$.min_people.$error"/>
                    <div class=" flex justify-between">
                      <label  class="block text-lg font-semibold text-gray-700">
                          Au minimum
                      </label>
                      <TCounter v-model.number="min_people"/>
                    </div>
                  </div>

                  <div class="flex flex-col space-y-2 pt-2">
                    
                    <label class="text-xl font-semibold text-gray-700 flex flex-col">
                      <span> Les photos de votre coin de paradis</span>
                      <span class="text-gray-400 text-xs font-normal">Vous n'avez pas de belles photos sous la main ? Pas de panique, vous pouvez quand même passer à l'étape suivante pour enregistrer votre annonce, et revenir un peu plus tard déposer vos photos.
                      </span>
                    </label>
                    
                    <TUpload @set_uploaded_files="get_uploaded_files" @set_upload_state="get_upload_state" :media="files"/>
                  </div>

                  <div class="flex flex-col space-y-2 pt-2">
                    <label class="block text-xl font-semibold text-gray-700">
                     Titre
                    </label>
                    
                    <TInputError :message="v$.title.$errors[0].$message" v-if="v$.title.$error"/>
                    <TInput placeholder="Un oasis de bien être​,​ à deux pas du centre de Casa." v-model="title"/>
                  </div>
               
                  <div class="flex flex-col space-y-2 pt-2">
                    <label class="block text-xl font-semibold text-gray-700">
                     Description
                    </label>
                    
                    <TInputError :message="v$.description.$errors[0].$message" v-if="v$.description.$error"/>
                    <TTextArea placeholder="Ma piscine est propre et bien entretenue. 4 transats, Une table et quatre chaises sont en place. Il y a aussi un splendide BBQ à gaz pour un supplément de 100 dhs. Un frigo avec des petites glaces ou des snacks sera disponible gratuitement." v-model="description"/>
                  </div>
                
                <div class="space-y-4">
                  <div class="flex flex-col space-y-2 pt-2">
                    <label class="block text-xl font-semibold text-gray-700">
                     Ville
                    </label>
                    <TInputError :message="v$.city.$errors[0].$message" v-if="v$.city.$error"/>
                    <multiselect 
                      :searchable="true"
                      :close-on-select="true"
                      v-model="city"
                      :options="cities" 
                      label="name" track-by="name"
                      name="city" id="city"
                      :selectLabel="'Clique Entrer pour selectionner'"
                      :deselectLabel="'Clique Entrer pour retirer'"
                      :selectedLabel="'Selectionner'"
                      placeholder="Selectionner la ville"
                    >
                    <template v-slot:noResult>
                      Oups! Aucun élément trouvé. Pensez à modifier la requête de recherche.
                    </template>
                    </multiselect>
                    
                  </div>

                  <div class="flex flex-col space-y-2 pt-2">
                    <label class="block text-xl font-semibold text-gray-700">
                    Quelle est l'adresse de votre piscine ?
                    </label>
                    <TInputError :message="v$.address.$errors[0].$message" v-if="v$.address.$error"/>
                    <TTextArea placeholder="9 rue Tilleules, Allée des Corriandres, Villa B,  MAARIF" v-model="address"/>
                  </div>                  
                  

                  <div class="flex flex-col space-y-2 pt-2">
                    <label class="block text-xl font-semibold text-gray-700">
                     Téléphone
                    </label>
                    <TInputError :message="v$.phone.$errors[0].$message" v-if="v$.phone.$error"/>                    
                    <TInput placeholder="06XXXXXXXX" v-model="phone" type="number"/>
                  </div>
                
                  <div class="flex flex-col space-y-2 pt-2">
                    <label class="block text-xl font-semibold text-gray-700">
                     Quel produit utilisez-vous pour l'entretien de votre piscine ?
                    </label>
                    <TInputError :message="v$.cleaning_product.$errors[0].$message" v-if="v$.cleaning_product.$error"/>                    
                    <TInput placeholder="Chlore, Sel, Brome, Autre..." v-model="cleaning_product"/>
                  </div>

                  
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
    
  </div>
  
</template>


<script>
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { computed, onMounted, watchEffect } from '@vue/runtime-dom'
import { reactive, ref, toRefs } from '@vue/reactivity'


import useVuelidate from '@vuelidate/core'
import { required, minLength, minValue, helpers,numeric } from '@vuelidate/validators'

import _extras from '@/assets/js/extras'
import _rules from '@/assets/js/rules'
import cities from '@/assets/js/cities'
import extra_tuto from '@/assets/img/extra_price_tuto.gif'
import congrats from '@/assets/img/congrats.gif'

import { createToast } from 'mosha-vue-toastify'
import Multiselect from 'vue-multiselect'

import {timestamp} from '@/firebase/firebaseInit'

export default {
    name: "CreateAnnouncement",
    components: {Multiselect},
    props:["id"],
    setup(props){
      onMounted(() => document.querySelector('#city').setAttribute('autocomplete','nope')); //tip to disable the autocomplete of multiselect input
      const router = useRouter();
      const store = useStore();
      const files = ref([]); 
      const images_uploaded = ref(false);
      const creation_done = ref(false);
      const disable_for_loading = ref(false);
      
      let announcement = computed(() => store.getters.getAnnouncement);
      
      let form = reactive({
          user_id: "",
          user: {},        
          max_people: 1,
          min_people: 1,
          title:"",
          description: "",
          city:{},
          address:"",
          phone:"",
          half_day_price:null,
          full_day_price:null,
          rules: _rules,
          more_rules: "",
          extras: _extras,
          cleaning_product: "",
          media:null, 
          published:false, 
          created_at: timestamp,          
          updated_at: null
      });

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

      watchEffect(() => {  
        console.log(announcement);
        if(props.id != null &&  announcement.value != "")
        { 
          Object.assign(form , announcement.value);
          console.log(form);
          if(announcement.value.media !=null && Object.keys(announcement.value.media).length > 0){
              announcement.value.media.forEach(media => {
                  let file = {
                      uploadValue : 0,
                      url : media,
                      imageData : null,
                      tmpUrl: media
                  };
                  files.value.push(file);
              });
          }        
          
        }
      });

      // Phone valiation regex source https://regexr.com/399n8
      const phoneValidation = helpers.regex(/^(?:(?:(?:\+|00)212[\s]?(?:[\s]?\(0\)[\s]?)?)|0){1}(?:5[\s.-]?[2-3]|6[\s.-]?[13-9]){1}[0-9]{1}(?:[\s.-]?\d{2}){3}$/);
      const validationRules = computed(() => {
        return {
          rules: 
          [{
            title: { required, }, 
            allowed: { required, }, 
          }],
          max_people: { required, minValue: minValue(1) },
          min_people: { required, minValue: minValue(1) },
          title: { required, minLength:minLength(10) },
          description: { required,  },
          city: { required,  },
          address: { required,  },
          phone: { required, phoneValidation: helpers.withMessage('Invalid phone form', phoneValidation) },
          half_day_price: { required, numeric },
          full_day_price: { numeric },
          extras: 
          [{
            available: { required, },
            label:{ required,  },
            price: { numeric },
            byone: { required, },
          }],
          cleaning_product: { required },

        }
      });

      const v$ = useVuelidate(validationRules, form);

      const publish = () => {
        disable_for_loading.value = true;
        if(store.getters.isAuth){
          form.user_id = store.state.user.user.id;
          form.user = store.state.user.user;
          form.phone = "0611307312";
          form.published = form.media != null && Object.keys(form.media).length > 0;
          store.dispatch('progressbar/start');
          v$.value.$validate();
          if (!v$.value.$error) {

            let continue_without_uploading_images = true;            
            if(!images_uploaded.value){
              continue_without_uploading_images = confirm('Vous n\'avez pas encore finaliser l\'upload de vos images, voulez vous continuer quand même ? ');
            }
            
            if(continue_without_uploading_images){
              let action = 'createAnnouncementAction';
              if(props.id != null){ 
                form.id = props.id;   
                action = 'updateAnnouncementAction'; 
              }
              store.dispatch(action, form).then((response) => {
                if(response.success){
                  if(props.id != null){
                    createToast("L\'annonce à été mise à jour ! 👌", {
                        type: 'success',
                        timeout: 3000,
                        position: 'bottom-left',
                    });
                  }
                  else creation_done.value = true;
                }
                store.dispatch('progressbar/stop');
                disable_for_loading.value = false;
              })
              .catch((error) => {
                console.log(error);
                createToast(error.data, {
                    type: 'danger',
                    timeout: 3000,
                    position: 'bottom-left',
                });
                store.dispatch('progressbar/stop');            
                disable_for_loading.value = false;
              }); 
            }else{
              disable_for_loading.value = false;              
              store.dispatch('progressbar/stop');
            }

                   
          }else{
          // console.log(v$.value.$errors[0].$property);
          // console.log(v$.value.$errors[0].$message);
          createToast('Veuillez verifier les informations saisies 🤓', {
                type: 'warning',
                timeout: 2000,
                position: 'bottom-left',
            });
            store.dispatch('progressbar/stop');          
            disable_for_loading.value = false;       
          }
        }else{
          createToast('Veuillez vous connecter pour pouvoir publier !', {
                type: 'info',
                timeout: 2000,
                position: 'bottom-left',
            });
        }
      }

      const get_uploaded_files = (files) => {
        form.media = files.map((file) => file.url);
      }
      const get_upload_state = (state) => {
        images_uploaded.value = state;
      }
      return { router, cities, extra_tuto, congrats, ...toRefs(form), files, get_uploaded_files, get_upload_state, publish, disable_for_loading, creation_done, v$ }
    }

}
</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>