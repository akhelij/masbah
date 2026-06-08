<script setup lang="ts">
// Client-only Leaflet pin picker used by the publish wizard's location step.
// The owner drops/drags a marker to set the EXACT lat/lng (private). The page
// derives the public approx_lat/approx_lng (~500 m jitter) from this value.
// Unlike PoolMap (which shows a privacy circle), this shows a precise, draggable
// marker because the owner is setting their own private coordinates.
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

const el = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let marker: LeafletMarker | null = null
let LRef: typeof import('leaflet') | null = null

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
  map?.remove()
  map = null
  marker = null
})
</script>

<template>
  <div ref="el" class="pin-picker" role="application" :aria-label="label" />
</template>

<style scoped>
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
