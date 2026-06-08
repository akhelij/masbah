<script setup lang="ts">
import type { Amenity, PoolPhoto, PoolType, SlotKey } from '~/types/db'
import type { PoolDraft } from '~/composables/useCompletionScore'
import type { SlotConfig } from '~/composables/usePoolSlots'

// The 8-step publish wizard (S8). Loads the owned draft, holds it in a reactive
// object (the autosaved DB row is the real source of truth), autosaves changes
// debounced + per step, validates each step, and publishes once the minimum is
// met. dashboard layout + auth middleware.
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()

const poolId = computed(() => String(route.params.id))

const { cities } = useCities()
const { detail, pending, error, refresh } = useOwnerPool(poolId)
const { updatePool, setStatus } = usePoolMutations()
const slotsApi = usePoolSlots(poolId)
const photosApi = usePoolPhotosManager(poolId)

useSeoMeta({
  title: () => `${t('publish.seoTitle')} · Masbah`,
  robots: 'noindex',
})

// ── Reactive draft (source of truth mirrors the autosaved row) ──────────────
const draft = reactive<PoolDraft>({
  id: poolId.value,
  title: '',
  description: null,
  type: 'villa',
  city_id: null,
  neighborhood: null,
  address: null,
  lat: null,
  lng: null,
  approx_lat: null,
  approx_lng: null,
  max_guests: 10,
  length_m: null,
  width_m: null,
  depth_min: null,
  depth_max: null,
  heated: false,
  covered: false,
  child_safe: false,
  sheltered_from_view: false,
  owner_present: false,
  direct_contact_enabled: true,
  rules: {
    kids_allowed: true,
    music_allowed: true,
    events_allowed: false,
    pets_allowed: false,
    quiet_hours: null,
  },
  amenities: [],
  status: 'draft',
  completion_score: 0,
})

const photos = ref<PoolPhoto[]>([])
const slots = reactive<Record<SlotKey, SlotConfig>>({
  morning: { slot: 'morning', price_mad: 0, enabled: false, weekend_premium_pct: 0 },
  afternoon: { slot: 'afternoon', price_mad: 0, enabled: false, weekend_premium_pct: 0 },
  evening: { slot: 'evening', price_mad: 0, enabled: false, weekend_premium_pct: 0 },
  full_day: { slot: 'full_day', price_mad: 0, enabled: false, weekend_premium_pct: 0 },
})

const hydrated = ref(false)

// Quiet-hours editing: a toggle + two time strings, serialised to "HH:MM-HH:MM".
const quietEnabled = ref(false)
const quietFrom = ref('22:00')
const quietTo = ref('08:00')
const weekendEnabled = ref(false)
const weekendPct = ref(20)

function hydrateFromDetail(): void {
  const d = detail.value
  if (!d) return
  Object.assign(draft, d.draft)
  photos.value = d.photos.slice().sort((a, b) => a.position - b.position)

  for (const key of Object.keys(slots) as SlotKey[]) {
    const row = d.slots.find((s) => s.slot === key)
    slots[key] = row
      ? {
          slot: key,
          price_mad: row.price_mad,
          enabled: row.enabled,
          weekend_premium_pct: row.weekend_premium_pct,
        }
      : { slot: key, price_mad: 0, enabled: false, weekend_premium_pct: 0 }
  }

  // Derive quiet-hours UI from the rules string.
  const qh = d.draft.rules.quiet_hours
  if (qh && /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(qh)) {
    quietEnabled.value = true
    const [from, to] = qh.split('-')
    quietFrom.value = from ?? '22:00'
    quietTo.value = to ?? '08:00'
  } else {
    quietEnabled.value = false
  }

  // Weekend premium derived from any enabled slot that has one.
  const wk = d.slots.find((s) => s.weekend_premium_pct > 0)
  if (wk) {
    weekendEnabled.value = true
    weekendPct.value = wk.weekend_premium_pct
  }

  hydrated.value = true
}

watch(detail, hydrateFromDetail, { immediate: true })

// ── City options for PSelect ────────────────────────────────────────────────
const cityOptions = computed(() =>
  cities.value.map((c) => ({
    value: c.id,
    label: locale.value === 'ar' ? c.name_ar : c.name_fr,
  }))
)
const selectedCity = computed(() => cities.value.find((c) => c.id === draft.city_id) ?? null)

// ── Pool type options ───────────────────────────────────────────────────────
const poolTypes: { value: PoolType; emoji: string }[] = [
  { value: 'villa', emoji: '🏡' },
  { value: 'riad', emoji: '🕌' },
  { value: 'farm', emoji: '🌾' },
  { value: 'apartment', emoji: '🏢' },
  { value: 'other', emoji: '➕' },
]

// ── Amenities builder (preset list × no/included/paid) ──────────────────────
interface AmenityPreset {
  key: string
  labelKey: string
}
const amenityPresets: AmenityPreset[] = [
  { key: 'towels', labelKey: 'publish.amenities.preset.towels' },
  { key: 'shower', labelKey: 'publish.amenities.preset.shower' },
  { key: 'toilets', labelKey: 'publish.amenities.preset.toilets' },
  { key: 'table', labelKey: 'publish.amenities.preset.table' },
  { key: 'floats', labelKey: 'publish.amenities.preset.floats' },
  { key: 'barbecue', labelKey: 'publish.amenities.preset.barbecue' },
  { key: 'gazebo', labelKey: 'publish.amenities.preset.gazebo' },
  { key: 'wifi', labelKey: 'publish.amenities.preset.wifi' },
  { key: 'parking', labelKey: 'publish.amenities.preset.parking' },
  { key: 'kitchen', labelKey: 'publish.amenities.preset.kitchen' },
  { key: 'sound', labelKey: 'publish.amenities.preset.sound' },
]

function amenityState(key: string): 'no' | 'included' | 'paid' {
  const a = draft.amenities.find((x) => x.key === key)
  if (!a) return 'no'
  return a.included ? 'included' : 'paid'
}

function setAmenity(preset: AmenityPreset, state: 'no' | 'included' | 'paid'): void {
  const idx = draft.amenities.findIndex((x) => x.key === preset.key)
  if (state === 'no') {
    if (idx >= 0) draft.amenities.splice(idx, 1)
    queueSave()
    return
  }
  const labelFr = t(preset.labelKey)
  // Both locales stored from the message catalog so labels persist per-language.
  const entry: Amenity = {
    key: preset.key,
    label_fr: labelFr,
    label_ar: labelFr,
    included: state === 'included',
    price: state === 'included' ? 0 : draft.amenities[idx]?.price || 0,
    per_person: state === 'paid' ? Boolean(draft.amenities[idx]?.per_person) : false,
  }
  if (idx >= 0) draft.amenities.splice(idx, 1, entry)
  else draft.amenities.push(entry)
  queueSave()
}

