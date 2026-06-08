<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()
const user = useSupabaseUser()
const profiles = useProfiles()
const runtimeConfig = useRuntimeConfig()

useSeoMeta({
  title: () => `${t('auth.phone.title')} · Masbah`,
  robots: 'noindex',
})

const enabled = computed(() => runtimeConfig.public.phoneVerificationEnabled)

type Step = 'phone' | 'otp' | 'done'
const step = ref<Step>('phone')

const loading = ref(false)
const errorMessage = ref<string | null>(null)

// ── Step 1: phone (Moroccan, E.164 +212, 9 Western digits) ──────────────
const phoneDigits = ref('')
const cleanedPhone = computed(() => phoneDigits.value.replace(/\D/g, '').replace(/^0/, ''))
const phoneValid = computed(() => /^[5-7]\d{8}$/.test(cleanedPhone.value))
const e164 = computed(() => `+212${cleanedPhone.value}`)

function sendCode(): void {
  if (!phoneValid.value) {
    errorMessage.value = t('auth.phone.invalidNumber')
    return
  }
  // ── MOCK ──────────────────────────────────────────────────────────────
  // No real SMS is sent. This is a stub: in dev the OTP `000000` is accepted
  // as valid (see verifyCode). Wire a real provider (Supabase phone auth /
  // Twilio) here when phone verification ships.
  errorMessage.value = null
  step.value = 'otp'
  nextTick(() => otpInputs.value[0]?.focus())
}

// ── Step 2: OTP (6 boxes) ───────────────────────────────────────────────
const otp = ref<string[]>(['', '', '', '', '', ''])
const otpInputs = ref<HTMLInputElement[]>([])
const otpError = ref(false)
const otpValue = computed(() => otp.value.join(''))

function onOtpInput(index: number, event: Event): void {
  const target = event.target as HTMLInputElement
  const digit = target.value.replace(/\D/g, '').slice(0, 1)
  otp.value[index] = digit
  target.value = digit
  otpError.value = false
  if (digit && index < 5) otpInputs.value[index + 1]?.focus()
}

function onOtpKeydown(index: number, event: KeyboardEvent): void {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    otpInputs.value[index - 1]?.focus()
  }
}

function onOtpPaste(event: ClipboardEvent): void {
  event.preventDefault()
  const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < 6; i++) otp.value[i] = digits[i] ?? ''
  const next = Math.min(digits.length, 5)
  otpInputs.value[next]?.focus()
}

async function verifyCode(): Promise<void> {
  if (otpValue.value.length !== 6) {
    otpError.value = true
    return
  }
  // ── MOCK ──────────────────────────────────────────────────────────────
  // Accept the fixed dev code `000000`. A real implementation would call
  // supabase.auth.verifyOtp({ phone, token, type: 'sms' }).
  if (otpValue.value !== '000000') {
    otpError.value = true
    errorMessage.value = t('auth.phone.invalidCode')
    return
  }

  if (!user.value) return
  loading.value = true
  errorMessage.value = null
  try {
    const { error } = await profiles.update(user.value.id, {
      phone: e164.value,
      phone_verified: true,
    })
    if (error) {
      errorMessage.value = t('auth.errors.generic')
      otpError.value = true
      return
    }
    step.value = 'done'
  } finally {
    loading.value = false
  }
}

function editNumber(): void {
  step.value = 'phone'
  otp.value = ['', '', '', '', '', '']
  otpError.value = false
  errorMessage.value = null
}
</script>

