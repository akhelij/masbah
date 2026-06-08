import type { PoolListItem, PoolPhoto, PoolPublic, PoolRating, ProfilePublic } from '~/types/db'

/** A rating summary for one role (host or guest). */
export interface RatingSummary {
  /** Average rating 1..5, or null when no reviews. */
  avg: number | null
  count: number
}

/**
 * Public profile view-model assembled for a member id: their public profile
 * fields, dual rating summaries (`asHost` = reviews on the pools they own;
 * `asGuest` = renter reviews they received), and their published pools for a
 * listings strip. All data comes from public projections (no auth needed).
 */
export interface PublicProfile {
  profile: ProfilePublic & { bio: string | null }
  asHost: RatingSummary
  asGuest: RatingSummary
  pools: PoolListItem[]
}

/**
 * Build the public profile for `idRef`. Reads the `profiles_public` row, the
 * member's published pools (`pools_public` where owner_id = id) plus their
 * covers/slots/ratings for the strip, and aggregates the two rating roles:
 *   • asHost  — `reviews` with target_type='pool' on the member's pools
 *   • asGuest — `reviews` with target_type='renter' and target_user_id = id
 * Everything is public-read, so no caller scoping is needed. Returns a null
 * `profile` when the member doesn't exist. Keyed on the id + locale.
 */
