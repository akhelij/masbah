<script setup lang="ts">
// Client-only multi-pin search map (S3 map view). Plots each pool's APPROX
// (jittered) coordinates on an OpenStreetMap-tiled Leaflet map as a small
// price-circle marker — never a precise pin, mirroring PoolMap's privacy
// stance. Clicking a marker opens a popup with a mini card linking to the
// listing, and emits `select` so the page can sync its rail.
//
// Leaflet needs `window`, so the component is always mounted inside
// <ClientOnly> by the page and additionally guards on `import.meta.client`.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  Map as LeafletMap,
  CircleMarker as LeafletCircleMarker,
  LayerGroup as LeafletLayerGroup,
  Marker as LeafletMarker,
} from 'leaflet'
import type { PoolListItem } from '~/types/db'

const props = defineProps<{
  pools: PoolListItem[]
  /** Currently highlighted pool id (e.g. the rail card in view). */
  activeId?: string | null
  /** The visitor's geolocation ("Près de moi") — shown as a distinct marker. */
  userPos?: { lat: number; lng: number } | null
  label?: string
}>()

const emit = defineEmits<{
  // eslint-disable-next-line no-unused-vars
  (e: 'select', id: string): void
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const el = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let markerLayer: LeafletLayerGroup | null = null
let userMarker: LeafletMarker | null = null
const markersById = new Map<string, LeafletCircleMarker>()

// Only pools with public coordinates can be plotted.
const located = computed(() =>
  props.pools.filter(
    (p): p is PoolListItem & { approxLat: number; approxLng: number } =>
      p.approxLat != null && p.approxLng != null
  )
)

function priceLabel(p: PoolListItem): string {
  return p.priceFrom != null ? formatMad(p.priceFrom, locale.value) : t('search.map.priceNa')
}

function popupHtml(p: PoolListItem): string {
  const href = localePath(`/pools/${p.id}`)
  const esc = (s: string): string =>
    s.replace(/[&<>"']/g, (c) => {
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
          return '&#39;'
      }
    })
  const place = p.neighborhood ? `${p.neighborhood} · ${p.cityName}` : p.cityName
  const rating =
    p.rating != null
      ? `<span class="sm-pop-rating">★ ${p.rating.toLocaleString(locale.value)}</span>`
      : ''
  const cover = p.coverUrl
    ? `<span class="sm-pop-img" style="background-image:url('${encodeURI(p.coverUrl)}')"></span>`
    : ''
  return (
    `<a class="sm-pop" href="${href}">` +
    cover +
    `<span class="sm-pop-body">` +
    `<span class="sm-pop-title">${esc(p.title)}</span>` +
    `<span class="sm-pop-meta">${esc(place)}${rating}</span>` +
    `<span class="sm-pop-price">${esc(priceLabel(p))}</span>` +
    `</span></a>`
  )
}

function paint(marker: LeafletCircleMarker, isActive: boolean): void {
  marker.setStyle({
    color: '#fff',
    weight: 2,
    fillColor: isActive ? '#0E7490' : '#0891b2',
    fillOpacity: 1,
    radius: isActive ? 11 : 8,
  })
  // CircleMarker has no z-index offset; raise the active one to the front.
  if (isActive) marker.bringToFront()
}