function updateAmenityPrice(key: string, price: number): void {
  const a = draft.amenities.find((x) => x.key === key)
  if (a) {
    a.price = Math.max(0, Math.round(price || 0))
    queueSave()
  }
}
function toggleAmenityPerPerson(key: string): void {
  const a = draft.amenities.find((x) => x.key === key)
  if (a) {
    a.per_person = !a.per_person
    queueSave()
  }
}

// ── Autosave (debounced) ────────────────────────────────────────────────────
type SaveState = 'idle' | 'saving' | 'saved' | 'error'
const saveState = ref<SaveState>('idle')

function buildPatch(): Record<string, unknown> {
  // Serialise quiet hours into the rules object.
  const rules = {
    ...draft.rules,
    quiet_hours: quietEnabled.value ? `${quietFrom.value}-${quietTo.value}` : null,
  }
  draft.rules.quiet_hours = rules.quiet_hours
  return {
    title: draft.title,
    description: draft.description,
    type: draft.type,
    city_id: draft.city_id,
    neighborhood: draft.neighborhood,
    address: draft.address,
    lat: draft.lat,
    lng: draft.lng,
    approx_lat: draft.approx_lat,
    approx_lng: draft.approx_lng,
    max_guests: draft.max_guests,
    length_m: draft.length_m,
    width_m: draft.width_m,
    depth_min: draft.depth_min,
    depth_max: draft.depth_max,
    heated: draft.heated,
    covered: draft.covered,
    child_safe: draft.child_safe,
    sheltered_from_view: draft.sheltered_from_view,
    owner_present: draft.owner_present,
    direct_contact_enabled: draft.direct_contact_enabled,
    rules,
    amenities: draft.amenities,
    completion_score: completion.value,
  }
}

async function saveNow(): Promise<void> {
  if (!hydrated.value) return
  saveState.value = 'saving'
  const { error: saveErr } = await updatePool(poolId.value, buildPatch())
  saveState.value = saveErr ? 'error' : 'saved'
}

const debouncedSave = useDebounceFn(saveNow, 900)
function queueSave(): void {
  if (!hydrated.value) return
  saveState.value = 'saving'
  void debouncedSave()
}

// Persist slots (their own table) — debounced separately.
async function saveSlotsNow(): Promise<void> {
  if (!hydrated.value) return
  const configs: SlotConfig[] = (Object.keys(slots) as SlotKey[]).map((key) => ({
    slot: key,
    price_mad: slots[key].price_mad,
    enabled: slots[key].enabled,
    weekend_premium_pct: weekendEnabled.value && slots[key].enabled ? weekendPct.value : 0,
  }))
  saveState.value = 'saving'
  const { error: slotErr } = await slotsApi.upsert(configs)
  // Persist the recomputed completion score alongside.
  await updatePool(poolId.value, { completion_score: completion.value })
  saveState.value = slotErr ? 'error' : 'saved'
}
const debouncedSaveSlots = useDebounceFn(saveSlotsNow, 700)
function queueSaveSlots(): void {
  if (!hydrated.value) return
  saveState.value = 'saving'
  void debouncedSaveSlots()
}

// ── Completion score + readiness ────────────────────────────────────────────
const slotList = computed(() =>
  (Object.keys(slots) as SlotKey[]).map((k) => ({
    enabled: slots[k].enabled,
    price_mad: slots[k].price_mad,
  }))
)
const completion = computed(() =>
  computeCompletionScore(draft, photos.value.length, slotList.value)
)
const readiness = computed(() =>
  publishReadiness(draft, photos.value.length, slotList.value)
)

// ── Step navigation ─────────────────────────────────────────────────────────
const TOTAL_STEPS = 8
const stepKeys = [
  'essential',
  'location',
  'photos',
  'pool',
  'amenities',
  'rules',
  'pricing',
  'review',
] as const

const step = ref(1)
const showSuccess = ref(false)

const stepRail = computed(() =>
  stepKeys.map((key, i) => ({
    key,
    n: i + 1,
    label: t(`publish.steps.${key}`),
  }))
)

function goStep(n: number): void {
  if (n < 1 || n > TOTAL_STEPS) return
  step.value = n
  if (import.meta.client) window.scrollTo({ top: 0 })
}
function nextStep(): void {
  if (step.value >= TOTAL_STEPS) return
  goStep(step.value + 1)
}
function prevStep(): void {
  goStep(step.value - 1)
}

const progressPct = computed(() => completion.value)

// ── Photo upload handling ────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const photoError = ref<string | null>(null)

function pickPhotos(): void {
  fileInput.value?.click()
}

async function onFilesSelected(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  input.value = ''
  if (!files.length) return

  uploading.value = true
  photoError.value = null
  for (const file of files) {
    try {
      const makeCover = photos.value.length === 0
      const created = await photosApi.upload(file, photos.value.length, makeCover)
      photos.value.push(created)
    } catch (err) {
      const code =
        err instanceof PhotoError ? err.code : ('upload_failed' as PhotoError['code'])
      photoError.value = t(`publish.photos.error${codeToKey(code)}`)
    }
  }
  uploading.value = false
  void saveNow()
}

function codeToKey(code: PhotoError['code']): string {
  switch (code) {
    case 'too_large':
      return 'TooLarge'
    case 'bad_type':
      return 'BadType'
    case 'decode_failed':
      return 'Decode'
    case 'db_failed':
      return 'Db'
    default:
      return 'Upload'
  }
}

async function removePhoto(photo: PoolPhoto): Promise<void> {
  const wasCover = photo.is_cover
  await photosApi.remove(photo)
  photos.value = photos.value.filter((p) => p.id !== photo.id)
  // Reassign positions and promote a new cover if needed.
  photos.value.forEach((p, i) => {
    p.position = i
  })
  if (wasCover && photos.value.length) {
    photos.value[0]!.is_cover = true
    await photosApi.setCover(
      photos.value[0]!.id,
      photos.value.map((p) => p.id)
    )
  }
  await photosApi.reorder(photos.value.map((p) => p.id))
  void saveNow()
}

async function makeCover(photo: PoolPhoto): Promise<void> {
  photos.value.forEach((p) => {
    p.is_cover = p.id === photo.id
  })
  await photosApi.setCover(
    photo.id,
    photos.value.map((p) => p.id)
  )
}

// Drag-to-reorder (HTML5 DnD on the tiles).
const dragIndex = ref<number | null>(null)
function onDragStart(index: number): void {
  dragIndex.value = index
}
function onDrop(index: number): void {
  if (dragIndex.value === null || dragIndex.value === index) {
    dragIndex.value = null
    return
  }
  const moved = photos.value.splice(dragIndex.value, 1)[0]
  if (moved) photos.value.splice(index, 0, moved)
  dragIndex.value = null
  photos.value.forEach((p, i) => {
    p.position = i
  })
  void photosApi.reorder(photos.value.map((p) => p.id))
  void saveNow()
}

const coverUrl = computed(() => {
  const cover = photos.value.find((p) => p.is_cover) ?? photos.value[0]
  return cover ? usePoolImageUrl(cover.storage_path) : null
})

