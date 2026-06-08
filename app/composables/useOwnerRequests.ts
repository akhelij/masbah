import type { BookingExtra } from '~/composables/useCreateBooking'
import type { BookingStatus } from '~/composables/useRenterBookings'
import type { City, PoolPhoto, ProfilePublic, SlotKey } from '~/types/db'

/** Base-table `booking_requests` row read for the owner (RLS-scoped via pool ownership). */
interface OwnerRequestRow {
  id: string
  pool_id: string
  renter_id: string
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

/** Minimal owner-pool projection used to hydrate a request card. */
interface OwnerRequestPoolRow {
  id: string
  title: string
  city_id: string
  neighborhood: string | null
}

/**
 * One booking request received on the owner's pools, hydrated with the pool
 * (title, cover, city) and the public profile of the renter who made it.
 */
export interface OwnerRequestItem {
  id: string
  poolId: string
  poolTitle: string | null
  coverUrl: string | null
  cityName: string
  neighborhood: string | null
  /** Public renter profile (full_name, avatar_url, phone_verified) or null. */
  renter: ProfilePublic | null
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
 * The booking requests RECEIVED on the signed-in owner's pools, newest first.
 *
 * The user ref's id is unreliable in this context (see useOwnerPools), so we do
 * NOT filter by owner id. Instead we read the owner's pools first (the `pools`
 * RLS policy grants SELECT only on own rows), then fetch `booking_requests`
 * scoped to those pool ids. Each row is hydrated with its pool (title, cover,
 * city) and the renter's public profile. Returns an empty list when logged out.
 * Keyed on logged-in presence + locale (like useOwnerPools / useRenterBookings).
 */
export function useOwnerRequests() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { locale } = useI18n()

  const key = computed(() => `owner-requests:${user.value ? 'me' : 'anon'}:${locale.value}`)

  const { data, pending, error, refresh } = useAsyncData<OwnerRequestItem[]>(
    key,
    async () => {
      if (!user.value) return []

      // RLS restricts `pools` SELECT to the authenticated owner's own rows, so
      // these are exactly the owner's pool ids (no owner_id filter needed).
      const { data: poolsData, error: poolsErr } = await supabase
        .from('pools')
        .select('id, title, city_id, neighborhood')
      if (poolsErr) throw poolsErr
      const pools = (poolsData ?? []) as unknown as OwnerRequestPoolRow[]
      if (pools.length === 0) return []

      const poolIds = pools.map((p) => p.id)

      // Requests on the owner's pools. The owner RLS policy on booking_requests
      // (`pool_is_owned(pool_id)`) authorises these reads.
      const { data: reqData, error: reqErr } = await supabase
        .from('booking_requests')
        .select(
          'id, pool_id, renter_id, date, slot, guests, extras, message, total_estimate_mad, status, decline_reason, responded_at, expires_at, created_at'
        )
        .in('pool_id', poolIds)
        .order('created_at', { ascending: false })
      if (reqErr) throw reqErr
      const requests = (reqData ?? []) as unknown as OwnerRequestRow[]
      if (requests.length === 0) return []

      const renterIds = [...new Set(requests.map((r) => r.renter_id))]
      const cityIds = [...new Set(pools.map((p) => p.city_id).filter(Boolean))]

      const [photosRes, citiesRes, rentersRes] = await Promise.all([
        supabase
          .from('pool_photos')
          .select('id, pool_id, storage_path, position, is_cover')
          .in('pool_id', poolIds)
          .order('position', { ascending: true }),
        cityIds.length
          ? supabase
              .from('cities')
              .select('id, name_fr, name_ar, slug, region, lat, lng, is_active')
              .in('id', cityIds)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('profiles_public')
          .select('id, full_name, avatar_url, phone_verified, created_at')
          .in('id', renterIds),
      ])
      if (photosRes.error) throw photosRes.error
      if (citiesRes.error) throw citiesRes.error
      if (rentersRes.error) throw rentersRes.error

      const photos = (photosRes.data ?? []) as unknown as PoolPhoto[]
      const cities = (citiesRes.data ?? []) as unknown as City[]
      const renters = (rentersRes.data ?? []) as unknown as ProfilePublic[]

      const poolById = new Map<string, OwnerRequestPoolRow>()
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

      const renterById = new Map<string, ProfilePublic>()
      for (const r of renters) renterById.set(r.id, r)

      const lang = locale.value === 'ar' ? 'ar' : 'fr'

      return requests.map<OwnerRequestItem>((r) => {
        const pool = poolById.get(r.pool_id) ?? null
        const city = pool ? (cityById.get(pool.city_id) ?? null) : null
        return {
          id: r.id,
          poolId: r.pool_id,
          poolTitle: pool?.title ?? null,
          coverUrl: usePoolImageUrl(coverByPool.get(r.pool_id)),
          cityName: city ? (lang === 'ar' ? city.name_ar : city.name_fr) : '',
          neighborhood: pool?.neighborhood ?? null,
          renter: renterById.get(r.renter_id) ?? null,
          date: r.date,
          slot: r.slot,
          guests: r.guests,
          extras: Array.isArray(r.extras) ? r.extras : [],
          message: r.message,
          totalEstimateMad: r.total_estimate_mad,
          status: r.status,
          declineReason: r.decline_reason,
          respondedAt: r.responded_at,
          expiresAt: r.expires_at,
          createdAt: r.created_at,
        }
      })
    },
    { watch: [user, locale] }
  )

  const requests = computed<OwnerRequestItem[]>(() => data.value ?? [])
  /** Pending requests only (still awaiting the owner's response). */
  const pendingRequests = computed<OwnerRequestItem[]>(() =>
    requests.value.filter((r) => r.status === 'pending')
  )
  const pendingCount = computed(() => pendingRequests.value.length)

  return { requests, pendingRequests, pendingCount, pending, error, refresh }
}
