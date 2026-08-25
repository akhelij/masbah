<script setup lang="ts">
import type { PoolRules, ReviewCategories, SlotKey } from '~/types/db'

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: true })
const config = useRuntimeConfig()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { requireAuth } = useAuthGate()

// The generated Database type is a placeholder, so `supabase.rpc(...)` resolves
// to an `undefined`-args signature. Re-type just the one RPC we call (mirrors
// the casting approach in the data composables).
type PoolContactRow = { owner_phone: string | null; owner_name: string | null }
type PoolContactResult = Promise<{
  data: PoolContactRow[] | null
  error: { message: string } | null
}>
const callContactRpc = supabase.rpc.bind(supabase) as unknown as (
  // eslint-disable-next-line no-unused-vars
  fn: 'get_pool_contact_direct',
  // eslint-disable-next-line no-unused-vars
  args: { p_pool_id: string }
) => PoolContactResult

const id = computed(() => String(route.params.id))
const { detail, pending, refresh } = usePool(id)

// ── Favorites ───────────────────────────────────────────────────────────
const { favoriteIdSet } = useFavorites()
const { toggle } = useToggleFavorite()
const isFavorite = computed(() => favoriteIdSet.value.has(id.value))
function onToggleFav(): void {
  void toggle(id.value, isFavorite.value)
}

// ── Gallery ─────────────────────────────────────────────────────────────
const activePhoto = ref(0)
const photos = computed(() => detail.value?.photos ?? [])
watch(photos, () => {
  activePhoto.value = 0
})

// ── Slot selection ──────────────────────────────────────────────────────
const SLOT_LABELS: Record<SlotKey, string> = {
  morning: 'slots.morning',
  afternoon: 'slots.afternoon',
  evening: 'slots.evening',
  full_day: 'slots.fullDay',
}

const slotOptions = computed(() =>
  (detail.value?.slots ?? []).map((s) => ({
    key: s.slot,
    label: t(SLOT_LABELS[s.slot]),
    sub: formatMad(s.price_mad, locale.value),
  }))
)
const selectedSlot = ref<string | undefined>(undefined)
watch(
  () => detail.value?.slots,
  (slots) => {
    if (slots && slots.length && !selectedSlot.value) selectedSlot.value = slots[0]?.slot
  },
  { immediate: true }
)
const selectedSlotRow = computed(
  () =>
    detail.value?.slots.find((s) => s.slot === selectedSlot.value) ?? detail.value?.slots[0] ?? null
)
const selectedPrice = computed(
  () => selectedSlotRow.value?.price_mad ?? detail.value?.priceFrom ?? null
)
const weekendPremium = computed(() => {
  const max = Math.max(0, ...(detail.value?.slots ?? []).map((s) => s.weekend_premium_pct ?? 0))
  return max > 0 ? max : null
})

// ── Amenities split ─────────────────────────────────────────────────────
function amenityLabel(label_fr: string, label_ar: string): string {
  return locale.value === 'ar' ? label_ar : label_fr
}
const includedAmenities = computed(() =>
  (detail.value?.pool.amenities ?? []).filter((a) => a.included)
)
const paidExtras = computed(() => (detail.value?.pool.amenities ?? []).filter((a) => !a.included))

// ── Rules → checklist ───────────────────────────────────────────────────
interface RuleItem {
  key: string
  allowed: boolean
  label: string
}
const rulesList = computed<RuleItem[]>(() => {
  const r: PoolRules | undefined = detail.value?.pool.rules
  if (!r) return []
  return [
    {
      key: 'kids',
      allowed: r.kids_allowed,
      label: r.kids_allowed ? t('pool.rules.kidsYes') : t('pool.rules.kidsNo'),
    },
    {
      key: 'music',
      allowed: r.music_allowed,
      label: r.music_allowed ? t('pool.rules.musicYes') : t('pool.rules.musicNo'),
    },
    {
      key: 'events',
      allowed: r.events_allowed,
      label: r.events_allowed ? t('pool.rules.eventsYes') : t('pool.rules.eventsNo'),
    },
    {
      key: 'pets',
      allowed: r.pets_allowed,
      label: r.pets_allowed ? t('pool.rules.petsYes') : t('pool.rules.petsNo'),
    },
  ]
})
const quietHours = computed(() => detail.value?.pool.rules?.quiet_hours ?? null)

// ── Key facts ───────────────────────────────────────────────────────────
interface Fact {
  ic: string
  v: string
  l: string
}
const facts = computed<Fact[]>(() => {
  const p = detail.value?.pool
  if (!p) return []
  const out: Fact[] = [
    {
      ic: '👥',
      v: t('pool.facts.guests', { count: p.max_guests }),
      l: t('pool.facts.guestsLabel'),
    },
  ]
  if (p.length_m && p.width_m) {
    out.push({
      ic: '📏',
      v: t('pool.facts.size', { l: p.length_m, w: p.width_m }),
      l: t('pool.facts.sizeLabel'),
    })
  }
  if (p.depth_min != null && p.depth_max != null) {
    out.push({
      ic: '🌊',
      v: t('pool.facts.depth', { min: p.depth_min, max: p.depth_max }),
      l: t('pool.facts.depthLabel'),
    })
  }
  if (p.heated) out.push({ ic: '🌡️', v: t('pool.facts.heated'), l: t('pool.facts.heatedLabel') })
  else if (p.covered)
    out.push({ ic: '⛱️', v: t('pool.facts.covered'), l: t('pool.facts.coveredLabel') })
  else if (p.child_safe)
    out.push({ ic: '🛟', v: t('pool.facts.childSafe'), l: t('pool.facts.childSafeLabel') })
  return out.slice(0, 4)
})