function photoUrl(p: PoolPhoto): string {
  return usePoolImageUrl(p.storage_path) ?? p.storage_path
}

// ── Location pin → derive jittered public coords ────────────────────────────
function jitter(value: number): number {
  // ±~0.005° ≈ 500 m. Deterministic-ish but randomised per save is fine.
  return value + (Math.random() - 0.5) * 0.01
}
function onPinUpdate(lat: number, lng: number): void {
  draft.lat = lat
  draft.lng = lng
  draft.approx_lat = jitter(lat)
  draft.approx_lng = jitter(lng)
  queueSave()
}

// ── Slot helpers ────────────────────────────────────────────────────────────
const slotMeta: { key: SlotKey; labelKey: string; subKey: string }[] = [
  { key: 'morning', labelKey: 'slots.morning', subKey: 'slots.morningSub' },
  { key: 'afternoon', labelKey: 'slots.afternoon', subKey: 'slots.afternoonSub' },
  { key: 'evening', labelKey: 'slots.evening', subKey: 'slots.eveningSub' },
  { key: 'full_day', labelKey: 'slots.fullDay', subKey: 'slots.fullDaySub' },
]
function toggleSlot(_key: SlotKey): void {
  // The PToggle v-model already flipped `slots[_key].enabled`; just persist.
  void _key
  queueSaveSlots()
}

// Preview helpers (review step).
const previewPrice = computed(() => {
  const enabled = (Object.keys(slots) as SlotKey[])
    .filter((k) => slots[k].enabled && slots[k].price_mad > 0)
    .map((k) => slots[k].price_mad)
  return enabled.length ? Math.min(...enabled) : null
})
const enabledSlotCount = computed(
  () => (Object.keys(slots) as SlotKey[]).filter((k) => slots[k].enabled && slots[k].price_mad > 0).length
)

// ── Publish ─────────────────────────────────────────────────────────────────
const publishing = ref(false)
const publishError = ref<string | null>(null)
const blockedMissing = ref<string[]>([])

async function publish(): Promise<void> {
  publishError.value = null
  blockedMissing.value = []
  if (!readiness.value.ready) {
    blockedMissing.value = readiness.value.missing
    return
  }
  publishing.value = true
  // Flush any pending edits first.
  await saveNow()
  await saveSlotsNow()
  const result = await setStatus(poolId.value, 'published', {
    draft,
    photos: photos.value,
    slots: slotList.value,
  })
  publishing.value = false

  if ('blocked' in result) {
    blockedMissing.value = result.missing
    return
  }
  if (result.error) {
    publishError.value = t('publish.saveError')
    return
  }
  draft.status = 'published'
  showSuccess.value = true
}

function goToListing(): void {
  void navigateTo(localePath(`/pools/${poolId.value}`))
}
function goToDashboard(): void {
  void navigateTo(localePath('/annonces'))
}

function quit(): void {
  void navigateTo(localePath('/annonces'))
}

// Title length helper for the description counter.
const descLength = computed(() => (draft.description ?? '').length)

// Reference router so it's available for potential leave guards (kept explicit).
void router
</script>

