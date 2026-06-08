/**
 * Cancel one of the signed-in renter's booking requests (pending or accepted).
 *
 * Delegates to the SECURITY DEFINER `cancel_booking(p_request_id)` RPC
 * (migration 0005), which authorises on `renter_id = auth.uid()`, flips the
 * status to `cancelled_by_renter` and notifies the owner. No status UPDATE
 * policy is granted on the table, so this RPC is the only cancel path.
 */

// The generated Database type is a placeholder, so `supabase.rpc(...)` resolves
// to an `undefined`-args signature. Re-type just the one RPC we call (mirrors
// the casting approach in the data composables / pool detail page).
type CancelResult = Promise<{ error: { message: string } | null }>
type CancelRpc = (
  // eslint-disable-next-line no-unused-vars
  fn: 'cancel_booking',
  // eslint-disable-next-line no-unused-vars
  args: { p_request_id: string }
) => CancelResult

export function useCancelBooking() {
  const supabase = useSupabaseClient()
  const callCancel = supabase.rpc.bind(supabase) as unknown as CancelRpc
  const user = useSupabaseUser()

  const pending = ref(false)
  const error = ref<string | null>(null)

  /**
   * Cancel `requestId`. Resolves to true on success, false on failure (with a
   * friendly i18n key set on `error`).
   */
  async function cancel(requestId: string): Promise<boolean> {
    // Truthy guard only — do NOT read user.value.id here (unreliable).
    if (!user.value) {
      error.value = 'bookings.cancel.error'
      return false
    }

    pending.value = true
    error.value = null
    try {
      const { error: rpcErr } = await callCancel('cancel_booking', { p_request_id: requestId })
      if (rpcErr) {
        error.value = 'bookings.cancel.error'
        return false
      }
      return true
    } finally {
      pending.value = false
    }
  }

  return { cancel, pending, error }
}
