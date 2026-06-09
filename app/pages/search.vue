<script setup lang="ts">
// S3 — Search results (SSR). Filters are read from and written back to the URL
// query so results are shareable and server-rendered. A reactive `filters`
// object is derived from the query and passed to usePools(); on any change we
// router.replace() the query (which re-runs the composable via its watcher).
import type { PoolFilters } from '~/composables/usePools'
import type { PoolListItem, SlotKey } from '~/types/db'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const localeHead = useLocaleHead({ seo: true })
const config = useRuntimeConfig()

// ── Amenity catalogue (keys mirror seed `amenities[].key`) ───────────────
const AMENITY_KEYS = [
  'barbecue',
  'parking',
  'transats',
  'douche',
  'wifi',
  'cuisine',
  'abri',
] as const
type AmenityKey = (typeof AMENITY_KEYS)[number]

const SORT_VALUES = ['recent', 'price_asc', 'price_desc', 'rating'] as const
type SortValue = (typeof SORT_VALUES)[number]

const SLOT_VALUES: SlotKey[] = ['morning', 'afternoon', 'evening', 'full_day']
const SLOT_LABELS: Record<SlotKey, string> = {
  morning: 'slots.morning',
  afternoon: 'slots.afternoon',
  evening: 'slots.evening',
  full_day: 'slots.fullDay',
}

// ── Parse the query → typed local state ──────────────────────────────────
function strParam(v: unknown): string {
  return Array.isArray(v) ? (v[0] ?? '') : typeof v === 'string' ? v : ''
}
function numParam(v: unknown): number | null {
  const s = strParam(v)
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const cityModel = ref<string>(strParam(route.query.city))
const slotModel = ref<string>(
  SLOT_VALUES.includes(strParam(route.query.slot) as SlotKey) ? strParam(route.query.slot) : ''
)
const amenityModel = ref<AmenityKey[]>(
  strParam(route.query.amenities)
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is AmenityKey => (AMENITY_KEYS as readonly string[]).includes(s))
)
const minModel = ref<number | null>(numParam(route.query.min))
const maxModel = ref<number | null>(numParam(route.query.max))
// 'nearest' is a runtime-only sort (needs the visitor's geolocation); it is
// never read from or written to the URL.
const sortModel = ref<SortValue | 'nearest'>(
  SORT_VALUES.includes(strParam(route.query.sort) as SortValue)
    ? (strParam(route.query.sort) as SortValue)
    : 'recent'
)
const qModel = ref<string>(strParam(route.query.q))

// ── Filters object for usePools (reactive) ───────────────────────────────
const filters = computed<PoolFilters>(() => ({
  citySlug: cityModel.value || null,
  slot: (slotModel.value as SlotKey) || null,
  amenities: amenityModel.value.slice(),
  minPrice: minModel.value,
  maxPrice: maxModel.value,
  // 'nearest' is resolved client-side from geolocation, so the query sorts by
  // 'recent' and we re-order by distance below.
  sort: sortModel.value === 'nearest' ? 'recent' : sortModel.value,
  q: qModel.value.trim() || null,
}))

const { pools, pending, error, refresh } = usePools(filters)
const { cities } = useCities()

// ── "Près de moi" geolocation + distance ─────────────────────────────────
interface DecoratedPool extends PoolListItem {
  distanceKm: number | null
}
const userPos = ref<{ lat: number; lng: number } | null>(null)
const locating = ref(false)
const geoError = ref<string | null>(null)

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

function locateMe(): void {
  if (!import.meta.client || !navigator.geolocation) {
    geoError.value = 'search.geo.unsupported'
    return
  }
  locating.value = true
  geoError.value = null
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userPos.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      sortModel.value = 'nearest'
      locating.value = false
    },
    () => {
      geoError.value = 'search.geo.denied'
      locating.value = false
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  )
}

// pools decorated with distance from the visitor; re-ordered when sort=nearest.
const displayPools = computed<DecoratedPool[]>(() => {
  const u = userPos.value
  const list: DecoratedPool[] = pools.value.map((p) => ({
    ...p,
    distanceKm:
      u && p.approxLat != null && p.approxLng != null
        ? haversineKm(u.lat, u.lng, p.approxLat, p.approxLng)
        : null,
  }))
  if (sortModel.value === 'nearest' && u) {
    list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  }
  return list
})