<template>
  <div class="wiz">
    <!-- Loading / not-found states -->
    <div v-if="pending && !hydrated" class="wiz-loading">
      <span class="spinner" aria-hidden="true" />
      <p class="muted">{{ t('publish.loading') }}</p>
    </div>

    <div v-else-if="error || (!detail && !pending)" class="wiz-missing">
      <h1 class="t-h2">{{ t('publish.notFoundTitle') }}</h1>
      <p class="muted">{{ t('publish.notFoundBody') }}</p>
      <div class="missing-actions">
        <PButton variant="secondary" @click="refresh">{{ t('common.retry') }}</PButton>
        <NuxtLink :to="localePath('/annonces')" class="btn btn-primary">
          {{ t('publish.backToListings') }}
        </NuxtLink>
      </div>
    </div>

    <!-- Success state -->
    <div v-else-if="showSuccess" class="wiz-success">
      <div class="success-check" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 class="t-h1">{{ t('publish.success.title') }}</h1>
      <p class="t-body muted success-body">
        {{ t('publish.success.body', { title: draft.title }) }}
      </p>
      <div class="success-actions">
        <PButton variant="primary" size="lg" block @click="goToListing">
          {{ t('publish.success.view') }}
        </PButton>
        <PButton variant="ghost" block @click="goToDashboard">
          {{ t('publish.success.dashboard') }}
        </PButton>
      </div>
    </div>

    <!-- Wizard -->
    <template v-else>
      <header class="wiz-header">
        <div class="wiz-header-row">
          <button class="icon-btn quit-btn" type="button" :aria-label="t('publish.quit')" @click="quit">
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
          </button>
          <div class="wiz-header-title">
            <strong>{{ t('publish.title') }}</strong>
            <span class="save-indicator" :class="`is-${saveState}`">
              <svg
                v-if="saveState === 'saved'"
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
              <span>{{
                saveState === 'saving'
                  ? t('publish.saving')
                  : saveState === 'error'
                    ? t('publish.saveError')
                    : t('publish.savedAuto')
              }}</span>
            </span>
          </div>
          <span class="step-count muted">{{
            t('publish.stepCount', { current: step, total: TOTAL_STEPS })
          }}</span>
        </div>
        <div class="progress"><i :style="{ width: `${progressPct}%` }" /></div>
      </header>

      <div class="wiz-grid">
        <!-- desktop step rail -->
        <nav class="rail" :aria-label="t('publish.title')">
          <button
            v-for="r in stepRail"
            :key="r.key"
            class="rail-btn"
            :class="{ 'is-on': r.n === step, done: r.n < step }"
            type="button"
            @click="goStep(r.n)"
          >
            <span class="nm">
              <svg
                v-if="r.n < step"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <template v-else>{{ r.n }}</template>
            </span>
            {{ r.label }}
          </button>
        </nav>

        <!-- step content -->
        <div class="wiz-content">
          <!-- STEP 1 · Essential -->
          <section v-show="step === 1" class="step">
            <span class="t-over">{{ t('publish.essential.over') }}</span>
            <h1 class="t-h1 step-title">{{ t('publish.essential.title') }}</h1>
            <p class="muted step-sub">{{ t('publish.essential.subtitle') }}</p>

            <div class="fields">
              <div class="field">
                <span class="label">{{ t('publish.essential.typeLabel') }}</span>
                <div class="type-grid">
                  <button
                    v-for="pt in poolTypes"
                    :key="pt.value"
                    class="optcard"
                    :class="{ 'is-on': draft.type === pt.value }"
                    type="button"
                    @click="(draft.type = pt.value), queueSave()"
                  >
                    <span>{{ pt.emoji }}</span>{{ t(`publish.type.${pt.value}`) }}
                  </button>
                </div>
              </div>

              <PSelect
                v-model="draft.city_id as string"
                :label="t('publish.essential.cityLabel')"
                :options="cityOptions"
                :placeholder="t('publish.essential.cityPlaceholder')"
                @update:model-value="queueSave"
              />

              <div class="field">
                <label class="label" for="f-title">{{ t('publish.essential.titleLabel') }}</label>
                <input
                  id="f-title"
                  v-model="draft.title"
                  class="input"
                  type="text"
                  maxlength="70"
                  :placeholder="t('publish.essential.titlePlaceholder')"
                  @input="queueSave"
                >
                <div class="helpers">
                  <div class="helper-good">{{ t('publish.essential.titleGood') }}</div>
                  <div class="helper-bad">{{ t('publish.essential.titleBad') }}</div>
                </div>
              </div>

              <div class="field">
                <span class="label">{{ t('publish.essential.capacityLabel') }}</span>
                <div class="counter-row">
                  <PCounter
                    v-model="draft.max_guests"
                    :min="1"
                    :max="50"
                    :aria-label="t('publish.essential.capacityLabel')"
                    @update:model-value="queueSave"
                  />
                  <span class="hint">{{ t('publish.essential.capacityHint') }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- STEP 2 · Description -->
          <section v-show="step === 2" class="step">
            <span class="t-over">{{ t('publish.description.over') }}</span>
            <h1 class="t-h1 step-title">{{ t('publish.description.title') }}</h1>
            <p class="muted step-sub">{{ t('publish.description.subtitle') }}</p>

            <div class="fields">
              <div class="field">
                <label class="label" for="f-title-2">{{ t('publish.essential.titleLabel') }}</label>
                <input
                  id="f-title-2"
                  v-model="draft.title"
                  class="input"
                  type="text"
                  maxlength="70"
                  :placeholder="t('publish.essential.titlePlaceholder')"
                  @input="queueSave"
                >
              </div>
              <div class="field">
                <label class="label" for="f-desc">{{ t('publish.description.label') }}</label>
                <textarea
                  id="f-desc"
                  v-model="draft.description as string"
                  class="ta"
                  :placeholder="t('publish.description.placeholder')"
                  maxlength="1200"
                  @input="queueSave"
                />
                <span class="hint">{{ t('publish.description.hint') }}</span>
                <span class="hint counter">{{ t('publish.description.counter', { n: descLength }) }}</span>
              </div>
            </div>
          </section>

          <!-- STEP 3 · Location -->
          <section v-show="step === 3" class="step">
            <span class="t-over">{{ t('publish.location.over') }}</span>
            <h1 class="t-h1 step-title">{{ t('publish.location.title') }}</h1>
            <p class="muted step-sub">{{ t('publish.location.subtitle') }}</p>

            <div class="fields">
              <div class="field">
                <label class="label" for="f-hood">{{ t('publish.location.neighborhoodLabel') }}</label>
                <input
                  id="f-hood"
                  v-model="draft.neighborhood as string"
                  class="input"
                  type="text"
                  :placeholder="t('publish.location.neighborhoodPlaceholder')"
                  @input="queueSave"
                >
              </div>

              <div class="field">
                <label class="label" for="f-addr">{{ t('publish.location.addressLabel') }}</label>
                <input
                  id="f-addr"
                  v-model="draft.address as string"
                  class="input"
                  type="text"
                  :placeholder="t('publish.location.addressPlaceholder')"
                  @input="queueSave"
                >
                <div class="privacy-tip">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--aqua-700)"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>{{ t('publish.location.privacyNote') }}</span>
                </div>
              </div>

              <div class="field">
                <span class="label">{{ t('publish.location.pinLabel') }}</span>
                <ClientOnly>
                  <PoolPinPicker
                    :lat="draft.lat"
                    :lng="draft.lng"
                    :fallback-lat="selectedCity?.lat ?? undefined"
                    :fallback-lng="selectedCity?.lng ?? undefined"
                    :label="t('publish.location.pinLabel')"
                    @update="onPinUpdate"
                  />
                  <template #fallback>
                    <div class="map-placeholder" />
                  </template>
                </ClientOnly>
                <span class="hint">{{
                  draft.lat === null ? t('publish.location.pinUnset') : t('publish.location.pinHint')
                }}</span>
                <span class="hint">{{ t('publish.location.approxNote') }}</span>
              </div>
            </div>
          </section>

          <!-- STEP 4 · Photos -->
          <section v-show="step === 4" class="step">
            <span class="t-over">{{ t('publish.photos.over') }}</span>
            <h1 class="t-h1 step-title">{{ t('publish.photos.title') }}</h1>
            <p class="muted step-sub">{{ t('publish.photos.subtitle') }}</p>

            <div class="amber-tip">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
              </svg>
              <span>{{ t('publish.photos.tip') }}</span>
            </div>

            <div class="photos-head">
              <span class="label">{{ t('publish.photos.yourPhotos') }}</span>
              <span
                class="photo-count t-sm"
                :class="{ ok: photos.length >= 3 }"
              >{{
                photos.length >= 3
                  ? t('publish.photos.countOk', { n: photos.length })
                  : t('publish.photos.count', { n: photos.length })
              }}</span>
            </div>

            <p v-if="photoError" class="photo-error">{{ photoError }}</p>

            <div class="pgrid">
              <div
                v-for="(p, idx) in photos"
                :key="p.id"
                class="ptile"
                :class="{ dragging: dragIndex === idx }"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent
                @drop.prevent="onDrop(idx)"
                @dragend="dragIndex = null"
              >
                <img :src="photoUrl(p)" :alt="`${idx + 1}`">
                <span v-if="p.is_cover" class="cov">{{ t('publish.photos.cover') }}</span>
                <button
                  v-else
                  class="setcov"
                  type="button"
                  :aria-label="t('publish.photos.setCover')"
                  @click="makeCover(p)"
                >
                  ★
                </button>
                <button
                  class="rm"
                  type="button"
                  :aria-label="t('publish.photos.remove')"
                  @click="removePhoto(p)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <button class="padd" type="button" :disabled="uploading" @click="pickPhotos">
                <svg
                  v-if="!uploading"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>{{ uploading ? t('publish.photos.uploading') : t('publish.photos.add') }}</span>
              </button>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              class="sr-file"
              @change="onFilesSelected"
            >
          </section>

          <!-- STEP 5 · Pool -->
          <section v-show="step === 5" class="step">
            <span class="t-over">{{ t('publish.pool.over') }}</span>
            <h1 class="t-h1 step-title">{{ t('publish.pool.title') }}</h1>
            <p class="muted step-sub">{{ t('publish.pool.subtitle') }}</p>

            <div class="fields">
              <div class="field">
                <span class="label">{{ t('publish.pool.dimensions') }}</span>
                <div class="dim-row">
                  <div class="price-in">
                    <input
                      v-model.number="draft.length_m as number"
                      class="input"
                      type="number"
                      min="0"
                      step="0.5"
                      :aria-label="t('publish.pool.length')"
                      @input="queueSave"
                    >
                    <span class="dh">m</span>
                  </div>
                  <span class="dim-x">×</span>
                  <div class="price-in">
                    <input
                      v-model.number="draft.width_m as number"
                      class="input"
                      type="number"
                      min="0"
                      step="0.5"
                      :aria-label="t('publish.pool.width')"
                      @input="queueSave"
                    >
                    <span class="dh">m</span>
                  </div>
                </div>
              </div>

              <div class="field">
                <span class="label">{{ t('publish.pool.depth') }}</span>
                <div class="dim-row">
                  <div class="price-in">
                    <input
                      v-model.number="draft.depth_min as number"
                      class="input"
                      type="number"
                      min="0"
                      step="0.1"
                      :aria-label="t('publish.pool.depthMin')"
                      @input="queueSave"
                    >
                    <span class="dh">m</span>
                  </div>
                  <span class="dim-x">→</span>
                  <div class="price-in">
                    <input
                      v-model.number="draft.depth_max as number"
                      class="input"
                      type="number"
                      min="0"
                      step="0.1"
                      :aria-label="t('publish.pool.depthMax')"
                      @input="queueSave"
                    >
                    <span class="dh">m</span>
                  </div>
                </div>
                <span class="hint">{{ t('publish.pool.depthHint') }}</span>
              </div>

              <div class="toggle-card">
                <label class="toggle-row">
                  <span>{{ t('publish.pool.heated') }}</span>
                  <PToggle v-model="draft.heated" :aria-label="t('publish.pool.heated')" @update:model-value="queueSave" />
                </label>
                <label class="toggle-row">
                  <span>{{ t('publish.pool.covered') }}</span>
                  <PToggle v-model="draft.covered" :aria-label="t('publish.pool.covered')" @update:model-value="queueSave" />
                </label>
                <label class="toggle-row">
                  <span>{{ t('publish.pool.childSafe') }}</span>
                  <PToggle v-model="draft.child_safe" :aria-label="t('publish.pool.childSafe')" @update:model-value="queueSave" />
                </label>
              </div>

              <div class="sheltered-card">
                <label class="toggle-row sheltered-head">
                  <span class="sheltered-title">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--aqua-700)"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68M6.6 6.6A13.2 13.2 0 0 0 2 12s3 8 10 8a9.1 9.1 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                    </svg>
                    {{ t('publish.pool.shelteredTitle') }}
                  </span>
                  <PToggle
                    v-model="draft.sheltered_from_view"
                    :aria-label="t('publish.pool.shelteredTitle')"
                    @update:model-value="queueSave"
                  />
                </label>
                <p class="t-sm muted sheltered-body">{{ t('publish.pool.shelteredBody') }}</p>
              </div>
            </div>
          </section>

          <!-- STEP 6 · Amenities -->
          <section v-show="step === 6" class="step">
            <span class="t-over">{{ t('publish.amenities.over') }}</span>
            <h1 class="t-h1 step-title">{{ t('publish.amenities.title') }}</h1>
            <p class="muted step-sub">{{ t('publish.amenities.subtitle') }}</p>

            <div class="eq-list">
              <div v-for="preset in amenityPresets" :key="preset.key" class="eq-item">
                <div class="eq-row">
                  <span class="eq-label">{{ t(preset.labelKey) }}</span>
                  <div class="mini-seg">
                    <button
                      :class="{ 'is-on': amenityState(preset.key) === 'no' }"
                      type="button"
                      @click="setAmenity(preset, 'no')"
                    >
                      {{ t('publish.amenities.no') }}
                    </button>
                    <button
                      :class="{ 'is-on': amenityState(preset.key) === 'included' }"
                      type="button"
                      @click="setAmenity(preset, 'included')"
                    >
                      {{ t('publish.amenities.included') }}
                    </button>
                    <button
                      :class="{ 'is-on': amenityState(preset.key) === 'paid' }"
                      type="button"
                      @click="setAmenity(preset, 'paid')"
                    >
                      {{ t('publish.amenities.paid') }}
                    </button>
                  </div>
                </div>
                <div v-if="amenityState(preset.key) === 'paid'" class="eq-paid">
                  <div class="price-in eq-price">
                    <input
                      :value="draft.amenities.find((a) => a.key === preset.key)?.price ?? 0"
                      class="input"
                      type="number"
                      min="0"
                      :aria-label="t('publish.amenities.priceLabel')"
                      @input="updateAmenityPrice(preset.key, ($event.target as HTMLInputElement).valueAsNumber)"
                    >
                    <span class="dh">DH</span>
                  </div>
                  <label class="perperson">
                    <PCheckbox
                      :model-value="Boolean(draft.amenities.find((a) => a.key === preset.key)?.per_person)"
                      @update:model-value="toggleAmenityPerPerson(preset.key)"
                    />
                    <span class="t-sm">{{ t('publish.amenities.perPerson') }}</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <!-- STEP 7 · Rules -->
          <section v-show="step === 7" class="step">
            <span class="t-over">{{ t('publish.rules.over') }}</span>
            <h1 class="t-h1 step-title">{{ t('publish.rules.title') }}</h1>
            <p class="muted step-sub">{{ t('publish.rules.subtitle') }}</p>

            <div class="toggle-card">
              <label class="toggle-row">
                <span>{{ t('publish.rules.kids') }}</span>
                <PToggle v-model="draft.rules.kids_allowed" :aria-label="t('publish.rules.kids')" @update:model-value="queueSave" />
              </label>
              <label class="toggle-row">
                <span>{{ t('publish.rules.music') }}</span>
                <PToggle v-model="draft.rules.music_allowed" :aria-label="t('publish.rules.music')" @update:model-value="queueSave" />
              </label>
              <label class="toggle-row">
                <span>{{ t('publish.rules.events') }}</span>
                <PToggle v-model="draft.rules.events_allowed" :aria-label="t('publish.rules.events')" @update:model-value="queueSave" />
              </label>
              <label class="toggle-row">
                <span>{{ t('publish.rules.pets') }}</span>
                <PToggle v-model="draft.rules.pets_allowed" :aria-label="t('publish.rules.pets')" @update:model-value="queueSave" />
              </label>
              <label class="toggle-row">
                <span>{{ t('publish.pool.ownerPresent') }}</span>
                <PToggle v-model="draft.owner_present" :aria-label="t('publish.pool.ownerPresent')" @update:model-value="queueSave" />
              </label>
            </div>

            <div class="plain-card">
              <label class="toggle-row">
                <span>{{ t('publish.rules.quietHours') }}</span>
                <PToggle v-model="quietEnabled" :aria-label="t('publish.rules.quietHours')" @update:model-value="queueSave" />
              </label>
              <div v-if="quietEnabled" class="quiet-row">
                <label class="field quiet-field">
                  <span class="t-sm muted">{{ t('publish.rules.quietFrom') }}</span>
                  <input v-model="quietFrom" class="input" type="time" @input="queueSave">
                </label>
                <label class="field quiet-field">
                  <span class="t-sm muted">{{ t('publish.rules.quietTo') }}</span>
                  <input v-model="quietTo" class="input" type="time" @input="queueSave">
                </label>
              </div>
            </div>

            <div class="sheltered-card">
              <label class="toggle-row sheltered-head">
                <span class="sheltered-title">{{ t('publish.rules.directContactTitle') }}</span>
                <PToggle
                  v-model="draft.direct_contact_enabled"
                  :aria-label="t('publish.rules.directContactTitle')"
                  @update:model-value="queueSave"
                />
              </label>
              <p class="t-sm muted sheltered-body">{{ t('publish.rules.directContactBody') }}</p>
            </div>
          </section>

          <!-- STEP 8 · Pricing -->
          <section v-show="step === 8" class="step">
            <span class="t-over">{{ t('publish.pricing.over') }}</span>
            <h1 class="t-h1 step-title">{{ t('publish.pricing.title') }}</h1>
            <p class="muted step-sub">{{ t('publish.pricing.subtitle') }}</p>

            <div class="info-tip">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              <span>{{ t('publish.pricing.tip') }}</span>
            </div>

            <div class="slot-list">
              <div
                v-for="meta in slotMeta"
                :key="meta.key"
                class="slot-cfg"
                :class="{ off: !slots[meta.key].enabled }"
              >
                <div class="slot-main">
                  <PToggle
                    v-model="slots[meta.key].enabled"
                    :aria-label="t(meta.labelKey)"
                    @update:model-value="toggleSlot(meta.key)"
                  />
                  <div class="slot-names">
                    <strong>{{ t(meta.labelKey) }}</strong>
                    <span class="muted t-sm"> · {{ t(meta.subKey) }}</span>
                  </div>
                </div>
                <div class="price-in slot-price">
                  <input
                    v-model.number="slots[meta.key].price_mad"
                    class="input"
                    type="number"
                    min="0"
                    :disabled="!slots[meta.key].enabled"
                    :aria-label="t('publish.pricing.priceLabel', { slot: t(meta.labelKey) })"
                    @input="queueSaveSlots"
                  >
                  <span class="dh">DH</span>
                </div>
              </div>
            </div>

            <div class="plain-card weekend-card">
              <label class="toggle-row">
                <span>{{ t('publish.pricing.weekendTitle') }}</span>
                <PToggle v-model="weekendEnabled" :aria-label="t('publish.pricing.weekendTitle')" @update:model-value="queueSaveSlots" />
              </label>
              <div v-if="weekendEnabled" class="weekend-row">
                <span class="t-sm muted">{{ t('publish.pricing.weekendBody') }}</span>
                <div class="price-in weekend-pct">
                  <input
                    v-model.number="weekendPct"
                    class="input"
                    type="number"
                    min="0"
                    max="200"
                    :aria-label="t('publish.pricing.weekendPct')"
                    @input="queueSaveSlots"
                  >
                  <span class="dh">%</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Inline recap appears under pricing as the final step's summary -->
          <section v-show="step === 8" class="step review-block">
            <span class="t-over">{{ t('publish.review.over') }}</span>
            <h2 class="t-h3 step-title">{{ t('publish.review.title') }}</h2>
            <p class="muted step-sub">{{ t('publish.review.subtitle') }}</p>

            <span class="label preview-label">{{ t('publish.review.previewLabel') }}</span>
            <div class="preview-card pcard">
              <div class="preview-ph">
                <img v-if="coverUrl" :src="coverUrl" alt="">
                <div v-else class="preview-noimg">{{ t('pool.noPhoto') }}</div>
                <span v-if="draft.sheltered_from_view" class="badge badge-privacy preview-badge">
                  {{ t('pool.sheltered') }}
                </span>
              </div>
              <div class="preview-body">
                <strong class="preview-title">{{ draft.title || t('publish.essential.titlePlaceholder') }}</strong>
                <div class="t-sm muted preview-loc">
                  {{ [draft.neighborhood, selectedCity ? (locale === 'ar' ? selectedCity.name_ar : selectedCity.name_fr) : ''].filter(Boolean).join(', ') }}
                </div>
                <div v-if="previewPrice !== null" class="preview-price">
                  <span class="muted t-sm">{{ t('common.from') }}</span>
                  <strong>{{ t('common.priceFmt', { n: previewPrice.toLocaleString(locale) }) }}</strong>
                  <span class="muted t-sm">{{ t('common.perSlot') }}</span>
                </div>
              </div>
            </div>

            <span class="label checks-label">{{ t('publish.review.checksLabel') }}</span>
            <div class="checks">
              <div class="vcheck" :class="{ off: photos.length < 3 }">
                <span class="ic" :class="photos.length >= 3 ? 'ok' : 'no'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span>{{ t('publish.readiness.doneTitle') }} <span class="muted">· {{ t('publish.readiness.donePhotos', { n: photos.length }) }}</span></span>
              </div>
              <div class="vcheck" :class="{ off: enabledSlotCount === 0 }">
                <span class="ic" :class="enabledSlotCount > 0 ? 'ok' : 'no'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span>{{ t('publish.readiness.slot') }} <span class="muted">· {{ t('publish.readiness.doneSlots', { n: enabledSlotCount }) }}</span></span>
              </div>
              <div class="vcheck" :class="{ off: !readiness.hasCity }">
                <span class="ic" :class="readiness.hasCity ? 'ok' : 'no'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span>{{ t('publish.readiness.doneLocation') }}</span>
              </div>
              <div class="vcheck" :class="{ off: !readiness.hasTitle }">
                <span class="ic" :class="readiness.hasTitle ? 'ok' : 'no'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span>{{ t('publish.readiness.title') }}</span>
              </div>
            </div>

            <p class="cash-reminder t-sm muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3" /><circle cx="12" cy="12" r="2.5" /></svg>
              {{ t('publish.review.cashReminder') }}
            </p>

            <div v-if="blockedMissing.length" class="blocked-box">
              <strong>{{ t('publish.review.blockedTitle') }}</strong>
              <p class="t-sm">{{ t('publish.review.blockedIntro') }}</p>
              <ul>
                <li v-for="key in blockedMissing" :key="key">{{ t(key) }}</li>
              </ul>
            </div>
            <p v-if="publishError" class="photo-error">{{ publishError }}</p>
          </section>
        </div>
      </div>

      <!-- sticky footer nav -->
      <footer class="wiz-foot">
        <div class="wiz-foot-inner">
          <PButton v-if="step > 1" variant="ghost" class="back-btn" @click="prevStep">
            <template #icon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </template>
            {{ t('publish.back') }}
          </PButton>
          <span class="foot-hint t-sm muted">{{ t('publish.footHint') }}</span>
          <PButton
            v-if="step < TOTAL_STEPS"
            variant="primary"
            size="lg"
            class="next-btn"
            @click="nextStep"
          >
            {{ t('publish.continue') }}
          </PButton>
          <PButton
            v-else
            variant="primary"
            size="lg"
            class="next-btn"
            :loading="publishing"
            @click="publish"
          >
            {{ t('publish.publishCta') }}
          </PButton>
        </div>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.wiz {
  margin-inline: -16px;
}
@media (min-width: 768px) {
  .wiz {
    margin-inline: -24px;
  }
}

