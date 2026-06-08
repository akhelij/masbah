import type {
  Amenity,
  BlockedDate,
  City,
  PoolDetail,
  PoolPhoto,
  PoolPhotoResolved,
  PoolPublic,
  PoolRating,
  PoolSlot,
  ProfilePublic,
  ReviewRow,
  ReviewWithAuthor,
  SlotKey,
} from '~/types/db'

const SLOT_ORDER: Record<SlotKey, number> = { morning: 0, afternoon: 1, evening: 2, full_day: 3 }

/**
 * Full detail view-model for one pool (published, public projection):
 * pools_public row + ordered photos + enabled slots + owner profiles_public +
 * pool_ratings + recent pool reviews (with public authors) + upcoming
 * blocked_dates for the availability calendar.
 *
 * `id` may be a ref so the page can react to route changes. Returns a null
 * `detail` when the pool is not found / not published.
 */
export function usePool(id: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient()
  const { locale } = useI18n()

  const poolId = computed(() => toValue(id))

  const { data, pending, error, refresh } = useAsyncData<PoolDetail | null>(
    () => `pool:${poolId.value}:${locale.value}`,
    async () => {
      const pid = poolId.value
      if (!pid) return null

      const { data: poolRow, error: poolErr } = await supabase
        .from('pools_public')
        .select(
          'id, owner_id, title, description, type, city_id, neighborhood, approx_lat, approx_lng, max_guests, length_m, width_m, depth_min, depth_max, heated, covered, child_safe, sheltered_from_view, owner_present, direct_contact_enabled, rules, amenities, completion_score, created_at, updated_at'
        )
        .eq('id', pid)
        .maybeSingle()
      if (poolErr) throw poolErr
      if (!poolRow) return null
      const pool = poolRow as unknown as PoolPublic

      const today = new Date().toISOString().slice(0, 10)

      const [photosRes, slotsRes, ratingRes, reviewsRes, cityRes, ownerRes, blockedRes] =
        await Promise.all([
          supabase
            .from('pool_photos')
            .select('id, pool_id, storage_path, position, is_cover')
            .eq('pool_id', pid)
            .order('position', { ascending: true }),
          supabase
            .from('pool_slots')
            .select('id, pool_id, slot, price_mad, enabled, weekend_premium_pct')
            .eq('pool_id', pid)
            .eq('enabled', true),
          supabase
            .from('pool_ratings')
            .select('pool_id, avg_rating, review_count')
            .eq('pool_id', pid)
            .maybeSingle(),
          supabase
            .from('reviews')
            .select(
              'id, booking_id, author_id, target_type, pool_id, target_user_id, rating, categories, comment, reply, created_at'
            )
            .eq('pool_id', pid)
            .eq('target_type', 'pool')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('cities')
            .select('id, name_fr, name_ar, slug, region, lat, lng, is_active')
            .eq('id', pool.city_id)
            .maybeSingle(),
          supabase
            .from('profiles_public')
            .select('id, full_name, avatar_url, phone_verified, created_at')
            .eq('id', pool.owner_id)
            .maybeSingle(),
          supabase
            .from('blocked_dates')
            .select('id, pool_id, date, slot, reason')
            .eq('pool_id', pid)
            .gte('date', today)
            .order('date', { ascending: true }),
        ])
      if (photosRes.error) throw photosRes.error
      if (slotsRes.error) throw slotsRes.error
      if (ratingRes.error) throw ratingRes.error
      if (reviewsRes.error) throw reviewsRes.error
      if (cityRes.error) throw cityRes.error
      if (ownerRes.error) throw ownerRes.error
      if (blockedRes.error) throw blockedRes.error

      const photos = (photosRes.data ?? []) as unknown as PoolPhoto[]
      const slotsRaw = (slotsRes.data ?? []) as unknown as PoolSlot[]
      const rating = ratingRes.data as unknown as PoolRating | null
      const reviewRows = (reviewsRes.data ?? []) as unknown as ReviewRow[]
      const city = (cityRes.data as unknown as City | null) ?? null
      const owner = (ownerRes.data as unknown as ProfilePublic | null) ?? null
      const blockedDates = (blockedRes.data ?? []) as unknown as BlockedDate[]

      // Photos: cover first, then by position; URLs resolved.
      const resolvedPhotos: PoolPhotoResolved[] = photos
        .slice()
        .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position)
        .map((ph) => ({ ...ph, url: usePoolImageUrl(ph.storage_path) ?? ph.storage_path }))
      const coverUrl = resolvedPhotos[0]?.url ?? null

      // Slots: enabled only, canonical order.
      const slots = slotsRaw.slice().sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot])
      const priceFrom = slots.length ? Math.min(...slots.map((s) => s.price_mad)) : null

      // Reviews enriched with their public authors (one extra query).
      let reviews: ReviewWithAuthor[] = reviewRows.map((r) => ({ ...r, author: null }))
      const authorIds = [...new Set(reviewRows.map((r) => r.author_id))]
      if (authorIds.length) {
        const { data: authorsData, error: authorsErr } = await supabase
          .from('profiles_public')
          .select('id, full_name, avatar_url, phone_verified, created_at')
          .in('id', authorIds)
        if (authorsErr) throw authorsErr
        const authors = (authorsData ?? []) as unknown as ProfilePublic[]
        const byId = new Map(authors.map((a) => [a.id, a]))
        reviews = reviewRows.map((r) => ({ ...r, author: byId.get(r.author_id) ?? null }))
      }

      const lang = locale.value === 'ar' ? 'ar' : 'fr'
      const cityName = city ? (lang === 'ar' ? city.name_ar : city.name_fr) : ''

      const detail: PoolDetail = {
        pool: {
          ...pool,
          amenities: Array.isArray(pool.amenities) ? (pool.amenities as Amenity[]) : [],
        },
        city,
        cityName,
        photos: resolvedPhotos,
        coverUrl,
        slots,
        priceFrom,
        owner,
        rating: rating ? Number(rating.avg_rating) : null,
        reviewCount: rating ? rating.review_count : 0,
        reviews,
        blockedDates,
      }
      return detail
    },
    { watch: [poolId, locale] }
  )

  const detail = computed<PoolDetail | null>(() => data.value ?? null)
  return { detail, pending, error, refresh }
}
