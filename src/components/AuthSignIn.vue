<template>
  <div class="shadow p-8 w-full text-left">
    <h2 class="text-3xl font-bold">Se connecter</h2>
    <p class="text-sm mb-5"> 👋 Bon retour parmis nous !</p>
    <AuthSocial />

    <TDivider> Ou </TDivider>

    <form method="POST" @submit.prevent="signIn" class="text-sm sm:text-base">
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
        required
      >
        🔑
      </TInput>

      

      <TButton class="w-full mb-5"> Se connecter </TButton>
      <div class="flex flex-col space-y-3 md:flex-row md:space-y-0 justify-between ">
        
        <span>
          Pas encore inscrit ?
          <a href="" class="text-cyan-600"
            @click.prevent="switchToRegister"
          >
            Créer un compte
          </a>
        </span>
       <a href="#" class="text-cyan-600 float-right right-0" @click="switchToReset">
          Mot de passe oublié ?
        </a>
      </div>
    </form>
  </div>
</template>

<script>
import { reactive } from '@vue/reactivity'
import { useStore } from 'vuex'
import { computed, inject, toRefs } from '@vue/runtime-core'

import useVuelidate from '@vuelidate/core'
import { required, email, minLength } from '@vuelidate/validators'
import { createToast } from 'mosha-vue-toastify'

export default {
    name: 'AuthSignIn',
    setup() {
        const store = useStore()
        const emitter = inject('$emitter')

        const form = reactive({
            email: '',
            password: '',
        })

        const rules = computed(() => {
            return {
                email: { required, email },
                password: { required, minLength: minLength(8) },
            }
        })

        const v$ = useVuelidate(rules, form)

        const signIn = async () => {
            store.dispatch('progressbar/start')
            v$.value.$validate()
            if (!v$.value.$error) {
                await store
                    .dispatch('signInAction', form)
                    .then((response) => {
                        emitter.emit('hideModal', 'SignInModal')
                        createToast('🥳 Bon retour parmis nous !', {
                            type: 'success',
                            timeout: 2000,
                            position: 'bottom-left',
                        })

                        store.dispatch('progressbar/stop')
                    })
                    .catch((error) => {
                        createToast(error.data, {
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

        const switchToRegister = () => {
            emitter.emit('hideModal', 'SignInModal')
            emitter.emit('showModal', 'RegisterModal')
        }
        const switchToReset = () => {
            emitter.emit('hideModal', 'SignInModal')
            emitter.emit('showModal', 'ResetModal')
        }

        return { ...toRefs(form), v$, signIn, switchToRegister, switchToReset }
    },
}
</script>

<style scoped>
</style>