async function build(): Promise<void> {
  if (!import.meta.client || !el.value) return
  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  map = L.map(el.value, {
    scrollWheelZoom: false,
    attributionControl: true,
    zoomControl: true,
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  drawMarkers(L)
  drawUser(L)
  if (props.userPos) map.setView([props.userPos.lat, props.userPos.lng], 11)
}

// Distinct "you are here" marker for the visitor's geolocation.
function drawUser(L: typeof import('leaflet')): void {
  if (!map) return
  const u = props.userPos
  if (!u) {
    userMarker?.remove()
    userMarker = null
    return
  }
  if (userMarker) {
    userMarker.setLatLng([u.lat, u.lng])
    return
  }
  const icon = L.divIcon({
    className: 'sm-user',
    html: '<span class="sm-user-dot"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
  userMarker = L.marker([u.lat, u.lng], {
    icon,
    interactive: false,
    keyboard: false,
    zIndexOffset: 1000,
  }).addTo(map)
}

function drawMarkers(L: typeof import('leaflet')): void {
  if (!map || !markerLayer) return
  markerLayer.clearLayers()
  markersById.clear()

  const pts = located.value
  if (pts.length === 0) {
    // Fall back to a Morocco-wide view so the canvas isn't blank.
    map.setView([31.7917, -7.0926], 6)
    return
  }

  const latlngs: [number, number][] = []
  for (const p of pts) {
    const ll: [number, number] = [p.approxLat, p.approxLng]
    latlngs.push(ll)
    const marker = L.circleMarker(ll, {
      bubblingMouseEvents: false,
    })
    paint(marker, p.id === props.activeId)
    marker.bindTooltip(priceLabel(p), {
      permanent: true,
      direction: 'top',
      offset: [0, -6],
      className: 'sm-tip',
    })
    marker.bindPopup(popupHtml(p), { closeButton: true, minWidth: 200, className: 'sm-popwrap' })
    marker.on('click', () => emit('select', p.id))
    marker.addTo(markerLayer!)
    markersById.set(p.id, marker)
  }

  if (latlngs.length === 1) {
    map.setView(latlngs[0]!, 13)
  } else {
    map.fitBounds(L.latLngBounds(latlngs).pad(0.2))
  }
}

// Re-draw when the result set or locale changes.
watch(
  [located, locale],
  async () => {
    if (!import.meta.client || !map) return
    const L = await import('leaflet')
    drawMarkers(L)
  },
  { flush: 'post' }
)

// Re-style + open the active marker when the highlight changes.
watch(
  () => props.activeId,
  (id) => {
    for (const [pid, marker] of markersById) paint(marker, pid === id)
    if (id) {
      const m = markersById.get(id)
      if (m && map) {
        map.panTo(m.getLatLng())
        m.openPopup()
      }
    }
  }
)

// Recenter + (re)draw the visitor marker when geolocation resolves/changes.
watch(
  () => props.userPos,
  async (u) => {
    if (!import.meta.client || !map) return
    const L = await import('leaflet')
    drawUser(L)
    if (u) map.setView([u.lat, u.lng], 11)
  },
  { flush: 'post' }
)

onMounted(build)
onBeforeUnmount(() => {
  map?.remove()
  map = null
  markerLayer = null
  userMarker = null
  markersById.clear()
})
</script>

<template>
  <div
    ref="el"
    class="search-map"
    role="application"
    :aria-label="label ?? t('search.map.ariaLabel')"
  />
</template>

<style scoped>
.search-map {
  height: 100%;
  width: 100%;
  min-height: 60vh;
  border-radius: var(--r-2xl);
  overflow: hidden;
  border: 1px solid var(--line);
  background: linear-gradient(160deg, #dcefe6, #cfe9ec 50%, #bfe3ee);
  z-index: 0;
}
/* Keep Leaflet panes below the sticky header/action bar. */
.search-map :deep(.leaflet-pane),
.search-map :deep(.leaflet-top),
.search-map :deep(.leaflet-bottom) {
  z-index: 1;
}
/* price tooltip */
.search-map :deep(.sm-tip) {
  background: #fff;
  color: var(--ink-strong);
  font-weight: 800;
  font-size: 0.78rem;
  border: 1.5px solid #fff;
  border-radius: var(--r-pill);
  box-shadow: var(--sh-pop);
  padding: 0.25rem 0.5rem;
}
.search-map :deep(.sm-tip::before) {
  display: none;
}
/* popup mini-card */
.search-map :deep(.sm-popwrap .leaflet-popup-content) {
  margin: 0;
  width: auto !important;
}
.search-map :deep(.sm-popwrap .leaflet-popup-content-wrapper) {
  border-radius: var(--r-xl);
  overflow: hidden;
  padding: 0;
}
.search-map :deep(.sm-pop) {
  display: flex;
  gap: 0.6rem;
  align-items: stretch;
  text-decoration: none;
  color: var(--ink);
  width: 230px;
  padding: 0.55rem;
}
.search-map :deep(.sm-pop-img) {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: var(--r-md);
  background-size: cover;
  background-position: center;
  background-color: var(--sand-2);
}
.search-map :deep(.sm-pop-body) {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  justify-content: center;
}
.search-map :deep(.sm-pop-title) {
  font-weight: 700;
  font-size: 0.9rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-map :deep(.sm-pop-meta) {
  font-size: 0.78rem;
  color: var(--ink-muted);
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.search-map :deep(.sm-pop-rating) {
  color: var(--amber-ink);
  font-weight: 700;
}
.search-map :deep(.sm-pop-price) {
  font-weight: 800;
  color: var(--ink-strong);
  font-size: 0.92rem;
  margin-top: 0.1rem;
}
/* "You are here" marker — blue, distinct from the aqua pool markers. */
.search-map :deep(.sm-user) {
  background: none;
  border: none;
}
.search-map :deep(.sm-user-dot) {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #2563eb;
  border: 3px solid #fff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25);
}
</style>
