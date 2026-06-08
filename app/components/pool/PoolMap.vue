<script setup lang="ts">
// Client-only approximate-location map (S4). Renders an OpenStreetMap-tiled
// Leaflet map centred on the pool's jittered coordinates with a ~1 km
// translucent CIRCLE — never a precise marker, since the exact address is only
// shared after a booking is accepted.
//
// Leaflet needs `window`, so the component is mounted inside <ClientOnly> by
// the page and additionally guards on `import.meta.client`.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Map as LeafletMap } from 'leaflet'

const props = withDefaults(
  defineProps<{
    lat: number
    lng: number
    /** Circle radius in metres. */
    radius?: number
    label?: string
  }>(),
  {
    radius: 1000,
  }
)

const el = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null

onMounted(async () => {
  if (!import.meta.client || !el.value) return

  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  map = L.map(el.value, {
    center: [props.lat, props.lng],
    zoom: 13,
    scrollWheelZoom: false,
    attributionControl: true,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)

  L.circle([props.lat, props.lng], {
    radius: props.radius,
    color: '#0891b2',
    weight: 2,
    fillColor: '#06b6d4',
    fillOpacity: 0.16,
  }).addTo(map)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div
    ref="el"
    class="pool-map"
    role="img"
    :aria-label="label"
  />
</template>

<style scoped>
.pool-map {
  height: 280px;
  width: 100%;
  border-radius: var(--r-2xl);
  overflow: hidden;
  border: 1px solid var(--line);
  background: linear-gradient(160deg, #dcefe6, #cfe9ec 50%, #bfe3ee);
  z-index: 0;
}
/* Keep Leaflet panes below the sticky header/action bar. */
.pool-map :deep(.leaflet-pane),
.pool-map :deep(.leaflet-top),
.pool-map :deep(.leaflet-bottom) {
  z-index: 1;
}
</style>
