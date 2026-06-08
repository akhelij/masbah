import type { Amenity, PoolPhoto, PoolRules, PoolSlot, PoolType } from '~/types/db'
import type { PoolDraft } from './useCompletionScore'

/** Full base-table row (incl. PRIVATE columns) for the owner editor. */
interface OwnerPoolFullRow {
  id: string
  title: string
  description: string | null
  type: PoolType
  city_id: string | null
  neighborhood: string | null
  address: string | null
  lat: number | null
  lng: number | null
  approx_lat: number | null
  approx_lng: number | null
  max_guests: number
  length_m: number | null
  width_m: number | null
  depth_min: number | null
  depth_max: number | null
  heated: boolean
  covered: boolean
  child_safe: boolean
  sheltered_from_view: boolean
  owner_present: boolean
  direct_contact_enabled: boolean
  rules: PoolRules
  amenities: Amenity[]
  status: 'draft' | 'published' | 'paused'
  completion_score: number
  owner_id: string
}

const OWNER_POOL_COLUMNS =
  'id, title, description, type, city_id, neighborhood, address, lat, lng, approx_lat, approx_lng, max_guests, length_m, width_m, depth_min, depth_max, heated, covered, child_safe, sheltered_from_view, owner_present, direct_contact_enabled, rules, amenities, status, completion_score, owner_id'

export interface OwnerPoolDetail {
  draft: PoolDraft
  photos: PoolPhoto[]
  slots: PoolSlot[]
}

/**
 * A single OWNED pool (base table, RLS-scoped to the owner) with its photos and
 * slots, shaped for the wizard editor. Returns a null `detail` when the pool is
 * not found or not owned by the caller. `id` may be reactive.
 */
export function useOwnerPool(id: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const poolId = computed(() => toValue(id))

  const { data, pending, error, refresh } = useAsyncData<OwnerPoolDetail | null>(
    () => `owner-pool:${poolId.value}:${user.value ? 'me' : 'anon'}`,
    async () => {
      const pid = poolId.value
      if (!pid || !user.value) return null

      const { data: row, error: rowErr } = await supabase
        .from('pools')
        .select(OWNER_POOL_COLUMNS)
        .eq('id', pid)
        .maybeSingle()
      if (rowErr) throw rowErr
      if (!row) return null
      const pool = row as unknown as OwnerPoolFullRow

      const [photosRes, slotsRes] = await Promise.all([
        supabase
          .from('pool_photos')
          .select('id, pool_id, storage_path, position, is_cover')
          .eq('pool_id', pid)
          .order('position', { ascending: true }),
        supabase
          .from('pool_slots')
          .select('id, pool_id, slot, price_mad, enabled, weekend_premium_pct')
          .eq('pool_id', pid),
      ])
      if (photosRes.error) throw photosRes.error
      if (slotsRes.error) throw slotsRes.error

      const photos = (photosRes.data ?? []) as unknown as PoolPhoto[]
      const slots = (slotsRes.data ?? []) as unknown as PoolSlot[]

      const draft: PoolDraft = {
        id: pool.id,
        title: pool.title,
        description: pool.description,
        type: pool.type,
        city_id: pool.city_id,
        neighborhood: pool.neighborhood,
        address: pool.address,
        lat: pool.lat,
        lng: pool.lng,
        approx_lat: pool.approx_lat,
        approx_lng: pool.approx_lng,
        max_guests: pool.max_guests,
        length_m: pool.length_m,
        width_m: pool.width_m,
        depth_min: pool.depth_min,
        depth_max: pool.depth_max,
        heated: pool.heated,
        covered: pool.covered,
        child_safe: pool.child_safe,
        sheltered_from_view: pool.sheltered_from_view,
        owner_present: pool.owner_present,
        direct_contact_enabled: pool.direct_contact_enabled,
        rules: pool.rules,
        amenities: Array.isArray(pool.amenities) ? pool.amenities : [],
        status: pool.status,
        completion_score: pool.completion_score,
      }

      return { draft, photos, slots }
    },
    { watch: [poolId, user] }
  )

  const detail = computed<OwnerPoolDetail | null>(() => data.value ?? null)
  return { detail, pending, error, refresh }
}
