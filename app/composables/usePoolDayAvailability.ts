import type { BlockedDate, SlotKey } from '~/types/db'

/** Shape returned for a pool/date availability lookup. */
export interface DayAvailability {
  /** Whole day blocked via blocked_dates (slot = null). */
  dayBlocked: boolean
  /** Slot keys blocked via blocked_dates for this date. */
  blockedSlots: SlotKey[]
  /**
   * Slot keys occupied by ANY accepted booking on this date (sourced from the
   * pool_day_availability SECURITY DEFINER RPC, which sees across renters
   * without exposing their identities). accept_booking also rejects accepting a
   * conflicting slot, so this stays authoritative.
   */
  acceptedSlots: SlotKey[]
}

interface AvailabilityRpcRow {
  day_blocked: boolean
  blocked_slots: SlotKey[] | null
  accepted_slots: SlotKey[] | null
}
// The generated Database type is a placeholder, so `supabase.rpc(...)` resolves
// to an `undefined`-args signature. Re-type just the one RPC we call (mirrors
// useCancelBooking).
type AvailabilityRpc = (
  // eslint-disable-next-line no-unused-vars
  fn: 'pool_day_availability',
  // eslint-disable-next-line no-unused-vars
  args: { p_pool_id: string; p_date: string }
) => Promise<{ data: AvailabilityRpcRow[] | null; error: { message: string } | null }>

/**
 * Fetch the availability signals for one pool on one date via the
 * `pool_day_availability` RPC: whole-day block, blocked slots, and slots taken
 * by ANY accepted booking (cross-renter, identities not exposed).
 *
 * The page greys out blocked/taken slots; accept_booking stays authoritative on
 * the owner side (it refuses to accept an already-taken slot). `date` may be a
 * ref/getter so it re-fetches on change.
 */
export function usePoolDayAvailability(
  poolId: MaybeRefOrGetter<string>,
  date: MaybeRefOrGetter<string | null | undefined>
) {
  const supabase = useSupabaseClient()
  const callAvailability = supabase.rpc.bind(supabase) as unknown as AvailabilityRpc

  const pid = computed(() => toValue(poolId))
  const day = computed(() => toValue(date) ?? null)

  const { data, pending, error, refresh } = useAsyncData<DayAvailability>(
    () => `day-avail:${pid.value}:${day.value ?? 'none'}`,
    async () => {
      const empty: DayAvailability = { dayBlocked: false, blockedSlots: [], acceptedSlots: [] }
      if (!pid.value || !day.value) return empty

      // SECURITY DEFINER RPC (migration 0013): returns the blocked + accepted
      // slots for this pool/date WITHOUT leaking who booked them. Reading the
      // base table directly under RLS would hide OTHER renters' accepted
      // bookings, under-reporting taken slots to a browsing renter.
      const { data: rows, error: rpcErr } = await callAvailability('pool_day_availability', {
        p_pool_id: pid.value,
        p_date: day.value,
      })
      if (rpcErr) throw rpcErr

      const row = rows?.[0]
      if (!row) return empty
      return {
        dayBlocked: !!row.day_blocked,
        blockedSlots: row.blocked_slots ?? [],
        acceptedSlots: row.accepted_slots ?? [],
      }
    },
    { watch: [pid, day] }
  )

  const availability = computed<DayAvailability>(
    () => data.value ?? { dayBlocked: false, blockedSlots: [], acceptedSlots: [] }
  )
  return { availability, pending, error, refresh }
}

/** Map a flat list of BlockedDate to the slot keys blocked for `dateIso`. */
export function blockedSlotsForDate(blocked: BlockedDate[], dateIso: string): SlotKey[] {
  return blocked
    .filter((b): b is BlockedDate & { slot: SlotKey } => b.date === dateIso && b.slot !== null)
    .map((b) => b.slot)
}