export function usePublicProfile(idRef: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient()
  const { locale } = useI18n()

  const memberId = computed(() => toValue(idRef))

  const { data, pending, error, refresh } = useAsyncData<PublicProfile | null>(
    () => `public-profile:${memberId.value}:${locale.value}`,
    async () => {
      const id = memberId.value
      if (!id) return null

      // NOTE: `profiles_public` (migration 0001) projects only the safe columns
      // id/full_name/avatar_url/phone_verified/created_at — `bio` lives on the
      // own-row-RLS `profiles` table and is NOT public, so another member's bio
      // is intentionally unavailable here. We keep `bio` in the shape (null) so
      // the page can render it once a public bio projection is added.
      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles_public')
        .select('id, full_name, avatar_url, phone_verified, created_at')
        .eq('id', id)
        .maybeSingle()
      if (profileErr) throw profileErr
      if (!profileRow) return null
      const profile = {
        ...(profileRow as unknown as ProfilePublic),
        bio: null as string | null,
      }

      // Their published pools, plus the renter reviews they received as a guest.
      const [poolsRes, guestReviewsRes] = await Promise.all([
        supabase
          .from('pools_public')
          .select(
            'id, owner_id, title, description, type, city_id, neighborhood, approx_lat, approx_lng, max_guests, length_m, width_m, depth_min, depth_max, heated, covered, child_safe, sheltered_from_view, owner_present, direct_contact_enabled, rules, amenities, completion_score, created_at, updated_at'
          )
          .eq('owner_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('rating')
          .eq('target_user_id', id)
          .eq('target_type', 'renter'),
      ])
      if (poolsRes.error) throw poolsRes.error
      if (guestReviewsRes.error) throw guestReviewsRes.error

      const pools = (poolsRes.data ?? []) as unknown as PoolPublic[]
      const guestRatings = ((guestReviewsRes.data ?? []) as unknown as { rating: number }[]).map(
        (r) => r.rating
      )

      const poolIds = pools.map((p) => p.id)
      const cityIds = [...new Set(pools.map((p) => p.city_id).filter(Boolean))]

      // Covers + cheapest slot + per-pool ratings for the listings strip, and
      // the host-side aggregate (avg over the member's pools' ratings).
      const [photosRes, slotsRes, ratingsRes, citiesRes] = await Promise.all([
        poolIds.length
          ? supabase
              .from('pool_photos')
              .select('id, pool_id, storage_path, position, is_cover')
              .in('pool_id', poolIds)
              .order('position', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        poolIds.length
          ? supabase
              .from('pool_slots')
              .select('id, pool_id, slot, price_mad, enabled, weekend_premium_pct')
              .in('pool_id', poolIds)
              .eq('enabled', true)
          : Promise.resolve({ data: [], error: null }),
        poolIds.length
          ? supabase
              .from('pool_ratings')
              .select('pool_id, avg_rating, review_count')
              .in('pool_id', poolIds)
          : Promise.resolve({ data: [], error: null }),
        cityIds.length
          ? supabase
              .from('cities')
              .select('id, name_fr, name_ar, slug, region, lat, lng, is_active')
              .in('id', cityIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (photosRes.error) throw photosRes.error
      if (slotsRes.error) throw slotsRes.error
      if (ratingsRes.error) throw ratingsRes.error
      if (citiesRes.error) throw citiesRes.error

      const photos = (photosRes.data ?? []) as unknown as PoolPhoto[]
      const slots = (slotsRes.data ?? []) as unknown as {
        pool_id: string
        price_mad: number
      }[]
      const ratings = (ratingsRes.data ?? []) as unknown as PoolRating[]
      const cities = (citiesRes.data ?? []) as unknown as {
        id: string
        name_fr: string
        name_ar: string
        slug: string
      }[]

      const lang = locale.value === 'ar' ? 'ar' : 'fr'

      const coverByPool = new Map<string, string>()
      for (const ph of photos) {
        if ((ph.is_cover || ph.position === 0) && !coverByPool.has(ph.pool_id)) {
          coverByPool.set(ph.pool_id, ph.storage_path)
        }
      }
      for (const ph of photos) {
        if (!coverByPool.has(ph.pool_id)) coverByPool.set(ph.pool_id, ph.storage_path)
      }

      const minPriceByPool = new Map<string, number>()
      for (const s of slots) {
        const cur = minPriceByPool.get(s.pool_id)
        if (cur === undefined || s.price_mad < cur) minPriceByPool.set(s.pool_id, s.price_mad)
      }

      const ratingByPool = new Map<string, PoolRating>()
      for (const r of ratings) ratingByPool.set(r.pool_id, r)

      const cityById = new Map<string, (typeof cities)[number]>()
      for (const c of cities) cityById.set(c.id, c)

      const poolItems: PoolListItem[] = pools.map((p) => {
        const city = cityById.get(p.city_id)
        const rating = ratingByPool.get(p.id)
        return {
          id: p.id,
          title: p.title,
          type: p.type,
          cityName: city ? (lang === 'ar' ? city.name_ar : city.name_fr) : '',
          citySlug: city?.slug ?? '',
          neighborhood: p.neighborhood,
          approxLat: p.approx_lat,
          approxLng: p.approx_lng,
          coverUrl: usePoolImageUrl(coverByPool.get(p.id)),
          priceFrom: minPriceByPool.get(p.id) ?? null,
          rating: rating ? Number(rating.avg_rating) : null,
          reviewCount: rating ? rating.review_count : 0,
          maxGuests: p.max_guests,
          heated: p.heated,
          covered: p.covered,
          childSafe: p.child_safe,
          sheltered: p.sheltered_from_view,
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
        }
      })

      // Host summary: weighted average across the member's pools' ratings.
      let hostCount = 0
      let hostWeighted = 0
      for (const r of ratings) {
        hostCount += r.review_count
        hostWeighted += Number(r.avg_rating) * r.review_count
      }
      const asHost: RatingSummary = {
        avg: hostCount ? hostWeighted / hostCount : null,
        count: hostCount,
      }

      const asGuest: RatingSummary = {
        avg: guestRatings.length
          ? guestRatings.reduce((a, b) => a + b, 0) / guestRatings.length
          : null,
        count: guestRatings.length,
      }

      return { profile, asHost, asGuest, pools: poolItems }
    },
    { watch: [memberId, locale] }
  )

  const member = computed<PublicProfile | null>(() => data.value ?? null)
  return { member, pending, error, refresh }
}
