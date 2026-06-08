import type { Amenity, SlotKey } from '~/types/db'

/** One captured extra, stored on `booking_requests.extras` (jsonb). */
export interface BookingExtra {
  key: string
  label_fr: string
  label_ar: string
  price: number
  per_person: boolean
}

export interface CreateBookingInput {
  poolId: string
  date: string
  slot: SlotKey
  guests: number
  extras: BookingExtra[]
  message?: string | null
  totalEstimate: number
}

export interface CreateBookingResult {
  id: string | null
  /** i18n key for a friendly inline message, or null on success. */
  error: string | null
}

interface InsertSelectResult {
  data: { id: string } | null
  error: { message: string } | null
}

// Re-type the (placeholder-Database) client to the narrow insert chain we use,
// mirroring useToggleFavorite / usePoolMutations.
interface BookingInsertRow {
  pool_id: string
  // renter_id is OMITTED — it defaults to auth.uid() at the DB (migration 0010).
  date: string
  slot: SlotKey
  guests: number
  extras: BookingExtra[]
  message: string | null
  total_estimate_mad: number
}
interface BookingInsertQuery {
  from(table: 'booking_requests'): {
    insert(row: BookingInsertRow): {
      select(cols: 'id'): { single(): Promise<InsertSelectResult> }
    }
  }
}

/**
 * Map the validate_booking_request() trigger's RAISE messages (migration 0005)
 * to friendly FR/AR i18n keys. Matching is substring-based and case-insensitive
 * so it survives minor wording changes.
 */
function mapBookingError(message: string | null | undefined): string {
  const m = (message ?? '').toLowerCase()
  if (m.includes('capacity') || m.includes('exceed')) return 'booking.errors.capacity'
  if (m.includes('own pool') || m.includes('owners cannot')) return 'booking.errors.ownPool'
  if (m.includes('today or later') || m.includes('past')) return 'booking.errors.pastDate'
  if (m.includes('too many pending')) return 'booking.errors.tooManyPending'
  // Unique-pending index violation (duplicate request).
  if (m.includes('duplicate') || m.includes('no_dup') || m.includes('unique')) {
    return 'booking.errors.duplicate'
  }
  // "Selected slot is not available" / "This date/slot is not available" /
  // "Pool is not available for booking".
  if (m.includes('not available') || m.includes('slot')) return 'booking.errors.notAvailable'
  if (m.includes('not found')) return 'booking.errors.notAvailable'
  return 'booking.errors.generic'
}

/** Build the persisted `extras` payload from the pool's paid amenities. */
export function toBookingExtras(amenities: Amenity[], selectedKeys: string[]): BookingExtra[] {
  const keep = new Set(selectedKeys)
  return amenities
    .filter((a) => !a.included && a.price > 0 && keep.has(a.key))
    .map((a) => ({
      key: a.key,
      label_fr: a.label_fr,
      label_ar: a.label_ar,
      price: a.price,
      per_person: a.per_person,
    }))
}

/**
 * Submit a booking request. Inserts into `booking_requests` with status
 * defaulting to 'pending' and renter_id defaulting to auth.uid() at the DB —
 * we never pass renter_id (the user ref's id is unreliable in this context).
 */
export function useCreateBooking() {
  const supabase = useSupabaseClient()
  const writeClient = supabase as unknown as BookingInsertQuery
  const user = useSupabaseUser()

  const pending = ref(false)

  async function submit(input: CreateBookingInput): Promise<CreateBookingResult> {
    // Truthy guard only — do NOT read user.value.id here (unreliable).
    if (!user.value) return { id: null, error: 'booking.errors.notAuthenticated' }

    pending.value = true
    try {
      const { data, error } = await writeClient
        .from('booking_requests')
        .insert({
          pool_id: input.poolId,
          date: input.date,
          slot: input.slot,
          guests: Math.max(1, Math.round(input.guests)),
          extras: input.extras,
          message: input.message?.trim() ? input.message.trim() : null,
          total_estimate_mad: Math.max(0, Math.round(input.totalEstimate)),
        })
        .select('id')
        .single()

      if (error) return { id: null, error: mapBookingError(error.message) }
      return { id: data?.id ?? null, error: null }
    } finally {
      pending.value = false
    }
  }

  return { submit, pending }
}
