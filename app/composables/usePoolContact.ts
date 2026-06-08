/**
 * Reveal a pool's private contact details (exact address, coordinates, owner
 * phone + name) AFTER the renter's booking has been accepted.
 *
 * Delegates to the SECURITY DEFINER `get_pool_contact(p_pool_id)` RPC
 * (migration 0005), which raises "Not authorized to view contact details"
 * unless the caller owns the pool or has an accepted booking on it. We treat
 * that error as "locked" (return null + set the `locked` flag) rather than a
 * hard failure, so the UI can show the "unlocks after acceptance" message.
 */

/** Resolved private contact for an accepted booking. */
export interface PoolContact {
  address: string | null
  lat: number | null
  lng: number | null
  ownerPhone: string | null
  ownerName: string | null
}

// The RPC returns a table; supabase-js gives back an array of rows. The
// generated Database type is a placeholder, so re-type just this one call.
interface ContactRpcRow {
  address: string | null
  lat: number | null
  lng: number | null
  owner_phone: string | null
  owner_name: string | null
}
type ContactResult = Promise<{
  data: ContactRpcRow[] | null
  error: { message: string } | null
}>
type ContactRpc = (
  // eslint-disable-next-line no-unused-vars
  fn: 'get_pool_contact',
  // eslint-disable-next-line no-unused-vars
  args: { p_pool_id: string }
) => ContactResult

export function usePoolContact() {
  const supabase = useSupabaseClient()
  const callContact = supabase.rpc.bind(supabase) as unknown as ContactRpc

  const pending = ref(false)
  /** True when the RPC denied access (not yet accepted) — show the locked hint. */
  const locked = ref(false)
  /** True on an unexpected (non-authorization) failure. */
  const error = ref(false)

  /**
   * Fetch the contact for `poolId`. Returns the contact on success, or null
   * when access is denied (sets `locked`) or the call fails (sets `error`).
   */
  async function reveal(poolId: string): Promise<PoolContact | null> {
    pending.value = true
    locked.value = false
    error.value = false
    try {
      const { data, error: rpcErr } = await callContact('get_pool_contact', { p_pool_id: poolId })
      if (rpcErr) {
        // "Not authorized to view contact details" → locked until acceptance.
        if (/not authorized/i.test(rpcErr.message)) locked.value = true
        else error.value = true
        return null
      }
      const row = data?.[0]
      if (!row) {
        error.value = true
        return null
      }
      return {
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        ownerPhone: row.owner_phone,
        ownerName: row.owner_name,
      }
    } finally {
      pending.value = false
    }
  }

  return { reveal, pending, locked, error }
}
