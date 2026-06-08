<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useI18n()
const localePath = useLocalePath()
const user = useSupabaseUser()
const profiles = useProfiles()

useSeoMeta({
  title: () => `Masbah`,
  robots: 'noindex',
})

// Landing page for OAuth / email-confirmation redirects. @nuxtjs/supabase
// exchanges the code/hash for a session automatically; we wait briefly for
// `user` to populate, then route onward.
let resolved = false
async function route(): Promise<void> {
  if (resolved) return
  resolved = true

  if (!user.value) {
    await navigateTo(localePath('/login'))
    return
  }

  // Send users with an incomplete profile (no full_name yet) through onboarding.
  let needsOnboarding = true
  try {
    const { data } = await profiles.selectFullName(user.value.id)
    const fullName = data?.full_name
    needsOnboarding = !fullName || fullName.trim() === ''
  } catch {
    // If the lookup fails, fall back to home rather than trapping the user.
    needsOnboarding = false
  }

  await navigateTo(localePath(needsOnboarding ? '/onboarding' : '/'))
}

onMounted(() => {
  if (user.value) {
    route()
    return
  }
  // Give the session a moment to settle, then resolve regardless.
  const stop = watch(
    user,
    (u) => {
      if (u) {
        stop()
        route()
      }
    },
    { immediate: false }
  )
  setTimeout(() => {
    stop()
    route()
  }, 2500)
})
</script>

<template>
  <AuthCard>
    <div class="confirm">
      <svg class="spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="var(--line-strong)" stroke-width="2.4" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="var(--aqua-700)"
          stroke-width="2.4"
          stroke-linecap="round"
        />
      </svg>
      <p class="muted t-body">{{ t('auth.confirm.loading') }}</p>
    </div>
  </AuthCard>
</template>

<style scoped>
.confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 0;
  text-align: center;
}
.spin {
  width: 40px;
  height: 40px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spin {
    animation-duration: 1.6s;
  }
}
</style>
