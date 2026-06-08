import type {
  Amenity,
  City,
  PoolListItem,
  PoolPhoto,
  PoolPublic,
  PoolRating,
  PoolSlot,
} from '~/types/db'

/**
 * Featured pools for the home: the most recent published pools, as
 * `PoolListItem[]`. Same stitching approach as usePools (pools_public is a
 * view), limited to `limit` rows and ordered newest-first.
 */
export function useFeaturedPools(limit = 6) {
  const supabase = useSupabaseClient()
  const { locale } = useI18n()

  const { data, pending, error, refresh } = useAsyncData<PoolListItem[]>(
    () => `featured-pools:${limit}:${locale.value}`,
    async () => {
      const { data: poolsData, error: poolsErr } = await supabase
        .from('pools_public')
        .select(
          'id, owner_id, title, description, type, city_id, neighborhood, approx_lat, approx_lng, max_guests, length_m, width_m, depth_min, depth_max, heated, covered, child_safe, sheltered_from_view, owner_present, direct_contact_enabled, rules, amenities, completion_score, created_at, updated_at'
        )
        .order('created_at', { ascending: false })
        .limit(limit)
      if (poolsErr) throw poolsErr
      const pools = (poolsData ?? []) as unknown as PoolPublic[]
      if (pools.length === 0) return []

      const poolIds = pools.map((p) => p.id)
      const cityIds = [...new Set(pools.map((p) => p.city_id))]

      const [photosRes, slotsRes, ratingsRes, citiesRes] = await Promise.all([
        supabase
          .from('pool_photos')
          .select('id, pool_id, storage_path, position, is_cover')
          .in('pool_id', poolIds)
          .order('position', { ascending: true }),
        supabase
          .from('pool_slots')
          .select('id, pool_id, slot, price_mad, enabled, weekend_premium_pct')
          .in('pool_id', poolIds)
          .eq('enabled', true),
        supabase
          .from('pool_ratings')
          .select('pool_id, avg_rating, review_count')
          .in('pool_id', poolIds),
        supabase
          .from('cities')
          .select('id, name_fr, name_ar, slug, region, lat, lng, is_active')
          .in('id', cityIds),
      ])
      if (photosRes.error) throw photosRes.error
      if (slotsRes.error) throw slotsRes.error
      if (ratingsRes.error) throw ratingsRes.error
      if (citiesRes.error) throw citiesRes.error

      const photos = (photosRes.data ?? []) as unknown as PoolPhoto[]
      const slots = (slotsRes.data ?? []) as unknown as PoolSlot[]
      const ratings = (ratingsRes.data ?? []) as unknown as PoolRating[]
      const cities = (citiesRes.data ?? []) as unknown as City[]

      const coverByPool = new Map<string, string>()
      for (const ph of photos) {
        if (!coverByPool.has(ph.pool_id) && (ph.is_cover || ph.position === 0)) {
          coverByPool.set(ph.pool_id, ph.storage_path)
        }
      }
      for (const ph of photos) {
        if (!coverByPool.has(ph.pool_id)) coverByPool.set(ph.pool_id, ph.storage_path)
      }

      const minPriceByPool = new Map<string, number>()
      for (const s of slots) {
        const prev = minPriceByPool.get(s.pool_id)
        if (prev === undefined || s.price_mad < prev) minPriceByPool.set(s.pool_id, s.price_mad)
      }

      const ratingByPool = new Map<string, { avg: number; count: number }>()
      for (const r of ratings) {
        ratingByPool.set(r.pool_id, { avg: Number(r.avg_rating), count: r.review_count })
      }

      const cityById = new Map<string, City>()
      for (const c of cities) cityById.set(c.id, c)

      const lang = locale.value === 'ar' ? 'ar' : 'fr'

      return pools.map<PoolListItem>((p) => {
        const city = cityById.get(p.city_id) ?? null
        const rating = ratingByPool.get(p.id)
        const amenities = Array.isArray(p.amenities) ? (p.amenities as Amenity[]) : []
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
          rating: rating ? rating.avg : null,
          reviewCount: rating ? rating.count : 0,
          maxGuests: p.max_guests,
          heated: p.heated,
          covered: p.covered,
          childSafe: p.child_safe,
          sheltered: p.sheltered_from_view,
          amenities,
        }
      })
    }
  )

  const pools = computed<PoolListItem[]>(() => data.value ?? [])
  return { pools, pending, error, refresh }
}
