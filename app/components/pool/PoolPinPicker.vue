<script setup lang="ts">
// Client-only Leaflet pin picker used by the publish wizard's location step.
// The owner sets the EXACT (private) lat/lng three ways: search an address
// (OpenStreetMap/Nominatim geocode), use their current position, or click/drag
// on the map. The page derives the public approx_lat/approx_lng (~500 m jitter).
// Unlike PoolMap (privacy circle), this shows a precise, draggable marker
// because the owner is setting their own private coordinates.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'

const props = withDefaults(
  defineProps<{
    lat: number | null
    lng: number | null
    /** Fallback centre when no pin is set yet (city centre or Morocco). */
    fallbackLat?: number
    fallbackLng?: number
    label?: string
  }>(),
  {
    // Casablanca-ish default so the map opens over Morocco.
    fallbackLat: 33.5731,
    fallbackLng: -7.5898,
  }
)

const emit = defineEmits<{ update: [lat: number, lng: number] }>()

const { t, locale } = useI18n()

const el = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let marker: LeafletMarker | null = null
let LRef: typeof import('leaflet') | null = null
let resizeObserver: ResizeObserver | null = null

// ── Address search (Nominatim) + geolocation ──────────────────────────────
interface GeoResult {
  lat: number
  lng: number
  label: string
}
const q = ref('')
const results = ref<GeoResult[]>([])
const searching = ref(false)
const searched = ref(false)
const locating = ref(false)

function recenter(lat: number, lng: number, zoom = 16): void {
  if (!map || !LRef) return
  map.setView([lat, lng], zoom)
  placeMarker(LRef, lat, lng)
  emit('update', lat, lng)
}

async function search(): Promise<void> {
  const query = q.value.trim()
  if (!query || searching.value) return
  searching.value = true
  results.value = []
  try {
    const url =
      'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ma' +
      `&accept-language=${locale.value}&q=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const data: Array<{ lat: string; lon: string; display_name: string }> = await res.json()
    results.value = Array.isArray(data)
      ? data
          .map((d) => ({ lat: Number(d.lat), lng: Number(d.lon), label: d.display_name }))
          .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
      : []
  } catch {
    results.value = []
  } finally {
    searching.value = false
    searched.value = true
  }
}

function pick(r: GeoResult): void {
  q.value = r.label
  results.value = []
  searched.value = false
  recenter(r.lat, r.lng)
}

function locateMe(): void {
  if (!import.meta.client || !navigator.geolocation || locating.value) return
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      recenter(pos.coords.latitude, pos.coords.longitude, 17)
      locating.value = false
    },
    () => {
      locating.value = false
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  )
}

function placeMarker(L: typeof import('leaflet'), lat: number, lng: number): void {
  if (!map) return
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    const icon = L.divIcon({
      className: 'pin-picker-marker',
      html: '<span class="pin-dot"></span>',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    })
    marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map)
    marker.on('dragend', () => {
      const p = marker!.getLatLng()
      emit('update', p.lat, p.lng)
    })
  }
}

onMounted(async () => {
  if (!import.meta.client || !el.value) return

  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')
  LRef = L

  const hasPin = typeof props.lat === 'number' && typeof props.lng === 'number'
  const center: [number, number] = hasPin
    ? [props.lat as number, props.lng as number]
    : [props.fallbackLat, props.fallbackLng]

  map = L.map(el.value, {
    center,
    zoom: hasPin ? 15 : 12,
    scrollWheelZoom: false,
    attributionControl: true,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)

  if (hasPin) placeMarker(L, props.lat as number, props.lng as number)

  // Click anywhere to set / move the pin.
  map.on('click', (e) => {
    placeMarker(L, e.latlng.lat, e.latlng.lng)
    emit('update', e.latlng.lat, e.latlng.lng)
  })

  // The wizard renders steps with v-show, so this map often mounts while its
  // step is display:none (zero width) — Leaflet then caches that size and only
  // tiles part of the container once it becomes visible. Re-measuring on every
  // size change (hidden→shown, resize) keeps the tiles filling the box.
  map.invalidateSize()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => map?.invalidateSize())
    resizeObserver.observe(el.value)
  }
})

// Keep the marker in sync if the parent resets the coordinates.
watch(
  () => [props.lat, props.lng] as const,
  ([lat, lng]) => {
    if (!map || !LRef) return
    if (typeof lat === 'number' && typeof lng === 'number') {
      placeMarker(LRef, lat, lng)
    }
  }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
  marker = null
})
</script>

<template>
  <div class="pin-picker-wrap">
    <div class="pin-tools">
      <div class="pin-search">
        <input
          v-model="q"
          type="text"
          class="pin-search-input"
          :placeholder="t('publish.location.searchPlaceholder')"
          @keydown.enter.prevent="search"
        />
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="searching"
          @click="search"
        >
          {{ searching ? t('publish.location.searching') : t('publish.location.searchBtn') }}
        </button>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm pin-locate"
        :disabled="locating"
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
        {{ t('publish.location.myPosition') }}
      </button>
    </div>

    <ul v-if="results.length" class="pin-results">
      <li v-for="(r, i) in results" :key="i">
        <button type="button" @click="pick(r)">
          {{ r.label }}
        </button>
      </li>
    </ul>
    <p v-else-if="searched && !searching" class="pin-noresults">
      {{ t('publish.location.noResults') }}
    </p>

    <div ref="el" class="pin-picker" role="application" :aria-label="label" />
  </div>
</template>

<style scoped>
.pin-tools {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
  flex-wrap: wrap;
}
.pin-search {
  display: flex;
  gap: 0.4rem;
  flex: 1 1 240px;
}
.pin-search-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: #fff;
  font: inherit;
  color: var(--ink);
}
.pin-search-input:focus-visible {
  outline: none;
  border-color: var(--aqua-500);
  box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.18);
}
.pin-locate {
  flex: none;
  gap: 0.35rem;
}
.pin-results {
  list-style: none;
  margin: 0 0 0.55rem;
  padding: 0.3rem;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: #fff;
  box-shadow: var(--sh-pop);
  max-height: 200px;
  overflow-y: auto;
}
.pin-results li button {
  display: block;
  width: 100%;
  text-align: start;
  padding: 0.5rem 0.6rem;
  border-radius: var(--r-sm);
  font-size: 0.88rem;
  line-height: 1.3;
  color: var(--ink);
  background: none;
  border: none;
  cursor: pointer;
}
.pin-results li button:hover,
.pin-results li button:focus-visible {
  background: var(--aqua-50);
  outline: none;
}
.pin-noresults {
  margin: 0 0 0.55rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
}
.pin-picker {
  height: 240px;
  width: 100%;
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line);
  background: linear-gradient(160deg, #dcefe6, #cfe9ec 50%, #bfe3ee);
  z-index: 0;
}
.pin-picker :deep(.leaflet-pane),
.pin-picker :deep(.leaflet-top),
.pin-picker :deep(.leaflet-bottom) {
  z-index: 1;
}
.pin-picker :deep(.pin-picker-marker) {
  background: none;
  border: none;
}
.pin-picker :deep(.pin-dot) {
  display: block;
  width: 22px;
  height: 22px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: var(--aqua-700);
  border: 3px solid #fff;
  box-shadow: 0 3px 6px rgba(10, 45, 56, 0.35);
  cursor: grab;
}
</style>