// ── Keep the URL in sync (shareable + SSR) ───────────────────────────────
const queryFromState = computed<Record<string, string>>(() => {
  const q: Record<string, string> = {}
  if (cityModel.value) q.city = cityModel.value
  if (slotModel.value) q.slot = slotModel.value
  if (amenityModel.value.length) q.amenities = amenityModel.value.join(',')
  if (minModel.value != null) q.min = String(minModel.value)
  if (maxModel.value != null) q.max = String(maxModel.value)
  if (sortModel.value !== 'recent' && sortModel.value !== 'nearest') q.sort = sortModel.value
  if (qModel.value.trim()) q.q = qModel.value.trim()
  return q
})

watch(
  queryFromState,
  (next) => {
    // Only replace when something actually changed (avoid redundant history ops
    // and an SSR/refresh loop).
    const cur = route.query
    const keys = new Set([...Object.keys(next), ...Object.keys(cur)])
    let changed = false
    for (const k of keys) {
      if (strParam(cur[k]) !== (next[k] ?? '')) {
        changed = true
        break
      }
    }
    if (changed) void router.replace({ query: next })
  },
  { flush: 'post' }
)

// Reflect external query changes (back/forward, city-chip links) into state.
watch(
  () => route.query,
  (q) => {
    cityModel.value = strParam(q.city)
    slotModel.value = SLOT_VALUES.includes(strParam(q.slot) as SlotKey) ? strParam(q.slot) : ''
    amenityModel.value = strParam(q.amenities)
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is AmenityKey => (AMENITY_KEYS as readonly string[]).includes(s))
    minModel.value = numParam(q.min)
    maxModel.value = numParam(q.max)
    sortModel.value = SORT_VALUES.includes(strParam(q.sort) as SortValue)
      ? (strParam(q.sort) as SortValue)
      : 'recent'
    qModel.value = strParam(q.q)
  }
)

// ── Derived display ──────────────────────────────────────────────────────
const cityOptions = computed(() => [
  { value: '', label: t('search.filters.cityAny') },
  ...cities.value.map((c) => ({
    value: c.slug,
    label: locale.value === 'ar' ? c.name_ar : c.name_fr,
  })),
])

const cityName = computed(() => {
  if (!cityModel.value) return ''
  const c = cities.value.find((ci) => ci.slug === cityModel.value)
  return c ? (locale.value === 'ar' ? c.name_ar : c.name_fr) : ''
})

const sortOptions = computed(() => [
  // Only offer "nearest" once we have the visitor's location.
  ...(userPos.value ? [{ value: 'nearest', label: t('search.sort.nearest') }] : []),
  { value: 'recent', label: t('search.sort.recent') },
  { value: 'price_asc', label: t('search.sort.priceAsc') },
  { value: 'price_desc', label: t('search.sort.priceDesc') },
  { value: 'rating', label: t('search.sort.rating') },
])

const slotOptions = computed(() => SLOT_VALUES.map((k) => ({ key: k, label: t(SLOT_LABELS[k]) })))

const minInput = computed<string>({
  get: () => (minModel.value != null ? String(minModel.value) : ''),
  set: (v) => {
    const n = Number(v)
    minModel.value = v.trim() && Number.isFinite(n) ? n : null
  },
})
const maxInput = computed<string>({
  get: () => (maxModel.value != null ? String(maxModel.value) : ''),
  set: (v) => {
    const n = Number(v)
    maxModel.value = v.trim() && Number.isFinite(n) ? n : null
  },
})

const resultCount = computed(() => pools.value.length)
const resultsHeading = computed(() =>
  cityName.value
    ? t('search.resultsInCity', { n: resultCount.value, city: cityName.value })
    : t('search.results', { n: resultCount.value })
)

// Active filter count (drives the mobile "Filtres (n)" pill + reset CTA).
const activeFilterCount = computed(
  () =>
    (slotModel.value ? 1 : 0) +
    amenityModel.value.length +
    (minModel.value != null ? 1 : 0) +
    (maxModel.value != null ? 1 : 0)
)
const hasAnyFilter = computed(
  () => activeFilterCount.value > 0 || !!cityModel.value || !!qModel.value
)

