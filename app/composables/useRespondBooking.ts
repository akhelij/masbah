/**
 * Owner response to a received booking request: accept or decline.
 *
 * Delegates to the SECURITY DEFINER RPCs `accept_booking(p_request_id)` and
 * `decline_booking(p_request_id, p_reason)` (migration 0005), which authorise on
 * pool ownership, flip the status, and insert the renter's notification(s)
 * server-side. Accepting also auto-declines conflicting pending requests on the
 * same pool/date. No status UPDATE policy is granted on the table, so these RPCs
 * are the only response path.
 */

// The generated Database type is a placeholder, so `supabase.rpc(...)` resolves
// to an `undefined`-args signature. Re-type just the two RPCs we call (mirrors
// the casting approach in useCancelBooking / the data composables).
type RpcResult = Promise<{ error: { message: string } | null }>
type RespondRpc = {
  // eslint-disable-next-line no-unused-vars
  (fn: 'accept_booking', args: { p_request_id: string }): RpcResult
  // eslint-disable-next-line no-unused-vars
  (fn: 'decline_booking', args: { p_request_id: string; p_reason: string | null }): RpcResult
}

/** Map an accept/decline RPC RAISE message to a friendly FR/AR i18n key. */
function mapRespondError(message: string | null | undefined): string {
  const m = (message ?? '').toLowerCase()
  if (m.includes('not authorized') || m.includes('not authorised')) {
    return 'demandes.errors.notAuthorized'
  }
  if (m.includes('not pending')) return 'demandes.errors.notPending'
  if (m.includes('not found')) return 'demandes.errors.notFound'
  return 'demandes.errors.generic'
}

export function useRespondBooking() {
  const supabase = useSupabaseClient()
  const callRpc = supabase.rpc.bind(supabase) as unknown as RespondRpc
  const user = useSupabaseUser()

  const pending = ref(false)
  const error = ref<string | null>(null)

  /**
   * Accept `requestId`. Resolves to true on success, false on failure (with a
   * friendly i18n key set on `error`). Accepting auto-declines conflicting
   * pending requests on the same pool/date server-side.
   */
  async function accept(requestId: string): Promise<boolean> {
    // Truthy guard only — do NOT read user.value.id here (unreliable).
    if (!user.value) {
      error.value = 'demandes.errors.generic'
      return false
    }
    pending.value = true
    error.value = null
    try {
      const { error: rpcErr } = await callRpc('accept_booking', { p_request_id: requestId })
      if (rpcErr) {
        error.value = mapRespondError(rpcErr.message)
        return false
      }
      return true
    } finally {
      pending.value = false
    }
  }

  /**
   * Decline `requestId` with an optional `reason`. Resolves to true on success,
   * false on failure (with a friendly i18n key set on `error`).
   */
  async function decline(requestId: string, reason?: string | null): Promise<boolean> {
    if (!user.value) {
      error.value = 'demandes.errors.generic'
      return false
    }
    pending.value = true
    error.value = null
    try {
      const trimmed = reason?.trim() ? reason.trim() : null
      const { error: rpcErr } = await callRpc('decline_booking', {
        p_request_id: requestId,
        p_reason: trimmed,
      })
      if (rpcErr) {
        error.value = mapRespondError(rpcErr.message)
        return false
      }
      return true
    } finally {
      pending.value = false
    }
  }

  return { accept, decline, pending, error }
}
