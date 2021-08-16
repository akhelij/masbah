<template>
    
   <div class="shadow p-8 w-full text-left">
    <h2 class="text-3xl font-bold mb-5">Récuperer votre mot de passe</h2>
    <p class="text-sm mb-5">Mot de passe oublié ? Aucun problème. Faites-nous simplement savoir votre adresse e-mail et nous vous enverrons par e-mail un lien de réinitialisation du mot de passe qui vous permettra d'en choisir un nouveau.</p>
    <form  method="POST" @submit.prevent="reset" class="text-sm sm:text-base">        
        
        
      <TInputError :message="v$.email.$errors[0].$message" v-if="v$.email.$error"/>
      <TInput
        placeholder="Adresse e-mail"
        id="email"
        v-model="email"
        type="text"
        name="email"
      >
        📧
      </TInput>      
      

      <TButton class="w-full"> Envoyer </TButton>

      <p>
        Déjà membre ?
        <a href="" class="text-cyan-500" @click.prevent="switchToConnect">
          Se connecter
        </a>
      </p>
    </form>
  </div>
</template>

<script>
import { computed, inject, reactive, toRefs } from '@vue/runtime-core'
import { useStore } from 'vuex'

import useVuelidate from '@vuelidate/core'
import { required, email, } from '@vuelidate/validators'
import { createToast } from 'mosha-vue-toastify'

export default {
    name: 'AuthReset',
    setup() {
        const store = useStore();
        const emitter = inject('$emitter');
        const form = reactive({
          email: ""
        });

        const switchToConnect = () => {
            emitter.emit('hideModal', 'ResetModal');
            emitter.emit('showModal', 'SignInModal');
        }

        const rules = computed(() => {
            return {
                email: { required, email },                
            }
        })

        const v$ = useVuelidate(rules, form)

        const reset = () => {
            store.dispatch('progressbar/start')
            v$.value.$validate()
            if (!v$.value.$error) {
                store
                    .dispatch('resetPasswordAction', form.email)
                    .then((response) => {
                        emitter.emit('hideModal', 'ResetModal');
                        createToast('🥳 Un Email vous à été envoyé !', {
                            type: 'success',
                            timeout: 2000, 
position: 'bottom-left'
                        })
                        store.dispatch('progressbar/stop')

                    })
                    .catch((error) => {
                        createToast("😭 Erreur inattendu, veuillez nous raconter ce qui c'est passé, dans la bulle en bas", {
                            type: 'danger',
                            timeout: 2000, 
position: 'bottom-left'
                        })

                        store.dispatch('progressbar/stop')
                    })
            }else{
              createToast("Veuillez verifier les informations saisies 🤓", {
                            type: 'warning',
                            timeout: 2000, 
position: 'bottom-left'
                        });
              store.dispatch('progressbar/stop')
            }            
        }

        return { switchToConnect, ...toRefs(form), v$, reset }
    },
}
</script>

<style scoped>
</style>