/* loading / missing / success */
.wiz-loading,
.wiz-missing,
.wiz-success {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
  padding-inline: 1rem;
}
.spinner {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 3px solid var(--line-strong);
  border-top-color: var(--aqua-600);
  animation: spin 0.8s linear infinite;
}
.missing-actions,
.success-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  max-width: 22rem;
}
.missing-actions {
  flex-direction: row;
  justify-content: center;
}
.success-check {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: var(--success-soft);
  color: var(--success);
  display: grid;
  place-items: center;
}
.success-check svg {
  width: 46px;
  height: 46px;
}
.success-body {
  max-width: 32rem;
}

/* header */
.wiz-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.wiz-header-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 58px;
  max-width: 1080px;
  margin-inline: auto;
  padding-inline: 16px;
}
@media (min-width: 768px) {
  .wiz-header-row {
    padding-inline: 24px;
  }
}
.quit-btn {
  border: none;
  background: var(--sand-2);
  width: 38px;
  height: 38px;
}
.wiz-header-title {
  flex: 1;
  min-width: 0;
}
.wiz-header-title strong {
  font-size: 0.98rem;
  display: block;
}
.save-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8125rem;
  color: var(--ink-muted);
}
.save-indicator.is-saved {
  color: var(--success);
}
.save-indicator.is-error {
  color: var(--danger);
}
.save-indicator svg {
  width: 13px;
  height: 13px;
}
.step-count {
  flex: none;
  font-size: 0.8125rem;
}
.progress {
  height: 5px;
  background: var(--sand-2);
}
.progress i {
  display: block;
  height: 100%;
  background: var(--aqua-600);
  transition: width var(--dur-3) var(--ease-water);
}

