import type { BookingExtra } from '~/composables/useCreateBooking'
import type { City, PoolPhoto, SlotKey } from '~/types/db'

/** A renter's booking_requests status (enum `booking_status`). */
export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled_by_renter'

/** Base-table row we read for the signed-in renter (RLS-scoped to renter_id). */
interface BookingRow {
  id: string
  pool_id: string
  date: string
  slot: SlotKey
  guests: number
  extras: BookingExtra[]
  message: string | null
  total_estimate_mad: number
  status: BookingStatus
  decline_reason: string | null
  responded_at: string | null
  expires_at: string
  created_at: string
}

/** Minimal published-pool projection used to hydrate a booking card. */
interface BookingPoolRow {
  id: string
  title: string
  city_id: string
  neighborhood: string | null
}

/**
 * One row of the renter's "Mes réservations" list: the booking_requests columns
 * we show, plus the resolved pool title, cover image and city name. When the
 * pool is no longer published (or otherwise not readable), the pool fields fall
 * back to null/empty so the card still renders the booking itself.
 */
export interface RenterBookingItem {
  id: string
  poolId: string
  poolTitle: string | null
  coverUrl: string | null
  cityName: string
  neighborhood: string | null
  date: string
  slot: SlotKey
  guests: number
  extras: BookingExtra[]
  message: string | null
  totalEstimateMad: number
  status: BookingStatus
  declineReason: string | null
  respondedAt: string | null
  expiresAt: string
  createdAt: string
}

/**
 * The signed-in renter's booking requests across every status, newest first.
 *
 * RLS scopes `booking_requests` SELECT to `renter_id = auth.uid()`, so we never
 * filter by renter_id (the user ref's id is unreliable in this context — see
 * useOwnerPools / useToggleFavorite). Each row is hydrated with its pool's
 * title, cover photo and city name via the public projection. Returns an empty
 * list when logged out. Keyed on logged-in presence + locale (like useOwnerPools).
 */
export function useRenterBookings() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { locale } = useI18n()

  const key = computed(() => `renter-bookings:${user.value ? 'me' : 'anon'}:${locale.value}`)

  const { data, pending, error, refresh } = useAsyncData<RenterBookingItem[]>(
    key,
    async () => {
      if (!user.value) return []

      // RLS restricts `booking_requests` SELECT to the renter's own rows, so no
      // explicit renter_id filter is needed (and the user ref's id is flaky).
      const { data: bookingsData, error: bookingsErr } = await supabase
        .from('booking_requests')
        .select(
          'id, pool_id, date, slot, guests, extras, message, total_estimate_mad, status, decline_reason, responded_at, expires_at, created_at'
        )
        .order('created_at', { ascending: false })
      if (bookingsErr) throw bookingsErr
      const bookings = (bookingsData ?? []) as unknown as BookingRow[]
      if (bookings.length === 0) return []

      const poolIds = [...new Set(bookings.map((b) => b.pool_id))]

      // Hydrate from the public (published-only) projection + photos + cities.
      const [poolsRes, photosRes] = await Promise.all([
        supabase.from('pools_public').select('id, title, city_id, neighborhood').in('id', poolIds),
        supabase
          .from('pool_photos')
          .select('id, pool_id, storage_path, position, is_cover')
          .in('pool_id', poolIds)
          .order('position', { ascending: true }),
      ])
      if (poolsRes.error) throw poolsRes.error
      if (photosRes.error) throw photosRes.error

      const pools = (poolsRes.data ?? []) as unknown as BookingPoolRow[]
      const photos = (photosRes.data ?? []) as unknown as PoolPhoto[]

      const cityIds = [...new Set(pools.map((p) => p.city_id).filter(Boolean))]
      const citiesRes = cityIds.length
        ? await supabase
            .from('cities')
            .select('id, name_fr, name_ar, slug, region, lat, lng, is_active')
            .in('id', cityIds)
        : { data: [], error: null }
      if (citiesRes.error) throw citiesRes.error
      const cities = (citiesRes.data ?? []) as unknown as City[]

      const poolById = new Map<string, BookingPoolRow>()
      for (const p of pools) poolById.set(p.id, p)

      const coverByPool = new Map<string, string>()
      for (const ph of photos) {
        if (ph.is_cover || ph.position === 0) {
          if (!coverByPool.has(ph.pool_id)) coverByPool.set(ph.pool_id, ph.storage_path)
        }
      }
      for (const ph of photos) {
        if (!coverByPool.has(ph.pool_id)) coverByPool.set(ph.pool_id, ph.storage_path)
      }

      const cityById = new Map<string, City>()
      for (const c of cities) cityById.set(c.id, c)

      const lang = locale.value === 'ar' ? 'ar' : 'fr'

      return bookings.map<RenterBookingItem>((b) => {
        const pool = poolById.get(b.pool_id) ?? null
        const city = pool ? (cityById.get(pool.city_id) ?? null) : null
        return {
          id: b.id,
          poolId: b.pool_id,
          poolTitle: pool?.title ?? null,
          coverUrl: usePoolImageUrl(coverByPool.get(b.pool_id)),
          cityName: city ? (lang === 'ar' ? city.name_ar : city.name_fr) : '',
          neighborhood: pool?.neighborhood ?? null,
          date: b.date,
          slot: b.slot,
          guests: b.guests,
          extras: Array.isArray(b.extras) ? b.extras : [],
          message: b.message,
          totalEstimateMad: b.total_estimate_mad,
          status: b.status,
          declineReason: b.decline_reason,
          respondedAt: b.responded_at,
          expiresAt: b.expires_at,
          createdAt: b.created_at,
        }
      })
    },
    { watch: [user, locale] }
  )

  const bookings = computed<RenterBookingItem[]>(() => data.value ?? [])
  return { bookings, pending, error, refresh }
}