// ── Owner ───────────────────────────────────────────────────────────────
const ownerInitials = computed(() => {
  const name = detail.value?.owner?.full_name?.trim() ?? ''
  if (!name) return '·'
  const parts = name.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (a + b).toUpperCase()
})
const memberYear = computed(() => {
  const created = detail.value?.owner?.created_at
  return created ? new Date(created).getFullYear() : null
})

// ── Direct contact reveal (RPC, auth-gated) ─────────────────────────────
const revealedPhone = ref<string | null>(null)
const contactPending = ref(false)
const contactError = ref<string | null>(null)

async function fetchContact(): Promise<string | null> {
  if (revealedPhone.value) return revealedPhone.value
  contactPending.value = true
  contactError.value = null
  try {
    const { data, error } = await callContactRpc('get_pool_contact_direct', {
      p_pool_id: id.value,
    })
    if (error) {
      contactError.value = t('pool.owner.contactError')
      return null
    }
    const phone = data?.[0]?.owner_phone ?? null
    revealedPhone.value = phone
    return phone
  } finally {
    contactPending.value = false
  }
}

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

function onCall(): void {
  requireAuth('message', () => {
    void fetchContact().then((phone) => {
      if (phone && import.meta.client) window.location.href = `tel:${phone}`
    })
  })
}

function onWhatsApp(): void {
  requireAuth('message', () => {
    void fetchContact().then((phone) => {
      if (phone && import.meta.client) {
        // Pre-filled message: opening an empty chat makes people freeze, and the
        // owner gets no context about which listing the message is about.
        const text = `${t('pool.waPrefill', { title: detail.value?.pool.title ?? '' })}\n${listingUrl.value}`
        window.open(
          `https://wa.me/${digitsOnly(phone)}?text=${encodeURIComponent(text)}`,
          '_blank',
          'noopener'
        )
      }
    })
  })
}

// ── Share ───────────────────────────────────────────────────────────────
const listingUrl = computed(() => `${config.public.siteUrl}${localePath(`/pools/${id.value}`)}`)

async function onShare(): Promise<void> {
  if (!import.meta.client || !detail.value) return
  const title = detail.value.pool.title
  const text = t('pool.shareText', { title })
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: listingUrl.value })
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  } else {
    // Desktop fallback: WhatsApp share (the dominant channel in Morocco).
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${listingUrl.value}`)}`,
      '_blank',
      'noopener'
    )
  }
}

// ── Reserve CTA ─────────────────────────────────────────────────────────
// When the visitor picked a (future) date in the Disponibilités section, the
// booking flow is deep-linked with ?date= (+ the selected slot) so step 1
// arrives pre-filled.
function onReserve(): void {
  const query: Record<string, string> = {}
  if (visitDate.value && visitDate.value >= todayIso()) {
    query.date = visitDate.value
    if (selectedSlot.value) query.slot = selectedSlot.value
  }
  requireAuth('booking', () => navigateTo({ path: localePath(`/pools/${id.value}/book`), query }))
}

// ── Reviews ─────────────────────────────────────────────────────────────
const CAT_KEYS: (keyof ReviewCategories)[] = [
  'proprete',
  'conformite',
  'communication',
  'confidentialite',
]
const categoryAverages = computed(() => {
  const reviews = detail.value?.reviews ?? []
  return CAT_KEYS.map((key) => {
    const vals = reviews
      .map((r) => r.categories?.[key])
      .filter((v): v is number => typeof v === 'number')
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    return { key, avg }
  }).filter((c) => c.avg !== null)
})
function reviewInitials(name: string | null | undefined): string {
  const n = (name ?? '').trim()
  if (!n) return '·'
  const parts = n.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (a + b).toUpperCase()
}
function reviewDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale.value === 'ar' ? 'ar-MA' : 'fr-MA', {
    month: 'long',
    year: 'numeric',
  })
}

// Per-review category chips (only the axes that were actually rated).
const REVIEW_CAT_KEYS: (keyof ReviewCategories)[] = [
  'proprete',
  'conformite',
  'rapport',
  'communication',
  'confidentialite',
]
function reviewCats(categories: ReviewCategories | null | undefined): {
  key: string
  label: string
  value: number
}[] {
  if (!categories) return []
  return REVIEW_CAT_KEYS.filter((k) => typeof categories[k] === 'number').map((k) => ({
    key: k,
    label: t(`pool.reviews_section.cat.${k}`),
    value: categories[k] as number,
  }))
}

// ── Owner reply (only the signed-in pool owner) ─────────────────────────────
// Resolve the caller's own id via own-row RLS on `profiles` (the user ref's id
// is unreliable). When it matches the pool's owner_id, show a reply box on each
// un-replied review.
const myId = ref<string | null>(null)
watch(
  () => detail.value?.owner?.id,
  async () => {
    if (!user.value) {
      myId.value = null
      return
    }
    const { data } = await supabase.from('profiles').select('id').maybeSingle()
    myId.value = (data as unknown as { id: string } | null)?.id ?? null
  },
  { immediate: true }
)
const isOwner = computed(
  () => !!myId.value && !!detail.value?.owner?.id && myId.value === detail.value.owner.id
)