/* grid */
.wiz-grid {
  display: grid;
  gap: 2rem;
  align-items: start;
  max-width: 1080px;
  margin-inline: auto;
  padding: 1.6rem 16px 7rem;
}
@media (min-width: 768px) {
  .wiz-grid {
    padding-inline: 24px;
  }
}
@media (min-width: 1024px) {
  .wiz-grid {
    grid-template-columns: 236px 1fr;
  }
}
.rail {
  position: sticky;
  top: 88px;
  display: none;
  flex-direction: column;
  gap: 0.15rem;
}
@media (min-width: 1024px) {
  .rail {
    display: flex;
  }
}
.rail-btn {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  text-align: start;
  padding: 0.55rem 0.65rem;
  border-radius: var(--r-lg);
  border: none;
  background: none;
  cursor: pointer;
  color: var(--ink-muted);
  font-weight: 600;
  font-size: 0.88rem;
}
.rail-btn:hover {
  background: var(--sand-2);
}
.rail-btn .nm {
  width: 26px;
  height: 26px;
  border-radius: 99px;
  border: 2px solid var(--line-strong);
  display: grid;
  place-items: center;
  font-size: 0.76rem;
  flex: none;
  transition: all var(--dur-1);
}
.rail-btn .nm svg {
  width: 14px;
  height: 14px;
}
.rail-btn.is-on {
  color: var(--aqua-800);
  background: var(--aqua-50);
}
.rail-btn.is-on .nm {
  border-color: var(--aqua-700);
  background: var(--aqua-700);
  color: #fff;
}
.rail-btn.done .nm {
  border-color: var(--success);
  background: var(--success);
  color: #fff;
}

