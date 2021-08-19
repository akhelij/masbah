<template>
    <div class="sm:flex sm:space-x-3 space-y-2 sm:space-y-0 text-sm sm:text-base">
      <TSecondaryButton @click.native="socialAuthAction('google')" class="flex space-x-2 items-center justify-center w-full sm:w-max">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
          width="24" height="24"
          class="fill-current transform scale-75"
        >
          <path
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          />
        </svg>
        <span>Se connecter avec Google</span>
      </TSecondaryButton>

      <TSecondaryButton @click.native="socialAuthAction('facebook')" class="flex space-x-2 items-center  justify-center w-full  sm:w-max" >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" class="fill-current transform scale-75">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/>
        </svg>
        <span>Se connecter avec Facebook</span>
      </TSecondaryButton>
    </div>
</template>

<script>
import { inject } from '@vue/runtime-core'
import { useStore } from 'vuex'
import { createToast } from 'mosha-vue-toastify'
export default {
    name: 'AuthSocial',
    setup() {
        const store = useStore()
        const emitter = inject('$emitter')

        const socialAuthAction = (provider) => {
            store.dispatch('progressbar/start')
            store
                .dispatch('socialAuthAction', provider)
                .then(() => {
                    emitter.emit('hideModal', 'SignInModal')
                    emitter.emit('hideModal', 'RegisterModal')
                    createToast('🥳 Bon retour parmis nous !', {
                        type: 'success',
                        timeout: 2000, 
                        position: 'bottom-left'
                    })

                    store.dispatch('progressbar/stop')
                })
                .catch((error) => {
                    console.log(error)
                    store.dispatch('progressbar/stop')
                })
        }

       
        return { socialAuthAction }
    },
}
</script>

<style>
</style>