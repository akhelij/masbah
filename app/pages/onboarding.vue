<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'auth' })

const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const user = useSupabaseUser()
const profiles = useProfiles()

useSeoMeta({
  title: () => `${t('auth.onboarding.title')} · Masbah`,
  robots: 'noindex',
})

const loading = ref(false)
const errorMessage = ref<string | null>(null)

// Prefill full_name from the OAuth/sign-up metadata, language from the active UI.
const metaName = computed(() => {
  const meta = user.value?.user_metadata as { full_name?: string; name?: string } | undefined
  return meta?.full_name ?? meta?.name ?? ''
})

const fullName = ref('')
const preferredLang = ref<'fr' | 'ar'>('fr')

watch(
  user,
  () => {
    if (fullName.value === '') fullName.value = metaName.value
  },
  { immediate: true }
)
onMounted(() => {
  preferredLang.value = locale.value === 'ar' ? 'ar' : 'fr'
})

// Initials avatar (no upload — avatars need their own bucket which doesn't exist).
const initials = computed(() => {
  const name = fullName.value.trim()
  if (!name) return '🙂'
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
})

async function persist(updates: {
  full_name?: string
  preferred_lang?: 'fr' | 'ar'
}): Promise<boolean> {
  if (!user.value) return false
  loading.value = true
  errorMessage.value = null
  try {
    const { error } = await profiles.update(user.value.id, updates)
    if (error) {
      errorMessage.value = t('auth.errors.generic')
      return false
    }
    return true
  } finally {
    loading.value = false
  }
}

async function onSubmit(): Promise<void> {
  const ok = await persist({
    full_name: fullName.value.trim(),
    preferred_lang: preferredLang.value,
  })
  if (!ok) return
  // Reflect the chosen language in the UI before leaving.
  if (preferredLang.value !== locale.value) await setLocale(preferredLang.value)
  await navigateTo(localePath('/'))
}

async function onSkip(): Promise<void> {
  // Still capture the name if it was prefilled, but don't block on errors.
  if (fullName.value.trim()) await persist({ full_name: fullName.value.trim() })
  await navigateTo(localePath('/'))
}

const canSubmit = computed(() => fullName.value.trim() !== '')
</script>

<template>
  <AuthCard>
    <div class="auth-intro">
      <h1 class="t-h2">{{ t('auth.onboarding.title') }}</h1>
      <p class="muted t-sm">{{ t('auth.onboarding.subtitle') }}</p>
    </div>

    <div class="avatar-preview">
      <span class="avatar onboarding-avatar" aria-hidden="true">{{ initials }}</span>
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

      <div class="field">
        <span class="label">{{ t('auth.onboarding.languageLabel') }}</span>
        <div class="lang-chips">
          <button
            type="button"
            class="chip"
            :class="{ 'is-on': preferredLang === 'fr' }"
            :aria-pressed="preferredLang === 'fr'"
            @click="preferredLang = 'fr'"
          >
            <svg
              class="chk"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="m5 12 5 5L20 6" />
            </svg>
            Français
          </button>
          <button
            type="button"
            class="chip ar"
            :class="{ 'is-on': preferredLang === 'ar' }"
            :aria-pressed="preferredLang === 'ar'"
            @click="preferredLang = 'ar'"
          >
            <svg
              class="chk"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="m5 12 5 5L20 6" />
            </svg>
            العربية
          </button>
        </div>
      </div>

      <PButton
        type="submit"
        variant="primary"
        block
        size="lg"
        :loading="loading"
        :disabled="!canSubmit"
      >
        {{ t('auth.onboarding.submit') }}
      </PButton>
      <PButton type="button" variant="ghost" block :disabled="loading" @click="onSkip">
        {{ t('auth.onboarding.skip') }}
      </PButton>
    </form>
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
.avatar-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 1.25rem;
}
.onboarding-avatar {
  width: 72px;
  height: 72px;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #22d3ee, #0e7490);
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.lang-chips {
  display: flex;
  gap: 0.6rem;
}
.lang-chips .chip {
  flex: 1;
  justify-content: center;
  min-height: 48px;
}
</style>
