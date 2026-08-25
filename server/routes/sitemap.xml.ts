// Dynamic sitemap (Nitro route) — emits both locale prefixes (/fr, /ar) for
// every URL, each with xhtml:link rel="alternate" hreflang alternates. Pool
// ids and city slugs are fetched from Supabase via PostgREST using the public
// (anon) key exposed by @nuxtjs/supabase at config.public.supabase.{url,key}.
// The site base URL is config.public.siteUrl (NUXT_PUBLIC_SITE_URL).

interface IdRow {
  id: string
}
interface SlugRow {
  slug: string
}

const LOCALES = ['fr', 'ar'] as const
type Locale = (typeof LOCALES)[number]

function xmlEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&apos;'
    }
  })
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const base = String(config.public.siteUrl || '').replace(/\/+$/, '')
  const supaUrl = String(config.public.supabase?.url || '').replace(/\/+$/, '')
  const supaKey = String(config.public.supabase?.key || '')

  // Fetch published pool ids + active city slugs in parallel. PostgREST errors
  // shouldn't 500 the sitemap — fall back to the static URLs instead.
  let poolIds: string[] = []
  let citySlugs: string[] = []
  if (supaUrl && supaKey) {
    const headers = { apikey: supaKey, Authorization: `Bearer ${supaKey}` }
    const [pools, cities] = await Promise.allSettled([
      $fetch<IdRow[]>(`${supaUrl}/rest/v1/pools_public`, {
        params: { select: 'id' },
        headers,
      }),
      $fetch<SlugRow[]>(`${supaUrl}/rest/v1/cities`, {
        params: { select: 'slug', is_active: 'eq.true' },
        headers,
      }),
    ])
    if (pools.status === 'fulfilled' && Array.isArray(pools.value)) {
      poolIds = pools.value.map((r) => r.id).filter(Boolean)
    }
    if (cities.status === 'fulfilled' && Array.isArray(cities.value)) {
      citySlugs = cities.value.map((r) => r.slug).filter(Boolean)
    }
  }

  // Build the list of path *suffixes* (locale prefix is added per-locale).
  const paths: string[] = [
    '',
    '/search',
    '/comment-ca-marche',
    '/devenir-hote',
    '/conditions',
    '/confidentialite',
    '/blog',
    '/blog/louer-piscine-privee-maroc',
    '/blog/prix-location-piscine-privee-maroc',
    '/blog/location-piscine-marrakech-agadir-rabat',
    '/blog/devenir-hote-piscine-maroc',
    '/blog/meilleures-piscines-casablanca',
  ]
  for (const slug of citySlugs) paths.push(`/piscines/${slug}`)
  for (const id of poolIds) paths.push(`/pools/${id}`)

  function loc(locale: Locale, path: string): string {
    return `${base}/${locale}${path}`
  }

  const urls: string[] = []
  for (const path of paths) {
    for (const locale of LOCALES) {
      const alternates = LOCALES.map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${alt}" href="${xmlEscape(loc(alt, path))}"/>`
      )
      // x-default points at the default locale (fr).
      alternates.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(loc('fr', path))}"/>`
      )
      urls.push(
        `  <url>\n` +
          `    <loc>${xmlEscape(loc(locale, path))}</loc>\n` +
          `${alternates.join('\n')}\n` +
          `  </url>`
      )
    }
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urls.join('\n')}\n` +
    `</urlset>\n`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400')
  return body
})
