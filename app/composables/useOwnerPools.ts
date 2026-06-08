import type { City, PoolPhoto, PoolSlot } from '~/types/db'

/**
 * One row of the owner's "Mes annonces" list: the base `pools` columns we show,
 * plus a resolved cover image, the lowest enabled slot price, and the city name.
 */
export interface OwnerPoolItem {
  id: string
  title: string
  status: 'draft' | 'published' | 'paused'
  cityName: string
  neighborhood: string | null
  coverUrl: string | null
  priceFrom: number | null
  completionScore: number
  /** Placeholder until an analytics/views table exists. */
  views: number
  updatedAt: string
}

/** Base-table row shape we read for the owner (RLS-scoped to owner_id). */
interface OwnerPoolRow {
  id: string
  title: string
  status: 'draft' | 'published' | 'paused'
  city_id: string
  neighborhood: string | null
  completion_score: number
  updated_at: string
}

/**
 * The owner's pools across ALL statuses (draft / published / paused), read from
 * the base `pools` table (the owner RLS policy grants full SELECT on own rows).
 * Each row is hydrated with its cover photo, lowest enabled slot price and city
 * name. Returns an empty list when logged out.
 */
export function useOwnerPools() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { locale } = useI18n()

  // Keyed on logged-in presence (RLS scopes rows to the owner; the user ref's
  // id isn't reliably populated, so we don't key on it) + locale.
  const key = computed(() => `owner-pools:${user.value ? 'me' : 'anon'}:${locale.value}`)

  const { data, pending, error, refresh } = useAsyncData<OwnerPoolItem[]>(
    key,
    async () => {
      if (!user.value) return []

      // RLS restricts `pools` SELECT to the authenticated owner's own rows, so
      // no explicit owner_id filter is needed (and the user ref's id is flaky).
      const { data: poolsData, error: poolsErr } = await supabase
        .from('pools')
        .select('id, title, status, city_id, neighborhood, completion_score, updated_at')
        .order('updated_at', { ascending: false })
      if (poolsErr) throw poolsErr
      const pools = (poolsData ?? []) as unknown as OwnerPoolRow[]
      if (pools.length === 0) return []

      const poolIds = pools.map((p) => p.id)
      const cityIds = [...new Set(pools.map((p) => p.city_id).filter(Boolean))]

      const [photosRes, slotsRes, citiesRes] = await Promise.all([
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
        cityIds.length
          ? supabase
              .from('cities')
              .select('id, name_fr, name_ar, slug, region, lat, lng, is_active')
              .in('id', cityIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (photosRes.error) throw photosRes.error
      if (slotsRes.error) throw slotsRes.error
      if (citiesRes.error) throw citiesRes.error

      const photos = (photosRes.data ?? []) as unknown as PoolPhoto[]
      const slots = (slotsRes.data ?? []) as unknown as PoolSlot[]
      const cities = (citiesRes.data ?? []) as unknown as City[]

      const coverByPool = new Map<string, string>()
      for (const ph of photos) {
        if (ph.is_cover || ph.position === 0) {
          if (!coverByPool.has(ph.pool_id)) coverByPool.set(ph.pool_id, ph.storage_path)
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

      const cityById = new Map<string, City>()
      for (const c of cities) cityById.set(c.id, c)

      const lang = locale.value === 'ar' ? 'ar' : 'fr'

      return pools.map<OwnerPoolItem>((p) => {
        const city = cityById.get(p.city_id) ?? null
        return {
          id: p.id,
          title: p.title,
          status: p.status,
          cityName: city ? (lang === 'ar' ? city.name_ar : city.name_fr) : '',
          neighborhood: p.neighborhood,
          coverUrl: usePoolImageUrl(coverByPool.get(p.id)),
          priceFrom: minPriceByPool.get(p.id) ?? null,
          completionScore: p.completion_score,
          views: 0,
          updatedAt: p.updated_at,
        }
      })
    },
    { watch: [user, locale] }
  )

  const pools = computed<OwnerPoolItem[]>(() => data.value ?? [])
  return { pools, pending, error, refresh }
}