const { reply: sendReply, pending: replyPending, error: replyError } = useReplyToReview()
const replyOpenId = ref<string | null>(null)
const replyText = ref('')
function openReply(reviewId: string): void {
  replyError.value = null
  replyText.value = ''
  replyOpenId.value = reviewId
}
function cancelReply(): void {
  replyOpenId.value = null
  replyText.value = ''
}
async function submitReply(reviewId: string): Promise<void> {
  const ok = await sendReply(reviewId, replyText.value)
  if (ok) {
    replyOpenId.value = null
    replyText.value = ''
    await refresh()
  }
}

// ── Availability (simple list of next blocked dates) ────────────────────
// Lightweight date selection: picking a date here (plus the slot selected in
// the slot picker) deep-links the Réserver flow — see onReserve above.
const visitDate = ref('')

const blockedList = computed(() => {
  const blocked = detail.value?.blockedDates ?? []
  return blocked.slice(0, 12).map((b) => ({
    id: b.id,
    date: new Date(b.date).toLocaleDateString(locale.value === 'ar' ? 'ar-MA' : 'fr-MA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }),
    slot: b.slot ? t(SLOT_LABELS[b.slot]) : null,
  }))
})

// ── Location line ───────────────────────────────────────────────────────
const locationLine = computed(() => {
  const n = detail.value?.pool.neighborhood
  const c = detail.value?.cityName ?? ''
  return n ? `${n} · ${c}` : c
})

// ── SEO + JSON-LD ───────────────────────────────────────────────────────
const pageTitle = computed(() => {
  const d = detail.value
  if (!d) return 'Masbah'
  return `${d.pool.title} — ${d.cityName} | Masbah`
})
const pageDescription = computed(() => {
  const d = detail.value
  if (!d) return t('home.subtitle')
  return d.pool.description?.slice(0, 160) ?? t('home.subtitle')
})

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value,
  ogTitle: () => pageTitle.value,
  ogDescription: () => pageDescription.value,
  ogImage: () => detail.value?.coverUrl ?? `${config.public.siteUrl}/pwa-512x512.png`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

const jsonLd = computed(() => {
  const d = detail.value
  if (!d) return null
  const base = config.public.siteUrl
  const currentPath = `${base}${localePath(`/pools/${id.value}`)}`
  const cityPath = `${base}${localePath(`/piscines/${d.citySlug}`)}`

  const productLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${currentPath}#product`,
    name: d.pool.title,
    description: d.pool.description ?? undefined,
    image: d.photos.map((p) => p.url).slice(0, 6),
    category: 'Pool rental',
    areaServed: {
      '@type': 'City',
      name: d.cityName,
      ...(d.pool.neighborhood ? { containsPlace: d.pool.neighborhood } : {}),
      addressCountry: 'MA',
    },
  }
  if (d.priceFrom != null) {
    productLd.offers = {
      '@type': 'Offer',
      priceCurrency: 'MAD',
      price: d.priceFrom,
      availability: 'https://schema.org/InStock',
    }
  }
  if (d.rating != null && d.reviewCount > 0) {
    productLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: d.rating,
      reviewCount: d.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  const breadcrumbLd = {
    '@type': 'BreadcrumbList',
    '@id': `${currentPath}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale.value === 'ar' ? 'الرئيسية' : 'Accueil',
        item: `${base}${localePath('/')}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: d.cityName,
        item: cityPath,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: d.pool.title,
        item: currentPath,
      },
    ],
  }

  return { '@context': 'https://schema.org', '@graph': [productLd, breadcrumbLd] }
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: [...(localeHead.value.link ?? [])],
  meta: [...(localeHead.value.meta ?? [])],
  script: jsonLd.value
    ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd.value) }]
    : [],
}))
</script>