<template>
  <AuthCard>
    <!-- Feature not yet enabled -->
    <div v-if="!enabled" class="phone-soon">
      <div class="soon-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M12 18h.01" />
        </svg>
      </div>
      <h1 class="t-h2">{{ t('auth.phone.title') }}</h1>
      <p class="muted t-body sent-body">{{ t('auth.phone.soon') }}</p>
      <NuxtLink :to="localePath('/')" class="btn btn-secondary btn-block sent-action">
        {{ t('auth.phone.backHome') }}
      </NuxtLink>
    </div>

    <!-- Done -->
    <div v-else-if="step === 'done'" class="auth-sent">
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
      <h1 class="t-h2">{{ t('auth.phone.doneTitle') }}</h1>
      <p class="muted t-body sent-body">{{ t('auth.phone.doneBody') }}</p>
      <NuxtLink :to="localePath('/')" class="btn btn-primary btn-block sent-action">
        {{ t('auth.phone.backHome') }}
      </NuxtLink>
    </div>

    <!-- Step 2: OTP -->
    <template v-else-if="step === 'otp'">
      <div class="auth-intro">
        <h1 class="t-h2">{{ t('auth.phone.otpTitle') }}</h1>
        <p class="muted t-body">
          {{ t('auth.phone.otpSubtitle', { phone: e164 }) }}
          <button type="button" class="btn-link-sm" @click="editNumber">
            {{ t('auth.phone.edit') }}
          </button>
        </p>
      </div>

      <AuthErrorBanner v-if="errorMessage" :message="errorMessage" class="auth-banner" />

      <div class="otp" :class="{ err: otpError }">
        <input
          v-for="(_, i) in otp"
          :key="i"
          ref="otpInputs"
          type="text"
          inputmode="numeric"
          maxlength="1"
          :class="{ filled: otp[i] }"
          :value="otp[i]"
          :aria-label="t('auth.phone.digitLabel', { n: i + 1 })"
          @input="onOtpInput(i, $event)"
          @keydown="onOtpKeydown(i, $event)"
          @paste="onOtpPaste"
        >
      </div>

      <p class="dev-hint t-sm">{{ t('auth.phone.devHint') }}</p>

      <PButton
        variant="primary"
        block
        size="lg"
        :loading="loading"
        class="otp-submit"
        @click="verifyCode"
      >
        {{ t('auth.phone.verify') }}
      </PButton>
    </template>

    <!-- Step 1: phone -->
    <template v-else>
      <div class="auth-intro">
        <h1 class="t-h2">{{ t('auth.phone.title') }}</h1>
        <p class="muted t-body">{{ t('auth.phone.subtitle') }}</p>
      </div>

      <AuthErrorBanner v-if="errorMessage" :message="errorMessage" class="auth-banner" />

      <form class="auth-form" novalidate @submit.prevent="sendCode">
        <div class="field">
          <span class="label">{{ t('auth.phone.numberLabel') }}</span>
          <div class="phone-in">
            <span class="pre">🇲🇦 +212</span>
            <input
              v-model="phoneDigits"
              class="input"
              type="tel"
              inputmode="numeric"
              :placeholder="t('auth.phone.numberPlaceholder')"
              autocomplete="tel-national"
            >
          </div>
          <span class="hint">{{ t('auth.phone.numberHint') }}</span>
        </div>

        <PButton type="submit" variant="primary" block size="lg" :disabled="!phoneValid">
          {{ t('auth.phone.sendCode') }}
        </PButton>
      </form>

      <div class="trust-note">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        {{ t('auth.phone.privacy') }}
      </div>
    </template>
  </AuthCard>
</template>

<style scoped>
.auth-intro {
  margin-bottom: 1.25rem;
}
.auth-intro .t-body {
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
.phone-in {
  display: flex;
  gap: 0.5rem;
}
.phone-in .pre {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.8rem;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--r-md);
  font-weight: 700;
  background: var(--sand-2);
  white-space: nowrap;
}
.phone-in .input {
  flex: 1;
}
.trust-note {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  background: var(--aqua-50);
  border-radius: var(--r-lg);
  padding: 0.7rem 0.85rem;
  color: var(--aqua-800);
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 1rem;
}
.trust-note svg {
  width: 18px;
  height: 18px;
  flex: none;
}

/* OTP */
.otp {
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}
.otp input {
  width: 100%;
  aspect-ratio: 1;
  max-width: 50px;
  text-align: center;
  font-size: 1.4rem;
  font-weight: 800;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--r-md);
  color: var(--ink);
  background: #fff;
}
.otp input:focus {
  outline: none;
  border-color: var(--aqua-500);
  box-shadow: var(--focus);
}
.otp input.filled {
  border-color: var(--aqua-500);
  background: var(--aqua-50);
}
.otp.err input {
  border-color: var(--danger);
  background: var(--danger-soft);
}
.dev-hint {
  color: var(--ink-faint);
  text-align: center;
  margin-top: 0.9rem;
}
.otp-submit {
  margin-top: 0.6rem;
}
.btn-link-sm {
  background: none;
  border: none;
  color: var(--aqua-700);
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  font-size: inherit;
}
.btn-link-sm:hover {
  text-decoration: underline;
}

/* shared success / soon */
.auth-sent,
.phone-soon {
  text-align: center;
}
.sent-icon,
.soon-icon {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto 1rem;
}
.sent-icon {
  background: var(--success-soft);
  color: var(--success);
}
.soon-icon {
  background: var(--aqua-50);
  color: var(--aqua-700);
}
.sent-icon svg,
.soon-icon svg {
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