.wiz-content {
  min-width: 0;
  max-width: 620px;
}
.step-title {
  margin-top: 0.3rem;
}
.step-sub {
  margin-top: 0.3rem;
  margin-bottom: 1.4rem;
}
.fields {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}
.counter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.helpers {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.helper-good {
  background: var(--success-soft);
  border: 1px solid #bbe9c9;
  border-radius: var(--r-md);
  padding: 0.5rem 0.7rem;
  font-size: 0.83rem;
  color: #0f7a38;
}
.helper-bad {
  background: var(--sand-2);
  border-radius: var(--r-md);
  padding: 0.5rem 0.7rem;
  font-size: 0.83rem;
  color: var(--ink-muted);
}
.counter {
  align-self: flex-end;
}

/* type grid + optcard */
.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}
@media (min-width: 560px) {
  .type-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.optcard {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.85rem;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--r-lg);
  cursor: pointer;
  font-weight: 600;
  transition: all var(--dur-1);
  background: #fff;
  color: var(--ink);
}
.optcard:hover {
  border-color: var(--aqua-400);
}
.optcard.is-on {
  border-color: var(--aqua-700);
  background: var(--aqua-50);
  color: var(--aqua-800);
}

/* textarea */
.ta {
  width: 100%;
  background: #fff;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--r-md);
  padding: 0.78rem 0.9rem;
  font-size: 0.95rem;
  color: var(--ink);
  min-height: 120px;
  resize: vertical;
  line-height: 1.55;
  font-family: inherit;
}
.ta:focus {
  outline: none;
  border-color: var(--aqua-500);
  box-shadow: var(--focus);
}

/* price-in */
.price-in {
  position: relative;
  flex: 1;
}
.price-in input {
  padding-inline-end: 2.8rem;
}
.price-in .dh {
  position: absolute;
  inset-inline-end: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 700;
  color: var(--ink-muted);
  font-size: 0.88rem;
  pointer-events: none;
}
.dim-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.dim-x {
  font-weight: 700;
  color: var(--ink-muted);
}

/* privacy tip */
.privacy-tip {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  background: rgba(10, 45, 56, 0.04);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 0.8rem 0.9rem;
  color: var(--ink-muted);
  font-size: 0.86rem;
  line-height: 1.45;
}
.privacy-tip svg {
  width: 20px;
  height: 20px;
  flex: none;
  margin-top: 1px;
}
.map-placeholder {
  height: 240px;
  border-radius: var(--r-lg);
  border: 1px solid var(--line);
  background: linear-gradient(160deg, #dcefe6, #cfe9ec 50%, #bfe3ee);
}

/* toggle cards */
.toggle-card,
.plain-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 0.2rem 1rem;
}
.plain-card {
  padding: 1rem;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.75rem 0;
  cursor: pointer;
}
.toggle-card .toggle-row {
  border-bottom: 1px solid var(--line-2);
}
.toggle-card .toggle-row:last-child {
  border-bottom: none;
}
.toggle-row > span:first-child {
  font-weight: 600;
}

/* sheltered / highlighted card */
.sheltered-card {
  background: linear-gradient(180deg, var(--aqua-50), #fff);
  border: 1px solid var(--aqua-200);
  border-radius: var(--r-xl);
  padding: 1rem;
}
.sheltered-head {
  padding: 0;
}
.sheltered-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
}
.sheltered-title svg {
  width: 20px;
  height: 20px;
}
.sheltered-body {
  margin-top: 0.5rem;
}
.quiet-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.9rem;
}
.quiet-field {
  flex: 1;
}

