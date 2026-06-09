<script setup lang="ts">
// Client-only EXACT-location map with a precise marker. Used ONLY where the
// real coordinates have been unlocked (the renter's accepted-booking reveal) —
// deliberately separate from PoolMap, which shows a ~1 km privacy circle and
// must never render a precise marker for un-accepted viewers.
//
// Leaflet needs `window`, so the component is mounted inside <ClientOnly> by the
// page and additionally guards on `import.meta.client`.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Map as LeafletMap } from 'leaflet'

const props = withDefaults(
  defineProps<{
    lat: number
    lng: number
    label?: string
    zoom?: number
  }>(),
  { zoom: 16 }
)

const el = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null

onMounted(async () => {
  if (!import.meta.client || !el.value) return

  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  map = L.map(el.value, {
    center: [props.lat, props.lng],
    zoom: props.zoom,
    scrollWheelZoom: false,
    attributionControl: true,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)

  const icon = L.divIcon({
    className: 'exact-marker',
    html: '<span class="pin-dot"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })
  L.marker([props.lat, props.lng], { icon }).addTo(map)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="el" class="exact-map" role="img" :aria-label="label" />
</template>

<style scoped>
.exact-map {
  height: 200px;
  width: 100%;
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line);
  background: linear-gradient(160deg, #dcefe6, #cfe9ec 50%, #bfe3ee);
  z-index: 0;
}
.exact-map :deep(.leaflet-pane),
.exact-map :deep(.leaflet-top),
.exact-map :deep(.leaflet-bottom) {
  z-index: 1;
}
.exact-map :deep(.exact-marker) {
  background: none;
  border: none;
}
.exact-map :deep(.pin-dot) {
  display: block;
  width: 22px;
  height: 22px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: var(--aqua-700);
  border: 3px solid #fff;
  box-shadow: 0 3px 6px rgba(10, 45, 56, 0.35);
}
</style>