<template>
  <div class="listing">
    <!-- ░░ NOT FOUND ░░ -->
    <div v-if="!detail && !pending" class="wrap notfound">
      <span class="state-ill">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
          <path d="M9 10h6M12 7v6" />
        </svg>
      </span>
      <h1 class="t-h2" style="margin-top: 1rem">{{ t('pool.notFoundTitle') }}</h1>
      <p class="t-body muted" style="margin-top: 0.5rem; max-width: 42ch">
        {{ t('pool.notFoundBody') }}
      </p>
      <NuxtLink :to="localePath('/')" class="btn btn-primary" style="margin-top: 1.4rem">
        {{ t('pool.backHome') }}
      </NuxtLink>
    </div>

    <!-- ░░ SKELETON ░░ -->
    <div v-else-if="pending" class="wrap sk-wrap">
      <div class="skel sk-hero" />
      <div class="sk-cols">
        <div>
          <div class="skel" style="height: 28px; width: 70%; margin-top: 1.2rem" />
          <div class="skel" style="height: 14px; width: 45%; margin-top: 0.7rem" />
          <div class="skel sk-owner" />
          <div
            class="skel"
            style="height: 200px; margin-top: 1.2rem; border-radius: var(--r-2xl)"
          />
        </div>
        <div class="skel sk-book hidden lg:block" />
      </div>
    </div>

    <!-- ░░ CONTENT ░░ -->
    <template v-else-if="detail">
      <!-- 1 · GALLERY -->
      <div class="wrap gallery-wrap">
        <div v-if="photos.length" class="gallery">
          <button class="gallery-main" type="button">
            <NuxtImg
              :src="photos[activePhoto]?.url"
              :alt="t('pool.photoAlt', { n: activePhoto + 1, title: detail.pool.title })"
              sizes="sm:100vw md:66vw lg:60vw"
              format="webp"
              loading="eager"
            />
          </button>
          <div v-if="photos.length > 1" class="gallery-thumbs scroll-x">
            <button
              v-for="(ph, i) in photos"
              :key="ph.id"
              class="gallery-thumb"
              :class="{ 'is-on': i === activePhoto }"
              type="button"
              :aria-label="t('pool.photoAlt', { n: i + 1, title: detail.pool.title })"
              @click="activePhoto = i"
            >
              <NuxtImg
                :src="ph.url"
                :alt="t('pool.photoAlt', { n: i + 1, title: detail.pool.title })"
                width="120"
                height="90"
                format="webp"
                loading="lazy"
              />
            </button>
          </div>
        </div>
        <div v-else class="gallery-empty">
          <span>{{ t('pool.noPhoto') }}</span>
        </div>
      </div>

      <main class="wrap detail-grid">
        <!-- ░ LEFT ░ -->
        <div class="detail-main">
          <!-- 2 · HEADER -->
          <div class="detail-head">
            <div class="badges">
              <span class="badge badge-verified">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                {{ t('pool.verified') }}
              </span>
              <span v-if="detail.pool.sheltered_from_view" class="badge badge-privacy">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68M6.6 6.6A13.2 13.2 0 0 0 2 12s3 8 10 8a9.1 9.1 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"
                  />
                </svg>
                {{ t('pool.sheltered') }}
              </span>
            </div>

            <div class="title-row">
              <h1 class="t-h2">{{ detail.pool.title }}</h1>
              <button
                class="share-inline"
                type="button"
                :aria-label="t('pool.share')"
                @click="onShare"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
              <button
                class="fav fav-inline"
                :class="{ 'is-on': isFavorite }"
                type="button"
                :aria-label="isFavorite ? t('pool.unfavorite') : t('pool.favorite')"
                :aria-pressed="isFavorite"
                @click="onToggleFav"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"
                  />
                </svg>
              </button>
            </div>

            <div class="meta-row">
              <PRating
                v-if="detail.rating != null"
                :rating="detail.rating"
                :count="detail.reviewCount"
                size="sm"
                show-value
              />
              <span v-if="detail.rating != null" aria-hidden="true">·</span>
              <span class="loc">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {{ locationLine }}
              </span>
            </div>
          </div>

          <!-- 3 · OWNER CARD -->
          <div class="owner-card">
            <div class="owner-top">
              <NuxtLink
                v-if="detail.owner"
                :to="localePath('/membres/' + detail.owner.id)"
                class="owner-avatar-link"
                :aria-label="detail.owner.full_name || t('pool.owner.title')"
              >
                <span class="avatar owner-avatar">{{ ownerInitials }}</span>
              </NuxtLink>
              <span v-else class="avatar owner-avatar">{{ ownerInitials }}</span>
              <div style="flex: 1; min-width: 0">
                <div class="owner-name-row">
                  <NuxtLink
                    v-if="detail.owner"
                    :to="localePath('/membres/' + detail.owner.id)"
                    class="owner-name owner-name-link"
                  >
                    {{ detail.owner.full_name || t('pool.owner.title') }}
                  </NuxtLink>
                  <strong v-else class="owner-name">{{ t('pool.owner.title') }}</strong>
                  <span v-if="detail.owner?.phone_verified" class="badge badge-phone">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.4"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {{ t('pool.owner.phoneVerified') }}
                  </span>
                </div>
                <div v-if="memberYear" class="t-sm muted" style="margin-top: 0.15rem">
                  {{ t('pool.owner.memberSince', { year: memberYear }) }}
                </div>
              </div>
            </div>

            <template v-if="detail.pool.direct_contact_enabled">
              <p class="t-sm muted owner-reassure">{{ t('pool.owner.reassure') }}</p>
              <div class="owner-actions">
                <button
                  class="btn btn-secondary"
                  type="button"
                  :disabled="contactPending"
                  @click="onCall"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.1 4.18 2 2 0 0 1 5.1 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"
                    />
                  </svg>
                  <span v-if="revealedPhone">{{ revealedPhone }}</span>
                  <span v-else>{{ t('pool.owner.call') }}</span>
                </button>
                <PButton variant="whatsapp" :loading="contactPending" @click="onWhatsApp">
                  <template #icon>
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path
                        d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02zm-7.01 15.24a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24z"
                      />
                    </svg>
                  </template>
                  {{ t('pool.owner.whatsapp') }}
                </PButton>
              </div>
              <p v-if="contactError" class="hint-err" style="margin-top: 0.5rem">
                {{ contactError }}
              </p>
            </template>

            <div v-else class="owner-locked">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <strong class="t-sm">{{ t('pool.owner.lockedTitle') }}</strong>
                <p class="t-sm muted" style="margin-top: 0.2rem">
                  {{ t('pool.owner.lockedBody') }}
                </p>
              </div>
            </div>
          </div>

          <!-- 4 · KEY FACTS -->
          <div v-if="facts.length" class="sec sec-first">
            <div class="facts">
              <div v-for="(f, i) in facts" :key="i" class="fact">
                <span class="fact-ic">{{ f.ic }}</span>
                <div>
                  <div class="fact-v">{{ f.v }}</div>
                  <div class="fact-l">{{ f.l }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 5 · ABOUT -->
          <div v-if="detail.pool.description" class="sec">
            <h2>{{ t('pool.about') }}</h2>
            <p class="t-body" style="white-space: pre-line">{{ detail.pool.description }}</p>
          </div>

          <!-- 6 · ÉQUIPEMENTS & EXTRAS -->
          <div v-if="includedAmenities.length || paidExtras.length" class="sec">
            <h2>{{ t('pool.amenities.title') }}</h2>
            <div v-if="includedAmenities.length" class="eq-grid">
              <div v-for="(a, i) in includedAmenities" :key="i" class="eq">
                <span class="eq-tick">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span>{{ amenityLabel(a.label_fr, a.label_ar) }}</span>
              </div>
            </div>

            <template v-if="paidExtras.length">
              <div class="extras-label">{{ t('pool.amenities.extras') }}</div>
              <div class="extras-list">
                <div v-for="(a, i) in paidExtras" :key="i" class="extra">
                  <span>{{ amenityLabel(a.label_fr, a.label_ar) }}</span>
                  <span class="price-tag">
                    +{{ formatMad(a.price, locale)
                    }}<template v-if="a.per_person"> {{ t('common.perPerson') }}</template>
                  </span>
                </div>
              </div>
            </template>
          </div>

          <!-- 7 · RÈGLEMENT -->
          <div v-if="rulesList.length" class="sec">
            <h2>{{ t('pool.rules.title') }}</h2>
            <div class="rules-grid">
              <div
                v-for="r in rulesList"
                :key="r.key"
                class="rule"
                :class="{ 'rule-no': !r.allowed }"
              >
                <span :class="r.allowed ? 'rule-yes' : 'rule-no-ic'">
                  <svg
                    v-if="r.allowed"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <svg
                    v-else
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </span>
                <span>{{ r.label }}</span>
              </div>
              <div v-if="quietHours" class="rule">
                <span class="rule-yes">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>
                <span>{{ t('pool.rules.quietHours', { hours: quietHours }) }}</span>
              </div>
            </div>
          </div>

          <!-- 8 · SLOTS (mobile inline; desktop in booking card) -->
          <div class="sec lg:hidden">
            <h2>{{ t('pool.slots.title') }}</h2>
            <PSlotPicker v-if="slotOptions.length" v-model="selectedSlot" :options="slotOptions" />
            <p v-else class="t-sm muted">{{ t('pool.slots.empty') }}</p>
            <p v-if="weekendPremium" class="t-sm muted weekend-note">
              {{ t('pool.slots.weekendNote', { pct: weekendPremium }) }}
            </p>
          </div>

          <!-- 9 · AVAILABILITY -->
          <div class="sec">
            <h2>{{ t('pool.availability.title') }}</h2>
            <p class="t-sm muted" style="margin-top: -0.4rem; margin-bottom: 0.8rem">
              {{ t('pool.availability.subtitle') }}
            </p>
            <PDatePicker
              v-model="visitDate"
              class="avail-date"
              :label="t('pool.availability.dateLabel')"
              :hint="visitDate ? t('pool.availability.dateHint') : undefined"
            />
            <div v-if="blockedList.length" class="blocked-list">
              <span v-for="b in blockedList" :key="b.id" class="blocked-chip">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                {{ b.date }}<template v-if="b.slot"> · {{ b.slot }}</template>
              </span>
            </div>
            <p v-else class="t-sm muted">{{ t('pool.availability.available') }}</p>
          </div>

          <!-- 10 · LOCATION (approximate map) -->
          <div v-if="detail.pool.approx_lat != null && detail.pool.approx_lng != null" class="sec">
            <h2>{{ t('pool.location.title') }}</h2>
            <ClientOnly>
              <PoolMap
                :lat="detail.pool.approx_lat"
                :lng="detail.pool.approx_lng"
                :label="t('pool.location.mapAlt')"
              />
              <template #fallback>
                <div class="skel map-fallback" />
              </template>
            </ClientOnly>
            <div class="loc-note">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--aqua-700)"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <strong>{{ locationLine }}</strong>
                <p class="t-sm muted" style="margin-top: 0.2rem">{{ t('pool.location.approx') }}</p>
              </div>
            </div>
          </div>

          <!-- 11 · REVIEWS -->
          <div class="sec">
            <h2 class="reviews-head">
              <svg viewBox="0 0 24 24" fill="var(--amber)" aria-hidden="true">
                <path
                  d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
                />
              </svg>
              <span v-if="detail.rating != null">
                {{
                  t('pool.reviews_section.summary', {
                    rating: detail.rating.toLocaleString(locale),
                    count: detail.reviewCount,
                  })
                }}
              </span>
              <span v-else>{{ t('pool.reviews_section.title') }}</span>
            </h2>

            <template v-if="detail.reviews.length">
              <div v-if="categoryAverages.length" class="rev-bars">
                <div v-for="c in categoryAverages" :key="c.key" class="rev-bar">
                  <span class="rev-nm">{{ t(`pool.reviews_section.cat.${c.key}`) }}</span>
                  <span class="rev-track">
                    <span class="rev-fill" :style="{ width: `${((c.avg ?? 0) / 5) * 100}%` }" />
                  </span>
                  <span class="rev-vv">{{
                    (c.avg ?? 0).toLocaleString(locale, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })
                  }}</span>
                </div>
              </div>

              <div class="rev-cards">
                <div v-for="rev in detail.reviews" :key="rev.id" class="rev-card">
                  <div class="rev-author">
                    <NuxtLink
                      v-if="rev.author"
                      :to="localePath('/membres/' + rev.author.id)"
                      class="rev-avatar-link"
                      :aria-label="rev.author.full_name || ''"
                    >
                      <span class="avatar rev-avatar">{{
                        reviewInitials(rev.author?.full_name)
                      }}</span>
                    </NuxtLink>
                    <span v-else class="avatar rev-avatar">{{ reviewInitials(null) }}</span>
                    <div>
                      <NuxtLink
                        v-if="rev.author"
                        :to="localePath('/membres/' + rev.author.id)"
                        class="rev-author-name rev-author-link"
                      >
                        {{ rev.author.full_name || '—' }}
                      </NuxtLink>
                      <strong v-else class="rev-author-name">—</strong>
                      <div class="t-sm muted">{{ reviewDate(rev.created_at) }}</div>
                    </div>
                  </div>
                  <PRating :rating="rev.rating" size="sm" style="margin-top: 0.5rem" />

                  <!-- category chips -->
                  <div v-if="reviewCats(rev.categories).length" class="rev-chips">
                    <span v-for="c in reviewCats(rev.categories)" :key="c.key" class="rev-chip">
                      {{ c.label }}
                      <strong>{{ c.value.toLocaleString(locale) }}</strong>
                    </span>
                  </div>

                  <p v-if="rev.comment" class="t-body" style="margin-top: 0.5rem">
                    {{ rev.comment }}
                  </p>

                  <!-- owner's public reply -->
                  <div v-if="rev.reply" class="rev-reply">
                    <div class="rev-reply-head">
                      <strong class="t-sm">{{
                        t('pool.reviews_section.replyFrom', {
                          name: detail.owner?.full_name || t('pool.owner.title'),
                        })
                      }}</strong>
                      <PBadge variant="host">{{ t('pool.reviews_section.hostBadge') }}</PBadge>
                    </div>
                    <p class="t-sm" style="margin-top: 0.4rem">{{ rev.reply }}</p>
                  </div>

                  <!-- owner reply composer (signed-in pool owner, un-replied) -->
                  <template v-else-if="isOwner">
                    <PButton
                      v-if="replyOpenId !== rev.id"
                      variant="ghost"
                      size="sm"
                      style="margin-top: 0.5rem"
                      @click="openReply(rev.id)"
                    >
                      <template #icon>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path
                            d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"
                          />
                        </svg>
                      </template>
                      {{ t('pool.reviews_section.replyCta') }}
                    </PButton>
                    <div v-else class="rev-reply-box">
                      <p class="t-sm reply-hint">{{ t('pool.reviews_section.replyHint') }}</p>
                      <textarea
                        v-model="replyText"
                        class="ta"
                        rows="3"
                        :placeholder="t('pool.reviews_section.replyPlaceholder')"
                      />
                      <p v-if="replyError" class="hint-err" style="margin-top: 0.4rem">
                        {{ t(replyError) }}
                      </p>
                      <div class="rev-reply-acts">
                        <PButton
                          variant="ghost"
                          size="sm"
                          :disabled="replyPending"
                          @click="cancelReply"
                        >
                          {{ t('pool.reviews_section.replyCancel') }}
                        </PButton>
                        <PButton
                          size="sm"
                          :loading="replyPending"
                          :disabled="!replyText.trim()"
                          @click="submitReply(rev.id)"
                        >
                          {{ t('pool.reviews_section.replySend') }}
                        </PButton>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </template>

            <div v-else class="reviews-empty">
              <strong>{{ t('pool.reviews_section.empty') }}</strong>
              <p class="t-sm muted" style="margin-top: 0.3rem">
                {{ t('pool.reviews_section.emptyBody') }}
              </p>
            </div>
          </div>
        </div>

        <!-- ░ DESKTOP BOOKING CARD ░ -->
        <aside class="booking-card hidden lg:block">
          <div class="bc-price-row">
            <span class="muted t-sm">{{ t('common.from') }}</span>
            <strong class="bc-price">{{ formatMad(selectedPrice, locale) }}</strong>
            <span v-if="selectedSlotRow" class="muted t-sm">
              {{ t('common.perSlot') }}
            </span>
          </div>
          <div v-if="detail.rating != null" class="bc-rating">
            <PRating :rating="detail.rating" :count="detail.reviewCount" size="sm" show-value />
          </div>

          <div class="bc-slots">
            <div class="bc-label">{{ t('pool.slots.title') }}</div>
            <PSlotPicker v-if="slotOptions.length" v-model="selectedSlot" :options="slotOptions" />
            <p v-else class="t-sm muted">{{ t('pool.slots.empty') }}</p>
            <p v-if="weekendPremium" class="t-sm muted weekend-note">
              {{ t('pool.slots.weekendNote', { pct: weekendPremium }) }}
            </p>
          </div>

          <PButton block size="lg" style="margin-top: 0.9rem" @click="onReserve">
            {{ t('pool.requestToBook') }}
          </PButton>
          <PButton
            v-if="detail.pool.direct_contact_enabled"
            variant="whatsapp"
            block
            :loading="contactPending"
            style="margin-top: 0.6rem"
            @click="onWhatsApp"
          >
            <template #icon>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02z"
                />
              </svg>
            </template>
            {{ t('pool.owner.whatsapp') }}
          </PButton>

          <div class="reassure">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            {{ t('home.cash.title') }}
          </div>
          <p class="t-sm muted bc-nocharge">{{ t('pool.noCharge') }}</p>
        </aside>
      </main>

      <!-- ░░ STICKY ACTION BAR (mobile) ░░ -->
      <div class="actionbar listing-actionbar lg:hidden">
        <div class="ab-price">
          <div class="muted ab-from">{{ t('common.from') }}</div>
          <strong class="ab-amount">{{ formatMad(selectedPrice, locale) }}</strong>
          <div v-if="selectedSlotRow" class="muted ab-slot">{{ t('common.perSlot') }}</div>
        </div>
        <PIconButton
          v-if="detail.pool.direct_contact_enabled"
          variant="whatsapp"
          :label="t('pool.owner.whatsapp')"
          class="ab-wa"
          @click="onWhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02z"
            />
          </svg>
        </PIconButton>
        <PButton class="ab-reserve" @click="onReserve">{{ t('pool.reserve') }}</PButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.listing {
  padding-bottom: 2rem;
}