/* amber tip + info tip */
.amber-tip,
.info-tip {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  border-radius: var(--r-lg);
  padding: 0.8rem 0.9rem;
  margin-bottom: 1.1rem;
  line-height: 1.45;
  font-size: 0.88rem;
}
.amber-tip {
  background: var(--amber-soft);
  border: 1px solid #f3e2b3;
  color: var(--amber-ink);
}
.info-tip {
  background: var(--aqua-50);
  border: 1px solid var(--aqua-200);
  color: var(--aqua-800);
  margin-bottom: 1.2rem;
}
.amber-tip svg,
.info-tip svg {
  width: 20px;
  height: 20px;
  flex: none;
  margin-top: 1px;
}

/* photos */
.photos-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}
.photo-count {
  font-weight: 700;
  color: var(--ink-muted);
}
.photo-count.ok {
  color: var(--success);
}
.photo-error {
  background: var(--danger-soft);
  color: var(--danger-deep);
  border-radius: var(--r-md);
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.6rem;
}
.pgrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}
@media (min-width: 560px) {
  .pgrid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.ptile {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--r-lg);
  overflow: hidden;
  background: var(--sand-2);
  cursor: grab;
}
.ptile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}
.ptile.dragging {
  opacity: 0.4;
}
.ptile .cov {
  position: absolute;
  top: 0.4rem;
  inset-inline-start: 0.4rem;
  background: var(--aqua-700);
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  padding: 0.2rem 0.45rem;
  border-radius: 99px;
}
.ptile .setcov {
  position: absolute;
  top: 0.4rem;
  inset-inline-start: 0.4rem;
  width: 26px;
  height: 26px;
  border-radius: 99px;
  background: rgba(10, 45, 56, 0.6);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
}
.ptile .rm {
  position: absolute;
  top: 0.4rem;
  inset-inline-end: 0.4rem;
  width: 26px;
  height: 26px;
  border-radius: 99px;
  background: rgba(10, 45, 56, 0.7);
  color: #fff;
  border: none;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.ptile .rm svg {
  width: 14px;
  height: 14px;
}
.padd {
  border: 2px dashed var(--line-strong);
  border-radius: var(--r-lg);
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ink-muted);
  font-weight: 600;
  font-size: 0.82rem;
  background: #fff;
}
.padd:hover {
  border-color: var(--aqua-400);
  color: var(--aqua-700);
}
.padd:disabled {
  cursor: progress;
  opacity: 0.7;
}
.padd svg {
  width: 24px;
  height: 24px;
}
.sr-file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

/* amenities builder */
.eq-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.eq-item {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 0.7rem 0.85rem;
}
.eq-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}
.eq-label {
  font-weight: 600;
}
.mini-seg {
  display: inline-flex;
  background: var(--sand-2);
  border-radius: var(--r-pill);
  padding: 0.2rem;
  gap: 0.15rem;
}
.mini-seg button {
  border: none;
  background: none;
  border-radius: var(--r-pill);
  padding: 0.4rem 0.7rem;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--ink-muted);
  cursor: pointer;
  white-space: nowrap;
}
.mini-seg button.is-on {
  background: #fff;
  color: var(--aqua-800);
  box-shadow: var(--sh-sm);
}
.eq-paid {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.7rem;
  flex-wrap: wrap;
}
.eq-price {
  max-width: 150px;
  flex: none;
  width: 150px;
}
.perperson {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}

/* slots */
.slot-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.slot-cfg {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 0.65rem 0.85rem;
}
.slot-cfg.off {
  opacity: 0.55;
}
.slot-main {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex: 1;
  min-width: 0;
}
.slot-price {
  width: 130px;
  flex: none;
}
.weekend-card {
  margin-top: 1.2rem;
}
.weekend-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.8rem;
}
.weekend-pct {
  width: 96px;
  margin-inline-start: auto;
  flex: none;
}

/* review block */
.review-block {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--line);
}
.preview-label,
.checks-label {
  display: block;
  margin-bottom: 0.6rem;
}
.preview-card {
  max-width: 300px;
}
.preview-ph {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--sand-2);
  overflow: hidden;
}
.preview-ph img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-noimg {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--ink-faint);
  font-size: 0.85rem;
}
.preview-badge {
  position: absolute;
  top: 0.6rem;
  inset-inline-start: 0.6rem;
}
.preview-body {
  padding: 0.85rem 0.95rem 1rem;
}
.preview-title {
  font-size: 0.98rem;
  line-height: 1.25;
}
.preview-loc {
  margin-top: 0.15rem;
}
.preview-price {
  margin-top: 0.5rem;
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}
.checks-label {
  margin-top: 1.6rem;
}
.checks {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 0.4rem 1rem;
}
.vcheck {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--line-2);
  font-size: 0.9rem;
}
.vcheck:last-child {
  border-bottom: none;
}
.vcheck .ic {
  width: 24px;
  height: 24px;
  border-radius: 99px;
  display: grid;
  place-items: center;
  flex: none;
}
.vcheck .ic.ok {
  background: var(--success-soft);
  color: var(--success);
}
.vcheck .ic.no {
  background: var(--sand-2);
  color: var(--ink-faint);
}
.vcheck .ic svg {
  width: 15px;
  height: 15px;
}
.cash-reminder {
  margin-top: 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.cash-reminder svg {
  width: 15px;
  height: 15px;
  flex: none;
}
.blocked-box {
  margin-top: 1.2rem;
  background: var(--amber-soft);
  border: 1px solid #f3e2b3;
  border-radius: var(--r-lg);
  padding: 0.9rem 1rem;
  color: var(--amber-ink);
}
.blocked-box ul {
  margin: 0.5rem 0 0;
  padding-inline-start: 1.2rem;
}
.blocked-box li {
  font-size: 0.86rem;
  margin-top: 0.2rem;
}

/* footer */
.wiz-foot {
  position: sticky;
  bottom: 0;
  z-index: 20;
  background: #fff;
  border-top: 1px solid var(--line);
  box-shadow: 0 -6px 20px -14px rgba(15, 61, 76, 0.25);
  margin-bottom: -2.5rem;
}
@media (max-width: 767px) {
  .wiz-foot {
    bottom: calc(72px + env(safe-area-inset-bottom));
  }
}
.wiz-foot-inner {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  max-width: 1080px;
  margin-inline: auto;
  padding: 0.8rem 16px;
}
@media (min-width: 768px) {
  .wiz-foot-inner {
    padding-inline: 24px;
  }
}
.back-btn {
  border: none;
}
.foot-hint {
  display: none;
}
@media (min-width: 640px) {
  .foot-hint {
    display: inline;
  }
}
.next-btn {
  margin-inline-start: auto;
  min-width: 160px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 1.6s;
  }
}
</style>
