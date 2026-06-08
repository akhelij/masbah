<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

useSeoMeta({
  title: () => `${t('auth.reset.title')} · Masbah`,
  robots: 'noindex',
})

const {
  loading,
  errorMessage,
  reset: clearError,
  sendPasswordReset,
  updatePassword,
} = useAuthForm()

// Mode is decided by whether we arrive from a recovery link. @nuxtjs/supabase
// processes the URL hash and emits a PASSWORD_RECOVERY auth event; until then
// we show the "enter your email" request form.
const mode = ref<'request' | 'update'>('request')

const email = ref('')
const password = ref('')
const sent = ref(false)
const done = ref(false)

watch([email, password], clearError)

let unsubscribe: (() => void) | null = null
onMounted(() => {
  // If the recovery session is already present on mount, switch to update mode.
  if (user.value) mode.value = 'update'

  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      mode.value = 'update'
    }
  })
  unsubscribe = () => data.subscription.unsubscribe()
})
onBeforeUnmount(() => unsubscribe?.())

async function onRequest(): Promise<void> {
  const result = await sendPasswordReset(email.value.trim())
  if (result.ok) sent.value = true
}

async function onUpdate(): Promise<void> {
  const result = await updatePassword(password.value)
  if (result.ok) {
    done.value = true
    // Brief confirmation, then send them home (now signed in).
    setTimeout(() => navigateTo(localePath('/')), 1500)
  }
}
</script>

<template>
  <AuthCard>
    <!-- ── Request: email sent confirmation ── -->
    <div v-if="mode === 'request' && sent" class="auth-sent">
      <div class="sent-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 5L2 7" />
        </svg>
      </div>
      <h1 class="t-h2">{{ t('auth.reset.sentTitle') }}</h1>
      <p class="muted t-body sent-body">{{ t('auth.reset.sentBody', { email: email.trim() }) }}</p>
      <NuxtLink :to="localePath('/login')" class="btn btn-secondary btn-block sent-action">
        {{ t('auth.reset.backToSignIn') }}
      </NuxtLink>
    </div>

    <!-- ── Update: password changed confirmation ── -->
    <div v-else-if="mode === 'update' && done" class="auth-sent">
      <div class="sent-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 class="t-h2">{{ t('auth.reset.doneTitle') }}</h1>
      <p class="muted t-body sent-body">{{ t('auth.reset.doneBody') }}</p>
    </div>

    <!-- ── Update: choose a new password ── -->
    <template v-else-if="mode === 'update'">
      <div class="auth-intro">
        <h1 class="t-h2">{{ t('auth.reset.newTitle') }}</h1>
        <p class="muted t-sm">{{ t('auth.reset.newSubtitle') }}</p>
      </div>

      <AuthErrorBanner v-if="errorMessage" :message="errorMessage" class="auth-banner" />

      <form class="auth-form" novalidate @submit.prevent="onUpdate">
        <AuthPasswordField
          v-model="password"
          :label="t('auth.fields.newPassword')"
          :placeholder="t('auth.fields.passwordPlaceholder')"
          :hint="t('auth.fields.passwordHint')"
          autocomplete="new-password"
        />
        <PButton
          type="submit"
          variant="primary"
          block
          size="lg"
          :loading="loading"
          :disabled="password.length < 8"
        >
          {{ t('auth.reset.updateSubmit') }}
        </PButton>
      </form>
    </template>

    <!-- ── Request: enter your email ── -->
    <template v-else>
      <div class="auth-intro">
        <h1 class="t-h2">{{ t('auth.reset.title') }}</h1>
        <p class="muted t-sm">{{ t('auth.reset.subtitle') }}</p>
      </div>

      <AuthErrorBanner v-if="errorMessage" :message="errorMessage" class="auth-banner" />

      <form class="auth-form" novalidate @submit.prevent="onRequest">
        <PInput
          v-model="email"
          type="email"
          inputmode="email"
          :label="t('auth.fields.email')"
          :placeholder="t('auth.fields.emailPlaceholder')"
          autocomplete="email"
          required
        />
        <PButton
          type="submit"
          variant="primary"
          block
          size="lg"
          :loading="loading"
          :disabled="email.trim() === ''"
        >
          {{ t('auth.reset.requestSubmit') }}
        </PButton>
      </form>

      <p class="auth-switch t-sm muted">
        <NuxtLink :to="localePath('/login')" class="btn-link">{{
          t('auth.reset.backToSignIn')
        }}</NuxtLink>
      </p>
    </template>
  </AuthCard>
</template>

<style scoped>
.auth-intro {
  margin-bottom: 1.25rem;
}
.auth-intro .t-sm {
  margin-top: 0.3rem;
}
.auth-banner {
  margin-bottom: 1rem;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.auth-switch {
  text-align: center;
  margin-top: 1.25rem;
}
.btn-link {
  background: none;
  border: none;
  color: var(--aqua-700);
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.auth-sent {
  text-align: center;
}
.sent-icon {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--success-soft);
  color: var(--success);
  display: grid;
  place-items: center;
  margin: 0 auto 1rem;
}
.sent-icon svg {
  width: 42px;
  height: 42px;
}
.sent-body {
  max-width: 24rem;
  margin: 0.5rem auto 0;
}
.sent-action {
  margin-top: 1.4rem;
  text-decoration: none;
}
</style>