function resetFilters(): void {
  cityModel.value = ''
  slotModel.value = ''
  amenityModel.value = []
  minModel.value = null
  maxModel.value = null
  sortModel.value = 'recent'
  qModel.value = ''
}

function toggleAmenity(key: AmenityKey): void {
  const i = amenityModel.value.indexOf(key)
  if (i === -1) amenityModel.value = [...amenityModel.value, key]
  else amenityModel.value = amenityModel.value.filter((k) => k !== key)
}
function isAmenityOn(key: AmenityKey): boolean {
  return amenityModel.value.includes(key)
}
function setSlot(key: SlotKey): void {
  slotModel.value = slotModel.value === key ? '' : key
}

// ── Favorites wiring (same pattern as index) ─────────────────────────────
const { favoriteIdSet } = useFavorites()
const { toggle } = useToggleFavorite()
function isFav(id: string): boolean {
  return favoriteIdSet.value.has(id)
}
function onToggleFav(pool: PoolListItem, next: boolean): void {
  void toggle(pool.id, !next)
}
function cardAmenities(pool: PoolListItem): string[] {
  return pool.amenities
    .filter((a) => a.included)
    .slice(0, 3)
    .map((a) => (locale.value === 'ar' ? a.label_ar : a.label_fr))
}
function cardCity(pool: PoolListItem): string {
  return pool.neighborhood ? `${pool.neighborhood} · ${pool.cityName}` : pool.cityName
}

// ── View toggle + filter sheet ───────────────────────────────────────────
const view = ref<'list' | 'map'>('list')
const filterSheetOpen = ref(false)
const activeMapId = ref<string | null>(null)
function onMapSelect(id: string): void {
  activeMapId.value = id
}

// ── SEO ──────────────────────────────────────────────────────────────────
const pageTitle = computed(
  () =>
    `${t('search.seoTitle')}${cityName.value ? ` ${t('search.seoTitleCity', { city: cityName.value })}` : ''} — Masbah`
)
const pageDescription = computed(() =>
  cityName.value ? t('search.seoDescCity', { city: cityName.value }) : t('search.seoDesc')
)

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value,
  ogTitle: () => pageTitle.value,
  ogDescription: () => pageDescription.value,
  ogImage: () => `${config.public.siteUrl}/pwa-512x512.png`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: [...(localeHead.value.link ?? [])],
  meta: [...(localeHead.value.meta ?? [])],
}))
</script>

