import type { Amenity, PoolRules, PoolSlot, PoolType } from '~/types/db'

/**
 * The editable draft of a pool, as the wizard holds it in memory and as the
 * `pools` base table stores it. Mirrors the writable columns of
 * supabase/migrations/0003_pools.sql (status/completion_score/owner are managed
 * by the mutations layer, not the form). Photos & slots live in their own
 * tables but are summarised here for the completion score.
 */
export interface PoolDraft {
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
}

/** Minimum a draft must satisfy before it can be published. */
export interface PublishReadiness {
  hasTitle: boolean
  hasCity: boolean
  hasPhotos: boolean
  hasPricedSlot: boolean
  hasMaxGuests: boolean
  ready: boolean
  /** i18n keys for the missing requirements, for a friendly block message. */
  missing: string[]
}

/** Default empty draft used when creating a brand-new listing. */
export function emptyPoolDraft(id: string): PoolDraft {
  return {
    id,
    title: '',
    description: null,
    type: 'villa',
    city_id: null,
    neighborhood: null,
    address: null,
    lat: null,
    lng: null,
    approx_lat: null,
    approx_lng: null,
    max_guests: 10,
    length_m: null,
    width_m: null,
    depth_min: null,
    depth_max: null,
    heated: false,
    covered: false,
    child_safe: false,
    sheltered_from_view: false,
    owner_present: false,
    direct_contact_enabled: true,
    rules: {
      kids_allowed: true,
      music_allowed: true,
      events_allowed: false,
      pets_allowed: false,
      quiet_hours: null,
    },
    amenities: [],
    status: 'draft',
    completion_score: 0,
  }
}

/**
 * 0–100 completion score from the filled fields of a draft + its photos/slots.
 * Reused by the wizard progress bar and the listing cards. The weights sum to
 * 100; partial sections contribute proportionally.
 */
/** The subset of draft fields the score reads. `amenities` only by length. */
export interface ScoreableDraft {
  title: string
  description: string | null
  city_id: string | null
  lat: number | null
  lng: number | null
  max_guests: number
  length_m: number | null
  width_m: number | null
  amenities: { key: string }[]
  sheltered_from_view: boolean
  heated: boolean
  child_safe: boolean
}

export function computeCompletionScore(
  draft: ScoreableDraft,
  photoCount: number,
  slots: Pick<PoolSlot, 'enabled' | 'price_mad'>[]
): number {
  let score = 0
  // Title (15)
  if (draft.title && draft.title.trim().length >= 5) score += 15
  // Description (15)
  if (draft.description && draft.description.trim().length >= 30) score += 15
  // City (10)
  if (draft.city_id) score += 10
  // Location pin set (10)
  if (typeof draft.lat === 'number' && typeof draft.lng === 'number') score += 10
  // Photos — up to 20, ramping to 3 photos
  score += Math.round(Math.min(photoCount, 3) / 3 * 20)
  // At least one enabled, priced slot (20)
  if (slots.some((s) => s.enabled && s.price_mad > 0)) score += 20
  // Capacity (5)
  if (draft.max_guests > 0) score += 5
  // Pool dimensions (5)
  if (draft.length_m && draft.width_m) score += 5
  // Amenities & key selling points (5 total, partial)
  let extras = 0
  if (draft.amenities.length > 0) extras += 1
  if (draft.sheltered_from_view) extras += 1
  if (draft.heated || draft.child_safe) extras += 1
  score += Math.round(extras / 3 * 5)

  return Math.max(0, Math.min(100, score))
}

/** What still blocks publishing, with i18n keys for the missing bits. */
export function publishReadiness(
  draft: { title: string; city_id: string | null; max_guests: number },
  photoCount: number,
  slots: Pick<PoolSlot, 'enabled' | 'price_mad'>[]
): PublishReadiness {
  const hasTitle = Boolean(draft.title && draft.title.trim().length >= 5)
  const hasCity = Boolean(draft.city_id)
  const hasPhotos = photoCount >= 1
  const hasPricedSlot = slots.some((s) => s.enabled && s.price_mad > 0)
  const hasMaxGuests = draft.max_guests > 0

  const missing: string[] = []
  if (!hasTitle) missing.push('publish.readiness.title')
  if (!hasCity) missing.push('publish.readiness.city')
  if (!hasPhotos) missing.push('publish.readiness.photo')
  if (!hasPricedSlot) missing.push('publish.readiness.slot')
  if (!hasMaxGuests) missing.push('publish.readiness.guests')

  return {
    hasTitle,
    hasCity,
    hasPhotos,
    hasPricedSlot,
    hasMaxGuests,
    ready: missing.length === 0,
    missing,
  }
}

/**
 * Convenience wrapper so the wizard/cards can call `useCompletionScore(draft)`
 * with reactive sources and get a computed 0–100 score.
 */
export function useCompletionScore(
  draft: MaybeRefOrGetter<ScoreableDraft>,
  photoCount: MaybeRefOrGetter<number>,
  slots: MaybeRefOrGetter<Pick<PoolSlot, 'enabled' | 'price_mad'>[]>
) {
  return computed(() =>
    computeCompletionScore(toValue(draft), toValue(photoCount), toValue(slots))
  )
}
