import type {
  Amenity,
  City,
  PoolListItem,
  PoolPhoto,
  PoolPublic,
  PoolRating,
  PoolSlot,
  SlotKey,
} from '~/types/db'

/** Reactive filter object accepted by usePools (all fields optional). */
export interface PoolFilters {
  citySlug?: string | null
  slot?: SlotKey | null
  amenities?: string[]
  minPrice?: number | null
  maxPrice?: number | null
  /** Pool-attribute toggles (true = required; false/undefined = no filter). */
  heated?: boolean
  sheltered?: boolean
  childSafe?: boolean
  /** 'price_asc' | 'price_desc' | 'rating' | 'recent' (default). */
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'recent' | null
  q?: string | null
}

/**
 * Browse published pools as `PoolListItem[]`.
 *
 * pools_public is a view, so rather than rely on PostgREST relationship
 * inference across a view + base tables we fetch the pieces (pools, cover
 * photos, enabled slots, ratings, cities) and stitch them together, then
 * apply price/amenity/text filters and sorting. priceFrom = the min enabled
 * slot price. The query is keyed on the filters so SSR ↔ client stay in sync
 * and changing a filter re-runs it (watch).
 */
export function usePools(filters: PoolFilters | Ref<PoolFilters> = {}) {
  const supabase = useSupabaseClient()
  const { locale } = useI18n()

  const filtersRef = computed<PoolFilters>(() => unref(filters) ?? {})

  const key = computed(() => `pools:${JSON.stringify(filtersRef.value)}:${locale.value}`)

  const { data, pending, error, refresh } = useAsyncData<PoolListItem[]>(
    key,
    async () => {
      const f = filtersRef.value

      // Resolve a city-slug filter to its id (and keep the row for naming).
      let cityFilterId: string | null = null
      if (f.citySlug) {
        const { data: cityRow, error: cityErr } = await supabase
          .from('cities')
          .select('id')
          .eq('slug', f.citySlug)
          .maybeSingle()
        if (cityErr) throw cityErr
        // Unknown slug → no results.
        if (!cityRow) return []
        cityFilterId = (cityRow as unknown as { id: string }).id
      }

      // Base pools query (published view). Text search on title/neighborhood.
      let poolQuery = supabase
        .from('pools_public')
        .select(
          'id, owner_id, title, description, type, city_id, neighborhood, approx_lat, approx_lng, max_guests, length_m, width_m, depth_min, depth_max, heated, covered, child_safe, sheltered_from_view, owner_present, direct_contact_enabled, rules, amenities, completion_score, created_at, updated_at'
        )
        .order('created_at', { ascending: false })
      if (cityFilterId) poolQuery = poolQuery.eq('city_id', cityFilterId)
      if (f.q && f.q.trim()) {
        const term = f.q.trim().replace(/[%,()]/g, ' ')
        poolQuery = poolQuery.or(`title.ilike.%${term}%,neighborhood.ilike.%${term}%`)
      }

      const { data: poolsData, error: poolsErr } = await poolQuery
      if (poolsErr) throw poolsErr
      const pools = (poolsData ?? []) as unknown as PoolPublic[]
      if (pools.length === 0) return []

      const poolIds = pools.map((p) => p.id)
      const cityIds = [...new Set(pools.map((p) => p.city_id))]

      // Fetch cover photos, enabled slots, ratings and cities in parallel.
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

      // Index helpers.
      const coverByPool = new Map<string, string>()
      for (const ph of photos) {
        if (coverByPool.has(ph.pool_id)) continue
        if (ph.is_cover || ph.position === 0) coverByPool.set(ph.pool_id, ph.storage_path)
      }
      // Fallback: first photo of any pool with no explicit cover.
      for (const ph of photos) {
        if (!coverByPool.has(ph.pool_id)) coverByPool.set(ph.pool_id, ph.storage_path)
      }

      const minPriceByPool = new Map<string, number>()
      const slotsByPool = new Map<string, Set<SlotKey>>()
      for (const s of slots) {
        const prev = minPriceByPool.get(s.pool_id)
        if (prev === undefined || s.price_mad < prev) minPriceByPool.set(s.pool_id, s.price_mad)
        if (!slotsByPool.has(s.pool_id)) slotsByPool.set(s.pool_id, new Set())
        slotsByPool.get(s.pool_id)!.add(s.slot)
      }

      const ratingByPool = new Map<string, { avg: number; count: number }>()
      for (const r of ratings) {
        ratingByPool.set(r.pool_id, { avg: Number(r.avg_rating), count: r.review_count })
      }

      const cityById = new Map<string, City>()
      for (const c of cities) cityById.set(c.id, c)

      const lang = locale.value === 'ar' ? 'ar' : 'fr'
      const wantedAmenities = (f.amenities ?? []).filter(Boolean)

      let items: PoolListItem[] = pools.map((p) => {
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

      // ── Client-side filters that depend on the stitched data ──────────
      if (f.slot) {
        items = items.filter((it) => slotsByPool.get(it.id)?.has(f.slot as SlotKey))
      }
      if (typeof f.minPrice === 'number') {
        items = items.filter(
          (it) => it.priceFrom !== null && it.priceFrom >= (f.minPrice as number)
        )
      }
      if (typeof f.maxPrice === 'number') {
        items = items.filter(
          (it) => it.priceFrom !== null && it.priceFrom <= (f.maxPrice as number)
        )
      }
      if (wantedAmenities.length) {
        items = items.filter((it) => {
          const keys = new Set(it.amenities.map((a) => a.key))
          return wantedAmenities.every((k) => keys.has(k))
        })
      }
      // Boolean pool attributes (chauffée / à l'abri des regards / enfants).
      if (f.heated) items = items.filter((it) => it.heated)
      if (f.sheltered) items = items.filter((it) => it.sheltered)
      if (f.childSafe) items = items.filter((it) => it.childSafe)

      // ── Sort ──────────────────────────────────────────────────────────
      const sort = f.sort ?? 'recent'
      items.sort((a, b) => {
        switch (sort) {
          case 'price_asc':
            return (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity)
          case 'price_desc':
            return (b.priceFrom ?? -Infinity) - (a.priceFrom ?? -Infinity)
          case 'rating':
            return (b.rating ?? -1) - (a.rating ?? -1)
          default:
            return 0 // 'recent' — preserve created_at desc from the query order
        }
      })

      return items
    },
    { watch: [filtersRef, locale] }
  )

  const pools = computed<PoolListItem[]>(() => data.value ?? [])
  return { pools, pending, error, refresh }
}