<template>
  <div class="search-page">
    <!-- ═══ STICKY TOP BAR (mobile filter chips + view toggle) ═══ -->
    <div class="s-top">
      <div class="wrap s-top-row">
        <h1 class="s-title">{{ resultsHeading }}</h1>
        <div class="s-top-actions">
          <button
            class="btn btn-sm near-me-btn"
            :class="userPos ? 'btn-primary' : 'btn-secondary'"
            type="button"
            :disabled="locating"
            :aria-pressed="!!userPos"
            @click="locateMe"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
            </svg>
            {{ locating ? t('search.geo.locating') : t('search.nearMe') }}
          </button>
          <PSelect
            v-model="sortModel"
            class="sort-select"
            :options="sortOptions"
            :label="t('search.sort.label')"
          />
          <button
            class="btn btn-secondary btn-sm view-toggle"
            type="button"
            @click="view = view === 'list' ? 'map' : 'list'"
          >
            <svg
              v-if="view === 'list'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5 3 7v12l6-2 6 2 6-2V5l-6 2-6-2Z" />
              <path d="M9 5v12M15 7v12" />
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span class="view-toggle-lbl">{{
              view === 'list' ? t('search.view.map') : t('search.view.list')
            }}</span>
          </button>
        </div>
      </div>

      <p v-if="geoError" class="wrap geo-note" role="status">
        {{ t(geoError) }}
      </p>

      <!-- Mobile filter chips row -->
      <div class="filter-chips lg:hidden">
        <button class="chip" type="button" @click="filterSheetOpen = true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          {{ t('search.filters.title')
          }}<template v-if="activeFilterCount"> ({{ activeFilterCount }})</template>
        </button>
        <PChip
          v-for="k in AMENITY_KEYS"
          :key="k"
          :model-value="isAmenityOn(k)"
          @update:model-value="toggleAmenity(k)"
        >
          {{ t(`search.amenities.${k}`) }}
        </PChip>
      </div>
    </div>

    <main class="wrap s-main">
      <div class="s-layout">
        <!-- ═══ DESKTOP FILTER SIDEBAR ═══ -->
        <aside class="filter-side hidden lg:block" aria-label="Filtres">
          <div class="fs-head">
            <h2 class="fs-title">{{ t('search.filters.title') }}</h2>
            <button
              v-if="hasAnyFilter"
              class="btn btn-ghost btn-sm"
              type="button"
              style="min-height: 34px"
              @click="resetFilters"
            >
              {{ t('search.filters.clearAll') }}
            </button>
          </div>

          <div class="fgroup">
            <PSelect v-model="cityModel" :label="t('search.filters.city')" :options="cityOptions" />
          </div>

          <div class="fgroup">
            <h3>{{ t('search.filters.slot') }}</h3>
            <div class="chip-wrap">
              <button
                v-for="opt in slotOptions"
                :key="opt.key"
                class="chip btn-sm"
                :class="{ 'is-on': slotModel === opt.key }"
                type="button"
                :aria-pressed="slotModel === opt.key"
                @click="setSlot(opt.key)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="fgroup">
            <h3>{{ t('search.filters.price') }}</h3>
            <div class="price-row">
              <PInput
                v-model="minInput"
                type="number"
                inputmode="numeric"
                :label="t('search.filters.priceMin')"
                :placeholder="t('search.filters.priceMinPh')"
              />
              <PInput
                v-model="maxInput"
                type="number"
                inputmode="numeric"
                :label="t('search.filters.priceMax')"
                :placeholder="t('search.filters.priceMaxPh')"
              />
            </div>
          </div>

          <div class="fgroup">
            <h3>{{ t('search.filters.amenities') }}</h3>
            <div class="chip-wrap">
              <PChip
                v-for="k in AMENITY_KEYS"
                :key="k"
                :model-value="isAmenityOn(k)"
                @update:model-value="toggleAmenity(k)"
              >
                {{ t(`search.amenities.${k}`) }}
              </PChip>
            </div>
          </div>
        </aside>

        <!-- ═══ RESULTS COLUMN ═══ -->
        <div class="results-col">
          <!-- LIST VIEW -->
          <template v-if="view === 'list'">
            <!-- error -->
            <div v-if="error" class="state-card">
              <span class="ill-circle" style="color: var(--danger)">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"
                  />
                  <path d="M12 9v4.5M12 17h.01" />
                </svg>
              </span>
              <div class="sc-title">{{ t('search.error.title') }}</div>
              <p class="sc-copy">{{ t('search.error.body') }}</p>
              <div class="sc-action">
                <PButton size="sm" @click="refresh">{{ t('common.retry') }}</PButton>
              </div>
            </div>

            <!-- skeletons -->
            <div v-else-if="pending" class="card-grid">
              <PoolCardSkeleton v-for="n in 6" :key="n" />
            </div>

            <!-- empty -->
            <div v-else-if="resultCount === 0" class="state-card">
              <span class="ill-circle">
                <span class="acc" />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-3.5-3.5" />
                  <path d="M8 11c.8-1 2.2-1 3 0s2.2 1 3 0" />
                </svg>
              </span>
              <div class="sc-title">{{ t('search.empty.title') }}</div>
              <p class="sc-copy">{{ t('search.empty.body') }}</p>
              <div v-if="hasAnyFilter" class="sc-action">
                <PButton size="sm" @click="resetFilters">{{ t('search.empty.reset') }}</PButton>
              </div>
            </div>

            <!-- results -->
            <div v-else class="card-grid">
              <PoolCard
                v-for="pool in displayPools"
                :id="pool.id"
                :key="pool.id"
                :title="pool.title"
                :city="cardCity(pool)"
                :rating="pool.rating ?? undefined"
                :review-count="pool.reviewCount"
                :price-from="pool.priceFrom ?? undefined"
                :cover-url="pool.coverUrl ?? undefined"
                :amenities="cardAmenities(pool)"
                :sheltered="pool.sheltered"
                :reliable-host="pool.rating !== null && pool.rating >= 4.7"
                :distance-km="pool.distanceKm ?? undefined"
                :favorite="isFav(pool.id)"
                @update:favorite="(v: boolean) => onToggleFav(pool, v)"
              />
            </div>
          </template>

          <!-- MAP VIEW -->
          <div v-else class="map-split">
            <!-- rail -->
            <div class="map-rail">
              <template v-if="pending">
                <PoolCardSkeleton v-for="n in 4" :key="n" />
              </template>
              <div v-else-if="resultCount === 0" class="state-card">
                <span class="ill-circle">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-3.5-3.5" />
                  </svg>
                </span>
                <div class="sc-title">{{ t('search.empty.title') }}</div>
                <p class="sc-copy">{{ t('search.empty.body') }}</p>
                <div v-if="hasAnyFilter" class="sc-action">
                  <PButton size="sm" @click="resetFilters">{{ t('search.empty.reset') }}</PButton>
                </div>
              </div>
              <template v-else>
                <div
                  v-for="pool in displayPools"
                  :key="pool.id"
                  class="rail-card"
                  :class="{ 'is-active': activeMapId === pool.id }"
                  @mouseenter="activeMapId = pool.id"
                >
                  <PoolCard
                    :id="pool.id"
                    :title="pool.title"
                    :city="cardCity(pool)"
                    :rating="pool.rating ?? undefined"
                    :review-count="pool.reviewCount"
                    :price-from="pool.priceFrom ?? undefined"
                    :cover-url="pool.coverUrl ?? undefined"
                    :amenities="cardAmenities(pool)"
                    :sheltered="pool.sheltered"
                    :reliable-host="pool.rating !== null && pool.rating >= 4.7"
                    :distance-km="pool.distanceKm ?? undefined"
                    :favorite="isFav(pool.id)"
                    @update:favorite="(v: boolean) => onToggleFav(pool, v)"
                  />
                </div>
              </template>
            </div>

            <!-- map canvas (client-only Leaflet) -->
            <div class="map-canvas">
              <ClientOnly>
                <SearchMap
                  :pools="displayPools"
                  :user-pos="userPos"
                  :active-id="activeMapId"
                  @select="onMapSelect"
                />
                <template #fallback>
                  <div class="skel map-skel" />
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ═══ MOBILE FILTER SHEET ═══ -->
    <PSheet v-model:open="filterSheetOpen" :title="t('search.filters.title')">
      <div class="sheet-filters">
        <div class="fgroup">
          <PSelect v-model="cityModel" :label="t('search.filters.city')" :options="cityOptions" />
        </div>
        <div class="fgroup">
          <h3>{{ t('search.filters.slot') }}</h3>
          <div class="chip-wrap">
            <button
              v-for="opt in slotOptions"
              :key="opt.key"
              class="chip btn-sm"
              :class="{ 'is-on': slotModel === opt.key }"
              type="button"
              :aria-pressed="slotModel === opt.key"
              @click="setSlot(opt.key)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="fgroup">
          <h3>{{ t('search.filters.price') }}</h3>
          <div class="price-row">
            <PInput
              v-model="minInput"
              type="number"
              inputmode="numeric"
              :label="t('search.filters.priceMin')"
              :placeholder="t('search.filters.priceMinPh')"
            />
            <PInput
              v-model="maxInput"
              type="number"
              inputmode="numeric"
              :label="t('search.filters.priceMax')"
              :placeholder="t('search.filters.priceMaxPh')"
            />
          </div>
        </div>
        <div class="fgroup">
          <h3>{{ t('search.filters.amenities') }}</h3>
          <div class="chip-wrap">
            <PChip
              v-for="k in AMENITY_KEYS"
              :key="k"
              :model-value="isAmenityOn(k)"
              @update:model-value="toggleAmenity(k)"
            >
              {{ t(`search.amenities.${k}`) }}
            </PChip>
          </div>
        </div>
      </div>
      <template #footer>
        <PButton variant="ghost" :disabled="!hasAnyFilter" @click="resetFilters">
          {{ t('search.filters.clearAll') }}
        </PButton>
        <PButton block @click="filterSheetOpen = false">
          {{ t('search.filters.showResults', { n: resultCount }) }}
        </PButton>
      </template>
    </PSheet>
  </div>
