<script setup lang="ts">
// Contextual auth sheet (S9). A bottom-sheet with a reason-specific header that
// nudges the visitor to sign in to complete an action (book / favorite / publish
// / message), offering Google + a link to the full email sign-in/up pages.
import type { AuthGateReason } from '~/composables/useAuthGate'

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    reason?: AuthGateReason
  }>(),
  {
    reason: 'default',
  }
)

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const { errorMessage, signInWithProvider } = useAuthForm()

const heading = computed(() => t(`auth.gate.${props.reason}.title`))
const subtitle = computed(() => t(`auth.gate.${props.reason}.subtitle`))

// Preserve where the user is so they return after authenticating on the pages.
const redirectQuery = computed(() => ({ redirect: route.fullPath }))

async function onGoogle(): Promise<void> {
  await signInWithProvider('google')
}

function go(): void {
  // Closing first avoids the sheet lingering over the navigation.
  open.value = false
}
</script>

<template>
  <PSheet v-model:open="open" :label-close="t('common.close')">
    <template #header>
      <h2 class="t-h3 sheet-title">{{ heading }}</h2>
    </template>

    <div class="gate">
      <p class="muted t-body gate-sub">{{ subtitle }}</p>

      <AuthErrorBanner v-if="errorMessage" :message="errorMessage" class="gate-banner" />

      <div class="gate-actions">
        <AuthSocial @google="onGoogle" />
        <div class="gate-or">{{ t('auth.or') }}</div>
        <NuxtLink
          :to="{ path: localePath('/login'), query: redirectQuery }"
          class="btn btn-primary btn-block"
          @click="go"
        >
          {{ t('auth.gate.signIn') }}
        </NuxtLink>
        <NuxtLink
          :to="{ path: localePath('/signup'), query: redirectQuery }"
          class="btn btn-secondary btn-block"
          @click="go"
        >
          {{ t('auth.gate.signUp') }}
        </NuxtLink>
      </div>

      <div class="reassure">
        <span>
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
          {{ t('auth.gate.free') }}
        </span>
        <span>
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
          {{ t('auth.gate.cashOnPlace') }}
        </span>
      </div>
    </div>
  </PSheet>
</template>

<style scoped>
.sheet-title {
  flex: 1;
  min-width: 0;
}
.gate {
  padding-bottom: 0.5rem;
}
.gate-sub {
  margin-bottom: 1.1rem;
}
.gate-banner {
  margin-bottom: 1rem;
}
.gate-actions {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.gate-or {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--ink-faint);
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0.2rem 0;
}
.gate-or::before,
.gate-or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}
.reassure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--ink-muted);
  font-size: 0.82rem;
  font-weight: 600;
  flex-wrap: wrap;
  margin-top: 1.2rem;
}
.reassure span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.reassure svg {
  width: 15px;
  height: 15px;
  color: var(--success);
}
</style>