/* ── not found / skeletons ────────────────────────────────────────── */
.notfound {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block: clamp(3rem, 8vw, 5rem);
}
.state-ill {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 34%, var(--aqua-100), var(--aqua-50));
  display: grid;
  place-items: center;
  color: var(--aqua-700);
}
.state-ill svg {
  width: 42px;
  height: 42px;
}
.sk-wrap {
  padding-top: 1.2rem;
}
.sk-hero {
  height: clamp(220px, 40vw, 420px);
  border-radius: var(--r-2xl);
}
.sk-cols {
  display: grid;
  gap: 2.5rem;
}
.sk-owner {
  height: 130px;
  margin-top: 1.2rem;
  border-radius: var(--r-2xl);
}
.sk-book {
  height: 420px;
  border-radius: var(--r-2xl);
}
@media (min-width: 1024px) {
  .sk-cols {
    grid-template-columns: 1fr 368px;
  }
}

/* ── gallery ──────────────────────────────────────────────────────── */
.gallery-wrap {
  padding-top: 1.2rem;
}
.gallery-main {
  display: block;
  width: 100%;
  border: none;
  padding: 0;
  background: var(--sand-2);
  border-radius: var(--r-2xl);
  overflow: hidden;
  aspect-ratio: 16 / 10;
  cursor: zoom-in;
}
.gallery-main :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.gallery-thumbs {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-bottom: 0.2rem;
}
.gallery-thumb {
  flex: 0 0 auto;
  width: 92px;
  height: 70px;
  border-radius: var(--r-md);
  overflow: hidden;
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
  background: var(--sand-2);
}
.gallery-thumb.is-on {
  border-color: var(--aqua-600);
}
.gallery-thumb :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.gallery-empty {
  aspect-ratio: 16 / 9;
  border-radius: var(--r-2xl);
  background: var(--sand-2);
  display: grid;
  place-items: center;
  color: var(--ink-faint);
  font-weight: 600;
}