</template>

<style scoped>
.search-page {
  padding-bottom: 2.5rem;
}

/* sticky top */
.s-top {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(250, 250, 247, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.s-top-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  padding-block: 0.75rem;
}
.s-title {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  margin: 0;
  flex: 1;
  min-width: 0;
}
.s-top-actions {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  margin-inline-start: auto;
}
.sort-select {
  min-width: 160px;
}
.sort-select :deep(.label) {
  font-size: 0.72rem;
}
.view-toggle {
  flex: none;
  align-self: end;
  height: 46px;
}
.near-me-btn {
  flex: none;
  align-self: end;
  height: 46px;
  gap: 0.4rem;
}
.geo-note {
  margin: 0.5rem auto 0;
  font-size: 0.85rem;
  color: var(--ink-muted);
}
.filter-chips {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0 16px 0.7rem;
}
.filter-chips::-webkit-scrollbar {
  display: none;
}
.filter-chips .chip {
  flex: none;
}

/* layout */
.s-main {
  padding-top: 1.1rem;
}
.s-layout {
  display: grid;
  gap: 1.5rem;
}
@media (min-width: 1024px) {
  .s-layout {
    grid-template-columns: 270px 1fr;
  }
}

/* sidebar */
.filter-side {
  align-self: start;
  position: sticky;
  top: 110px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  padding: 0.4rem 1.1rem 1.1rem;
  max-height: calc(100vh - 130px);
  overflow-y: auto;
}
.fs-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  background: #fff;
  padding-top: 0.9rem;
  z-index: 2;
}
.fs-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}
.fgroup {
  padding-block: 1rem;
  border-top: 1px solid var(--line);
}
.fgroup:first-of-type {
  border-top: none;
}
.fgroup h3 {
  font-weight: 700;
  font-size: 0.95rem;
  margin: 0 0 0.8rem;
}
.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.price-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}

