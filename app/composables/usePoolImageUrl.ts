// Resolve a pool photo `storage_path` to a displayable URL, and format MAD
// prices. Both are pure helpers (auto-imported) used by the data composables
// and the pool UI.

/**
 * Turn a `pool_photos.storage_path` into a usable image URL.
 *
 * Seed data stores full Unsplash URLs, while real uploads store a bucket key
 * (`<pool_id>/<file>`). If the path already looks like an absolute http(s)
 * URL we return it untouched; otherwise we build the Supabase public URL for
 * the `pool-photos` bucket.
 */
export function usePoolImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null
  if (/^https?:\/\//i.test(storagePath)) return storagePath

  const base = useRuntimeConfig().public.supabase?.url
  if (!base) return null
  const clean = storagePath.replace(/^\/+/, '')
  return `${String(base).replace(/\/+$/, '')}/storage/v1/object/public/pool-photos/${clean}`
}

/**
 * Format a MAD amount like the `common.priceFmt` i18n key ("350 DH" /
 * "350 درهم"), with locale-aware digit grouping. `locale` is the active i18n
 * code; defaults to French.
 */
export function formatMad(n: number | null | undefined, locale: string = 'fr'): string {
  const value = typeof n === 'number' && Number.isFinite(n) ? n : 0
  const lang = locale.startsWith('ar') ? 'ar' : 'fr'
  const grouped = value.toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-MA')
  const currency = lang === 'ar' ? 'درهم' : 'DH'
  return `${grouped} ${currency}`
}
