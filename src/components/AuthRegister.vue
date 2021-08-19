<template>
   <div class="shadow p-4 w-full text-left">
    <h2 class="text-3xl font-bold">S'inscrire</h2>
    <p class="text-sm mb-5">
      🙌 En vous inscrivant vous acceptez nos
      <a href="#" class="text-cyan-500">Conditions générales</a>.
    </p>
    <AuthSocial />

    <TDivider> Ou </TDivider>

    <form  method="POST" @submit.prevent="register" class="text-sm sm:text-base">        
        
        <TInputError :message="v$.username.$errors[0].$message" v-if="v$.username.$error"/>     
        <TInput
          placeholder="Nom complet"
          id="username"
          v-model="username"
          type="text"
          name="username"
          required
        >
          🤖
        </TInput>

      <TInputError :message="v$.email.$errors[0].$message" v-if="v$.email.$error"/>
      <TInput
        placeholder="Adresse e-mail"
        id="email"
        v-model="email"
        type="email"
        name="email"
        required
      >
        📧
      </TInput>      
      
      <TInputError :message="v$.password.$errors[0].$message" v-if="v$.password.$error"/>
      <TInput
        placeholder="Mot de passe"
        v-model="password"
        type="password"
        name="password"
      >
        🔑
      </TInput>
      
      <TInputError :message="v$.password_confirmation.$errors[0].$message" v-if="v$.password_confirmation.$error"/>
      <TInput
        placeholder="Confirmer mot de passe"
        id="password_confirmation"
        v-model="password_confirmation"
        type="password"
        name="password_confirmation"
        required
      >
        🔑
      </TInput>

      <p class="text-sm text-gray-400">Comment avez-vous connu notre site ? - Facultatif*</p>
      <TInput
        placeholder="🤔 Bouche à oreille, Réseaux sociaux...."
        id="info"
        v-model="info"
        type="text"
        name="info"
      >
        
      </TInput>
      

      
      <TButton class="w-full my-1"> S'inscrire </TButton>

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
import { computed, inject, toRefs } from '@vue/runtime-core'
import { reactive } from '@vue/reactivity'
import { useStore } from 'vuex'

import useVuelidate from '@vuelidate/core'
import { required, email, minLength, sameAs } from '@vuelidate/validators'
import { createToast } from 'mosha-vue-toastify'

export default {
    name: 'AuthRegister',
    setup() {
        const store = useStore()
        const emitter = inject('$emitter')
        const form = reactive({
            username: '',
            email: '',
            password: '',
            password_confirmation: '',
            info: ''
        })

        const switchToConnect = () => {
            emitter.emit('hideModal', 'RegisterModal')
            emitter.emit('showModal', 'SignInModal')
        }

        const rules = computed(() => {
            return {
                username: { required, minLength: minLength(3) },
                email: { required, email },
                password: { required, minLength: minLength(8) },
                password_confirmation: {
                    required,
                    sameAs: sameAs(form.password),
                },
            }
        })

        const v$ = useVuelidate(rules, form)

        const register = () => {
            store.dispatch('progressbar/start')
            v$.value.$validate()
            if (!v$.value.$error) {
                store
                    .dispatch('registerAction', {
                        username: form.username,
                        email: form.email,
                        password: form.password,
                        info: form.info,
                    })
                    .then((response) => {
                        emitter.emit('hideModal', 'RegisterModal')
                        createToast('🥳 Ravis de vous avoir parmis nous  !', {
                            type: 'success',
                            timeout: 2000,
                            position: 'bottom-left',
                        })
                        store.dispatch('progressbar/stop')
                    })
                    .catch((error) => {
                        createToast("😭 "+error.data, {
                            type: 'danger',
                            timeout: 2000,
                            position: 'bottom-left',
                        })

                        store.dispatch('progressbar/stop')
                    })
            } else {
                createToast('Veuillez verifier les informations saisies 🤓', {
                    type: 'warning',
                    timeout: 2000,
                    position: 'bottom-left',
                })
                store.dispatch('progressbar/stop')
            }
        }

        return { ...toRefs(form), switchToConnect, v$, register }
    },
}
</script>

<style scoped>
</style>