/* ── detail grid ──────────────────────────────────────────────────── */
.detail-grid {
  padding-top: 1rem;
  display: grid;
  gap: 2.5rem;
  align-items: start;
}
@media (min-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr 368px;
  }
}
.detail-main {
  min-width: 0;
}

/* header */
.detail-head {
  padding-block: 0.4rem 0.4rem;
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.7rem;
}
.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
}
.fav-inline {
  position: static;
  flex: none;
  width: 44px;
  height: 44px;
  border: 1.5px solid var(--line-strong);
  background: #fff;
}
.fav-inline:hover {
  border-color: var(--coral);
}
.share-inline {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px solid var(--line-strong);
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ink);
}
.share-inline:hover {
  border-color: var(--aqua-600);
  color: var(--aqua-700);
}
.share-inline svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  color: var(--ink-muted);
}
.loc {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.loc svg {
  width: 16px;
  height: 16px;
}

/* owner card */
.owner-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  padding: 1.1rem;
  margin-top: 1rem;
}
.owner-top {
  display: flex;
  gap: 0.9rem;
  align-items: center;
}
.owner-avatar {
  width: 56px;
  height: 56px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #fb7185, #f43f5e);
}
.owner-name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.owner-name {
  font-size: 1.05rem;
}
.owner-reassure {
  margin: 0.8rem 0;
}
.owner-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
.owner-locked {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
  margin-top: 0.9rem;
  padding: 0.8rem;
  background: var(--aqua-50);
  border-radius: var(--r-lg);
}
.owner-locked svg {
  width: 22px;
  height: 22px;
  color: var(--aqua-700);
  flex: none;
  margin-top: 1px;
}

