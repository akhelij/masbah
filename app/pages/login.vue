<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

useSeoMeta({
  title: () => `${t('auth.signIn.title')} · Masbah`,
  robots: 'noindex',
})

const { loading, errorMessage, reset, signIn, signInWithProvider } = useAuthForm()

const email = ref('')
const password = ref('')

// Clear a previous error as soon as the user edits either field.
watch([email, password], reset)

function redirectTarget(): string {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
}

async function onSubmit(): Promise<void> {
  const result = await signIn(email.value.trim(), password.value)
  if (result.ok) {
    await navigateTo(localePath(redirectTarget()))
  }
}

async function onGoogle(): Promise<void> {
  await signInWithProvider('google')
}
</script>

<template>
  <AuthCard>
    <div class="auth-intro">
      <h1 class="t-h2">{{ t('auth.signIn.title') }}</h1>
      <p class="muted t-sm">{{ t('auth.signIn.subtitle') }}</p>
    </div>

    <AuthErrorBanner v-if="errorMessage" :message="errorMessage" class="auth-banner" />

    <form class="auth-form" novalidate @submit.prevent="onSubmit">
      <PInput
        v-model="email"
        type="email"
        inputmode="email"
        :label="t('auth.fields.email')"
        :placeholder="t('auth.fields.emailPlaceholder')"
        autocomplete="email"
        required
      />

      <div>
        <div class="label-row">
          <span class="label">{{ t('auth.fields.password') }}</span>
          <NuxtLink :to="localePath('/reset-password')" class="btn-link-sm">
            {{ t('auth.signIn.forgotPassword') }}
          </NuxtLink>
        </div>
        <AuthPasswordField
          v-model="password"
          :placeholder="t('auth.fields.passwordPlaceholder')"
          autocomplete="current-password"
        />
      </div>

      <PButton type="submit" variant="primary" block size="lg" :loading="loading">
        {{ t('auth.signIn.submit') }}
      </PButton>
    </form>

    <div class="auth-or">{{ t('auth.or') }}</div>

    <AuthSocial :loading="loading" @google="onGoogle" />

    <p class="auth-switch t-sm muted">
      {{ t('auth.signIn.noAccount') }}
      <NuxtLink :to="localePath('/signup')" class="btn-link">{{
        t('auth.signIn.signUpLink')
      }}</NuxtLink>
    </p>
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
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
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
.btn-link-sm {
  color: var(--aqua-700);
  font-weight: 700;
  font-size: 0.8125rem;
  text-decoration: none;
}
.btn-link-sm:hover {
  text-decoration: underline;
}
</style>
