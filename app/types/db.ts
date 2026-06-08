// Hand-written DB types for Masbah V2.
//
// The generated `Database` type (app/types/database.types.ts) is still a
// placeholder with no tables, so `useSupabaseClient<Database>().from(...)`
// resolves to a `never`-typed builder. Until real types are generated, the
// data composables cast query results to the interfaces below (the same
// approach as app/composables/useProfiles.ts).
//
// Columns mirror the migrations in supabase/migrations/0001–0006:
//   • pools_public / profiles_public / pool_ratings views (0001, 0003, 0006)
//   • pool_slots / pool_photos / blocked_dates (0003)
//   • reviews (0006), cities (0002)
//
// Private columns (address, exact lat/lng, phone) are intentionally absent —
// they never reach public reads.

/** The four bookable time windows (enum `slot_type`). */
export type SlotKey = 'morning' | 'afternoon' | 'evening' | 'full_day'

/** Pool kind (enum `pool_type`). */
export type PoolType = 'villa' | 'riad' | 'farm' | 'apartment' | 'other'

/** Review subject (enum `review_target`). */
export type ReviewTarget = 'pool' | 'renter'

/** UI locale → also the language key for amenity/city labels. */
export type Lang = 'fr' | 'ar'

// ── JSON shapes stored on pools ───────────────────────────────────────

/** One entry of `pools.amenities` (jsonb array). */
export interface Amenity {
  key: string
  label_fr: string
  label_ar: string
  /** Included in the base price (vs. a paid extra). */
  included: boolean
  /** Extra price in MAD when not included (0 when included). */
  price: number
  /** Whether `price` is charged per guest. */
  per_person: boolean
}

/** `pools.rules` (jsonb object). */
export interface PoolRules {
  kids_allowed: boolean
  music_allowed: boolean
  events_allowed: boolean
  pets_allowed: boolean
  /** e.g. "22:00-08:00", or null when none. */
  quiet_hours: string | null
}

/** `reviews.categories` (jsonb object) — 1..5 per axis, all optional. */
export interface ReviewCategories {
  proprete?: number
  conformite?: number
  communication?: number
  confidentialite?: number
}

// ── Tables / Views ────────────────────────────────────────────────────

/** Row of `public.cities` (public-readable when `is_active`). */
export interface City {
  id: string
  name_fr: string
  name_ar: string
  slug: string
  region: string | null
  lat: number | null
  lng: number | null
  is_active: boolean
}

/**
 * Row of the `public.pools_public` view (safe, published-only projection).
 * Private columns (address, exact lat/lng) are NOT part of this view.
 */
export interface PoolPublic {
  id: string
  owner_id: string
  title: string
  description: string | null
  type: PoolType
  city_id: string
  neighborhood: string | null
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
  completion_score: number
  created_at: string
  updated_at: string
}

/** Row of `public.pool_slots`. */
export interface PoolSlot {
  id: string
  pool_id: string
  slot: SlotKey
  price_mad: number
  enabled: boolean
  weekend_premium_pct: number
}

/** Row of `public.pool_photos` (path is an Unsplash/HTTP URL or storage key). */
export interface PoolPhoto {
  id: string
  pool_id: string
  storage_path: string
  position: number
  is_cover: boolean
}

/** Row of the `public.pool_ratings` view (aggregate per pool). */
export interface PoolRating {
  pool_id: string
  /** Average rating, 1..5, two decimals (numeric → comes back as string|number). */
  avg_rating: number | string
  review_count: number
}

/** Row of the `public.profiles_public` view (safe owner/renter fields). */
export interface ProfilePublic {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone_verified: boolean
  created_at: string
}

/** Row of `public.reviews` (public-readable). */
export interface ReviewRow {
  id: string
  booking_id: string
  author_id: string
  target_type: ReviewTarget
  pool_id: string | null
  target_user_id: string | null
  rating: number
  categories: ReviewCategories
  comment: string | null
  reply: string | null
  created_at: string
}

/** Row of `public.blocked_dates` (slot null = whole day blocked). */
export interface BlockedDate {
  id: string
  pool_id: string
  date: string
  slot: SlotKey | null
  reason: string | null
}

// ── Derived view-models used by the UI ────────────────────────────────

/** Compact card shape for grids / lists / the map. */
export interface PoolListItem {
  id: string
  title: string
  type: PoolType
  /** Resolved city display name (locale-dependent) + slug for links/filters. */
  cityName: string
  citySlug: string
  neighborhood: string | null
  /** Public (jittered) coordinates for the map; may be null. */
  approxLat: number | null
  approxLng: number | null
  /** Fully-resolved cover image URL (or null when the pool has no photo). */
  coverUrl: string | null
  /** Lowest enabled slot price in MAD (null when no enabled slot). */
  priceFrom: number | null
  /** Average rating (number) or null when unrated. */
  rating: number | null
  reviewCount: number
  maxGuests: number
  heated: boolean
  covered: boolean
  childSafe: boolean
  sheltered: boolean
  amenities: Amenity[]
}

/** A photo with its URL already resolved, for the detail gallery. */
export interface PoolPhotoResolved extends PoolPhoto {
  url: string
}

/** A review enriched with its (public) author profile, for the detail page. */
export interface ReviewWithAuthor extends ReviewRow {
  author: ProfilePublic | null
}

/** Full detail view-model assembled by `usePool(id)`. */
export interface PoolDetail {
  pool: PoolPublic
  /** Resolved city (name in both langs + slug + coords). */
  city: City | null
  cityName: string
  /** Photos ordered by position, cover first, with resolved URLs. */
  photos: PoolPhotoResolved[]
  coverUrl: string | null
  /** Enabled slots only, in canonical order. */
  slots: PoolSlot[]
  priceFrom: number | null
  /** Public owner profile (no phone). */
  owner: ProfilePublic | null
  rating: number | null
  reviewCount: number
  /** Recent pool reviews (target_type = 'pool'), newest first, with authors. */
  reviews: ReviewWithAuthor[]
  /** Upcoming blocked dates/slots for the availability calendar. */
  blockedDates: BlockedDate[]
}
