import type { PoolPhoto, ProfilePublic, ReviewRow, ReviewTarget, SlotKey } from '~/types/db'

/** Base-table `booking_requests` row (the columns we need to gate reviewing). */
interface ReviewableBookingRow {
  id: string
  pool_id: string
  renter_id: string
  date: string
  slot: SlotKey
  status: string
}

/** Minimal published-pool projection used to hydrate a reviewable card. */
interface ReviewablePoolRow {
  id: string
  title: string
  owner_id: string
}

/**
 * One booking the signed-in user may still review. `targetType` says what the
 * caller would be reviewing: 'pool' (they were the renter) or 'renter' (they
 * were the host). `counterpartName` is the other party (owner name for a pool
 * review, renter name for a renter review).
 */
export interface ReviewableBooking {
  bookingId: string
  poolId: string
  poolTitle: string | null
  cover: string | null
  date: string
  slot: SlotKey
  targetType: ReviewTarget
  counterpartName: string | null
  /** Only set for owner→renter reviews (the renter being evaluated). */
  renterId: string | null
}

export interface ReviewableBookings {
  asRenter: ReviewableBooking[]
  asOwner: ReviewableBooking[]
}

const EMPTY: ReviewableBookings = { asRenter: [], asOwner: [] }

/**
 * Bookings the signed-in user can still review, newest visit first, split into
 * `asRenter` (they rent → review the pool) and `asOwner` (they host → review
 * the renter). A booking is reviewable when it is `accepted`, its visit date is
 * in the past, and no review with that booking_id + matching target_type exists
 * yet.
 *
 * Caller scoping mirrors useRenterBookings / useOwnerRequests: `booking_requests`
 * has two SELECT RLS policies (renter OR pool-owner) so we resolve the caller's
 * id from `profiles` (own-row RLS) for the renter side, and the caller's pool
 * ids from `pools` (own-row RLS) for the owner side. `reviews` is public-read,
 * so we fetch reviews for the candidate booking ids and filter client-side.
 * Returns empty when logged out. Keyed on logged-in presence + locale.
 */