/* results grid */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 560px) {
  .card-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (min-width: 1180px) {
  .card-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

/* state cards (empty / error) */
.state-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  padding: 2.4rem 1.3rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ill-circle {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 34%, var(--aqua-100), var(--aqua-50));
  display: grid;
  place-items: center;
  color: var(--aqua-700);
  position: relative;
  margin-bottom: 1rem;
}
.ill-circle > svg {
  width: 42px;
  height: 42px;
}
.ill-circle .acc {
  position: absolute;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--coral);
  top: 10px;
  inset-inline-end: 16px;
  box-shadow: 0 0 0 4px #fff;
}
.sc-title {
  font-weight: 700;
  font-size: 1.02rem;
}
.sc-copy {
  font-size: 0.86rem;
  color: var(--ink-muted);
  line-height: 1.5;
  margin-top: 0.35rem;
  max-width: 24rem;
}
.sc-action {
  margin-top: 1.1rem;
}

/* map view */
.map-skel {
  height: 100%;
  min-height: 60vh;
  border-radius: var(--r-2xl);
}
.map-rail {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.rail-card {
  border-radius: var(--r-2xl);
  transition: box-shadow var(--dur-1) var(--ease-soft);
}
.rail-card.is-active {
  box-shadow: 0 0 0 2px var(--aqua-500);
  border-radius: var(--r-2xl);
}
.map-canvas {
  min-height: 60vh;
}
@media (min-width: 768px) {
  .map-split {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 1.2rem;
    align-items: start;
  }
  .map-canvas {
    position: sticky;
    top: 110px;
    height: calc(100vh - 134px);
  }
  .map-rail {
    max-height: calc(100vh - 134px);
    overflow-y: auto;
    padding-inline: 0.2rem;
  }
}
@media (max-width: 767px) {
  .map-canvas {
    margin-bottom: 1rem;
  }
}

/* sheet */
.sheet-filters .fgroup:first-of-type {
  border-top: none;
  padding-top: 0;
}
.sheet-filters h3 {
  font-weight: 700;
  font-size: 0.95rem;
  margin: 0 0 0.8rem;
}
</style>