/* sections */
.sec {
  padding-block: 1.4rem;
  border-top: 1px solid var(--line);
  margin-top: 0.4rem;
}
.sec-first {
  border-top: none;
}
.sec h2 {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 0.9rem;
}

/* facts */
.facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}
@media (min-width: 560px) {
  .facts {
    grid-template-columns: repeat(4, 1fr);
  }
}
.fact {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 0.7rem 0.8rem;
}
.fact-ic {
  font-size: 1.25rem;
  line-height: 1;
}
.fact-v {
  font-weight: 700;
  font-size: 0.88rem;
}
.fact-l {
  font-size: 0.72rem;
  color: var(--ink-muted);
}

/* amenities */
.eq-grid {
  display: grid;
  gap: 0.1rem 1.4rem;
}
@media (min-width: 560px) {
  .eq-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.eq {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0;
}
.eq-tick {
  color: var(--success);
  flex: none;
}
.eq-tick svg {
  width: 18px;
  height: 18px;
}
.extras-label {
  font-size: 0.8125rem;
  color: var(--ink-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 1.1rem 0 0.6rem;
}
.extras-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: #fff;
}
.price-tag {
  font-weight: 700;
  color: var(--aqua-800);
  background: var(--aqua-50);
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  font-size: 0.82rem;
  white-space: nowrap;
}

/* rules */
.rules-grid {
  display: grid;
  gap: 0 1.4rem;
}
@media (min-width: 560px) {
  .rules-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.rule {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0;
  font-weight: 500;
}
.rule-no {
  color: var(--ink-muted);
}
.rule-yes {
  color: var(--success);
  flex: none;
}
.rule-no-ic {
  color: var(--danger);
  flex: none;
}
.rule svg {
  width: 19px;
  height: 19px;
}
.weekend-note {
  margin-top: 0.7rem;
}

/* availability */
.avail-date {
  max-width: 18rem;
  margin-bottom: 0.9rem;
}
.blocked-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.blocked-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.7rem;
  border-radius: var(--r-pill);
  background: var(--danger-soft);
  color: var(--danger-deep);
  font-size: 0.8rem;
  font-weight: 600;
}
.blocked-chip svg {
  width: 13px;
  height: 13px;
}

/* location */
.map-fallback {
  height: 280px;
  border-radius: var(--r-2xl);
}
.loc-note {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  margin-top: 0.8rem;
}
.loc-note svg {
  width: 20px;
  height: 20px;
  flex: none;
  margin-top: 1px;
}

/* reviews */
.reviews-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.reviews-head svg {
  width: 22px;
  height: 22px;
}
.rev-bars {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.7rem;
  margin-bottom: 1.3rem;
}
@media (min-width: 560px) {
  .rev-bars {
    grid-template-columns: 1fr 1fr;
    gap: 0.7rem 1.8rem;
  }
}
.rev-bar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.rev-nm {
  flex: none;
  width: 9.5rem;
  font-size: 0.86rem;
  font-weight: 600;
}
.rev-track {
  flex: 1;
  height: 6px;
  border-radius: 99px;
  background: var(--sand-2);
  overflow: hidden;
}
.rev-fill {
  display: block;
  height: 100%;
  background: var(--aqua-600);
  border-radius: 99px;
}
.rev-vv {
  flex: none;
  font-weight: 700;
  font-size: 0.82rem;
  width: 2rem;
  text-align: end;
}
.rev-cards {
  display: grid;
  gap: 0.8rem;
}
@media (min-width: 560px) {
  .rev-cards {
    grid-template-columns: 1fr 1fr;
  }
}
.rev-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 1.1rem;
  box-shadow: var(--sh-sm);
}
.rev-author {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.rev-avatar {
  width: 40px;
  height: 40px;
  font-size: 0.85rem;
  background: linear-gradient(135deg, #22d3ee, #0e7490);
}
.rev-author-name {
  font-size: 0.95rem;
  font-weight: 700;
}
.rev-author-link,
.owner-name-link {
  color: var(--ink);
  text-decoration: none;
}
.rev-author-link:hover,
.owner-name-link:hover {
  color: var(--aqua-800);
  text-decoration: underline;
}
.rev-author-link:focus-visible,
.owner-name-link:focus-visible,
.rev-avatar-link:focus-visible,
.owner-avatar-link:focus-visible {
  outline: none;
  border-radius: var(--r-sm);
  box-shadow: var(--focus);
}
.rev-avatar-link,
.owner-avatar-link {
  flex: none;
  border-radius: 999px;
}

/* per-review category chips */
.rev-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.6rem;
}
.rev-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--aqua-50);
  color: var(--aqua-800);
  font-size: 0.76rem;
  font-weight: 600;
  padding: 0.25rem 0.55rem;
  border-radius: var(--r-pill);
}
.rev-chip strong {
  font-weight: 800;
}

