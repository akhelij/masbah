// Thin helpers around the Supabase auth + profile calls used by the auth pages.
// Each helper exposes shared `loading` / `errorMessage` refs and maps Supabase
// errors to friendly FR/AR copy via the auth.errors.* i18n keys.
//
// The Google provider is intentionally NOT enabled in Supabase yet — the OAuth
// helper still fires the call but callers should surface auth.errors.googleSoon
// when it rejects (see login.vue / signup.vue).
//
// `OAuthProvider` is a local narrowing of supabase-js's `Provider` union
// (that package isn't directly resolvable from app code under pnpm) covering
// only the providers Masbah uses.
type OAuthProvider = 'google'

type AuthErrorKey =
  | 'invalidCredentials'
  | 'emailTaken'
  | 'weakPassword'
  | 'emailInvalid'
  | 'emailNotConfirmed'
  | 'rateLimited'
  | 'samePassword'
  | 'googleSoon'
  | 'generic'

interface AuthResult {
  ok: boolean
  /** Set on sign-up when Supabase email confirmation is required. */
  needsConfirmation?: boolean
}

/**
 * Map a raw Supabase auth error into one of our translation keys. Supabase
 * surfaces a stable `code` on newer versions and a human message otherwise.
 */
function mapAuthError(
  err: { message?: string; code?: string; status?: number } | null
): AuthErrorKey {
  if (!err) return 'generic'
  const code = err.code ?? ''
  const msg = (err.message ?? '').toLowerCase()

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'invalidCredentials'
  }
  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    msg.includes('already registered') ||
    msg.includes('already been registered')
  ) {
    return 'emailTaken'
  }
  if (
    code === 'weak_password' ||
    msg.includes('password should be at least') ||
    msg.includes('weak password')
  ) {
    return 'weakPassword'
  }
  if (
    code === 'email_address_invalid' ||
    msg.includes('unable to validate email') ||
    msg.includes('invalid email')
  ) {
    return 'emailInvalid'
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'emailNotConfirmed'
  }
  if (code === 'same_password' || msg.includes('should be different from the old password')) {
    return 'samePassword'
  }
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    err.status === 429 ||
    msg.includes('rate limit')
  ) {
    return 'rateLimited'
  }
  return 'generic'
}

export function useAuthForm() {
  const supabase = useSupabaseClient()
  const { t } = useI18n()
  const runtimeConfig = useRuntimeConfig()

  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  function setError(key: AuthErrorKey): void {
    errorMessage.value = t(`auth.errors.${key}`)
  }

  function reset(): void {
    errorMessage.value = null
  }

  /** Absolute origin for redirect URLs (falls back to configured site URL on SSR). */
  function origin(): string {
    if (import.meta.client) return window.location.origin
    return runtimeConfig.public.siteUrl
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    loading.value = true
    errorMessage.value = null
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(mapAuthError(error))
        return { ok: false }
      }
      return { ok: true }
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string, fullName: string): Promise<AuthResult> {
    loading.value = true
    errorMessage.value = null
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${origin()}/confirm`,
        },
      })
      if (error) {
        setError(mapAuthError(error))
        return { ok: false }
      }
      // When confirmation is required Supabase returns a user with no session,
      // and (to prevent enumeration) an "obfuscated" user for an existing email.
      const needsConfirmation = !data.session
      return { ok: true, needsConfirmation }
    } finally {
      loading.value = false
    }
  }

  async function signInWithProvider(provider: OAuthProvider): Promise<AuthResult> {
    loading.value = true
    errorMessage.value = null
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${origin()}/confirm` },
      })
      if (error) {
        // Google is not yet enabled in Supabase → surface the "coming soon" copy.
        setError(provider === 'google' ? 'googleSoon' : 'generic')
        return { ok: false }
      }
      return { ok: true }
    } catch {
      setError(provider === 'google' ? 'googleSoon' : 'generic')
      return { ok: false }
    } finally {
      loading.value = false
    }
  }

  async function sendPasswordReset(email: string): Promise<AuthResult> {
    loading.value = true
    errorMessage.value = null
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin()}/reset-password`,
      })
      if (error) {
        setError(mapAuthError(error))
        return { ok: false }
      }
      return { ok: true }
    } finally {
      loading.value = false
    }
  }

  async function updatePassword(password: string): Promise<AuthResult> {
    loading.value = true
    errorMessage.value = null
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(mapAuthError(error))
        return { ok: false }
      }
      return { ok: true }
    } finally {
      loading.value = false
    }
  }

  async function signOut(): Promise<void> {
    loading.value = true
    try {
      await supabase.auth.signOut()
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    errorMessage,
    reset,
    signIn,
    signUp,
    signInWithProvider,
    sendPasswordReset,
    updatePassword,
    signOut,
  }
}
