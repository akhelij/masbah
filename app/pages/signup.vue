<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => `${t('auth.signUp.title')} · Masbah`,
  robots: 'noindex',
})

const { loading, errorMessage, reset, signUp, signInWithProvider } = useAuthForm()

const fullName = ref('')
const email = ref('')
const password = ref('')
const acceptedTerms = ref(false)
const termsError = ref(false)
const submitted = ref(false)

watch([fullName, email, password], reset)
watch(acceptedTerms, (v) => {
  if (v) termsError.value = false
})

const canSubmit = computed(
  () => fullName.value.trim() !== '' && email.value.trim() !== '' && password.value.length >= 8
)

async function onSubmit(): Promise<void> {
  if (!acceptedTerms.value) {
    termsError.value = true
    return
  }
  const result = await signUp(email.value.trim(), password.value, fullName.value.trim())
  if (!result.ok) return

  if (result.needsConfirmation) {
    // Email confirmation is ON → show the "check your email" success state.
    submitted.value = true
    return
  }
  // Session already active (confirmation OFF) → straight to onboarding.
  await navigateTo(localePath('/onboarding'))
}

async function onGoogle(): Promise<void> {
  await signInWithProvider('google')
}
</script>

<template>
  <AuthCard>
    <!-- Success: confirmation email sent -->
    <div v-if="submitted" class="auth-sent">
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
      <h1 class="t-h2">{{ t('auth.signUp.checkEmailTitle') }}</h1>
      <p class="muted t-body sent-body">
        {{ t('auth.signUp.checkEmailBody', { email: email.trim() }) }}
      </p>
      <NuxtLink :to="localePath('/login')" class="btn btn-secondary btn-block sent-action">
        {{ t('auth.signUp.backToSignIn') }}
      </NuxtLink>
    </div>

    <!-- Form -->
    <template v-else>
      <div class="auth-intro">
        <h1 class="t-h2">{{ t('auth.signUp.title') }}</h1>
        <p class="muted t-sm">{{ t('auth.signUp.subtitle') }}</p>
      </div>

      <AuthErrorBanner v-if="errorMessage" :message="errorMessage" class="auth-banner" />

      <form class="auth-form" novalidate @submit.prevent="onSubmit">
        <PInput
          v-model="fullName"
          type="text"
          :label="t('auth.fields.fullName')"
          :placeholder="t('auth.fields.fullNamePlaceholder')"
          autocomplete="name"
          required
        />
        <PInput
          v-model="email"
          type="email"
          inputmode="email"
          :label="t('auth.fields.email')"
          :placeholder="t('auth.fields.emailPlaceholder')"
          autocomplete="email"
          required
        />
        <AuthPasswordField
          v-model="password"
          :label="t('auth.fields.password')"
          :placeholder="t('auth.fields.passwordPlaceholder')"
          :hint="t('auth.fields.passwordHint')"
          autocomplete="new-password"
        />

        <div>
          <PCheckbox v-model="acceptedTerms">
            <i18n-t keypath="auth.signUp.terms" tag="span" class="t-sm" scope="global">
              <template #cgu>
                <NuxtLink :to="localePath('/terms')" class="terms-link" @click.stop>{{
                  t('auth.signUp.termsCgu')
                }}</NuxtLink>
              </template>
              <template #privacy>
                <NuxtLink :to="localePath('/privacy')" class="terms-link" @click.stop>{{
                  t('auth.signUp.termsPrivacy')
                }}</NuxtLink>
              </template>
            </i18n-t>
          </PCheckbox>
          <span v-if="termsError" class="hint-err terms-err">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.01" />
            </svg>
            {{ t('auth.signUp.termsRequired') }}
          </span>
        </div>

        <PButton
          type="submit"
          variant="primary"
          block
          size="lg"
          :loading="loading"
          :disabled="!canSubmit"
        >
          {{ t('auth.signUp.submit') }}
        </PButton>
      </form>

      <div class="auth-or">{{ t('auth.or') }}</div>

      <AuthSocial :loading="loading" @google="onGoogle" />

      <p class="auth-switch t-sm muted">
        {{ t('auth.signUp.hasAccount') }}
        <NuxtLink :to="localePath('/login')" class="btn-link">{{
          t('auth.signUp.signInLink')
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
.terms-link {
  color: var(--aqua-700);
  font-weight: 700;
}
.terms-err {
  margin-top: 0.45rem;
}
.auth-or {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--ink-faint);
  font-size: 0.8rem;
  font-weight: 600;
  margin: 1.1rem 0;
}
.auth-or::before,
.auth-or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
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

/* success state */
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