/* owner reply */
.rev-reply {
  margin-top: 0.9rem;
  padding: 0.85rem 0.95rem;
  background: var(--aqua-50);
  border-radius: var(--r-lg);
  border-inline-start: 3px solid var(--aqua-400);
}
.rev-reply-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.rev-reply-box {
  margin-top: 0.7rem;
}
.reply-hint {
  color: var(--aqua-800);
  background: var(--aqua-50);
  border-radius: var(--r-md);
  padding: 0.5rem 0.65rem;
  margin-bottom: 0.5rem;
}
.rev-reply-acts {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.6rem;
}
.reviews-empty {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 1.4rem;
  text-align: center;
}

/* booking card */
.booking-card {
  position: sticky;
  top: 88px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-card);
  padding: 1.2rem;
  align-self: start;
}
.bc-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
}
.bc-price {
  font-size: 1.5rem;
}
.bc-rating {
  margin-bottom: 1rem;
}
.bc-slots {
  margin-bottom: 0.4rem;
}
.bc-label {
  font-size: 0.8125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.reassure {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--amber-ink);
  background: var(--amber-soft);
  border-radius: var(--r-md);
  padding: 0.5rem 0.7rem;
  margin-top: 0.8rem;
}
.reassure svg {
  width: 16px;
  height: 16px;
  flex: none;
}
.bc-nocharge {
  text-align: center;
  margin-top: 0.7rem;
}

/* sticky action bar */
.listing-actionbar {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 45;
  padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom));
}
.ab-price {
  flex: none;
  line-height: 1.12;
}
.ab-from,
.ab-slot {
  font-size: 0.68rem;
}
.ab-amount {
  font-size: 1.05rem;
}
.ab-wa {
  margin-inline-start: auto;
}
.ab-reserve {
  flex: 1;
  min-height: 50px;
}

/* On mobile the page sits above BOTH the app tab bar and this action bar. */
@media (max-width: 1023px) {
  .listing {
    padding-bottom: 96px;
  }
}
</style>