export function useReviewableBookings() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { locale } = useI18n()

  const key = computed(() => `reviewable:${user.value ? 'me' : 'anon'}:${locale.value}`)

  const { data, pending, error, refresh } = useAsyncData<ReviewableBookings>(
    key,
    async () => {
      if (!user.value) return EMPTY

      const today = new Date().toISOString().slice(0, 10)

      // Caller id (renter side) + owned pool ids (owner side) resolved via
      // own-row RLS, since the user ref's id is unreliable here.
      const [meRes, myPoolsRes] = await Promise.all([
        supabase.from('profiles').select('id').maybeSingle(),
        supabase.from('pools').select('id'),
      ])
      if (meRes.error) throw meRes.error
      if (myPoolsRes.error) throw myPoolsRes.error
      const myId = (meRes.data as unknown as { id: string } | null)?.id ?? null
      const myPoolIds = ((myPoolsRes.data ?? []) as unknown as { id: string }[]).map((p) => p.id)

      // Candidate bookings: accepted + visit date passed, on either side.
      const [renterRes, ownerRes] = await Promise.all([
        myId
          ? supabase
              .from('booking_requests')
              .select('id, pool_id, renter_id, date, slot, status')
              .eq('renter_id', myId)
              .eq('status', 'accepted')
              .lt('date', today)
              .order('date', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        myPoolIds.length
          ? supabase
              .from('booking_requests')
              .select('id, pool_id, renter_id, date, slot, status')
              .in('pool_id', myPoolIds)
              .eq('status', 'accepted')
              .lt('date', today)
              .order('date', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ])
      if (renterRes.error) throw renterRes.error
      if (ownerRes.error) throw ownerRes.error

      const renterRows = (renterRes.data ?? []) as unknown as ReviewableBookingRow[]
      const ownerRows = (ownerRes.data ?? []) as unknown as ReviewableBookingRow[]
      if (renterRows.length === 0 && ownerRows.length === 0) return EMPTY

      const allBookingIds = [...new Set([...renterRows, ...ownerRows].map((b) => b.id))]
      const poolIds = [...new Set([...renterRows, ...ownerRows].map((b) => b.pool_id))]
      const renterIds = [...new Set(ownerRows.map((b) => b.renter_id))]

      // Existing reviews for these bookings (public read), pools + renters.
      // Owner profiles (host names) depend on the pool rows, so they're fetched
      // in a follow-up query below.
      const [reviewsRes, poolsRes, photosRes, rentersRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('id, booking_id, target_type')
          .in('booking_id', allBookingIds),
        supabase.from('pools_public').select('id, title, owner_id').in('id', poolIds),
        supabase
          .from('pool_photos')
          .select('id, pool_id, storage_path, position, is_cover')
          .in('pool_id', poolIds)
          .order('position', { ascending: true }),
        renterIds.length
          ? supabase
              .from('profiles_public')
              .select('id, full_name, avatar_url, phone_verified, created_at')
              .in('id', renterIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (reviewsRes.error) throw reviewsRes.error
      if (poolsRes.error) throw poolsRes.error
      if (photosRes.error) throw photosRes.error
      if (rentersRes.error) throw rentersRes.error

      const reviews = (reviewsRes.data ?? []) as unknown as Pick<
        ReviewRow,
        'id' | 'booking_id' | 'target_type'
      >[]
      const pools = (poolsRes.data ?? []) as unknown as ReviewablePoolRow[]
      const photos = (photosRes.data ?? []) as unknown as PoolPhoto[]
      const renters = (rentersRes.data ?? []) as unknown as ProfilePublic[]

      const poolById = new Map<string, ReviewablePoolRow>()
      for (const p of pools) poolById.set(p.id, p)

      // Owner profiles (host names) for the renter side.
      const ownerIds = [...new Set(pools.map((p) => p.owner_id).filter(Boolean))]
      let owners: ProfilePublic[] = []
      if (ownerIds.length) {
        const { data: ownersData, error: ownersErr } = await supabase
          .from('profiles_public')
          .select('id, full_name, avatar_url, phone_verified, created_at')
          .in('id', ownerIds)
        if (ownersErr) throw ownersErr
        owners = (ownersData ?? []) as unknown as ProfilePublic[]
      }
      const ownerById = new Map<string, ProfilePublic>()
      for (const o of owners) ownerById.set(o.id, o)

      const renterById = new Map<string, ProfilePublic>()
      for (const r of renters) renterById.set(r.id, r)

      // Cover photo per pool (cover/position-0 first, else first available).
      const coverByPool = new Map<string, string>()
      for (const ph of photos) {
        if ((ph.is_cover || ph.position === 0) && !coverByPool.has(ph.pool_id)) {
          coverByPool.set(ph.pool_id, ph.storage_path)
        }
      }
      for (const ph of photos) {
        if (!coverByPool.has(ph.pool_id)) coverByPool.set(ph.pool_id, ph.storage_path)
      }

      // Which (booking_id → target_type) pairs are already reviewed.
      const reviewed = new Set(reviews.map((r) => `${r.booking_id}:${r.target_type}`))

      const asRenter: ReviewableBooking[] = renterRows
        .filter((b) => !reviewed.has(`${b.id}:pool`))
        .map((b) => {
          const pool = poolById.get(b.pool_id) ?? null
          const owner = pool ? (ownerById.get(pool.owner_id) ?? null) : null
          return {
            bookingId: b.id,
            poolId: b.pool_id,
            poolTitle: pool?.title ?? null,
            cover: usePoolImageUrl(coverByPool.get(b.pool_id)),
            date: b.date,
            slot: b.slot,
            targetType: 'pool' as const,
            counterpartName: owner?.full_name ?? null,
            renterId: null,
          }
        })

      const asOwner: ReviewableBooking[] = ownerRows
        .filter((b) => !reviewed.has(`${b.id}:renter`))
        .map((b) => {
          const pool = poolById.get(b.pool_id) ?? null
          const renter = renterById.get(b.renter_id) ?? null
          return {
            bookingId: b.id,
            poolId: b.pool_id,
            poolTitle: pool?.title ?? null,
            cover: usePoolImageUrl(coverByPool.get(b.pool_id)),
            date: b.date,
            slot: b.slot,
            targetType: 'renter' as const,
            counterpartName: renter?.full_name ?? null,
            renterId: b.renter_id,
          }
        })

      return { asRenter, asOwner }
    },
    { watch: [user, locale] }
  )

  const reviewable = computed<ReviewableBookings>(() => data.value ?? EMPTY)
  return { reviewable, pending, error, refresh }
}
