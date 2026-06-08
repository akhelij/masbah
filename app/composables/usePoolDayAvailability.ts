import type { BlockedDate, SlotKey } from '~/types/db'

/** Shape returned for a pool/date availability lookup. */
export interface DayAvailability {
  /** Whole day blocked via blocked_dates (slot = null). */
  dayBlocked: boolean
  /** Slot keys blocked via blocked_dates for this date. */
  blockedSlots: SlotKey[]
  /**
   * Slot keys occupied by the signed-in user's OR the owner's accepted
   * bookings (booking RLS only exposes those). Other renters' accepted
   * bookings are invisible here — the insert trigger is the source of truth.
   */
  acceptedSlots: SlotKey[]
}

interface BlockedRow {
  slot: SlotKey | null
}
interface AcceptedRow {
  slot: SlotKey
}

/**
 * Fetch the availability signals for one pool on one date:
 *   • blocked_dates (publicly readable) → greyed-out slots,
 *   • accepted booking_requests visible under RLS (renter's own / owner's).
 *
 * Kept intentionally simple: the page greys out blocked/known-taken slots, but
 * the server trigger remains authoritative on submit (it rejects conflicts the
 * client can't see). `date` may be a ref/getter so it re-fetches on change.
 */
export function usePoolDayAvailability(
  poolId: MaybeRefOrGetter<string>,
  date: MaybeRefOrGetter<string | null | undefined>
) {
  const supabase = useSupabaseClient()

  const pid = computed(() => toValue(poolId))
  const day = computed(() => toValue(date) ?? null)

  const { data, pending, error, refresh } = useAsyncData<DayAvailability>(
    () => `day-avail:${pid.value}:${day.value ?? 'none'}`,
    async () => {
      const empty: DayAvailability = { dayBlocked: false, blockedSlots: [], acceptedSlots: [] }
      if (!pid.value || !day.value) return empty

      const [blockedRes, acceptedRes] = await Promise.all([
        supabase
          .from('blocked_dates')
          .select('slot')
          .eq('pool_id', pid.value)
          .eq('date', day.value),
        // RLS-scoped: returns only rows the caller may see (own renter rows or
        // owned-pool rows). No renter_id filter (the user ref id is unreliable).
        supabase
          .from('booking_requests')
          .select('slot')
          .eq('pool_id', pid.value)
          .eq('date', day.value)
          .eq('status', 'accepted'),
      ])
      if (blockedRes.error) throw blockedRes.error
      if (acceptedRes.error) throw acceptedRes.error

      const blocked = (blockedRes.data ?? []) as unknown as BlockedRow[]
      const accepted = (acceptedRes.data ?? []) as unknown as AcceptedRow[]

      return {
        dayBlocked: blocked.some((b) => b.slot === null),
        blockedSlots: blocked.filter((b): b is { slot: SlotKey } => b.slot !== null).map((b) => b.slot),
        acceptedSlots: accepted.map((a) => a.slot),
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
