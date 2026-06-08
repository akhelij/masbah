// Global, useState-backed controller for the contextual auth sheet (S9).
//
// Usage from anywhere:
//   const { requireAuth } = useAuthGate()
//   requireAuth('booking', () => proceedWithBooking())
//
// If the visitor is signed in, the callback runs immediately. Otherwise the
// AuthSheet opens with a reason-specific header, and the pending callback runs
// once the user becomes authenticated (handled by AuthGateHost watching `user`).
//
// AuthGateHost.vue must be mounted ONCE near the app root (see component doc).

export type AuthGateReason = 'booking' | 'favorite' | 'publish' | 'message' | 'default'

interface AuthGateState {
  open: boolean
  reason: AuthGateReason
}

export function useAuthGate() {
  const user = useSupabaseUser()

  const state = useState<AuthGateState>('auth-gate', () => ({
    open: false,
    reason: 'default',
  }))

  // Pending action to resume after a successful sign-in. Kept out of useState
  // (functions aren't serialisable) — module-scoped per request is fine since
  // the gate is only ever driven on the client.
  const pendingAction = useState<{ run: (() => void) | null }>('auth-gate-pending', () => ({
    run: null,
  }))

  function open(reason: AuthGateReason = 'default'): void {
    state.value.reason = reason
    state.value.open = true
  }

  function close(): void {
    state.value.open = false
    pendingAction.value.run = null
  }

  function requireAuth(reason: AuthGateReason, cb?: () => void): void {
    if (user.value) {
      cb?.()
      return
    }
    pendingAction.value.run = cb ?? null
    open(reason)
  }

  // Called by AuthGateHost when `user` transitions to authenticated while the
  // gate is open, to resume the deferred action and dismiss the sheet.
  function resolvePending(): void {
    const action = pendingAction.value.run
    pendingAction.value.run = null
    state.value.open = false
    action?.()
  }

  return {
    state,
    open,
    close,
    requireAuth,
    resolvePending,
  }
}
